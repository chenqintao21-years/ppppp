const { pool } = require('../src/config/database');

/**
 * 搜索景点 - 优化版
 * GET /api/attractions/search
 *
 * 查询参数:
 * - keyword: 搜索关键词
 * - type: 景点类型
 * - location: 位置（城市或国家）
 * - minPrice, maxPrice: 价格范围
 * - minRating: 最低评分
 * - sortBy: 排序方式 (relevance|rating|price|reviews)
 * - page, limit: 分页参数
 */
async function searchAttractions(req, res) {
    try {
        const {
            keyword,
            type,
            location,
            minPrice,
            maxPrice,
            minRating,
            sortBy = 'relevance',
            page = 1,
            limit = 20
        } = req.query;

        // 计算分页
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // 构建基础查询 - 添加相关性评分
        let sql = `
            SELECT *,
            (
                CASE
                    WHEN ? IS NOT NULL THEN
                        (CASE WHEN name LIKE ? THEN 100 ELSE 0 END) +
                        (CASE WHEN name LIKE ? THEN 50 ELSE 0 END) +
                        (CASE WHEN description LIKE ? THEN 20 ELSE 0 END) +
                        (CASE WHEN type LIKE ? THEN 10 ELSE 0 END)
                    ELSE 0
                END
            ) as relevance_score
            FROM attractions
            WHERE 1=1
        `;

        const params = [];
        const countParams = [];

        // 关键词搜索 - 智能匹配
        if (keyword) {
            const exactMatch = keyword;
            const startMatch = `${keyword}%`;
            const containMatch = `%${keyword}%`;

            params.push(keyword, exactMatch, startMatch, containMatch, containMatch);
            countParams.push(keyword, exactMatch, startMatch, containMatch, containMatch);

            sql += ' AND (name LIKE ? OR description LIKE ? OR type LIKE ?)';
            params.push(containMatch, containMatch, containMatch);
            countParams.push(containMatch, containMatch, containMatch);
        } else {
            // 没有关键词时填充占位符
            params.push(null, null, null, null, null);
            countParams.push(null, null, null, null, null);
        }

        // 类型过滤
        if (type) {
            sql += ' AND type = ?';
            params.push(type);
            countParams.push(type);
        }

        // 位置过滤
        if (location) {
            sql += ' AND (location_city LIKE ? OR location_country LIKE ?)';
            const locationMatch = `%${location}%`;
            params.push(locationMatch, locationMatch);
            countParams.push(locationMatch, locationMatch);
        }

        // 价格范围过滤
        if (minPrice) {
            sql += ' AND price >= ?';
            params.push(parseFloat(minPrice));
            countParams.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            sql += ' AND price <= ?';
            params.push(parseFloat(maxPrice));
            countParams.push(parseFloat(maxPrice));
        }

        // 评分过滤
        if (minRating) {
            sql += ' AND rating >= ?';
            params.push(parseFloat(minRating));
            countParams.push(parseFloat(minRating));
        }

        // 获取总数（用于分页）
        const countSql = sql.replace(/SELECT \*,[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await pool.query(countSql, countParams);
        const total = countResult[0].total;

        // 排序
        switch (sortBy) {
            case 'rating':
                sql += ' ORDER BY rating DESC, review_count DESC';
                break;
            case 'price':
                sql += ' ORDER BY price ASC, rating DESC';
                break;
            case 'price_desc':
                sql += ' ORDER BY price DESC, rating DESC';
                break;
            case 'reviews':
                sql += ' ORDER BY review_count DESC, rating DESC';
                break;
            case 'relevance':
            default:
                if (keyword) {
                    sql += ' ORDER BY relevance_score DESC, rating DESC, review_count DESC';
                } else {
                    sql += ' ORDER BY rating DESC, review_count DESC';
                }
                break;
        }

        // 分页
        sql += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        const [attractions] = await pool.query(sql, params);

        res.json({
            success: true,
            data: attractions,
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasMore: offset + attractions.length < total
            },
            filters: {
                keyword,
                type,
                location,
                minPrice,
                maxPrice,
                minRating,
                sortBy
            }
        });
    } catch (error) {
        console.error('搜索景点失败:', error);
        res.status(500).json({
            success: false,
            error: '搜索景点失败'
        });
    }
}

/**
 * 获取热门景点
 * GET /api/attractions/trending
 */
async function getTrendingAttractions(req, res) {
    try {
        const [attractions] = await pool.query(
            'SELECT * FROM attractions ORDER BY review_count DESC, rating DESC LIMIT 10'
        );

        res.json({
            success: true,
            data: attractions
        });
    } catch (error) {
        console.error('获取热门景点失败:', error);
        res.status(500).json({
            success: false,
            error: '获取热门景点失败'
        });
    }
}

/**
 * 获取推荐景点
 * GET /api/attractions/recommendations
 */
async function getRecommendations(req, res) {
    try {
        const { location } = req.query;

        let sql = 'SELECT * FROM attractions';
        const params = [];

        if (location) {
            sql += ' WHERE (location_city LIKE ? OR location_country LIKE ?)';
            params.push(`%${location}%`, `%${location}%`);
        }

        sql += ' ORDER BY rating DESC, review_count DESC LIMIT 10';

        const [attractions] = await pool.query(sql, params);

        res.json({
            success: true,
            data: attractions.map((attr, index) => ({
                ...attr,
                rank: index + 1
            }))
        });
    } catch (error) {
        console.error('获取推荐景点失败:', error);
        res.status(500).json({
            success: false,
            error: '获取推荐景点失败'
        });
    }
}

/**
 * 获取热门目的地
 * GET /api/attractions/destinations
 */
async function getPopularDestinations(req, res) {
    try {
        const [destinations] = await pool.query(`
            SELECT
                location_city,
                location_country,
                COUNT(*) as attraction_count,
                AVG(rating) as avg_rating,
                SUM(review_count) as total_reviews
            FROM attractions
            GROUP BY location_city, location_country
            ORDER BY total_reviews DESC, avg_rating DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: destinations
        });
    } catch (error) {
        console.error('获取热门目的地失败:', error);
        res.status(500).json({
            success: false,
            error: '获取热门目的地失败'
        });
    }
}

/**
 * 添加/移除收藏
 * POST /api/attractions/favorites
 */
async function toggleFavorite(req, res) {
    try {
        const { attractionId, userId, action } = req.body;

        if (!attractionId || !userId) {
            return res.status(400).json({
                success: false,
                error: '缺少必填字段'
            });
        }

        if (action === 'add') {
            await pool.query(
                'INSERT INTO favorites (user_id, entity_type, entity_id) VALUES (?, ?, ?)',
                [userId, 'attraction', attractionId]
            );
        } else {
            await pool.query(
                'DELETE FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?',
                [userId, 'attraction', attractionId]
            );
        }

        res.json({
            success: true,
            message: action === 'add' ? '已添加到收藏' : '已从收藏中移除'
        });
    } catch (error) {
        console.error('收藏操作失败:', error);
        res.status(500).json({
            success: false,
            error: '收藏操作失败'
        });
    }
}

/**
 * 获取景点详情
 * GET /api/attractions/:id
 */
async function getAttractionDetail(req, res) {
    try {
        const { id } = req.params;

        const [attractions] = await pool.query(
            'SELECT * FROM attractions WHERE id = ?',
            [id]
        );

        if (attractions.length === 0) {
            return res.status(404).json({
                success: false,
                error: '景点不存在'
            });
        }

        const attraction = attractions[0];

        // 获取景点评论
        const [reviews] = await pool.query(
            'SELECT r.*, u.username, u.avatar FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.entity_type = ? AND r.entity_id = ? ORDER BY r.created_at DESC LIMIT 10',
            ['attraction', id]
        );

        res.json({
            success: true,
            data: {
                ...attraction,
                reviews
            }
        });
    } catch (error) {
        console.error('获取景点详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取景点详情失败'
        });
    }
}

/**
 * 预订景点
 * POST /api/bookings
 */
async function bookAttraction(req, res) {
    const { attractionId, attractionName, date, travelers, price } = req.body;

    // 验证必填字段
    if (!attractionId || !date || !travelers) {
        return res.status(400).json({
            success: false,
            error: '缺少必填字段'
        });
    }

    // 创建预订
    const booking = {
        success: true,
        message: '预订成功',
        data: {
            bookingId: 'BK' + Date.now(),
            attractionId,
            attractionName: attractionName || '景点名称',
            date,
            travelers: parseInt(travelers),
            price: parseFloat(price) || 35,
            totalPrice: (parseFloat(price) || 35) * parseInt(travelers),
            currency: 'USD',
            status: 'confirmed',
            createdAt: new Date().toISOString()
        }
    };

    res.json(booking);
}

/**
 * 获取评论列表
 * GET /api/reviews
 */
async function getReviews(req, res) {
    const { attractionId, offset = 0, limit = 10 } = req.query;

    const reviews = {
        success: true,
        total: 603,
        offset: parseInt(offset),
        limit: parseInt(limit),
        data: [
            {
                id: 3,
                attractionId: attractionId || 'louvre-museum',
                userName: '王五',
                userLocation: '中国广州',
                userContributions: 12,
                rating: 5.0,
                date: '2024-01',
                title: '非常值得参观',
                content: '卢浮宫的藏品令人惊叹，免排队门票让我们节省了很多时间。强烈推荐提前购买。',
                helpful: 15
            },
            {
                id: 4,
                attractionId: attractionId || 'louvre-museum',
                userName: '赵六',
                userLocation: '中国深圳',
                userContributions: 6,
                rating: 4.5,
                date: '2023-12',
                title: '艺术的殿堂',
                content: '作为世界顶级博物馆，卢浮宫确实名不虚传。建议穿舒适的鞋子，因为要走很多路。',
                helpful: 10
            }
        ]
    };

    res.json(reviews);
}

/**
 * 上传景点图片
 * POST /api/attractions/upload
 */
async function uploadAttractionImage(req, res) {
    const { attractionId } = req.body;

    if (!attractionId) {
        return res.status(400).json({
            success: false,
            error: '缺少景点ID'
        });
    }

    // 模拟文件上传
    const uploadedFile = {
        success: true,
        message: '图片上传成功',
        data: {
            filename: `attraction-${Date.now()}.jpg`,
            path: `/uploads/attractions/${attractionId}/`,
            url: `/uploads/attractions/${attractionId}/attraction-${Date.now()}.jpg`,
            size: 1024000,
            uploadedAt: new Date().toISOString()
        }
    };

    res.json(uploadedFile);
}

/**
 * 获取景点照片
 * GET /api/attractions/:id/photos
 */
async function getAttractionPhotos(req, res) {
    try {
        const { id } = req.params;

        // 模拟照片数据
        const photos = {
            success: true,
            data: [
                {
                    id: 1,
                    url: `/images/attractions/${id}/photo1.jpg`,
                    caption: '景点外观',
                    uploadedBy: '用户A',
                    uploadedAt: '2026-04-01'
                },
                {
                    id: 2,
                    url: `/images/attractions/${id}/photo2.jpg`,
                    caption: '内部景观',
                    uploadedBy: '用户B',
                    uploadedAt: '2026-04-02'
                },
                {
                    id: 3,
                    url: `/images/attractions/${id}/photo3.jpg`,
                    caption: '周边环境',
                    uploadedBy: '用户C',
                    uploadedAt: '2026-04-03'
                }
            ]
        };

        res.json(photos);
    } catch (error) {
        console.error('获取景点照片失败:', error);
        res.status(500).json({
            success: false,
            error: '获取景点照片失败'
        });
    }
}

/**
 * 获取景点分类
 * GET /api/attractions/categories
 */
async function getAttractionCategories(req, res) {
    try {
        const categories = {
            success: true,
            data: [
                { id: 1, name: '博物馆', count: 150 },
                { id: 2, name: '公园', count: 200 },
                { id: 3, name: '历史遗迹', count: 120 },
                { id: 4, name: '主题乐园', count: 80 },
                { id: 5, name: '自然景观', count: 180 },
                { id: 6, name: '宗教场所', count: 90 },
                { id: 7, name: '购物中心', count: 110 },
                { id: 8, name: '娱乐场所', count: 95 }
            ]
        };

        res.json(categories);
    } catch (error) {
        console.error('获取景点分类失败:', error);
        res.status(500).json({
            success: false,
            error: '获取景点分类失败'
        });
    }
}

/**
 * 获取景点列表
 * GET /api/attractions
 */
async function getAttractions(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [attractions] = await pool.query(
            'SELECT * FROM attractions ORDER BY rating DESC, review_count DESC LIMIT ? OFFSET ?',
            [parseInt(limit), offset]
        );

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM attractions');
        const total = countResult[0].total;

        res.json({
            success: true,
            data: attractions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('获取景点列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取景点列表失败'
        });
    }
}

/**
 * 获取热门景点
 * GET /api/attractions/popular?limit=20&page=1
 */
async function getPopularAttractions(req, res) {
    try {
        const { limit = 20, page = 1 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [attractions] = await pool.query(
            `SELECT id, name, description, rating, review_count, price, currency,
                    location_city, location_country, latitude, longitude,
                    duration, image, type
             FROM attractions
             ORDER BY rating DESC, review_count DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), offset]
        );

        // 获取总数
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM attractions');
        const total = countResult[0].total;

        res.json({
            success: true,
            data: attractions,
            total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('获取热门景点失败:', error);
        res.status(500).json({
            success: false,
            message: '获取热门景点失败'
        });
    }
}

/**
 * 获取景点评论
 * GET /api/attractions/:id/reviews
 */
async function getAttractionReviews(req, res) {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [reviews] = await pool.query(
            'SELECT r.*, u.username, u.avatar FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.entity_type = ? AND r.entity_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?',
            ['attraction', id, parseInt(limit), offset]
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM reviews WHERE entity_type = ? AND entity_id = ?',
            ['attraction', id]
        );
        const total = countResult[0].total;

        res.json({
            success: true,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('获取景点评论失败:', error);
        res.status(500).json({
            success: false,
            error: '获取景点评论失败'
        });
    }
}

/**
 * 获取景点营业时间
 * GET /api/attractions/:id/hours
 */
async function getAttractionHours(req, res) {
    try {
        const { id } = req.params;

        const hours = {
            success: true,
            data: {
                monday: { open: '09:00', close: '18:00', isOpen: true },
                tuesday: { open: '09:00', close: '18:00', isOpen: true },
                wednesday: { open: '09:00', close: '18:00', isOpen: true },
                thursday: { open: '09:00', close: '18:00', isOpen: true },
                friday: { open: '09:00', close: '18:00', isOpen: true },
                saturday: { open: '09:00', close: '20:00', isOpen: true },
                sunday: { open: '09:00', close: '20:00', isOpen: true }
            }
        };

        res.json(hours);
    } catch (error) {
        console.error('获取景点营业时间失败:', error);
        res.status(500).json({
            success: false,
            error: '获取营业时间失败'
        });
    }
}

/**
 * 获取景点游览建议
 * GET /api/attractions/:id/tips
 */
async function getAttractionTips(req, res) {
    try {
        const { id } = req.params;

        const tips = {
            success: true,
            data: [
                {
                    id: 1,
                    author: '旅行达人',
                    tip: '建议早上9点前到达，避开人流高峰',
                    helpful: 25,
                    date: '2026-03-15'
                },
                {
                    id: 2,
                    author: '摄影爱好者',
                    tip: '黄昏时分光线最美，适合拍照',
                    helpful: 18,
                    date: '2026-03-10'
                },
                {
                    id: 3,
                    author: '本地向导',
                    tip: '周末人多，建议工作日前往',
                    helpful: 32,
                    date: '2026-03-05'
                }
            ]
        };

        res.json(tips);
    } catch (error) {
        console.error('获取景点游览建议失败:', error);
        res.status(500).json({
            success: false,
            error: '获取游览建议失败'
        });
    }
}

/**
 * 获取附近景点
 * GET /api/attractions/nearby
 */
async function getNearbyAttractions(req, res) {
    try {
        const { lat, lng, radius = 5, limit = 10 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: '缺少经纬度参数'
            });
        }

        const [attractions] = await pool.query(
            'SELECT * FROM attractions ORDER BY rating DESC LIMIT ?',
            [parseInt(limit)]
        );

        res.json({
            success: true,
            data: attractions.map(attr => ({
                ...attr,
                distance: (Math.random() * 5).toFixed(1) + 'km'
            }))
        });
    } catch (error) {
        console.error('获取附近景点失败:', error);
        res.status(500).json({
            success: false,
            error: '获取附近景点失败'
        });
    }
}

