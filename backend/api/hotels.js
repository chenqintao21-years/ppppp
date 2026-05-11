// 酒店相关API接口
const { mapDataMergeService } = require('../services/mapService');

/**
 * 搜索酒店
 * POST /api/hotels/search
 */
async function searchHotels(req, res) {
    const { query, checkIn, checkOut, guests, location, city } = req.body;

    try {
        // 优先从数据库查询
        const { pool } = require('../src/config/database');

        let dbQuery = 'SELECT * FROM hotels WHERE 1=1';
        const params = [];

        if (city) {
            dbQuery += ' AND (location LIKE ? OR address LIKE ?)';
            params.push(`%${city}%`, `%${city}%`);
        }

        if (query) {
            dbQuery += ' AND name LIKE ?';
            params.push(`%${query}%`);
        }

        dbQuery += ' ORDER BY rating DESC, review_count DESC LIMIT 50';

        const [hotels] = await pool.query(dbQuery, params);

        if (hotels.length > 0) {
            // 从数据库返回数据
            const results = {
                success: true,
                data: hotels.map(hotel => ({
                    id: hotel.id,
                    name: hotel.name,
                    rating: parseFloat(hotel.rating) || 0,
                    reviews: hotel.review_count || 0,
                    price: hotel.price_per_night || null,
                    currency: 'CNY',
                    location: hotel.location,
                    address: hotel.address,
                    description: hotel.description || '',
                    amenities: [],
                    images: hotel.image ? [hotel.image] : [],
                    image: hotel.image || null,
                    available: true,
                    ratingBreakdown: {
                        overall: parseFloat(hotel.rating) || 0,
                        service: null,
                        facility: null,
                        hygiene: null
                    },
                    businessArea: hotel.location,
                    hotelService: null,
                    innerFacility: null
                })),
                total: hotels.length,
                filters: {
                    priceRange: { min: null, max: null },
                    ratings: [],
                    amenities: []
                }
            };

            return res.json(results);
        }

        // 如果数据库没有数据，返回空结果
        res.json({
            success: true,
            data: [],
            total: 0,
            filters: {
                priceRange: { min: null, max: null },
                ratings: [],
                amenities: []
            }
        });
    } catch (error) {
        console.error('搜索酒店失败:', error);
        res.status(500).json({
            success: false,
            message: '搜索酒店失败'
        });
    }
}

/**
 * 获取酒店详情
 * GET /api/hotels/:id
 */
async function getHotelDetail(req, res) {
    const { id } = req.params;
    const { city } = req.query; // 从查询参数获取城市名称

    try {
        // 首先尝试从数据库查询（数字ID）
        const { pool } = require('../src/config/database');

        if (!isNaN(id)) {
            // 如果是数字ID，从数据库查询
            const [hotels] = await pool.query('SELECT * FROM hotels WHERE id = ?', [id]);

            if (hotels.length > 0) {
                const hotel = hotels[0];
                return res.json({
                    success: true,
                    data: {
                        id: hotel.id,
                        name: hotel.name,
                        rating: parseFloat(hotel.rating) || 4.5,
                        reviews: hotel.review_count || 0,
                        price: hotel.price_per_night || 899,
                        currency: 'CNY',
                        location: hotel.location || hotel.address,
                        address: hotel.address,
                        latitude: hotel.latitude,
                        longitude: hotel.longitude,
                        description: hotel.description || '',
                        ratingBreakdown: {
                            service: 4.5,
                            cleanliness: 4.3,
                            location: 4.8,
                            facility: 4.5
                        },
                        amenities: hotel.amenities ? JSON.parse(hotel.amenities) : [],
                        roomTypes: [],
                        images: hotel.image ? [hotel.image] : [],
                        policies: {
                            checkIn: '14:00',
                            checkOut: '12:00',
                            cancellation: '入住前24小时免费取消'
                        }
                    }
                });
            }
        }

        // 如果数据库没有找到，返回404
        return res.status(404).json({
            success: false,
            message: '酒店不存在'
        });

        res.json(hotel);
    } catch (error) {
        console.error('获取酒店详情失败:', error);
        res.json(getDefaultHotelDetail(id));
    }
}

