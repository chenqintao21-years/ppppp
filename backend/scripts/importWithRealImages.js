/**
 * 从高德地图获取真实POI图片的导入脚本
 * 使用方法: node scripts/importWithRealImages.js
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

// 城市封面图片
const CITY_IMAGES = {
    '北京': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&h=600&fit=crop&q=80',
    '上海': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800&h=600&fit=crop&q=80',
    '广州': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop&q=80',
    '深圳': 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=800&h=600&fit=crop&q=80',
    '杭州': 'https://images.unsplash.com/photo-1559564484-e48bf5f6c69b?w=800&h=600&fit=crop&q=80',
    '成都': 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&h=600&fit=crop&q=80'
};

// 备用图片（当高德地图没有图片时使用）
const FALLBACK_IMAGES = {
    '公园': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&h=600&fit=crop&q=80',
    '古镇': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop&q=80',
    '寺庙': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop&q=80',
    '山': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
    '湖': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop&q=80',
    '动物园': 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop&q=80',
    '主题乐园': 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&h=600&fit=crop&q=80',
    '默认': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop&q=80'
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 从高德地图POI数据中提取图片
function extractImageFromPoi(poi) {
    // 高德地图API返回的photos字段包含图片信息
    if (poi.photos && poi.photos.length > 0) {
        // photos是一个数组，每个元素包含url字段
        const firstPhoto = poi.photos[0];
        if (firstPhoto && firstPhoto.url) {
            console.log(`      → 找到高德地图图片: ${firstPhoto.url.substring(0, 50)}...`);
            return firstPhoto.url;
        }
    }

    // 如果没有photos字段，返回null
    return null;
}

// 根据景点名称选择备用图片
function getFallbackImage(name) {
    if (name.includes('公园') || name.includes('园')) {
        return FALLBACK_IMAGES['公园'];
    } else if (name.includes('古镇') || name.includes('古城')) {
        return FALLBACK_IMAGES['古镇'];
    } else if (name.includes('寺') || name.includes('庙')) {
        return FALLBACK_IMAGES['寺庙'];
    } else if (name.includes('山')) {
        return FALLBACK_IMAGES['山'];
    } else if (name.includes('湖') || name.includes('海')) {
        return FALLBACK_IMAGES['湖'];
    } else if (name.includes('动物园') || name.includes('野生动物')) {
        return FALLBACK_IMAGES['动物园'];
    } else if (name.includes('乐园') || name.includes('欢乐') || name.includes('迪士尼')) {
        return FALLBACK_IMAGES['主题乐园'];
    }
    return FALLBACK_IMAGES['默认'];
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
    console.log('========== 从高德地图导入景点（含真实图片）==========\n');
    const connection = await pool.getConnection();
    let totalSuccess = 0;
    let realImageCount = 0;
    let fallbackImageCount = 0;

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

                        // 尝试从高德地图获取真实图片
                        let image = extractImageFromPoi(poi);

                        if (image) {
                            realImageCount++;
                            console.log(`    ✓ ${poi.name} [真实图片]`);
                        } else {
                            // 使用备用图片
                            image = getFallbackImage(poi.name);
                            fallbackImageCount++;
                            console.log(`    ✓ ${poi.name} [备用图片]`);
                        }

                        await connection.query(
                            `INSERT INTO attractions
                             (name, description, rating, review_count, price, currency,
                              location_city, location_country, latitude, longitude,
                              duration, cancellation_policy, image)
                             VALUES (?, ?, ?, ?, ?, 'CNY', ?, ?, ?, ?, '2-3小时', '提前24小时免费取消', ?)`,
                            [poi.name, description, rating, reviewCount, price, city.name, city.country, latitude, longitude, image]
                        );

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

        console.log(`\n景点导入完成: ${totalSuccess} 个景点`);
        console.log(`  - 高德真实图片: ${realImageCount} 个`);
        console.log(`  - 备用图片: ${fallbackImageCount} 个\n`);
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

        console.log('✅ 数据导入成功！');
        console.log('📸 图片来源: 高德地图POI真实图片 + 高质量备用图片\n');
        console.log('请刷新浏览器页面查看效果: http://localhost:5174/views/index.html\n');

    } finally {
        connection.release();
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║      从高德地图获取真实POI图片                 ║');
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
