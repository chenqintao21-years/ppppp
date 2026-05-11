const { pool } = require('../src/config/database');
const { AmapService } = require('../services/mapService');

const amapService = new AmapService();

// 将高德POI数据转换为餐厅格式
function convertPoiToRestaurant(poi) {
    const bizExt = poi.biz_ext || {};
    const photos = poi.photos || [];

    // 处理标签 - 可能是字符串或数组
    let features = [];
    if (poi.tag) {
        if (typeof poi.tag === 'string') {
            features = poi.tag.split(';').filter(t => t);
        } else if (Array.isArray(poi.tag)) {
            features = poi.tag;
        }
    }

    // 处理类型 - 可能是字符串或数组
    let cuisine = [];
    if (poi.type) {
        if (typeof poi.type === 'string') {
            cuisine = poi.type.split(';').filter(t => t);
        } else if (Array.isArray(poi.type)) {
            cuisine = poi.type;
        }
    }
    if (cuisine.length === 0) {
        cuisine = ['餐饮'];
    }

    return {
        id: poi.id,
        name: poi.name,
        image: photos.length > 0 ? photos[0].url : null,
        rating: parseFloat(bizExt.rating) || 0,
        reviewCount: parseInt(bizExt.rating) || 0,
        cuisine: cuisine,
        priceRange: bizExt.cost || null,
        description: poi.address || '',
        features: features,
        address: poi.address || '',
        phone: poi.tel || '',
        location: poi.location ? {
            lng: parseFloat(poi.location.split(',')[0]),
            lat: parseFloat(poi.location.split(',')[1])
        } : null
    };
}

// 将高德POI详情数据转换为餐厅详情格式
function convertPoiToRestaurantDetail(poi) {
    const bizExt = poi.biz_ext || {};
    const photos = poi.photos || [];

    // 处理标签
    let features = [];
    if (poi.tag) {
        if (typeof poi.tag === 'string') {
            features = poi.tag.split(';').filter(t => t);
        } else if (Array.isArray(poi.tag)) {
            features = poi.tag;
        }
    }

    // 处理类型
    let cuisine = [];
    if (poi.type) {
        if (typeof poi.type === 'string') {
            cuisine = poi.type.split(';').filter(t => t);
        } else if (Array.isArray(poi.type)) {
            cuisine = poi.type;
        }
    }
    if (cuisine.length === 0) {
        cuisine = ['餐饮'];
    }

    // 处理图片
    const photoUrls = photos.map(p => p.url || p).filter(url => url);

    return {
        id: poi.id,
        name: poi.name,
        rating: parseFloat(bizExt.rating) || 0,
        reviewCount: parseInt(bizExt.rating) || 0,
        cuisine: cuisine,
        priceRange: bizExt.cost || null,
        priceDetail: bizExt.cost || null,
        description: poi.address || '',
        features: features,
        address: poi.address || '',
        phone: poi.tel || '',
        hours: poi.business_time || null,
        photos: photoUrls,
        ratings: {
            food: parseFloat(bizExt.rating) || 0,
            service: parseFloat(bizExt.rating) || 0,
            value: parseFloat(bizExt.rating) || 0,
            atmosphere: parseFloat(bizExt.rating) || 0
        }
    };
}

// 获取餐厅详情
async function getRestaurantDetail(req, res) {
    try {
        const { id } = req.params;

        // 首先尝试从数据库查询（数字ID）
        const [restaurants] = await pool.query(
            'SELECT * FROM restaurants WHERE id = ?',
            [id]
        );

        // 如果数据库中找不到，返回404
        if (restaurants.length === 0) {
            return res.status(404).json({
                success: false,
                message: '餐厅不存在'
            });
        }

        if (restaurants.length === 0) {
            return res.status(404).json({
                success: false,
                message: '餐厅不存在'
            });
        }

        const restaurant = restaurants[0];

        // 从数据库获取菜系信息
        let cuisine = [];
        if (restaurant.cuisine_type) {
            cuisine = [restaurant.cuisine_type];
        }

        // 从数据库获取特色信息（从tags字段）
        let features = [];
        if (restaurant.tags) {
            try {
                const tags = typeof restaurant.tags === 'string'
                    ? JSON.parse(restaurant.tags)
                    : restaurant.tags;
                if (Array.isArray(tags) && tags.length > 0) {
                    features = tags;
                }
            } catch (e) {
                console.error('解析tags失败:', e);
            }
        }

        // 构建photos数组 - 使用image或image_url字段
        let photos = [];
        if (restaurant.image_url) {
            photos.push(restaurant.image_url);
        } else if (restaurant.image) {
            photos.push(restaurant.image);
        }

        const restaurantData = {
            id: restaurant.id,
            name: restaurant.name,
            rating: parseFloat(restaurant.rating),
            reviewCount: restaurant.review_count,
            cuisine: cuisine,
            priceRange: restaurant.price_range || null,
            priceDetail: restaurant.price_detail || null,
            description: restaurant.description,
            features: features,
            address: restaurant.address,
            phone: restaurant.phone,
            hours: restaurant.hours || null,
            photos: photos,
            ratings: {
                food: parseFloat(restaurant.food_rating) || 0,
                service: parseFloat(restaurant.service_rating) || 0,
                value: parseFloat(restaurant.value_rating) || 0,
                atmosphere: parseFloat(restaurant.atmosphere_rating) || 0
            }
        };

        res.json({
            success: true,
            data: restaurantData
        });
    } catch (error) {
        console.error('获取餐厅详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取餐厅详情失败'
        });
    }
}

