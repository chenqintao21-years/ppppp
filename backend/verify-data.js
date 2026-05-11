const { pool } = require('./src/config/database');

(async () => {
    try {
        const [destinations] = await pool.query('SELECT COUNT(*) as count FROM destinations WHERE status="active"');
        const [attractions] = await pool.query('SELECT COUNT(*) as count FROM attractions');
        const [cityStats] = await pool.query('SELECT location_city, COUNT(*) as count FROM attractions GROUP BY location_city ORDER BY count DESC');

        console.log('✅ 数据库统计:');
        console.log('  - 活跃城市数量:', destinations[0].count);
        console.log('  - 景点总数:', attractions[0].count);
        console.log('\n📊 各城市景点分布:');
        cityStats.forEach(stat => {
            console.log('  -', stat.location_city + ':', stat.count, '个景点');
        });

        process.exit(0);
    } catch (error) {
        console.error('验证失败:', error);
        process.exit(1);
    }
})();