// 默认酒店详情（备用）
function getDefaultHotelDetail(id) {
    const hotels = {
        1: {
            name: '北京国际酒店',
            rating: 4.5,
            reviews: 1234,
            price: 899,
            location: '北京市中心',
            address: '北京市朝阳区建国路88号',
            description: '位于市中心，交通便利，设施完善。酒店提供豪华客房和套房，配备现代化设施。',
            ratingBreakdown: {
                service: 4.5,
                cleanliness: 4.3,
                location: 4.8
            },
            amenities: [
                { icon: 'wifi', name: '免费WiFi' },
                { icon: 'gym', name: '健身房' },
                { icon: 'pool', name: '游泳池' },
                { icon: 'restaurant', name: '餐厅' }
            ]
        }
    };

    const hotelData = hotels[id] || hotels[1];

    return {
        success: true,
        data: {
            id: parseInt(id),
            name: hotelData.name,
            rating: hotelData.rating,
            reviews: hotelData.reviews,
            price: hotelData.price,
            currency: 'CNY',
            location: hotelData.location,
            address: hotelData.address,
            description: hotelData.description,
            ratingBreakdown: hotelData.ratingBreakdown,
            amenities: hotelData.amenities,
            roomTypes: [
                {
                    id: 1,
                    name: '豪华双人间',
                    price: 899,
                    capacity: 2,
                    size: '25平方米',
                    amenities: ['大床', '免费WiFi', '空调', '电视', '迷你吧']
                }
            ],
            images: [
                'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'600\'%3E%3Crect fill=\'%23e0e0e0\' width=\'800\' height=\'600\'/%3E%3C/svg%3E'
            ],
            policies: {
                checkIn: '14:00',
                checkOut: '12:00',
                cancellation: '入住前24小时免费取消'
            }
        }
    };
}

/**
 * 预订酒店
 * POST /api/hotels/book
 */
async function bookHotel(req, res) {
    const { hotelId, roomTypeId, checkIn, checkOut, guests, contactInfo } = req.body;

    const booking = {
        success: true,
        message: '预订成功',
        data: {
            bookingId: 'HB' + Date.now(),
            hotelId,
            roomTypeId,
            checkIn,
            checkOut,
            guests,
            totalPrice: 899 * calculateNights(checkIn, checkOut),
            currency: 'CNY',
            status: 'confirmed',
            contactInfo,
            createdAt: new Date().toISOString()
        }
    };

    res.json(booking);
}

/**
 * 获取热门酒店
 * GET /api/hotels/popular
 */
