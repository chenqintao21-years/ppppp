const { pool } = require('../src/config/database');

async function testSearch() {
    try {
        // 测试搜索长沙
        const location = '长沙';
        const locationMatch = `%${location}%`;

        console.log(`\n搜索条件: location_city LIKE '${locationMatch}'\n`);

        const [attractions] = await pool.query(
            `SELECT id, name, location_city, rating, image
             FROM attractions
             WHERE location_city LIKE ? OR location_country LIKE ?
             LIMIT 10`,
            [locationMatch, locationMatch]
        );

        console.log(`找到 ${attractions.length} 个景点：\n`);
        attractions.forEach(attr => {
            console.log(`- ${attr.name} (${attr.location_city}) - 评分: ${attr.rating}`);
            console.log(`  图片: ${attr.image ? '有' : '无'}`);
        });

        // 测试API响应格式
        console.log('\n\n========== API 响应格式测试 ==========\n');
        const result = {
            success: true,
            data: attractions,
            pagination: {
                page: 1,
                limit: 20,
                total: attractions.length,
                totalPages: 1,
                hasMore: false
            }
        };

        console.log('API 返回格式:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        process.exit(0);
    }
}

testSearch();
