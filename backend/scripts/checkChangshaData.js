const { pool } = require('../src/config/database');

async function checkData() {
    try {
        // 检查长沙景点
        console.log('\n========== 长沙景点数据 ==========\n');
        const [attractions] = await pool.query(
            `SELECT id, name, location_city, location_country, rating, image
             FROM attractions
             WHERE location_city = '长沙'
             LIMIT 10`
        );

        console.log(`找到 ${attractions.length} 个长沙景点：`);
        attractions.forEach(attr => {
            console.log(`- ${attr.name} (评分: ${attr.rating})`);
        });

        // 检查长沙餐厅
        console.log('\n========== 长沙餐厅数据 ==========\n');
        const [restaurants] = await pool.query(
            `SELECT id, name, address, rating, price_range, image
             FROM restaurants
             WHERE address LIKE '%长沙%'
             LIMIT 10`
        );

        console.log(`找到 ${restaurants.length} 个长沙餐厅：`);
        restaurants.forEach(rest => {
            console.log(`- ${rest.name} (评分: ${rest.rating}, 价格: ${rest.price_range})`);
        });

        // 检查所有城市
        console.log('\n========== 所有景点城市 ==========\n');
        const [cities] = await pool.query(
            `SELECT DISTINCT location_city, COUNT(*) as count
             FROM attractions
             GROUP BY location_city
             ORDER BY count DESC`
        );

        console.log('城市列表：');
        cities.forEach(city => {
            console.log(`- ${city.location_city}: ${city.count} 个景点`);
        });

    } catch (error) {
        console.error('查询失败:', error);
    } finally {
        process.exit(0);
    }
}

checkData();
