/**
 * 快速测试脚本 - 导入少量数据用于测试
 * 使用方法: node scripts/quickTest.js
 */

const { pool } = require('../src/config/database');
const { AmapService } = require('../services/mapService');

const amapService = new AmapService();

// 测试用的少量城市
const TEST_CITIES = [
    { name: '北京', name_en: 'Beijing', country: '中国', region: '华北' },
    { name: '上海', name_en: 'Shanghai', country: '中国', region: '华东' },
    { name: '广州', name_en: 'Guangzhou', country: '中国', region: '华南' }
];

const CITY_IMAGES = {
    '北京': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
    '上海': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800',
    '广州': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800'
};

async function quickTest() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║          快速测试 - 导入少量数据               ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    const connection = await pool.getConnection();

    try {
        // 1. 导入测试城市
        console.log('步骤 1/3: 导入测试城市...\n');
        for (const city of TEST_CITIES) {
            const coverImage = CITY_IMAGES[city.name];
            const slug = city.name_en.toLowerCase();

            await connection.query(
                `INSERT INTO destinations (name, name_en, country, region, cover_image, slug, status, rating, view_count)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', 4.5, ?)
                 ON DUPLICATE KEY UPDATE
                 name_en = VALUES(name_en),
                 country = VALUES(country),
                 region = VALUES(region),
                 cover_image = VALUES(cover_image),
                 slug = VALUES(slug)`,
                [city.name, city.name_en, city.country, city.region, coverImage, slug, Math.floor(Math.random() * 5000) + 1000]
            );
            console.log(`  ✓ ${city.name}`);
        }

        // 2. 为每个城市导入5个景点
        console.log('\n步骤 2/3: 从高德地图搜索景点...\n');
        let totalAttractions = 0;

        for (const city of TEST_CITIES) {
            console.log(`  搜索 ${city.name} 的景点...`);

            try {
                const result = await amapService.searchAttractions('景点|旅游景点', city.name, 5, 1);
                const pois = result.pois || [];

                console.log(`    找到 ${pois.length} 个景点`);

                for (const poi of pois) {
                    const location = poi.location ? poi.location.split(',') : [null, null];
                    const longitude = location[0] ? parseFloat(location[0]) : null;
                    const latitude = location[1] ? parseFloat(location[1]) : null;

                    const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
                    const reviewCount = Math.floor(Math.random() * 3000) + 100;
                    const hasPrice = Math.random() > 0.3;
                    const price = hasPrice ? (Math.random() * 150 + 20).toFixed(2) : null;
                    const description = poi.address || `${city.name}热门景点`;
                    const image = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000000)}?w=800&h=600&fit=crop`;

                    await connection.query(
                        `INSERT INTO attractions
                         (name, description, rating, review_count, price, currency,
                          location_city, location_country, latitude, longitude,
                          duration, cancellation_policy, image)
                         VALUES (?, ?, ?, ?, ?, 'CNY', ?, ?, ?, ?, '2-3小时', '提前24小时免费取消', ?)
                         ON DUPLICATE KEY UPDATE
                         description = VALUES(description),
                         rating = VALUES(rating),
                         review_count = VALUES(review_count)`,
                        [poi.name, description, rating, reviewCount, price, city.name, city.country, latitude, longitude, image]
                    );

                    console.log(`      ✓ ${poi.name}`);
                    totalAttractions++;
                }

                // 延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`    ✗ 搜索失败: ${error.message}`);
            }
        }

        // 3. 显示统计信息
        console.log('\n步骤 3/3: 统计数据...\n');

        const [destCount] = await connection.query('SELECT COUNT(*) as count FROM destinations WHERE status = "active"');
        const [attrCount] = await connection.query('SELECT COUNT(*) as count FROM attractions');

        console.log('╔════════════════════════════════════════════════╗');
        console.log('║              导入完成！                        ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log(`║  目的地数量: ${destCount[0].count.toString().padEnd(32)} ║`);
        console.log(`║  景点数量:   ${attrCount[0].count.toString().padEnd(32)} ║`);
        console.log('╚════════════════════════════════════════════════╝\n');

        console.log('下一步:');
        console.log('  1. 启动后端: npm run dev');
        console.log('  2. 启动前端: cd ../frontend && npm run dev');
        console.log('  3. 访问: http://localhost:5173\n');

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

// 运行测试
if (require.main === module) {
    quickTest().catch(error => {
        console.error('测试出错:', error);
        process.exit(1);
    });
}

module.exports = { quickTest };