// 获取餐厅点评
async function getRestaurantReviews(req, res) {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const [reviews] = await pool.query(
            `SELECT r.*, u.username as userName, u.avatar as userAvatar
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.entity_type = 'restaurant' AND r.entity_id = ?
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [id, limit, offset]
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM reviews WHERE entity_type = ? AND entity_id = ?',
            ['restaurant', id]
        );

        const total = countResult[0].total;

        res.json({
            success: true,
            data: reviews.map(review => ({
                id: review.id,
                userName: review.userName,
                userAvatar: review.userAvatar || null,
                rating: parseFloat(review.rating),
                date: review.created_at.toISOString().split('T')[0],
                text: review.content
            })),
            pagination: {
                total,
                page,
                pageSize: limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取餐厅点评错误:', error);
        res.status(500).json({
            success: false,
            message: '获取点评失败'
        });
    }
}

// 搜索餐厅
async function searchRestaurants(req, res) {
    try {
        const { q, location, cuisine, priceRange, rating, sort } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // 只从数据库查询，不使用高德地图API
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM restaurants WHERE 1=1';
        const params = [];

        if (location) {
            query += ' AND (address LIKE ? OR location_city LIKE ? OR location_address LIKE ?)';
            params.push(`%${location}%`, `%${location}%`, `%${location}%`);
        }

        if (q) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }

        if (rating) {
            query += ' AND rating >= ?';
            params.push(parseFloat(rating));
        }

        // 排序
        if (sort === 'rating') {
            query += ' ORDER BY rating DESC';
        } else if (sort === 'price') {
            query += ' ORDER BY price_range ASC';
        } else {
            query += ' ORDER BY review_count DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [restaurants] = await pool.query(query, params);

        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM restaurants WHERE 1=1';
        const countParams = [];

        if (location) {
            countQuery += ' AND (address LIKE ? OR location_city LIKE ? OR location_address LIKE ?)';
            countParams.push(`%${location}%`, `%${location}%`, `%${location}%`);
        }

        if (q) {
            countQuery += ' AND (name LIKE ? OR description LIKE ?)';
            countParams.push(`%${q}%`, `%${q}%`);
        }

        if (rating) {
            countQuery += ' AND rating >= ?';
            countParams.push(parseFloat(rating));
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                restaurants: restaurants,
                total: total,
                page: page,
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        console.error('搜索餐厅错误:', error);
        res.status(500).json({
            success: false,
            message: '搜索餐厅失败: ' + error.message
        });
    }
}

// 获取搜索建议
async function getRestaurantSuggestions(req, res) {
    try {
        const { q } = req.query;
        const limit = parseInt(req.query.limit) || 5;

        if (!q) {
            return res.json({
                success: true,
                data: []
            });
        }

        const [restaurants] = await pool.query(
            'SELECT id, name, rating FROM restaurants WHERE name LIKE ? LIMIT ?',
            [`%${q}%`, limit]
        );

        const suggestions = restaurants.map(r => ({
            type: 'restaurant',
            id: r.id,
            name: r.name,
            cuisine: r.cuisine_type || null,
            rating: parseFloat(r.rating)
        }));

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('获取搜索建议错误:', error);
        res.status(500).json({
            success: false,
            message: '获取建议失败'
        });
    }
}

// 创建餐厅预订
async function createRestaurantBooking(req, res) {
    try {
        const { restaurantId, date, time, guests, guestInfo, specialRequests } = req.body;
        const userId = req.user?.id || 1; // 如果未登录，使用默认用户ID

        // 生成预订ID
        const bookingId = 'RB' + Date.now();

        const [result] = await pool.query(
            `INSERT INTO bookings
            (booking_id, user_id, entity_type, entity_id, booking_date, guests, guest_name, guest_email, guest_phone, special_requests, status)
            VALUES (?, ?, 'restaurant', ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
            [bookingId, userId, restaurantId, date, guests, guestInfo.name, guestInfo.email, guestInfo.phone, specialRequests]
        );

        // 获取餐厅名称
        const [restaurants] = await pool.query('SELECT name FROM restaurants WHERE id = ?', [restaurantId]);
        const restaurantName = restaurants[0]?.name || '餐厅';

        res.status(201).json({
            success: true,
            data: {
                bookingId,
                status: 'confirmed',
                confirmationCode: 'ABC123',
                restaurantName,
                date,
                time,
                guests
            }
        });
    } catch (error) {
        console.error('创建餐厅预订错误:', error);
        res.status(500).json({
            success: false,
            message: '预订失败'
        });
    }
}

