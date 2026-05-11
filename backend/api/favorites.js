const { pool } = require('../src/config/database');

/**
 * 获取用户收藏列表
 * GET /api/favorites?type=attraction
 */
async function getFavorites(req, res) {
    try {
        const userId = req.user.id;
        const { type, page = 1, limit = 20 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        let query = `
            SELECT f.*,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.name
                       WHEN f.entity_type = 'hotel' THEN h.name
                       WHEN f.entity_type = 'restaurant' THEN r.name
                   END as entity_name,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.image
                       WHEN f.entity_type = 'hotel' THEN h.image
                       WHEN f.entity_type = 'restaurant' THEN r.image
                   END as entity_image,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.rating
                       WHEN f.entity_type = 'hotel' THEN h.rating
                       WHEN f.entity_type = 'restaurant' THEN r.rating
                   END as entity_rating,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.review_count
                       WHEN f.entity_type = 'hotel' THEN h.review_count
                       WHEN f.entity_type = 'restaurant' THEN r.review_count
                   END as entity_review_count,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.location_city
                       WHEN f.entity_type = 'hotel' THEN h.location
                       WHEN f.entity_type = 'restaurant' THEN r.address
                   END as entity_location,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.price
                       WHEN f.entity_type = 'restaurant' THEN r.price_range
                       ELSE NULL
                   END as entity_price,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.description
                       WHEN f.entity_type = 'hotel' THEN h.description
                       WHEN f.entity_type = 'restaurant' THEN r.description
                   END as entity_description
            FROM favorites f
            LEFT JOIN attractions a ON f.entity_type = 'attraction' AND f.entity_id = a.id
            LEFT JOIN hotels h ON f.entity_type = 'hotel' AND f.entity_id = h.id
            LEFT JOIN restaurants r ON f.entity_type = 'restaurant' AND f.entity_id = r.id
            WHERE f.user_id = ?
        `;

        const params = [userId];
        const countParams = [userId];

        // 类型过滤
        if (type) {
            query += ' AND f.entity_type = ?';
            params.push(type);
            countParams.push(type);
        }

        query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?';
        if (type) {
            countQuery += ' AND entity_type = ?';
        }

        const [favorites] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: {
                favorites,
                pagination: {
                    page: parseInt(page),
                    limit: limitNum,
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('获取收藏列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取收藏列表失败',
            error: error.message
        });
    }
}

/**
 * 检查收藏状态
 * GET /api/favorites/check?type=attraction&id=1
 */
async function checkFavoriteStatus(req, res) {
    try {
        const userId = req.user.id;
        const { type, id } = req.query;

        if (!type || !id) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        // 验证实体类型
        const validTypes = ['attraction', 'hotel', 'restaurant'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: '无效的实体类型'
            });
        }

        const [favorites] = await pool.query(
            'SELECT id FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?',
            [userId, type, parseInt(id)]
        );

        res.json({
            success: true,
            data: {
                isFavorited: favorites.length > 0,
                favoriteId: favorites.length > 0 ? favorites[0].id : null
            }
        });
    } catch (error) {
        console.error('检查收藏状态失败:', error);
        res.status(500).json({
            success: false,
            message: '检查收藏状态失败',
            error: error.message
        });
    }
}

/**
 * 批量检查收藏状态
 * POST /api/favorites/check-batch
 */
