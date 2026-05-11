/**
 * 优化版数据导入脚本 - 使用真实图片
 * 使用方法: node scripts/importWithImages.js
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

// 城市封面图片 - 使用Unsplash高质量图片
const CITY_IMAGES = {
    '北京': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&h=600&fit=crop&q=80',
    '上海': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800&h=600&fit=crop&q=80',
    '广州': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop&q=80',
    '深圳': 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=800&h=600&fit=crop&q=80',
    '杭州': 'https://images.unsplash.com/photo-1559564484-e48bf5f6c69b?w=800&h=600&fit=crop&q=80',
    '成都': 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&h=600&fit=crop&q=80'
};

// 景点类型对应的图片集合
const ATTRACTION_IMAGES = {
    '公园': [
        'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=600&fit=crop&q=80'
    ],
    '古镇': [
        'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=600&fit=crop&q=80'
    ],
    '寺庙': [
        'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=800&h=600&fit=crop&q=80'
    ],
    '山': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'
    ],
    '湖': [
        'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop&q=80'
    ],
    '动物园': [
        'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&h=600&fit=crop&q=80'
    ],
    '主题乐园': [
        'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=600&fit=crop&q=80'
    ],
    '默认': [
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&h=600&fit=crop&q=80'
    ]
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 根据景点名称智能选择图片
function getAttractionImage(name) {
    let category = '默认';

    if (name.includes('公园') || name.includes('园')) {
        category = '公园';
    } else if (name.includes('古镇') || name.includes('古城')) {
        category = '古镇';
    } else if (name.includes('寺') || name.includes('庙')) {
        category = '寺庙';
    } else if (name.includes('山')) {
        category = '山';
    } else if (name.includes('湖') || name.includes('海')) {
        category = '湖';
    } else if (name.includes('动物园') || name.includes('野生动物')) {
        category = '动物园';
    } else if (name.includes('乐园') || name.includes('欢乐') || name.includes('迪士尼')) {
        category = '主题乐园';
    }

    const images = ATTRACTION_IMAGES[category];
    return images[Math.floor(Math.random() * images.length)];
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

                        // 使用智能图片选择
                        const image = getAttractionImage(poi.name);

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

        console.log('✅ 数据导入成功！图片已优化为高质量格式\n');
        console.log('图片格式: Unsplash 800x600 WebP优化 (q=80)');
        console.log('图片特点: 根据景点类型智能匹配相关图片\n');
        console.log('请刷新浏览器页面查看效果: http://localhost:5174/views/index.html\n');

    } finally {
        connection.release();
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║      优化版导入 - 高质量图片                   ║');
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