// 获取附近餐厅
async function getNearbyRestaurants(req, res) {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 3;

        const [restaurants] = await pool.query(
            'SELECT * FROM restaurants WHERE id != ? ORDER BY rating DESC LIMIT ?',
            [id, limit]
        );

        res.json({
            success: true,
            data: restaurants.map(r => ({
                id: r.id,
                name: r.name,
                rating: parseFloat(r.rating),
                reviewCount: r.review_count,
                cuisine: r.cuisine_type ? [r.cuisine_type] : [],
                image: r.image || null,
                distance: null
            }))
        });
    } catch (error) {
        console.error('获取附近餐厅错误:', error);
        res.status(500).json({
            success: false,
            message: '获取附近餐厅失败'
        });
    }
}

// 获取餐厅列表
async function getRestaurants(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [restaurants] = await pool.query(
            'SELECT * FROM restaurants ORDER BY rating DESC, review_count DESC LIMIT ? OFFSET ?',
            [parseInt(limit), offset]
        );

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM restaurants');
        const total = countResult[0].total;

        res.json({
            success: true,
            data: restaurants.map(r => ({
                id: r.id,
                name: r.name,
                rating: parseFloat(r.rating),
                reviewCount: r.review_count,
                cuisine: r.cuisine_type ? [r.cuisine_type] : [],
                priceRange: r.price_range,
                image: r.image || null
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('获取餐厅列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取餐厅列表失败'
        });
    }
}

// 获取热门餐厅
async function getPopularRestaurants(req, res) {
    try {
        const { destination, limit = 10 } = req.query;

        let query = 'SELECT * FROM restaurants';
        const params = [];

        if (destination) {
            query += ' WHERE address LIKE ?';
            params.push(`%${destination}%`);
        }

        query += ' ORDER BY review_count DESC, rating DESC LIMIT ?';
        params.push(parseInt(limit));

        const [restaurants] = await pool.query(query, params);

        res.json({
            success: true,
            data: restaurants.map(r => ({
                id: r.id,
                name: r.name,
                rating: parseFloat(r.rating),
                reviewCount: r.review_count,
                cuisine: r.cuisine_type ? [r.cuisine_type] : [],
                priceRange: r.price_range,
                image: r.image || null
            }))
        });
    } catch (error) {
        console.error('获取热门餐厅错误:', error);
        res.status(500).json({
            success: false,
            message: '获取热门餐厅失败'
        });
    }
}

// 获取附近餐厅（通用版本）
async function getNearbyRestaurantsGeneric(req, res) {
    try {
        const { lat, lng, radius, limit = 10 } = req.query;

        // 简化版本：返回评分最高的餐厅
        const [restaurants] = await pool.query(
            'SELECT * FROM restaurants ORDER BY rating DESC LIMIT ?',
            [parseInt(limit)]
        );

        res.json({
            success: true,
            data: restaurants.map(r => ({
                id: r.id,
                name: r.name,
                rating: parseFloat(r.rating),
                reviewCount: r.review_count,
                cuisine: r.cuisine_type ? [r.cuisine_type] : [],
                priceRange: r.price_range,
                image: r.image || null,
                distance: null
            }))
        });
    } catch (error) {
        console.error('获取附近餐厅错误:', error);
        res.status(500).json({
            success: false,
            message: '获取附近餐厅失败'
        });
    }
}

// 获取餐厅菜单
async function getRestaurantMenu(req, res) {
    try {
        const { id } = req.params;

        // 返回空菜单，因为没有真实数据
        const menu = {
            success: true,
            data: {
                categories: []
            }
        };

        res.json(menu);
    } catch (error) {
        console.error('获取餐厅菜单错误:', error);
        res.status(500).json({
            success: false,
            message: '获取菜单失败'
        });
    }
}

// 预订餐厅
async function bookRestaurant(req, res) {
    try {
        const { restaurantId, date, time, guests, guestInfo, specialRequests } = req.body;

        // 生成预订ID
        const bookingId = 'RB' + Date.now();

        res.status(201).json({
            success: true,
            data: {
                bookingId,
                status: 'confirmed',
                confirmationCode: 'ABC123',
                restaurantId,
                date,
                time,
                guests
            }
        });
    } catch (error) {
        console.error('预订餐厅错误:', error);
        res.status(500).json({
            success: false,
            message: '预订失败'
        });
    }
}

module.exports = {
    getRestaurantDetail,
    getRestaurantReviews,
    searchRestaurants,
    getRestaurantSuggestions,
    createRestaurantBooking,
    getNearbyRestaurants,
    getRestaurants,
    getPopularRestaurants,
    getNearbyRestaurantsGeneric,
    getRestaurantMenu,
    bookRestaurant
};
