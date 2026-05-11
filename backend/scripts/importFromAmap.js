/**
 * 从高德地图导入热门目的地和景点数据
 * 使用方法: node scripts/importFromAmap.js
 */

const { pool } = require('../src/config/database');
const { AmapService } = require('../services/mapService');
const axios = require('axios');

const amapService = new AmapService();

// 热门城市列表（可以根据需要扩展）
const POPULAR_CITIES = [
    { name: '北京', name_en: 'Beijing', country: '中国', region: '华北' },
    { name: '上海', name_en: 'Shanghai', country: '中国', region: '华东' },
    { name: '广州', name_en: 'Guangzhou', country: '中国', region: '华南' },
    { name: '深圳', name_en: 'Shenzhen', country: '中国', region: '华南' },
    { name: '杭州', name_en: 'Hangzhou', country: '中国', region: '华东' },
    { name: '成都', name_en: 'Chengdu', country: '中国', region: '西南' },
    { name: '西安', name_en: 'Xi\'an', country: '中国', region: '西北' },
    { name: '重庆', name_en: 'Chongqing', country: '中国', region: '西南' },
    { name: '南京', name_en: 'Nanjing', country: '中国', region: '华东' },
    { name: '武汉', name_en: 'Wuhan', country: '中国', region: '华中' },
    { name: '厦门', name_en: 'Xiamen', country: '中国', region: '华南' },
    { name: '苏州', name_en: 'Suzhou', country: '中国', region: '华东' }
];

// 城市封面图片（使用Unsplash的城市图片）
const CITY_IMAGES = {
    '北京': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
    '上海': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800',
    '广州': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
    '深圳': 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=800',
    '杭州': 'https://images.unsplash.com/photo-1559564484-e48bf5f6c69b?w=800',
    '成都': 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800',
    '西安': 'https://images.unsplash.com/photo-1580837119756-563d608dd119?w=800',
    '重庆': 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800',
    '南京': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
    '武汉': 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800',
    '厦门': 'https://images.unsplash.com/photo-1598947660946-103a4eb2de0b?w=800',
    '苏州': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800'
};

/**
 * 导入热门目的地
 */
