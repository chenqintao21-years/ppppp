const { pool } = require('../src/config/database');

/**
 * 发布点评
 * POST /api/reviews
 */
async function createReview(req, res) {
    try {
        const userId = req.user.id;
        const { entityType, entityId, rating, title, content, photos } = req.body;

        // 验证必填字段
        if (!entityType || !entityId || !rating) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段'
            });
        }

        // 验证评分范围
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: '评分必须在1-5之间'
            });
        }

        // 验证实体类型
        const validTypes = ['attraction', 'hotel', 'restaurant'];
        if (!validTypes.includes(entityType)) {
            return res.status(400).json({
                success: false,
                message: '无效的实体类型'
            });
        }

        const connection = await pool.getConnection();

        try {
            // 检查实体是否存在
            const tableName = entityType === 'attraction' ? 'attractions' :
                            entityType === 'hotel' ? 'hotels' : 'restaurants';
            const [entities] = await connection.query(
                `SELECT id FROM ${tableName} WHERE id = ?`,
                [entityId]
            );

            if (entities.length === 0) {
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: '实体不存在'
                });
            }

            // 检查用户是否已经评论过
            const [existingReviews] = await connection.query(
                'SELECT id FROM reviews WHERE user_id = ? AND entity_type = ? AND entity_id = ?',
                [userId, entityType, entityId]
            );

            if (existingReviews.length > 0) {
                connection.release();
                return res.status(400).json({
                    success: false,
                    message: '您已经评论过该项目'
                });
            }

            // 插入点评
            const photosJson = photos ? JSON.stringify(photos) : null;
            const [result] = await connection.query(
                `INSERT INTO reviews (user_id, entity_type, entity_id, rating, title, content, photos)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, entityType, entityId, rating, title, content, photosJson]
            );

            // 更新实体的评分和评论数
            await connection.query(
                `UPDATE ${tableName}
                 SET rating = (SELECT AVG(rating) FROM reviews WHERE entity_type = ? AND entity_id = ?),
                     review_count = (SELECT COUNT(*) FROM reviews WHERE entity_type = ? AND entity_id = ?)
                 WHERE id = ?`,
                [entityType, entityId, entityType, entityId, entityId]
            );

            // 获取新创建的点评详情
            const [newReview] = await connection.query(
                `SELECT r.*, u.username, u.avatar
                 FROM reviews r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.id = ?`,
                [result.insertId]
            );

            connection.release();

            res.json({
                success: true,
                message: '点评发布成功',
                data: {
                    ...newReview[0],
                    photos: newReview[0].photos ? JSON.parse(newReview[0].photos) : []
                }
            });
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('发布点评失败:', error);
        res.status(500).json({
            success: false,
            message: '发布点评失败',
            error: error.message
        });
    }
}

/**
 * 获取点评列表（带排序和筛选）
 * GET /api/reviews
 * GET /api/:entityType/:id/reviews
 */
async function getReviews(req, res) {
    try {
        const { entityType, entityId } = req.params;
        const {
            sort = 'recent',
            rating,
            page = 1,
            limit = 10
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        let sql = `
            SELECT r.*, u.username, u.avatar,
                   (SELECT COUNT(*) FROM review_replies WHERE review_id = r.id) as reply_count
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // 实体过滤
        if (entityType && entityId) {
            sql += ' AND r.entity_type = ? AND r.entity_id = ?';
            params.push(entityType, parseInt(entityId));
        }

        // 评分过滤
        if (rating) {
            sql += ' AND r.rating = ?';
            params.push(parseFloat(rating));
        }

        // 排序
        switch (sort) {
            case 'helpful':
                sql += ' ORDER BY r.helpful_count DESC, r.created_at DESC';
                break;
            case 'rating_high':
                sql += ' ORDER BY r.rating DESC, r.created_at DESC';
                break;
            case 'rating_low':
                sql += ' ORDER BY r.rating ASC, r.created_at DESC';
                break;
            case 'recent':
            default:
                sql += ' ORDER BY r.created_at DESC';
        }

        sql += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        // 获取总数
        let countSql = 'SELECT COUNT(*) as total FROM reviews r WHERE 1=1';
        const countParams = [];
        if (entityType && entityId) {
            countSql += ' AND r.entity_type = ? AND r.entity_id = ?';
            countParams.push(entityType, parseInt(entityId));
        }
        if (rating) {
            countSql += ' AND r.rating = ?';
            countParams.push(parseFloat(rating));
        }

        const [reviews] = await pool.query(sql, params);
        const [countResult] = await pool.query(countSql, countParams);

        // 解析照片JSON
        const reviewsWithPhotos = reviews.map(review => ({
            ...review,
            photos: review.photos ? JSON.parse(review.photos) : []
        }));

        res.json({
            success: true,
            data: {
                reviews: reviewsWithPhotos,
                pagination: {
                    page: parseInt(page),
                    limit: limitNum,
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('获取点评列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取点评列表失败',
            error: error.message
        });
    }
}

/**
 * 获取点评详情
 * GET /api/reviews/:id
 */
async function getReviewDetail(req, res) {
    try {
        const { id } = req.params;

        const [reviews] = await pool.query(
            `SELECT r.*, u.username, u.avatar
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.id = ?`,
            [id]
        );

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: '点评不存在'
            });
        }

        // 获取回复
        const [replies] = await pool.query(
            `SELECT rr.*, u.username, u.avatar
             FROM review_replies rr
             JOIN users u ON rr.user_id = u.id
             WHERE rr.review_id = ?
             ORDER BY rr.created_at ASC`,
            [id]
        );

        const review = {
            ...reviews[0],
            photos: reviews[0].photos ? JSON.parse(reviews[0].photos) : [],
            replies
        };

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('获取点评详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取点评详情失败',
            error: error.message
        });
    }
}