async function getPopularHotels(req, res) {
    try {
        const { pool } = require('../src/config/database');

        // 从数据库获取评分最高的4个酒店
        const [hotels] = await pool.query(`
            SELECT
                id,
                name,
                rating,
                review_count as reviews,
                location,
                image
            FROM hotels
            ORDER BY rating DESC, review_count DESC
            LIMIT 4
        `);

        // 转换数据格式
        const formattedHotels = hotels.map((hotel, index) => ({
            id: hotel.id,
            name: hotel.name,
            rating: hotel.rating,
            reviews: hotel.reviews,
            price: 899 + (index * 200), // 模拟价格
            currency: 'CNY',
            location: hotel.location,
            image: hotel.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%23DDDDDD\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
            badge: '旅行者之选',
            rank: index + 1
        }));

        res.json({
            success: true,
            data: formattedHotels
        });
    } catch (error) {
        console.error('获取热门酒店失败:', error);
        // 如果数据库查询失败，返回模拟数据
        const hotels = {
            success: true,
            data: [
                {
                    id: 1,
                    name: 'La Siesta Classic Ma May Hotel',
                    rating: 5.0,
                    reviews: 2771,
                    price: 187,
                    currency: 'USD',
                    location: '河内老城区',
                    image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%23DDDDDD\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
                    badge: '旅行者之选',
                    rank: 1
                },
                {
                    id: 2,
                    name: 'Jaya House River Park',
                    rating: 5.0,
                    reviews: 5129,
                    price: 206,
                    currency: 'USD',
                    location: '暹粒',
                    image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%23CCDDEE\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
                    badge: '旅行者之选',
                    rank: 2
                },
                {
                    id: 3,
                    name: '度假酒店',
                    rating: 5.0,
                    reviews: 7711,
                    price: 251,
                    currency: 'USD',
                    location: '巴厘岛',
                    image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%23BBCCDD\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
                    badge: '旅行者之选',
                    rank: 3
                },
                {
                    id: 4,
                    name: 'The Kayon Jungle Resort',
                    rating: 5.0,
                    reviews: 3512,
                    price: 347,
                    currency: 'USD',
                    location: '乌布',
                    image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%23AABBCC\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
                    badge: '旅行者之选',
                    rank: 4
                }
            ]
        };
        res.json(hotels);
    }
}

/**
 * 获取酒店评论
 * GET /api/hotels/:id/reviews
 */
async function getHotelReviews(req, res) {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = {
        success: true,
        data: [
            {
                id: 1,
                userId: 101,
                userName: '张三',
                rating: 5.0,
                title: '非常棒的酒店',
                content: '位置很好，服务很棒，房间干净舒适，下次还会再来！',
                date: '2026-04-15',
                helpful: 23,
                images: ['/images/review1-1.jpg', '/images/review1-2.jpg']
            },
            {
                id: 2,
                userId: 102,
                userName: '李四',
                rating: 4.0,
                title: '不错的体验',
                content: '整体不错，就是早餐种类可以再丰富一些。',
                date: '2026-04-10',
                helpful: 15,
                images: []
            }
        ],
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 1234,
            totalPages: Math.ceil(1234 / limit)
        }
    };

    res.json(reviews);
}

/**
 * 获取酒店列表
 * GET /api/hotels
 */
async function getHotels(req, res) {
    const { page = 1, limit = 20, location, minPrice, maxPrice, rating } = req.query;

    const hotels = {
        success: true,
        data: [
            {
                id: 1,
                name: '北京国际酒店',
                rating: 4.5,
                reviews: 1234,
                price: 899,
                currency: 'CNY',
                location: '北京市中心',
                image: '/images/hotel1.jpg'
            },
            {
                id: 2,
                name: '上海外滩酒店',
                rating: 5.0,
                reviews: 2567,
                price: 1299,
                currency: 'CNY',
                location: '上海浦东',
                image: '/images/hotel2.jpg'
            },
            {
                id: 3,
                name: '成都熊猫酒店',
                rating: 4.0,
                reviews: 890,
                price: 599,
                currency: 'CNY',
                location: '成都市',
                image: '/images/hotel3.jpg'
            }
        ],
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 3,
            totalPages: 1
        }
    };

    res.json(hotels);
}

/**
 * 获取酒店建议
 * GET /api/hotels/suggestions
 */
async function getHotelSuggestions(req, res) {
    const { query } = req.query;

    const suggestions = {
        success: true,
        data: [
            {
                id: 1,
                name: '北京国际酒店',
                location: '北京市中心',
                rating: 4.5
            },
            {
                id: 2,
                name: '上海外滩酒店',
                location: '上海浦东',
                rating: 5.0
            }
        ]
    };

    res.json(suggestions);
}

// 辅助函数：计算住宿天数
function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * 获取最近浏览的酒店/景点
 * GET /api/hotels/recent-views
 */
