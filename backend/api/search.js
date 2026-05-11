const { pool } = require('../src/config/database');

/**
 * 统一搜索建议接口
 * GET /api/search/suggestions
 *
 * 查询参数:
 * - q: 搜索查询字符串
 * - type: 搜索类型 (all, restaurants, attractions, hotels)
 * - limit: 返回结果数量（默认10）
 */
async function getUnifiedSearchSuggestions(req, res) {
    try {
        const { q, type = 'all', limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: {
                    restaurants: [],
                    attractions: [],
                    hotels: [],
                    total: 0
                }
            });
        }

        const searchPattern = `%${q}%`;
        const limitNum = parseInt(limit);
        const limitPerType = Math.ceil(limitNum / 3);

        const results = {
            restaurants: [],
            attractions: [],
            hotels: [],
            total: 0
        };

        // 搜索餐厅
        if (type === 'all' || type === 'restaurants') {
            try {
                const [restaurants] = await pool.query(`
                    SELECT
                        id,
                        name,
                        cuisine_type as cuisine,
                        location_address as address,
                        rating,
                        review_count,
                        price_range,
                        'restaurant' as type
                    FROM restaurants
                    WHERE name LIKE ? OR cuisine_type LIKE ? OR location_address LIKE ?
                    ORDER BY rating DESC, review_count DESC
                    LIMIT ?
                `, [searchPattern, searchPattern, searchPattern, limitPerType]);
                results.restaurants = restaurants;
            } catch (error) {
                console.error('搜索餐厅失败:', error);
            }
        }

        // 搜索景点
        if (type === 'all' || type === 'attractions') {
            try {
                const [attractions] = await pool.query(`
                    SELECT
                        id,
                        name,
                        location_city,
                        location_country,
                        type as attraction_type,
                        rating,
                        review_count,
                        price,
                        'attraction' as type
                    FROM attractions
                    WHERE name LIKE ? OR location_city LIKE ? OR location_country LIKE ?
                    ORDER BY rating DESC, review_count DESC
                    LIMIT ?
                `, [searchPattern, searchPattern, searchPattern, limitPerType]);
                results.attractions = attractions;
            } catch (error) {
                console.error('搜索景点失败:', error);
            }
        }

        // 搜索酒店
        if (type === 'all' || type === 'hotels') {
            try {
                const [hotels] = await pool.query(`
                    SELECT
                        id,
                        name,
                        location_address as address,
                        location_city,
                        rating,
                        review_count,
                        price_per_night,
                        'hotel' as type
                    FROM hotels
                    WHERE name LIKE ? OR location_address LIKE ? OR location_city LIKE ?
                    ORDER BY rating DESC, review_count DESC
                    LIMIT ?
                `, [searchPattern, searchPattern, searchPattern, limitPerType]);
                results.hotels = hotels;
            } catch (error) {
                console.error('搜索酒店失败:', error);
            }
        }

        results.total = results.restaurants.length + results.attractions.length + results.hotels.length;

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('获取搜索建议失败:', error);
        res.status(500).json({
            success: false,
            error: '获取搜索建议失败'
        });
    }
}

/**
 * 热门搜索接口
 * GET /api/search/trending
 *
 * 查询参数:
 * - type: 搜索类型 (all, restaurants, attractions, hotels)
 * - limit: 返回结果数量（默认10）
 */
