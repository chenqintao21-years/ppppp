// 城市自动搜索和数据导入API
const { mapDataMergeService } = require('../services/mapService');
const { pool } = require('../src/config/database');
const axios = require('axios');

const AMAP_KEY = process.env.AMAP_KEY || '0c4c21c26cf0ed2fcebc2fabef2d6a0c';

/**
 * 高德地图地理编码 - 将城市名转换为经纬度
 */
async function geocodeCity(cityName) {
    try {
        const response = await axios.get('https://restapi.amap.com/v3/geocode/geo', {
            params: {
                key: AMAP_KEY,
                address: cityName,
                city: cityName
            }
        });

        if (response.data.status === '1' && response.data.geocodes && response.data.geocodes.length > 0) {
            const geocode = response.data.geocodes[0];
            const [lng, lat] = geocode.location.split(',');
            return {
                cityName: geocode.city || cityName,
                province: geocode.province,
                location: {
                    lng: parseFloat(lng),
                    lat: parseFloat(lat)
                },
                adcode: geocode.adcode
            };
        }
        return null;
    } catch (error) {
        console.error('地理编码失败:', error.message);
        return null;
    }
}

/**
 * 搜索景点
 */
async function searchAttractions(city, location, limit = 50) {
    try {
        const response = await axios.get('https://restapi.amap.com/v3/place/text', {
            params: {
                key: AMAP_KEY,
                keywords: '景点|旅游景点|风景区',
                city: city,
                types: '110000|110100|110200|110300', // 景点类型码
                offset: limit,
                extensions: 'all'
            }
        });

        if (response.data.status === '1' && response.data.pois) {
            return response.data.pois.map(poi => ({
                amapId: poi.id,
                name: poi.name,
                type: poi.type,
                address: poi.address,
                location: {
                    lng: parseFloat(poi.location.split(',')[0]),
                    lat: parseFloat(poi.location.split(',')[1])
                },
                tel: poi.tel || '',
                rating: poi.biz_ext?.rating || null,
                price: poi.biz_ext?.cost || null,
                opentime: poi.biz_ext?.open_time || '',
                cityname: poi.cityname || city,
                pname: poi.pname || '',
                photos: (poi.photos || []).map(p => p.url),
                tags: poi.tag ? (typeof poi.tag === 'string' ? poi.tag.split(';').filter(t => t) : (Array.isArray(poi.tag) ? poi.tag : [])) : [],
                source: 'amap'
            }));
        }
        return [];
    } catch (error) {
        console.error('搜索景点失败:', error.message);
        return [];
    }
}

/**
 * 搜索餐厅
 */
async function searchRestaurants(city, location, limit = 50) {
    try {
        const response = await axios.get('https://restapi.amap.com/v3/place/text', {
            params: {
                key: AMAP_KEY,
                keywords: '餐厅|美食|饭店',
                city: city,
                types: '050000|050100|050200|050300', // 餐饮类型码
                offset: limit,
                extensions: 'all'
            }
        });

        if (response.data.status === '1' && response.data.pois) {
            return response.data.pois.map(poi => ({
                amapId: poi.id,
                name: poi.name,
                cuisine: poi.type,
                address: poi.address,
                location: {
                    lng: parseFloat(poi.location.split(',')[0]),
                    lat: parseFloat(poi.location.split(',')[1])
                },
                tel: poi.tel || '',
                rating: poi.biz_ext?.rating || null,
                price: poi.biz_ext?.cost || null,
                opentime: poi.biz_ext?.open_time || '',
                cityname: poi.cityname || city,
                pname: poi.pname || '',
                photos: (poi.photos || []).map(p => p.url),
                tags: poi.tag ? (typeof poi.tag === 'string' ? poi.tag.split(';').filter(t => t) : (Array.isArray(poi.tag) ? poi.tag : [])) : [],
                source: 'amap'
            }));
        }
        return [];
    } catch (error) {
        console.error('搜索餐厅失败:', error.message);
        return [];
    }
}

/**
 * POST /api/city/auto-import
 * 自动搜索并导入城市数据
 */