/**
 * 创建评论
 * POST /api/reviews
 */
async function createReview(req, res) {
    try {
        const { entityType, entityId, rating, title, content } = req.body;
        const userId = req.user.id;

        if (!entityType || !entityId || !rating || !content) {
            return res.status(400).json({
                success: false,
                error: '缺少必填字段'
            });
        }

        const reviewId = Date.now();

        res.status(201).json({
            success: true,
            message: '评论创建成功',
            data: {
                id: reviewId,
                entityType,
                entityId,
                userId,
                rating,
                title,
                content,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('创建评论失败:', error);
        res.status(500).json({
            success: false,
            error: '创建评论失败'
        });
    }
}

/**
 * 获取评论详情
 * GET /api/reviews/:id
 */
async function getReviewDetail(req, res) {
    try {
        const { id } = req.params;

        const review = {
            success: true,
            data: {
                id: parseInt(id),
                entityType: 'attraction',
                entityId: 1,
                userName: '旅行者',
                userLocation: '中国北京',
                rating: 5.0,
                title: '非常棒的体验',
                content: '景点很美，服务很好，强烈推荐！',
                helpful: 15,
                date: '2026-04-01',
                photos: []
            }
        };

        res.json(review);
    } catch (error) {
        console.error('获取评论详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取评论详情失败'
        });
    }
}

/**
 * 删除评论
 * DELETE /api/reviews/:id
 */
async function deleteReview(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        res.json({
            success: true,
            message: '评论删除成功'
        });
    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({
            success: false,
            error: '删除评论失败'
        });
    }
}

module.exports = {
    searchAttractions,
    getAttractions,
    getPopularAttractions,
    getTrendingAttractions,
    getRecommendations,
    getPopularDestinations,
    toggleFavorite,
    getAttractionDetail,
    getAttractionReviews,
    getAttractionPhotos,
    getAttractionCategories,
    bookAttraction,
    getReviews,
    uploadAttractionImage,
    getAttractionHours,
    getAttractionTips,
    getNearbyAttractions,
    createReview,
    getReviewDetail,
    deleteReview
};