async function getTrendingSearches(req, res) {
    try {
        const { type = 'all', limit = 10 } = req.query;
        const limitNum = parseInt(limit);

        let query = `
            SELECT
                keyword,
                search_type,
                COUNT(*) as search_count,
                MAX(created_at) as last_searched
            FROM search_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;

        const params = [];

        if (type !== 'all') {
            query += ` AND search_type = ?`;
            params.push(type);
        }

        query += `
            GROUP BY keyword, search_type
            ORDER BY search_count DESC, last_searched DESC
            LIMIT ?
        `;
        params.push(limitNum);

        const [trending] = await pool.query(query, params);

        res.json({
            success: true,
            data: trending
        });
    } catch (error) {
        console.error('获取热门搜索失败:', error);
        res.status(500).json({
            success: false,
            error: '获取热门搜索失败'
        });
    }
}

/**
 * 全局搜索接口
 * GET /api/search
 *
 * 查询参数:
 * - q: 搜索查询字符串
 * - type: 搜索类型 (all, restaurants, attractions, hotels)
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20）
 * - sort: 排序方式 (relevance, rating, reviews, price)
 */
async function globalSearch(req, res) {
    try {
        const {
            q,
            type = 'all',
            page = 1,
            limit = 20,
            sort = 'relevance'
        } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: {
                    results: [],
                    total: 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: false
                }
            });
        }

        const searchPattern = `%${q}%`;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let results = [];
        let totalCount = 0;

        // 确定排序字段
        let orderBy = 'rating DESC, review_count DESC';
        switch(sort) {
            case 'rating':
                orderBy = 'rating DESC';
                break;
            case 'reviews':
                orderBy = 'review_count DESC';
                break;
            case 'price':
                orderBy = 'price ASC';
                break;
        }

        // 搜索餐厅
        if (type === 'all' || type === 'restaurants') {
            const [restaurants] = await pool.query(`
                SELECT
                    id,
                    name,
                    cuisine_type as cuisine,
                    location_address as address,
                    rating,
                    review_count,
                    price_range,
                    description,
                    image_url,
                    'restaurant' as type
                FROM restaurants
                WHERE name LIKE ? OR cuisine_type LIKE ? OR location_address LIKE ? OR description LIKE ?
                ORDER BY ${orderBy}
            `, [searchPattern, searchPattern, searchPattern, searchPattern]);
            results = results.concat(restaurants);
        }

        // 搜索景点
        if (type === 'all' || type === 'attractions') {
            const [attractions] = await pool.query(`
                SELECT
                    id,
                    name,
                    location_city,
                    location_country,
                    type as attraction_type,
                    rating,
                    review_count,
                    price,
                    description,
                    image_url,
                    'attraction' as type
                FROM attractions
                WHERE name LIKE ? OR location_city LIKE ? OR location_country LIKE ? OR description LIKE ?
                ORDER BY ${orderBy}
            `, [searchPattern, searchPattern, searchPattern, searchPattern]);
            results = results.concat(attractions);
        }

        // 搜索酒店
        if (type === 'all' || type === 'hotels') {
            const [hotels] = await pool.query(`
                SELECT
                    id,
                    name,
                    location_address as address,
                    location_city,
                    rating,
                    review_count,
                    price_per_night,
                    description,
                    image_url,
                    'hotel' as type
                FROM hotels
                WHERE name LIKE ? OR location_address LIKE ? OR location_city LIKE ? OR description LIKE ?
                ORDER BY ${orderBy}
            `, [searchPattern, searchPattern, searchPattern, searchPattern]);
            results = results.concat(hotels);
        }

        // 排序所有结果
        if (sort === 'rating') {
            results.sort((a, b) => b.rating - a.rating);
        } else if (sort === 'reviews') {
            results.sort((a, b) => b.review_count - a.review_count);
        }

        totalCount = results.length;
        const paginatedResults = results.slice(offset, offset + limitNum);

        // 记录搜索日志
        const userIp = req.ip || req.connection.remoteAddress;
        const userId = req.user ? req.user.id : null;

        try {
            await pool.query(`
                INSERT INTO search_logs (keyword, search_type, result_count, user_id, ip_address)
                VALUES (?, ?, ?, ?, ?)
            `, [q, type, totalCount, userId, userIp]);
        } catch (logError) {
            console.error('记录搜索日志失败:', logError);
        }

        res.json({
            success: true,
            data: {
                results: paginatedResults,
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                hasMore: offset + limitNum < totalCount,
                query: q,
                type: type
            }
        });
    } catch (error) {
        console.error('全局搜索失败:', error);
        res.status(500).json({
            success: false,
            error: '搜索失败'
        });
    }
}

/**
 * 旧的搜索建议接口（保持向后兼容）
 */
async function getSearchSuggestions(req, res) {
    try {
        const { q, limit = 5 } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const searchPattern = `%${q}%`;
        const limitNum = parseInt(limit);

        const [suggestions] = await pool.query(`
            SELECT DISTINCT
                id,
                name,
                location_city,
                location_country,
                type,
                rating,
                review_count,
                'attraction' as suggestion_type
            FROM attractions
            WHERE name LIKE ? OR location_city LIKE ? OR location_country LIKE ?
            ORDER BY rating DESC, review_count DESC
            LIMIT ?
        `, [searchPattern, searchPattern, searchPattern, limitNum]);

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('获取搜索建议失败:', error);
        res.status(500).json({
            success: false,
            error: '获取搜索建议失败'
        });
    }
}

/**
 * 获取搜索过滤器选项
 */
async function getSearchFilters(req, res) {
    try {
        const [types] = await pool.query(`
            SELECT DISTINCT type, COUNT(*) as count
            FROM attractions
            WHERE type IS NOT NULL
            GROUP BY type
            ORDER BY count DESC
        `);

        const [priceRange] = await pool.query(`
            SELECT
                MIN(price) as min_price,
                MAX(price) as max_price,
                AVG(price) as avg_price
            FROM attractions
            WHERE price > 0
        `);

        const [ratingDistribution] = await pool.query(`
            SELECT
                FLOOR(rating) as rating_level,
                COUNT(*) as count
            FROM attractions
            GROUP BY FLOOR(rating)
            ORDER BY rating_level DESC
        `);

        const [locations] = await pool.query(`
            SELECT
                location_city,
                location_country,
                COUNT(*) as count
            FROM attractions
            GROUP BY location_city, location_country
            ORDER BY count DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            data: {
                types: types.map(t => ({
                    value: t.type,
                    label: t.type,
                    count: t.count
                })),
                priceRange: {
                    min: parseFloat(priceRange[0].min_price || 0),
                    max: parseFloat(priceRange[0].max_price || 100),
                    avg: parseFloat(priceRange[0].avg_price || 50)
                },
                ratings: ratingDistribution.map(r => ({
                    level: r.rating_level,
                    count: r.count
                })),
                locations: locations.map(l => ({
                    city: l.location_city,
                    country: l.location_country,
                    count: l.count
                })),
                sortOptions: [
                    { value: 'relevance', label: '相关性' },
                    { value: 'rating', label: '评分最高' },
                    { value: 'reviews', label: '评论最多' },
                    { value: 'price', label: '价格最低' },
                    { value: 'price_desc', label: '价格最高' }
                ]
            }
        });
    } catch (error) {
        console.error('获取过滤器选项失败:', error);
        res.status(500).json({
            success: false,
            error: '获取过滤器选项失败'
        });
    }
}

module.exports = {
    getUnifiedSearchSuggestions,
    getTrendingSearches,
    globalSearch,
    getSearchSuggestions,
    getSearchFilters
};
