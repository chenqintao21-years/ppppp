// 测试查询贵港酒店
const mysql = require('mysql2/promise');

async function testGuigangHotels() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'tripadvisor',
        charset: 'utf8mb4'
    });

    try {
        console.log('正在查询贵港酒店...\n');

        const [hotels] = await pool.query(`
            SELECT id, name, rating, review_count, location, address
            FROM hotels
            WHERE address LIKE ? OR location LIKE ?
            ORDER BY rating DESC
            LIMIT 10
        `, ['%贵港%', '%贵港%']);

        console.log(`找到 ${hotels.length} 家贵港酒店:\n`);

        hotels.forEach((hotel, index) => {
            console.log(`${index + 1}. ${hotel.name}`);
            console.log(`   评分: ${hotel.rating} | 评论: ${hotel.review_count}`);
            console.log(`   位置: ${hotel.location}`);
            console.log(`   地址: ${hotel.address}\n`);
        });

        await pool.end();
    } catch (error) {
        console.error('查询失败:', error);
    }
}

testGuigangHotels();