/**
 * 点评点赞/有用
 * POST /api/reviews/:id/helpful
 */
async function markReviewHelpful(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const connection = await pool.getConnection();

        try {
            // 检查点评是否存在
            const [reviews] = await connection.query(
                'SELECT id FROM reviews WHERE id = ?',
                [id]
            );

            if (reviews.length === 0) {
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: '点评不存在'
                });
            }

            // 检查是否已经点赞
            const [existing] = await connection.query(
                'SELECT id FROM review_helpful WHERE review_id = ? AND user_id = ?',
                [id, userId]
            );

            if (existing.length > 0) {
                // 取消点赞
                await connection.query(
                    'DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?',
                    [id, userId]
                );

                await connection.query(
                    'UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = ?',
                    [id]
                );

                connection.release();

                return res.json({
                    success: true,
                    message: '已取消点赞',
                    data: { helpful: false }
                });
            } else {
                // 添加点赞
                await connection.query(
                    'INSERT INTO review_helpful (review_id, user_id) VALUES (?, ?)',
                    [id, userId]
                );

                await connection.query(
                    'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
                    [id]
                );

                connection.release();

                return res.json({
                    success: true,
                    message: '点赞成功',
                    data: { helpful: true }
                });
            }
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({
            success: false,
            message: '点赞操作失败',
            error: error.message
        });
    }
}

/**
 * 回复点评
 * POST /api/reviews/:id/reply
 */
async function replyToReview(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { content, isOwner = false } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '回复内容不能为空'
            });
        }

        const connection = await pool.getConnection();

        try {
            // 检查点评是否存在
            const [reviews] = await connection.query(
                'SELECT entity_type, entity_id FROM reviews WHERE id = ?',
                [id]
            );

            if (reviews.length === 0) {
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: '点评不存在'
                });
            }

            // 如果是商家回复，验证用户权限（这里简化处理，实际应该检查用户是否是商家）
            // 实际项目中需要添加商家表和权限验证

            // 插入回复
            const [result] = await connection.query(
                `INSERT INTO review_replies (review_id, user_id, content, is_owner)
                 VALUES (?, ?, ?, ?)`,
                [id, userId, content, isOwner]
            );

            // 获取新创建的回复
            const [newReply] = await connection.query(
                `SELECT rr.*, u.username, u.avatar
                 FROM review_replies rr
                 JOIN users u ON rr.user_id = u.id
                 WHERE rr.id = ?`,
                [result.insertId]
            );

            connection.release();

            res.json({
                success: true,
                message: '回复成功',
                data: newReply[0]
            });
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('回复点评失败:', error);
        res.status(500).json({
            success: false,
            message: '回复点评失败',
            error: error.message
        });
    }
}

/**
 * 举报点评
 * POST /api/reviews/:id/report
 */
async function reportReview(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { reason, description } = req.body;

        // 验证举报原因
        const validReasons = ['spam', 'offensive', 'fake', 'other'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: '无效的举报原因'
            });
        }

        const connection = await pool.getConnection();

        try {
            // 检查点评是否存在
            const [reviews] = await connection.query(
                'SELECT id FROM reviews WHERE id = ?',
                [id]
            );

            if (reviews.length === 0) {
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: '点评不存在'
                });
            }

            // 检查是否已经举报过
            const [existing] = await connection.query(
                'SELECT id FROM review_reports WHERE review_id = ? AND user_id = ?',
                [id, userId]
            );

            if (existing.length > 0) {
                connection.release();
                return res.status(400).json({
                    success: false,
                    message: '您已经举报过该点评'
                });
            }

            // 插入举报记录
            await connection.query(
                `INSERT INTO review_reports (review_id, user_id, reason, description)
                 VALUES (?, ?, ?, ?)`,
                [id, userId, reason, description]
            );

            connection.release();

            res.json({
                success: true,
                message: '举报成功，我们会尽快处理'
            });
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('举报点评失败:', error);
        res.status(500).json({
            success: false,
            message: '举报点评失败',
            error: error.message
        });
    }
}

/**
 * 获取点评统计信息
 * GET /api/:entityType/:id/reviews/stats
 */
async function getReviewStats(req, res) {
    try {
        const { entityType, entityId } = req.params;

        const [stats] = await pool.query(
            `SELECT
                COUNT(*) as total,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
             FROM reviews
             WHERE entity_type = ? AND entity_id = ?`,
            [entityType, entityId]
        );

        const total = stats[0].total;
        const ratingDistribution = {
            5: { count: stats[0].rating_5, percentage: total > 0 ? (stats[0].rating_5 / total * 100).toFixed(1) : 0 },
            4: { count: stats[0].rating_4, percentage: total > 0 ? (stats[0].rating_4 / total * 100).toFixed(1) : 0 },
            3: { count: stats[0].rating_3, percentage: total > 0 ? (stats[0].rating_3 / total * 100).toFixed(1) : 0 },
            2: { count: stats[0].rating_2, percentage: total > 0 ? (stats[0].rating_2 / total * 100).toFixed(1) : 0 },
            1: { count: stats[0].rating_1, percentage: total > 0 ? (stats[0].rating_1 / total * 100).toFixed(1) : 0 }
        };

        res.json({
            success: true,
            data: {
                total,
                averageRating: parseFloat(stats[0].average_rating || 0).toFixed(1),
                ratingDistribution
            }
        });
    } catch (error) {
        console.error('获取点评统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取点评统计失败',
            error: error.message
        });
    }
}

module.exports = {
    createReview,
    getReviews,
    getReviewDetail,
    markReviewHelpful,
    replyToReview,
    reportReview,
    getReviewStats
};