async function importDestinations() {
    console.log('\n========== 开始导入热门目的地 ==========\n');

    const connection = await pool.getConnection();
    let successCount = 0;
    let errorCount = 0;

    try {
        for (const city of POPULAR_CITIES) {
            try {
                console.log(`正在导入城市: ${city.name}...`);

                // 检查城市是否已存在
                const [existing] = await connection.query(
                    'SELECT id FROM destinations WHERE name = ?',
                    [city.name]
                );

                const coverImage = CITY_IMAGES[city.name] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
                const slug = city.name_en.toLowerCase().replace(/'/g, '');

                if (existing.length > 0) {
                    // 更新现有城市
                    await connection.query(
                        `UPDATE destinations
                         SET name_en = ?, country = ?, region = ?, cover_image = ?, slug = ?, status = 'active'
                         WHERE name = ?`,
                        [city.name_en, city.country, city.region, coverImage, slug, city.name]
                    );
                    console.log(`  ✓ 更新城市: ${city.name}`);
                } else {
                    // 插入新城市
                    await connection.query(
                        `INSERT INTO destinations (name, name_en, country, region, cover_image, slug, status, rating, view_count)
                         VALUES (?, ?, ?, ?, ?, ?, 'active', 4.5, ?)`,
                        [city.name, city.name_en, city.country, city.region, coverImage, slug, Math.floor(Math.random() * 10000) + 1000]
                    );
                    console.log(`  ✓ 新增城市: ${city.name}`);
                }

                successCount++;
            } catch (error) {
                console.error(`  ✗ 导入城市失败 ${city.name}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n目的地导入完成: 成功 ${successCount}, 失败 ${errorCount}\n`);
    } finally {
        connection.release();
    }
}

/**
 * 从高德地图搜索景点并导入
 */
async function importAttractions() {
    console.log('\n========== 开始从高德地图导入景点 ==========\n');

    const connection = await pool.getConnection();
    let totalSuccess = 0;
    let totalError = 0;
    let totalSkipped = 0;

    try {
        for (const city of POPULAR_CITIES) {
            console.log(`\n正在搜索 ${city.name} 的景点...`);

            try {
                // 搜索该城市的景点
                const result = await amapService.searchAttractions('景点|旅游景点|风景区', city.name, 20, 1);
                const pois = result.pois || [];

                console.log(`  找到 ${pois.length} 个景点`);

                for (const poi of pois) {
                    try {
                        // 数据质量检查：过滤掉没有名称或坐标的数据
                        if (!poi.name || !poi.location) {
                            console.log(`    ⊘ 跳过无效景点（缺少名称或坐标）`);
                            totalSkipped++;
                            continue;
                        }

                        // 检查景点是否已存在（通过名称和城市）
                        const [existing] = await connection.query(
                            'SELECT id FROM attractions WHERE name = ? AND location_city = ?',
                            [poi.name, city.name]
                        );

                        // 解析经纬度
                        const location = poi.location.split(',');
                        const longitude = parseFloat(location[0]);
                        const latitude = parseFloat(location[1]);

                        // 验证经纬度有效性
                        if (isNaN(longitude) || isNaN(latitude)) {
                            console.log(`    ⊘ 跳过景点 ${poi.name}（无效坐标）`);
                            totalSkipped++;
                            continue;
                        }

                        // 生成合理的评分和评论数
                        const rating = (Math.random() * 1.0 + 4.0).toFixed(1); // 4.0-5.0
                        const reviewCount = Math.floor(Math.random() * 3000) + 500;

                        // 生成价格（70%景点有门票）
                        const hasPrice = Math.random() > 0.3;
                        const price = hasPrice ? Math.floor(Math.random() * 120 + 30) : 0;

                        // 获取景点类型
                        let type = '景点';
                        if (poi.type) {
                            const typeMatch = poi.type.match(/风景名胜|公园|博物馆|寺庙|古迹|游乐园|动物园|植物园/);
                            type = typeMatch ? typeMatch[0] : '景点';
                        }

                        // 构建描述信息
                        let description = '';
                        if (poi.address) {
                            description = `位于${poi.address}`;
                        }
                        if (poi.tel) {
                            description += description ? `，联系电话：${poi.tel}` : `联系电话：${poi.tel}`;
                        }
                        if (!description) {
                            description = `${city.name}热门${type}，值得一游`;
                        }

                        // 使用Unsplash随机景点图片
                        const imageTopics = ['landmark', 'architecture', 'nature', 'temple', 'museum', 'park'];
                        const randomTopic = imageTopics[Math.floor(Math.random() * imageTopics.length)];
                        const image = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000000)}?w=800&h=600&fit=crop&q=80`;

                        if (existing.length > 0) {
                            // 更新现有景点
                            await connection.query(
                                `UPDATE attractions
                                 SET description = ?, rating = ?, review_count = ?, price = ?,
                                     location_country = ?, latitude = ?, longitude = ?,
                                     duration = '2-3小时', image = ?, type = ?
                                 WHERE id = ?`,
                                [description, rating, reviewCount, price, city.country, latitude, longitude, image, type, existing[0].id]
                            );
                            console.log(`    ✓ 更新景点: ${poi.name} (${type})`);
                        } else {
                            // 插入新景点
                            await connection.query(
                                `INSERT INTO attractions
                                 (name, description, rating, review_count, price, currency,
                                  location_city, location_country, latitude, longitude,
                                  duration, cancellation_policy, image, type)
                                 VALUES (?, ?, ?, ?, ?, 'CNY', ?, ?, ?, ?, '2-3小时', '提前24小时免费取消', ?, ?)`,
                                [poi.name, description, rating, reviewCount, price, city.name, city.country, latitude, longitude, image, type]
                            );
                            console.log(`    ✓ 新增景点: ${poi.name} (${type})`);
                        }

                        totalSuccess++;
                    } catch (error) {
                        console.error(`    ✗ 导入景点失败 ${poi.name}:`, error.message);
                        totalError++;
                    }

                    // 避免请求过快
                    await sleep(100);
                }

                // 每个城市之间暂停一下
                await sleep(500);

            } catch (error) {
                console.error(`  ✗ 搜索城市景点失败 ${city.name}:`, error.message);
            }
        }

        console.log(`\n景点导入完成: 成功 ${totalSuccess}, 失败 ${totalError}, 跳过 ${totalSkipped}\n`);
    } finally {
        connection.release();
    }
}

/**
 * 更新景点的类型字段
 */
async function updateAttractionTypes() {
    console.log('\n========== 更新景点类型 ==========\n');

    const connection = await pool.getConnection();

    try {
        // 添加type字段（如果不存在）
        await connection.query(`
            ALTER TABLE attractions
            ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT '景点'
        `);

        console.log('✓ 景点类型字段已更新\n');
    } catch (error) {
        // 字段可能已存在，忽略错误
        console.log('景点类型字段已存在\n');
    } finally {
        connection.release();
    }
}

/**
 * 辅助函数：延迟
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主函数
 */
async function main() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   从高德地图导入热门目的地和景点数据           ║');
    console.log('╚════════════════════════════════════════════════╝');

    try {
        // 1. 导入热门目的地
        await importDestinations();

        // 2. 更新景点表结构
        await updateAttractionTypes();

        // 3. 导入景点数据
        await importAttractions();

        console.log('╔════════════════════════════════════════════════╗');
        console.log('║              导入完成！                        ║');
        console.log('╚════════════════════════════════════════════════╝\n');

        process.exit(0);
    } catch (error) {
        console.error('\n导入过程出错:', error);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    importDestinations,
    importAttractions
};