async function autoImportCityData(req, res) {
    try {
        const { city, location } = req.body;

        if (!city && !location) {
            return res.status(400).json({
                success: false,
                message: '请提供城市名称或经纬度'
            });
        }

        const cityName = city;
        const cityInfo = { province: '' }; // 默认省份信息

        // 直接使用城市名称搜索，不需要地理编码
        console.log(`开始搜索 ${cityName} 的数据...`);

        // 2. 并行搜索酒店、景点、餐厅
        const [hotels, attractions, restaurants] = await Promise.all([
            mapDataMergeService.searchAndMergeHotels({
                city: cityName,
                keywords: '酒店',
                limit: 50
            }),
            searchAttractions(cityName, null, 50),
            searchRestaurants(cityName, null, 50)
        ]);

        console.log(`搜索完成: 酒店 ${hotels.length}, 景点 ${attractions.length}, 餐厅 ${restaurants.length}`);

        // 3. 导入数据到数据库
        const connection = await pool.getConnection();
        const importResults = {
            hotels: 0,
            attractions: 0,
            restaurants: 0,
            errors: []
        };

        try {
            await connection.beginTransaction();

            // 导入酒店
            for (const hotel of hotels) {
                try {
                    await connection.query(
                        `INSERT INTO hotels (
                            name, location_address, location_city, location_country,
                            latitude, longitude, rating, price_per_night,
                            phone, amenities, star_rating, description,
                            image_url, source, source_id, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            rating = VALUES(rating),
                            price_per_night = VALUES(price_per_night),
                            phone = VALUES(phone),
                            updated_at = NOW()`,
                        [
                            hotel.name || '',
                            hotel.address || '',
                            cityName,
                            cityInfo.province || '',
                            hotel.location?.lat || 0,
                            hotel.location?.lng || 0,
                            hotel.rating || 0,
                            hotel.price || null,
                            hotel.tel || null,
                            hotel.amenities ? JSON.stringify(hotel.amenities) : null,
                            hotel.level || null,
                            hotel.type || null,
                            hotel.images && hotel.images.length > 0 ? hotel.images[0] : null,
                            'amap',
                            hotel.id || hotel.amapId
                        ]
                    );
                    importResults.hotels++;
                } catch (error) {
                    importResults.errors.push({
                        type: 'hotel',
                        name: hotel.name,
                        error: error.message
                    });
                }
            }

            // 导入景点
            for (const attraction of attractions) {
                try {
                    await connection.query(
                        `INSERT INTO attractions (
                            name, description, location_city, location_country,
                            latitude, longitude, rating, price,
                            address, phone, opening_hours, type,
                            image_url, tags, source, source_id, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            rating = VALUES(rating),
                            price = VALUES(price),
                            phone = VALUES(phone),
                            opening_hours = VALUES(opening_hours),
                            updated_at = NOW()`,
                        [
                            attraction.name || '',
                            attraction.type || '',
                            attraction.cityname || cityName,
                            attraction.pname || cityInfo.province || '',
                            attraction.location?.lat || 0,
                            attraction.location?.lng || 0,
                            attraction.rating || 0,
                            attraction.price || null,
                            attraction.address || '',
                            attraction.tel || null,
                            attraction.opentime || null,
                            attraction.type || null,
                            attraction.photos && attraction.photos.length > 0 ? attraction.photos[0] : null,
                            attraction.tags ? JSON.stringify(attraction.tags) : null,
                            'amap',
                            attraction.amapId || attraction.id
                        ]
                    );
                    importResults.attractions++;
                } catch (error) {
                    importResults.errors.push({
                        type: 'attraction',
                        name: attraction.name,
                        error: error.message
                    });
                }
            }

            // 导入餐厅
            for (const restaurant of restaurants) {
                try {
                    const values = [
                        restaurant.name || '',
                        restaurant.cuisine || restaurant.type || '',
                        restaurant.address || '',
                        restaurant.cityname || cityName,
                        restaurant.pname || '',
                        restaurant.location?.lat || 0,
                        restaurant.location?.lng || 0,
                        restaurant.rating || 0,
                        (Array.isArray(restaurant.price) && restaurant.price.length > 0) ? restaurant.price[0] : (restaurant.price || null),
                        restaurant.tel || null,
                        (Array.isArray(restaurant.opentime) && restaurant.opentime.length > 0) ? JSON.stringify(restaurant.opentime) : null,
                        restaurant.type || restaurant.cuisine || null,
                        restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos[0] : null,
                        restaurant.tags && restaurant.tags.length > 0 ? JSON.stringify(restaurant.tags) : null,
                        'amap',
                        restaurant.amapId || restaurant.id
                    ];

                    await connection.query(
                        `INSERT INTO restaurants (
                            name, cuisine_type, location_address, location_city, location_country,
                            latitude, longitude, rating, price_range,
                            phone, opening_hours, description,
                            image_url, tags, source, source_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            rating = VALUES(rating),
                            price_range = VALUES(price_range),
                            phone = VALUES(phone),
                            opening_hours = VALUES(opening_hours),
                            updated_at = NOW()`,
                        values
                    );
                    importResults.restaurants++;
                } catch (error) {
                    console.error(`导入餐厅失败 ${restaurant.name}:`, error.message);
                    console.error('Values数组:', JSON.stringify(values));
                    console.error('Values长度:', values.length);
                    importResults.errors.push({
                        type: 'restaurant',
                        name: restaurant.name,
                        error: error.message
                    });
                }
            }

            await connection.commit();

            res.json({
                success: true,
                message: `成功导入 ${cityName} 的数据`,
                data: {
                    city: cityName,
                    location: null,
                    imported: importResults,
                    total: importResults.hotels + importResults.attractions + importResults.restaurants
                }
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('自动导入城市数据失败:', error);
        res.status(500).json({
            success: false,
            message: '导入失败',
            error: error.message
        });
    }
}

/**
 * GET /api/city/location
 * 获取用户当前位置（通过IP定位）
 */
async function getCurrentLocation(req, res) {
    try {
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const cleanIp = ip === '::1' || ip === '127.0.0.1' ? '' : ip;

        console.log('IP定位请求 - 原始IP:', ip, '清理后IP:', cleanIp);

        // 使用高德IP定位API
        const response = await axios.get('https://restapi.amap.com/v3/ip', {
            params: {
                key: AMAP_KEY,
                ip: cleanIp
            }
        });

        console.log('高德IP定位响应:', response.data);

        if (response.data.status === '1') {
            const data = response.data;

            // 如果是本地IP，返回默认城市
            if (!data.city || data.city === '' || (Array.isArray(data.city) && data.city.length === 0)) {
                console.log('本地IP或无法定位，返回默认城市');
                return res.json({
                    success: true,
                    data: {
                        city: '北京市',
                        province: '北京市',
                        adcode: '110000',
                        rectangle: '',
                        isDefault: true
                    }
                });
            }

            res.json({
                success: true,
                data: {
                    city: data.city,
                    province: data.province,
                    adcode: data.adcode,
                    rectangle: data.rectangle,
                    isDefault: false
                }
            });
        } else {
            // API调用失败，返回默认城市
            console.log('高德API返回失败，使用默认城市');
            res.json({
                success: true,
                data: {
                    city: '北京市',
                    province: '北京市',
                    adcode: '110000',
                    rectangle: '',
                    isDefault: true
                }
            });
        }
    } catch (error) {
        console.error('获取位置失败:', error);
        // 出错时返回默认城市
        res.json({
            success: true,
            data: {
                city: '北京市',
                province: '北京市',
                adcode: '110000',
                rectangle: '',
                isDefault: true
            }
        });
    }
}

/**
 * POST /api/city/search
 * 搜索城市（不导入数据）
 */
async function searchCity(req, res) {
    try {
        const { query } = req.body;

        if (!query || query.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const response = await axios.get('https://restapi.amap.com/v3/assistant/inputtips', {
            params: {
                key: AMAP_KEY,
                keywords: query,
                type: '190000', // 行政区域类型
                city: '',
                datatype: 'all'
            }
        });

        if (response.data.status === '1' && response.data.tips) {
            const cities = response.data.tips
                .filter(tip => tip.adcode && tip.location)
                .map(tip => ({
                    name: tip.name,
                    district: tip.district,
                    adcode: tip.adcode,
                    location: tip.location
                }));

            res.json({
                success: true,
                data: cities
            });
        } else {
            res.json({
                success: true,
                data: []
            });
        }
    } catch (error) {
        console.error('搜索城市失败:', error);
        res.status(500).json({
            success: false,
            message: '搜索失败',
            error: error.message
        });
    }
}

/**
 * 获取城市数据统计
 */
async function getCityStats(req, res) {
    try {
        const { cityName } = req.params;

        if (!cityName) {
            return res.status(400).json({
                success: false,
                message: '城市名称不能为空'
            });
        }

        // 查询各类数据的数量
        const [hotelsResult] = await pool.query(
            'SELECT COUNT(*) as count FROM hotels WHERE location LIKE ?',
            [`%${cityName}%`]
        );

        const [attractionsResult] = await pool.query(
            'SELECT COUNT(*) as count FROM attractions WHERE location_city LIKE ?',
            [`%${cityName}%`]
        );

        const [restaurantsResult] = await pool.query(
            'SELECT COUNT(*) as count FROM restaurants WHERE location_city LIKE ?',
            [`%${cityName}%`]
        );

        res.json({
            success: true,
            data: {
                hotels: hotelsResult[0].count,
                attractions: attractionsResult[0].count,
                restaurants: restaurantsResult[0].count
            }
        });
    } catch (error) {
        console.error('获取城市统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取统计失败',
            error: error.message
        });
    }
}

module.exports = {
    autoImportCityData,
    getCurrentLocation,
    searchCity,
    getCityStats,
    geocodeCity,
    searchAttractions,
    searchRestaurants
};
