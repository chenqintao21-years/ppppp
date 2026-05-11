const { pool } = require('../src/config/database');

/**
 * 获取城市详情
 * GET /api/destinations/:id
 */
async function getDestinationDetail(req, res) {
    try {
        const { id } = req.params;

        const connection = await pool.getConnection();

        // 获取城市基本信息
        const [destinations] = await connection.query(
            'SELECT * FROM destinations WHERE id = ? AND status = "active"',
            [id]
        );

        if (destinations.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '城市不存在'
            });
        }

        const destination = destinations[0];

        // 获取城市景点数量
        const [attractionStats] = await connection.query(
            'SELECT COUNT(*) as count FROM attractions WHERE location_city = ?',
            [destination.name]
        );

        // 获取城市酒店数量
        const [hotelStats] = await connection.query(
            'SELECT COUNT(*) as count FROM hotels WHERE location LIKE ?',
            [`%${destination.name}%`]
        );

        // 获取城市餐厅数量
        const [restaurantStats] = await connection.query(
            'SELECT COUNT(*) as count FROM restaurants WHERE address LIKE ?',
            [`%${destination.name}%`]
        );

        // 获取热门景点（前6个）
        const [topAttractions] = await connection.query(
            `SELECT id, name, rating, review_count, price, currency, image, description
             FROM attractions
             WHERE location_city = ?
             ORDER BY rating DESC, review_count DESC
             LIMIT 6`,
            [destination.name]
        );

        // 获取热门酒店（前6个）
        const [topHotels] = await connection.query(
            `SELECT id, name, rating, review_count, location, image
             FROM hotels
             WHERE location LIKE ?
             ORDER BY rating DESC, review_count DESC
             LIMIT 6`,
            [`%${destination.name}%`]
        );

        // 获取热门餐厅（前6个）
        const [topRestaurants] = await connection.query(
            `SELECT id, name, rating, review_count, price_range, image
             FROM restaurants
             WHERE address LIKE ?
             ORDER BY rating DESC, review_count DESC
             LIMIT 6`,
            [`%${destination.name}%`]
        );

        // 更新浏览量
        await connection.query(
            'UPDATE destinations SET view_count = view_count + 1 WHERE id = ?',
            [id]
        );

        connection.release();

        res.json({
            success: true,
            data: {
                ...destination,
                stats: {
                    attractions: attractionStats[0].count,
                    hotels: hotelStats[0].count,
                    restaurants: restaurantStats[0].count
                },
                topAttractions,
                topHotels,
                topRestaurants
            }
        });

    } catch (error) {
        console.error('获取城市详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
}

/**
 * 获取城市列表（带分页和筛选）
 * GET /api/destinations?page=1&limit=20&country=中国&region=亚洲
 */
async function getDestinations(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            country,
            region,
            sort = 'view_count' // view_count, rating, name
        } = req.query;

        const offset = (page - 1) * limit;
        const connection = await pool.getConnection();

        let query = 'SELECT * FROM destinations WHERE status = "active"';
        const params = [];

        if (country) {
            query += ' AND country = ?';
            params.push(country);
        }

        if (region) {
            query += ' AND region = ?';
            params.push(region);
        }

        // 排序
        const validSorts = ['view_count', 'rating', 'name', 'created_at'];
        const sortField = validSorts.includes(sort) ? sort : 'view_count';
        query += ` ORDER BY ${sortField} DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const [destinations] = await connection.query(query, params);

        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM destinations WHERE status = "active"';
        const countParams = [];

        if (country) {
            countQuery += ' AND country = ?';
            countParams.push(country);
        }

        if (region) {
            countQuery += ' AND region = ?';
            countParams.push(region);
        }

        const [countResult] = await connection.query(countQuery, countParams);
        const total = countResult[0].total;

        connection.release();

        res.json({
            success: true,
            data: destinations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('获取城市列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
}

/**
 * 搜索城市
 * GET /api/destinations/search?q=罗马
 */
async function searchDestinations(req, res) {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 1) {
            return res.status(400).json({
                success: false,
                message: '搜索关键词不能为空'
            });
        }

        const connection = await pool.getConnection();

        const [results] = await connection.query(
            `SELECT id, name, name_en, country, region, cover_image, rating, view_count
             FROM destinations
             WHERE status = "active"
             AND (name LIKE ? OR name_en LIKE ? OR country LIKE ?)
             ORDER BY view_count DESC
             LIMIT 20`,
            [`%${q}%`, `%${q}%`, `%${q}%`]
        );

        connection.release();

        res.json({
            success: true,
            query: q,
            data: results
        });

    } catch (error) {
        console.error('搜索城市失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
}

/**
 * 获取热门城市
 * GET /api/destinations/popular?limit=10
 */
async function getPopularDestinations(req, res) {
    try {
        const { limit = 12 } = req.query;

        const connection = await pool.getConnection();

        const [destinations] = await connection.query(
            `SELECT id, name, name_en, country, region, cover_image, rating, view_count, description
             FROM destinations
             WHERE status = "active"
             ORDER BY view_count DESC, rating DESC
             LIMIT ?`,
            [parseInt(limit)]
        );

        // 为每个城市添加景点数量统计
        for (let dest of destinations) {
            const [attractionCount] = await connection.query(
                'SELECT COUNT(*) as count FROM attractions WHERE location_city = ?',
                [dest.name]
            );
            dest.attraction_count = attractionCount[0].count;
        }

        connection.release();

        res.json({
            success: true,
            data: destinations,
            total: destinations.length
        });

    } catch (error) {
        console.error('获取热门城市失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
}

/**
 * 获取城市的景点列表
 * GET /api/destinations/:id/attractions?page=1&limit=20
 */
async function getDestinationAttractions(req, res) {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, sort = 'rating' } = req.query;
        const offset = (page - 1) * limit;

        const connection = await pool.getConnection();

        // 获取城市信息
        const [destinations] = await connection.query(
            'SELECT name FROM destinations WHERE id = ? AND status = "active"',
            [id]
        );

        if (destinations.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '城市不存在'
            });
        }

        const cityName = destinations[0].name;

        // 获取景点列表
        const validSorts = ['rating', 'review_count', 'price'];
        const sortField = validSorts.includes(sort) ? sort : 'rating';

        const [attractions] = await connection.query(
            `SELECT * FROM attractions
             WHERE location_city = ?
             ORDER BY ${sortField} DESC
             LIMIT ? OFFSET ?`,
            [cityName, parseInt(limit), offset]
        );

        // 获取总数
        const [countResult] = await connection.query(
            'SELECT COUNT(*) as total FROM attractions WHERE location_city = ?',
            [cityName]
        );

        connection.release();

        res.json({
            success: true,
            data: attractions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('获取城市景点失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
}

/**
 * 获取城市的酒店列表
 * GET /api/destinations/:id/hotels?page=1&limit=20
 */
async function getDestinationHotels(req, res) {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, sort = 'rating' } = req.query;
        const offset = (page - 1) * limit;

        const connection = await pool.getConnection();

        // 获取城市信息
        const [destinations] = await connection.query(
            'SELECT name FROM destinations WHERE id = ? AND status = "active"',
            [id]
        );

        if (destinations.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '城市不存在'
            });
        }

        const cityName = destinations[0].name;

        // 获取酒店列表
        const validSorts = ['rating', 'review_count'];
        const sortField = validSorts.includes(sort) ? sort : 'rating';

        const [hotels] = await connection.query(
            `SELECT * FROM hotels
             WHERE location LIKE ?
             ORDER BY ${sortField} DESC
             LIMIT ? OFFSET ?`,
            [`%${cityName}%`, parseInt(limit), offset]
        );

        // 获取总数
        const [countResult] = await connection.query(
            'SELECT COUNT(*) as total FROM hotels WHERE location LIKE ?',
            [`%${cityName}%`]
        );

        connection.release();

        res.json({
            success: true,
            data: hotels,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('获取城市酒店失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
}

/**
 * 获取城市的餐厅列表
 * GET /api/destinations/:id/restaurants?page=1&limit=20
 */
async function getDestinationRestaurants(req, res) {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, sort = 'rating' } = req.query;
        const offset = (page - 1) * limit;

        const connection = await pool.getConnection();

        // 获取城市信息
        const [destinations] = await connection.query(
            'SELECT name FROM destinations WHERE id = ? AND status = "active"',
            [id]
        );

        if (destinations.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '城市不存在'
            });
        }

        const cityName = destinations[0].name;

        // 获取餐厅列表
        const validSorts = ['rating', 'review_count'];
        const sortField = validSorts.includes(sort) ? sort : 'rating';

        const [restaurants] = await connection.query(
            `SELECT * FROM restaurants
             WHERE address LIKE ?
             ORDER BY ${sortField} DESC
             LIMIT ? OFFSET ?`,
            [`%${cityName}%`, parseInt(limit), offset]
        );

        // 获取总数
        const [countResult] = await connection.query(
            'SELECT COUNT(*) as total FROM restaurants WHERE address LIKE ?',
            [`%${cityName}%`]
        );

        connection.release();

        res.json({
            success: true,
            data: restaurants,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('获取城市餐厅失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
}

module.exports = {
    getDestinationDetail,
    getDestinations,
    searchDestinations,
    getPopularDestinations,
    getDestinationAttractions,
    getDestinationHotels,
    getDestinationRestaurants
};
