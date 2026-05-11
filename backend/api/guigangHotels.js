// 获取贵港酒店的专用API
const mysql = require('mysql2/promise');

// 创建数据库连接
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'tripadvisor',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
});

/**
 * 获取贵港酒店列表
 * GET /api/hotels/guigang
 */
async function getGuigangHotels(req, res) {
    try {
        const [hotels] = await pool.query(`
            SELECT
                id, name, rating, review_count, location, address,
                description, phone, latitude, longitude, image
            FROM hotels
            WHERE address LIKE '%贵港%' OR location LIKE '%贵港%'
            ORDER BY rating DESC, review_count DESC
            LIMIT 50
        `);

        const results = {
            success: true,
            data: hotels.map(hotel => ({
                id: hotel.id,
                name: hotel.name,
                rating: parseFloat(hotel.rating) || 4.0,
                reviews: hotel.review_count || 0,
                price: 899,
                currency: 'CNY',
                location: hotel.location,
                address: hotel.address,
                description: hotel.description || '',
                amenities: [],
                images: hotel.image ? [hotel.image] : [],
                image: hotel.image || '/images/hotel-default.jpg',
                available: true
            })),
            total: hotels.length
        };

        res.json(results);
    } catch (error) {
        console.error('获取贵港酒店失败:', error);
        res.status(500).json({
            success: false,
            message: '获取酒店数据失败',
            error: error.message
        });
    }
}

module.exports = {
    getGuigangHotels
};