async function getRecentViews(req, res) {
    const recentViews = {
        success: true,
        data: [
            {
                id: 'tour-1',
                type: 'tour',
                name: '巴黎大教堂和埃菲尔铁塔徒步游',
                rating: 5.0,
                reviews: 1234,
                image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'100\'%3E%3Crect fill=\'%23DDDDDD\' width=\'150\' height=\'100\'/%3E%3C/svg%3E'
            },
            {
                id: 'tour-2',
                type: 'tour',
                name: '内罗毕国家博物馆(回程)',
                rating: 5.0,
                reviews: 856,
                image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'100\'%3E%3Crect fill=\'%23CCCCCC\' width=\'150\' height=\'100\'/%3E%3C/svg%3E',
                badge: '可立即确认'
            },
            {
                id: 'destination-1',
                type: 'destination',
                name: '美国',
                rating: 5.0,
                reviews: 9876,
                image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'100\'%3E%3Crect fill=\'%23BBBBBB\' width=\'150\' height=\'100\'/%3E%3C/svg%3E'
            }
        ]
    };

    res.json(recentViews);
}

/**
 * 获取特色功能
 * GET /api/hotels/features
 */
async function getFeatures(req, res) {
    const features = {
        success: true,
        data: [
            {
                id: 1,
                icon: '🏆',
                title: '旅行者之选',
                description: '探索旅行者最喜爱的酒店'
            },
            {
                id: 2,
                icon: '💰',
                title: '适合各类预算的酒店',
                description: '通过搜索各类，获取以超过200万家酒店中的最佳价格，找到最适合的酒店'
            },
            {
                id: 3,
                icon: '🔒',
                title: '全网最优惠价格',
                description: '比较200多个订房网站的价格，以最便宜的价格预订酒店'
            }
        ]
    };

    res.json(features);
}

/**
 * 获取亚洲最佳酒店/目的地
 * GET /api/hotels/asia-best
 */
async function getAsiaBestHotels(req, res) {
    const destinations = {
        success: true,
        data: [
            {
                id: 1,
                name: '福冈的最佳长期住宿酒店：年度旅行者之选',
                rating: 5.0,
                reviews: 1670,
                image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%2387CEEB\' width=\'400\' height=\'300\'/%3E%3C/svg%3E',
                size: 'large'
            },
            {
                id: 2,
                name: '曼谷大皇宫和寺庙半日游：年度旅行者之选',
                rating: 5.0,
                reviews: 137,
                image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Crect fill=\'%23FFB347\' width=\'300\' height=\'300\'/%3E%3C/svg%3E',
                size: 'normal'
            },
            {
                id: 3,
                name: '3小时摩托车半日游之旅：前往曼谷的寺庙',
                rating: null,
                reviews: null,
                image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Crect fill=\'%23DDA15E\' width=\'300\' height=\'300\'/%3E%3C/svg%3E',
                size: 'normal'
            },
            {
                id: 4,
                name: '曼谷寺庙和城市风光骑行游',
                rating: 5.0,
                reviews: 520,
                image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Crect fill=\'%23BC6C25\' width=\'300\' height=\'300\'/%3E%3C/svg%3E',
                size: 'normal'
            }
        ]
    };

    res.json(destinations);
}

/**
 * 获取全包式度假酒店
 * GET /api/hotels/all-inclusive
 */