async function checkFavoriteStatusBatch(req, res) {
    try {
        const userId = req.user.id;
        const { items } = req.body; // [{ type: 'attraction', id: 1 }, ...]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        // 构建查询条件
        const conditions = items.map(item =>
            `(entity_type = '${item.type}' AND entity_id = ${parseInt(item.id)})`
        ).join(' OR ');

        const [favorites] = await pool.query(
            `SELECT entity_type, entity_id, id FROM favorites
             WHERE user_id = ? AND (${conditions})`,
            [userId]
        );

        // 构建结果映射
        const result = {};
        items.forEach(item => {
            const key = `${item.type}_${item.id}`;
            const favorite = favorites.find(f =>
                f.entity_type === item.type && f.entity_id === parseInt(item.id)
            );
            result[key] = {
                isFavorited: !!favorite,
                favoriteId: favorite ? favorite.id : null
            };
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('批量检查收藏状态失败:', error);
        res.status(500).json({
            success: false,
            message: '批量检查收藏状态失败',
            error: error.message
        });
    }
}

/**
 * Toggle收藏（添加或取消）
 * POST /api/favorites/toggle
 */
async function toggleFavorite(req, res) {
    try {
        const userId = req.user.id;
        const { entityType, entityId } = req.body;

        if (!entityType || !entityId) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
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

            // 检查是否已收藏
            const [existing] = await connection.query(
                'SELECT id FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?',
                [userId, entityType, entityId]
            );

            if (existing.length > 0) {
                // 取消收藏
                await connection.query(
                    'DELETE FROM favorites WHERE id = ?',
                    [existing[0].id]
                );

                connection.release();

                return res.json({
                    success: true,
                    message: '已取消收藏',
                    data: {
                        isFavorited: false,
                        action: 'removed'
                    }
                });
            } else {
                // 添加收藏
                const [result] = await connection.query(
                    'INSERT INTO favorites (user_id, entity_type, entity_id) VALUES (?, ?, ?)',
                    [userId, entityType, entityId]
                );

                connection.release();

                return res.json({
                    success: true,
                    message: '收藏成功',
                    data: {
                        isFavorited: true,
                        favoriteId: result.insertId,
                        action: 'added'
                    }
                });
            }
        } catch (error) {
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Toggle收藏失败:', error);
        res.status(500).json({
            success: false,
            message: 'Toggle收藏失败',
            error: error.message
        });
    }
}

/**
 * 添加收藏
 * POST /api/favorites
 */
async function addFavorite(req, res) {
    try {
        const userId = req.user.id;
        const { entityType, entityId } = req.body;

        if (!entityType || !entityId) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
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

        // 检查是否已收藏
        const [existing] = await pool.query(
            'SELECT id FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?',
            [userId, entityType, entityId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '已经收藏过了',
                data: {
                    isFavorited: true,
                    favoriteId: existing[0].id
                }
            });
        }

        // 添加收藏
        const [result] = await pool.query(
            'INSERT INTO favorites (user_id, entity_type, entity_id) VALUES (?, ?, ?)',
            [userId, entityType, entityId]
        );

        res.json({
            success: true,
            message: '收藏成功',
            data: {
                isFavorited: true,
                favoriteId: result.insertId
            }
        });
    } catch (error) {
        console.error('添加收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '添加收藏失败',
            error: error.message
        });
    }
}

/**
 * 取消收藏
 * DELETE /api/favorites/:id
 */
async function removeFavorite(req, res) {
    try {
        const favoriteId = req.params.id;
        const userId = req.user.id;

        // 检查收藏是否存在且属于当前用户
        const [favorites] = await pool.query(
            'SELECT * FROM favorites WHERE id = ? AND user_id = ?',
            [favoriteId, userId]
        );

        if (favorites.length === 0) {
            return res.status(404).json({
                success: false,
                message: '收藏不存在'
            });
        }

        // 删除收藏
        await pool.query(
            'DELETE FROM favorites WHERE id = ?',
            [favoriteId]
        );

        res.json({
            success: true,
            message: '已取消收藏',
            data: {
                isFavorited: false
            }
        });
    } catch (error) {
        console.error('取消收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '取消收藏失败',
            error: error.message
        });
    }
}

/**
 * 获取收藏统计
 * GET /api/favorites/stats
 */
async function getFavoriteStats(req, res) {
    try {
        const userId = req.user.id;

        const [stats] = await pool.query(
            `SELECT
                COUNT(*) as total,
                SUM(CASE WHEN entity_type = 'attraction' THEN 1 ELSE 0 END) as attractions,
                SUM(CASE WHEN entity_type = 'hotel' THEN 1 ELSE 0 END) as hotels,
                SUM(CASE WHEN entity_type = 'restaurant' THEN 1 ELSE 0 END) as restaurants
             FROM favorites
             WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                total: stats[0].total,
                byType: {
                    attraction: stats[0].attractions,
                    hotel: stats[0].hotels,
                    restaurant: stats[0].restaurants
                }
            }
        });
    } catch (error) {
        console.error('获取收藏统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取收藏统计失败',
            error: error.message
        });
    }
}

module.exports = {
    getFavorites,
    checkFavoriteStatus,
    checkFavoriteStatusBatch,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    getFavoriteStats
};
