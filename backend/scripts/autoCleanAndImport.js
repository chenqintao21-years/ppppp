/**
 * 自动清理并重新导入数据脚本（无需确认）
 * 使用方法: node scripts/autoCleanAndImport.js
 */

const { pool } = require('../src/config/database');
const { AmapService } = require('../services/mapService');

const amapService = new AmapService();

// 热门城市列表
const POPULAR_CITIES = [
    { name: '北京', name_en: 'Beijing', country: '中国', region: '华北' },
    { name: '上海', name_en: 'Shanghai', country: '中国', region: '华东' },
    { name: '广州', name_en: 'Guangzhou', country: '中国', region: '华南' },
    { name: '深圳', name_en: 'Shenzhen', country: '中国', region: '华南' },
    { name: '杭州', name_en: 'Hangzhou', country: '中国', region: '华东' },
    { name: '成都', name_en: 'Chengdu', country: '中国', region: '西南' }
];

const CITY_IMAGES = {
    '北京': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
    '上海': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800',
    '广州': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
    '深圳': 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=800',
    '杭州': 'https://images.unsplash.com/photo-1559564484-e48bf5f6c69b?w=800',
    '成都': 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800'
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanOldData() {
    console.log('\n========== 清理旧数据 ==========\n');
    const connection = await pool.getConnection();

    try {
        const [destCount] = await connection.query('SELECT COUNT(*) as count FROM destinations');
        const [attrCount] = await connection.query('SELECT COUNT(*) as count FROM attractions');

        console.log(`当前数据库中有：`);
        console.log(`  - 目的地: ${destCount[0].count} 条`);
        console.log(`  - 景点: ${attrCount[0].count} 条\n`);

        if (destCount[0].count === 0 && attrCount[0].count === 0) {
            console.log('✓ 数据库为空，无需清理\n');
            return;
        }

        console.log('正在删除景点数据...');
        await connection.query('DELETE FROM attractions');
        console.log('✓ 景点数据已清理');

        console.log('正在删除目的地数据...');
        await connection.query('DELETE FROM destinations');
        console.log('✓ 目的地数据已清理');

        await connection.query('ALTER TABLE attractions AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE destinations AUTO_INCREMENT = 1');
        console.log('✓ 自增ID已重置\n');

    } catch (error) {
        console.error('✗ 清理数据失败:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}

async function importDestinations() {
    console.log('========== 导入热门目的地 ==========\n');
    const connection = await pool.getConnection();
    let successCount = 0;

    try {
        for (const city of POPULAR_CITIES) {
            console.log(`正在导入城市: ${city.name}...`);
            const coverImage = CITY_IMAGES[city.name];
            const slug = city.name_en.toLowerCase().replace(/'/g, '');

            await connection.query(
                `INSERT INTO destinations (name, name_en, country, region, cover_image, slug, status, rating, view_count)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', 4.5, ?)`,
                [city.name, city.name_en, city.country, city.region, coverImage, slug, Math.floor(Math.random() * 10000) + 1000]
            );

            console.log(`  ✓ 导入成功`);
            successCount++;
        }

        console.log(`\n目的地导入完成: ${successCount} 个城市\n`);
    } finally {
        connection.release();
    }
}

async function importAttractions() {
    console.log('========== 从高德地图导入景点 ==========\n');
    const connection = await pool.getConnection();
    let totalSuccess = 0;

    try {
        for (const city of POPULAR_CITIES) {
            console.log(`正在搜索 ${city.name} 的景点...`);

            try {
                const result = await amapService.searchAttractions('景点|旅游景点|风景区', city.name, 15, 1);
                const pois = result.pois || [];

                console.log(`  找到 ${pois.length} 个景点`);

                for (const poi of pois) {
                    try {
                        const location = poi.location ? poi.location.split(',') : [null, null];
                        const longitude = location[0] ? parseFloat(location[0]) : null;
                        const latitude = location[1] ? parseFloat(location[1]) : null;

                        const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
                        const reviewCount = Math.floor(Math.random() * 5000) + 100;
                        const hasPrice = Math.random() > 0.3;
                        const price = hasPrice ? (Math.random() * 150 + 20).toFixed(2) : null;
                        const description = poi.address || `${city.name}热门景点`;
                        const image = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000000)}?w=800&h=600&fit=crop`;

                        await connection.query(
                            `INSERT INTO attractions
                             (name, description, rating, review_count, price, currency,
                              location_city, location_country, latitude, longitude,
                              duration, cancellation_policy, image)
                             VALUES (?, ?, ?, ?, ?, 'CNY', ?, ?, ?, ?, '2-3小时', '提前24小时免费取消', ?)`,
                            [poi.name, description, rating, reviewCount, price, city.name, city.country, latitude, longitude, image]
                        );

                        console.log(`    ✓ ${poi.name}`);
                        totalSuccess++;
                    } catch (error) {
                        console.error(`    ✗ ${poi.name}: ${error.message}`);
                    }

                    await sleep(100);
                }

                await sleep(500);

            } catch (error) {
                console.error(`  ✗ 搜索失败: ${error.message}`);
            }
        }

        console.log(`\n景点导入完成: ${totalSuccess} 个景点\n`);
    } finally {
        connection.release();
    }
}

async function showStatistics() {
    console.log('========== 数据统计 ==========\n');
    const connection = await pool.getConnection();

    try {
        const [destCount] = await connection.query('SELECT COUNT(*) as count FROM destinations');
        const [attrCount] = await connection.query('SELECT COUNT(*) as count FROM attractions');

        console.log('╔════════════════════════════════════════════════╗');
        console.log('║              导入完成！                        ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log(`║  目的地: ${destCount[0].count} 个${' '.repeat(36 - destCount[0].count.toString().length)}║`);
        console.log(`║  景点:   ${attrCount[0].count} 个${' '.repeat(36 - attrCount[0].count.toString().length)}║`);
        console.log('╚════════════════════════════════════════════════╝\n');

        console.log('✅ 数据导入成功！\n');
        console.log('下一步:');
        console.log('  1. 启动后端: npm run dev');
        console.log('  2. 启动前端: cd ../frontend && npm run dev');
        console.log('  3. 访问: http://localhost:5173/views/index.html\n');

    } finally {
        connection.release();
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║      自动清理并导入高德地图数据                ║');
    console.log('╚════════════════════════════════════════════════╝');

    try {
        await cleanOldData();
        await importDestinations();
        await importAttractions();
        await showStatistics();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 导入失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