async function getAllInclusiveHotels(req, res) {
    try {
        const { pool } = require('../src/config/database');

        // 从数据库获取评论数最多的4个酒店（跳过前4个，避免与热门酒店重复）
        const [hotels] = await pool.query(`
            SELECT
                id,
                name,
                rating,
                review_count as reviews,
                image
            FROM hotels
            ORDER BY review_count DESC
            LIMIT 4 OFFSET 4
        `);

        // 转换数据格式
        const formattedHotels = hotels.map((hotel, index) => ({
            id: hotel.id,
            name: hotel.name,
            rating: hotel.rating,
            reviews: hotel.reviews,
            image: hotel.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%2387CEEB\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
            badge: index < 2 ? '旅行者之选' : null
        }));

        res.json({
            success: true,
            data: formattedHotels
        });
    } catch (error) {
        console.error('获取全包式度假酒店失败:', error);
        // 如果数据库查询失败，返回模拟数据
        const hotels = {
            success: true,
            data: [
                {
                    id: 5,
                    name: 'Casa Dorada',
                    rating: 5.0,
                    reviews: 4572,
                    image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%2387CEEB\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
                    badge: '旅行者之选'
                },
                {
                    id: 6,
                    name: '度假酒店',
                    rating: 5.0,
                    reviews: 13104,
                    image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%2366B2B2\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
                    badge: '旅行者之选'
                },
                {
                    id: 7,
                    name: 'Voyage Sorgun',
                    rating: 5.0,
                    reviews: 10730,
                    image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%23AABBCC\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
                    badge: null
                },
                {
                    id: 8,
                    name: '希尔顿钻石度假酒店',
                    rating: 5.0,
                    reviews: 18360,
                    image: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'200\'%3E%3Crect fill=\'%23DDDDDD\' width=\'300\' height=\'200\'/%3E%3C/svg%3E',
                    badge: null
                }
            ]
        };
        res.json(hotels);
    }
}

/**
 * 获取热门酒店链接
 * GET /api/hotels/popular-links
 */
async function getPopularHotelLinks(req, res) {
    const links = {
        success: true,
        data: {
            columns: [
                {
                    links: [
                        { text: '世界', url: '#' },
                        { text: '旅行论坛', url: '#' },
                        { text: '航空公司', url: '#' },
                        { text: '旅游指南', url: '#' },
                        { text: '旅行酒店', url: 'hotel-page.html' },
                        { text: '度假租赁', url: '#' },
                        { text: '旅行故事', url: '#' },
                        { text: '邮轮', url: '#' },
                        { text: '租车', url: '#' }
                    ]
                },
                {
                    links: [
                        { text: '成都酒店', url: 'hotel-search.html?city=成都' },
                        { text: '华盛顿特区酒店', url: 'hotel-search.html?city=华盛顿' },
                        { text: '巴黎酒店', url: 'hotel-search.html?city=巴黎' },
                        { text: '纽约市酒店', url: 'hotel-search.html?city=纽约' },
                        { text: '洛杉矶酒店', url: 'hotel-search.html?city=洛杉矶' },
                        { text: '伦敦酒店', url: 'hotel-search.html?city=伦敦' },
                        { text: '东京酒店', url: 'hotel-search.html?city=东京' },
                        { text: '罗马酒店', url: 'hotel-search.html?city=罗马' }
                    ]
                },
                {
                    links: [
                        { text: '圣地亚哥酒店', url: 'hotel-search.html?city=圣地亚哥' },
                        { text: '巴塞罗那酒店', url: 'hotel-search.html?city=巴塞罗那' },
                        { text: '旧金山酒店', url: 'hotel-search.html?city=旧金山' },
                        { text: '新奥尔良酒店', url: 'hotel-search.html?city=新奥尔良' },
                        { text: '迈阿密酒店', url: 'hotel-search.html?city=迈阿密' },
                        { text: '拉斯维加斯酒店', url: 'hotel-search.html?city=拉斯维加斯' },
                        { text: '芝加哥酒店', url: 'hotel-search.html?city=芝加哥' },
                        { text: '西雅图酒店', url: 'hotel-search.html?city=西雅图' }
                    ]
                }
            ]
        }
    };

    res.json(links);
}

module.exports = {
    searchHotels,
    getHotelDetail,
    bookHotel,
    getPopularHotels,
    getHotelReviews,
    getHotels,
    getHotelSuggestions,
    getRecentViews,
    getFeatures,
    getAsiaBestHotels,
    getAllInclusiveHotels,
    getPopularHotelLinks
};
