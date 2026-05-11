// 城市数据导入API路由
const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * POST /api/cities/import
 * 批量导入城市数据（酒店、景点、餐厅）
 */
router.post('/import', async (req, res) => {
    const { city, hotels, attractions, restaurants } = req.body;

    if (!city) {
        return res.status(400).json({
            success: false,
            message: '缺少城市信息'
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const results = {
            city: city,
            imported: {
                hotels: 0,
                attractions: 0,
                restaurants: 0
            },
            errors: []
        };

        // 1. 导入酒店数据
        if (hotels && hotels.length > 0) {
            for (const hotel of hotels) {
                try {
                    await connection.query(
                        `INSERT INTO hotels (
                            name, address, city, country,
                            rating, price_range, description,
                            latitude, longitude, phone,
                            source, source_id, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            rating = VALUES(rating),
                            price_range = VALUES(price_range),
                            phone = VALUES(phone),
                            updated_at = NOW()`,
                        [
                            hotel.name,
                            hotel.address,
                            hotel.cityname || city,
                            hotel.pname || '',
                            hotel.rating || null,
                            hotel.price || null,
                            hotel.type || '',
                            hotel.location?.lat || null,
                            hotel.location?.lng || null,
                            hotel.tel || null,
                            hotel.source || 'amap',
                            hotel.amapId || hotel.id
                        ]
                    );
                    results.imported.hotels++;
                } catch (error) {
                    results.errors.push({
                        type: 'hotel',
                        name: hotel.name,
                        error: error.message
                    });
                }
            }
        }

        // 2. 导入景点数据
        if (attractions && attractions.length > 0) {
            for (const attraction of attractions) {
                try {
                    await connection.query(
                        `INSERT INTO attractions (
                            name, description, location_city, location_country,
                            latitude, longitude, rating, price,
                            address, phone, opening_hours,
                            source, source_id, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            rating = VALUES(rating),
                            price = VALUES(price),
                            phone = VALUES(phone),
                            opening_hours = VALUES(opening_hours),
                            updated_at = NOW()`,
                        [
                            attraction.name,
                            attraction.type || '',
                            attraction.cityname || city,
                            attraction.pname || '',
                            attraction.location?.lat || null,
                            attraction.location?.lng || null,
                            attraction.rating || null,
                            attraction.price || null,
                            attraction.address,
                            attraction.tel || null,
                            attraction.opentime || null,
                            attraction.source || 'amap',
                            attraction.amapId || attraction.id
                        ]
                    );
                    results.imported.attractions++;
                } catch (error) {
                    results.errors.push({
                        type: 'attraction',
                        name: attraction.name,
                        error: error.message
                    });
                }
            }
        }

        // 3. 导入餐厅数据
        if (restaurants && restaurants.length > 0) {
            for (const restaurant of restaurants) {
                try {
                    await connection.query(
                        `INSERT INTO restaurants (
                            name, cuisine_type, address, city, country,
                            latitude, longitude, rating, price_range,
                            phone, opening_hours,
                            source, source_id, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            rating = VALUES(rating),
                            price_range = VALUES(price_range),
                            phone = VALUES(phone),
                            opening_hours = VALUES(opening_hours),
                            updated_at = NOW()`,
                        [
                            restaurant.name,
                            restaurant.cuisine || restaurant.type || '',
                            restaurant.address,
                            restaurant.cityname || city,
                            restaurant.pname || '',
                            restaurant.location?.lat || null,
                            restaurant.location?.lng || null,
                            restaurant.rating || null,
                            restaurant.price || null,
                            restaurant.tel || null,
                            restaurant.opentime || null,
                            restaurant.source || 'amap',
                            restaurant.amapId || restaurant.id
                        ]
                    );
                    results.imported.restaurants++;
                } catch (error) {
                    results.errors.push({
                        type: 'restaurant',
                        name: restaurant.name,
                        error: error.message
                    });
                }
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: '数据导入成功',
            data: results
        });

    } catch (error) {
        await connection.rollback();
        console.error('导入城市数据失败:', error);
        res.status(500).json({
            success: false,
            message: '导入失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/cities/stats/:cityName
 * 获取城市数据统计
 */
router.get('/stats/:cityName', async (req, res) => {
    const { cityName } = req.params;

    try {
        const [hotelCount] = await db.query(
            'SELECT COUNT(*) as count FROM hotels WHERE city = ?',
            [cityName]
        );

        const [attractionCount] = await db.query(
            'SELECT COUNT(*) as count FROM attractions WHERE location_city = ?',
            [cityName]
        );

        const [restaurantCount] = await db.query(
            'SELECT COUNT(*) as count FROM restaurants WHERE city = ?',
            [cityName]
        );

        res.json({
            success: true,
            data: {
                city: cityName,
                hotels: hotelCount[0].count,
                attractions: attractionCount[0].count,
                restaurants: restaurantCount[0].count,
                total: hotelCount[0].count + attractionCount[0].count + restaurantCount[0].count
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
});

/**
 * GET /api/cities/list
 * 获取已导入的城市列表
 */
router.get('/list', async (req, res) => {
    try {
        const [cities] = await db.query(`
            SELECT DISTINCT city, COUNT(*) as total_items
            FROM (
                SELECT city FROM hotels WHERE city IS NOT NULL AND city != ''
                UNION ALL
                SELECT location_city as city FROM attractions WHERE location_city IS NOT NULL AND location_city != ''
                UNION ALL
                SELECT city FROM restaurants WHERE city IS NOT NULL AND city != ''
            ) as all_cities
            GROUP BY city
            ORDER BY total_items DESC
        `);

        res.json({
            success: true,
            data: cities
        });

    } catch (error) {
        console.error('获取城市列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取城市列表失败',
            error: error.message
        });
    }
});

/**
 * DELETE /api/cities/:cityName
 * 删除城市的所有数据
 */
router.delete('/:cityName', async (req, res) => {
    const { cityName } = req.params;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [hotelResult] = await connection.query(
            'DELETE FROM hotels WHERE city = ?',
            [cityName]
        );

        const [attractionResult] = await connection.query(
            'DELETE FROM attractions WHERE location_city = ?',
            [cityName]
        );

        const [restaurantResult] = await connection.query(
            'DELETE FROM restaurants WHERE city = ?',
            [cityName]
        );

        await connection.commit();

        res.json({
            success: true,
            message: '城市数据删除成功',
            data: {
                deleted: {
                    hotels: hotelResult.affectedRows,
                    attractions: attractionResult.affectedRows,
                    restaurants: restaurantResult.affectedRows
                }
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('删除城市数据失败:', error);
        res.status(500).json({
            success: false,
            message: '删除失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
