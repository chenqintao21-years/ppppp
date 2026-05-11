// 导入长沙热门数据脚本 - 景点、酒店、餐厅、美食
const { pool } = require('./src/config/database');
const axios = require('axios');
require('dotenv').config();

const AMAP_KEY = process.env.AMAP_KEY;

/**
 * 高德地图API搜索
 */
async function searchAmap(keywords, city, types, offset = 20, page = 1) {
    try {
        const response = await axios.get('https://restapi.amap.com/v3/place/text', {
            params: {
                key: AMAP_KEY,
                keywords: keywords,
                city: city,
                types: types,
                offset: offset,
                page: page,
                extensions: 'all'
            }
        });

        console.log(`  API响应状态: ${response.data.status}, 信息: ${response.data.info || '无'}`);

        if (response.data.status === '1' && response.data.pois) {
            console.log(`  返回POI数量: ${response.data.pois.length}`);
            return response.data.pois;
        } else {
            console.log(`  ⚠️  未找到数据: ${response.data.info || '未知原因'}`);
        }
        return [];
    } catch (error) {
        console.error(`高德地图搜索失败 [${keywords}]:`, error.message);
        return [];
    }
}

/**
 * 导入景点数据
 */
async function importAttractions() {
    console.log('\n========== 开始导入长沙景点数据 ==========\n');

    const keywords = ['景点', '公园', '博物馆', '名胜古迹', '游乐场'];
    let totalSuccess = 0;
    let totalSkip = 0;
    let totalError = 0;

    for (const keyword of keywords) {
        console.log(`\n📍 正在搜索: ${keyword}...`);

        // 搜索多页数据
        for (let page = 1; page <= 3; page++) {
            const pois = await searchAmap(keyword, '长沙', '110000|140000|141200', 20, page);

            if (pois.length === 0) break;

            console.log(`  第${page}页: 找到 ${pois.length} 个结果`);

            for (const poi of pois) {
                try {
                    // 检查是否有图片
                    const photos = poi.photos || [];
                    if (photos.length === 0) {
                        console.log(`  ⏭️  跳过无图片: ${poi.name}`);
                        totalSkip++;
                        continue;
                    }

                    // 检查是否已存在
                    const [existing] = await pool.query(
                        'SELECT id FROM attractions WHERE name = ? AND address = ?',
                        [poi.name, poi.address]
                    );

                    if (existing.length > 0) {
                        console.log(`  ⏭️  跳过已存在: ${poi.name}`);
                        totalSkip++;
                        continue;
                    }

                    // 提取经纬度
                    const location = poi.location.split(',');
                    const longitude = parseFloat(location[0]);
                    const latitude = parseFloat(location[1]);

                    // 构建描述
                    const description = buildAttractionDescription(poi);

                    // 提取图片URL
                    const imageUrl = photos[0]?.url || null;
                    const allPhotos = photos.map(p => p.url).join(',');

                    // 处理标签
                    const tags = Array.isArray(poi.tag) ? poi.tag.join(';') : (poi.tag || '');

                    // 插入数据库
                    await pool.query(`
                        INSERT INTO attractions (
                            name, description, rating, review_count,
                            location_city, latitude, longitude,
                            image, image_url, photos, phone, address,
                            type, opening_hours, facilities
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        poi.name,
                        description,
                        parseFloat(poi.biz_ext?.rating) || 4.5,
                        0,
                        '长沙',
                        latitude,
                        longitude,
                        imageUrl,
                        imageUrl,
                        allPhotos,
                        poi.tel || '',
                        poi.address || '',
                        poi.type || keyword,
                        poi.business_area || '',
                        tags
                    ]);

                    console.log(`  ✅ 导入成功: ${poi.name} (${photos.length}张图片)`);
                    totalSuccess++;

                } catch (error) {
                    console.error(`  ❌ 导入失败: ${poi.name} - ${error.message}`);
                    totalError++;
                }
            }

            // 延迟避免API限流
            await sleep(500);
        }
    }

    console.log('\n========== 景点导入完成 ==========');
    console.log(`✅ 成功: ${totalSuccess} | ⏭️  跳过: ${totalSkip} | ❌ 失败: ${totalError}\n`);
}

/**
 * 导入酒店数据
 */
async function importHotels() {
    console.log('\n========== 开始导入长沙酒店数据 ==========\n');

    const keywords = ['酒店', '宾馆', '民宿', '度假村'];
    let totalSuccess = 0;
    let totalSkip = 0;
    let totalError = 0;

    for (const keyword of keywords) {
        console.log(`\n📍 正在搜索: ${keyword}...`);

        for (let page = 1; page <= 3; page++) {
            const pois = await searchAmap(keyword, '长沙', '100100', 20, page);

            if (pois.length === 0) break;

            console.log(`  第${page}页: 找到 ${pois.length} 个结果`);

            for (const poi of pois) {
                try {
                    // 检查是否有图片
                    const photos = poi.photos || [];
                    if (photos.length === 0) {
                        console.log(`  ⏭️  跳过无图片: ${poi.name}`);
                        totalSkip++;
                        continue;
                    }

                    // 检查是否已存在
                    const [existing] = await pool.query(
                        'SELECT id FROM hotels WHERE name = ? AND address = ?',
                        [poi.name, poi.address]
                    );

                    if (existing.length > 0) {
                        console.log(`  ⏭️  跳过已存在: ${poi.name}`);
                        totalSkip++;
                        continue;
                    }

                    // 提取经纬度
                    const location = poi.location.split(',');
                    const longitude = parseFloat(location[0]);
                    const latitude = parseFloat(location[1]);

                    // 构建描述
                    const description = buildHotelDescription(poi);

                    // 提取图片URL
                    const imageUrl = photos[0]?.url || null;

                    // 插入数据库
                    await pool.query(`
                        INSERT INTO hotels (
                            name, description, rating, review_count,
                            location, address, phone,
                            latitude, longitude, image
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        poi.name,
                        description,
                        parseFloat(poi.biz_ext?.rating) || 4.0,
                        0,
                        poi.business_area || '长沙',
                        poi.address || '',
                        poi.tel || '',
                        latitude,
                        longitude,
                        imageUrl
                    ]);

                    console.log(`  ✅ 导入成功: ${poi.name} (${photos.length}张图片)`);
                    totalSuccess++;

                } catch (error) {
                    console.error(`  ❌ 导入失败: ${poi.name} - ${error.message}`);
                    totalError++;
                }
            }

            await sleep(500);
        }
    }

    console.log('\n========== 酒店导入完成 ==========');
    console.log(`✅ 成功: ${totalSuccess} | ⏭️  跳过: ${totalSkip} | ❌ 失败: ${totalError}\n`);
}

/**
 * 导入餐厅数据
 */
async function importRestaurants() {
    console.log('\n========== 开始导入长沙餐厅数据 ==========\n');

    const keywords = ['美食', '餐厅', '火锅', '湘菜', '小吃', '烧烤', '咖啡厅', '茶餐厅'];
    let totalSuccess = 0;
    let totalSkip = 0;
    let totalError = 0;

    for (const keyword of keywords) {
        console.log(`\n📍 正在搜索: ${keyword}...`);

        for (let page = 1; page <= 2; page++) {
            const pois = await searchAmap(keyword, '长沙', '050000|060000', 20, page);

            if (pois.length === 0) break;

            console.log(`  第${page}页: 找到 ${pois.length} 个结果`);

            for (const poi of pois) {
                try {
                    // 检查是否有图片
                    const photos = poi.photos || [];
                    if (photos.length === 0) {
                        console.log(`  ⏭️  跳过无图片: ${poi.name}`);
                        totalSkip++;
                        continue;
                    }

                    // 检查是否已存在
                    const [existing] = await pool.query(
                        'SELECT id FROM restaurants WHERE name = ? AND address = ?',
                        [poi.name, poi.address]
                    );

                    if (existing.length > 0) {
                        console.log(`  ⏭️  跳过已存在: ${poi.name}`);
                        totalSkip++;
                        continue;
                    }

                    // 提取经纬度
                    const location = poi.location.split(',');
                    const longitude = parseFloat(location[0]);
                    const latitude = parseFloat(location[1]);

                    // 构建描述
                    const description = buildRestaurantDescription(poi);

                    // 提取图片URL
                    const imageUrl = photos[0]?.url || null;

                    // 提取标签
                    const tags = poi.tag ? (Array.isArray(poi.tag) ? poi.tag : poi.tag.split(';').filter(t => t)) : [];

                    // 插入数据库
                    await pool.query(`
                        INSERT INTO restaurants (
                            name, cuisine_type, description, rating, review_count,
                            location_city, address, phone, opening_hours,
                            latitude, longitude, image, image_url, tags, source, source_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        poi.name,
                        keyword,
                        description,
                        parseFloat(poi.biz_ext?.rating) || 4.0,
                        0,
                        '长沙',
                        poi.address || '',
                        poi.tel || '',
                        poi.business_area || '',
                        latitude,
                        longitude,
                        imageUrl,
                        imageUrl,
                        JSON.stringify(tags),
                        'amap',
                        poi.id
                    ]);

                    console.log(`  ✅ 导入成功: ${poi.name} (${photos.length}张图片)`);
                    totalSuccess++;

                } catch (error) {
                    console.error(`  ❌ 导入失败: ${poi.name} - ${error.message}`);
                    totalError++;
                }
            }

            await sleep(500);
        }
    }

    console.log('\n========== 餐厅导入完成 ==========');
    console.log(`✅ 成功: ${totalSuccess} | ⏭️  跳过: ${totalSkip} | ❌ 失败: ${totalError}\n`);
}

/**
 * 构建景点描述
 */
function buildAttractionDescription(poi) {
    const parts = [];

    if (poi.tag) {
        const tags = Array.isArray(poi.tag) ? poi.tag : poi.tag.split(';').filter(t => t);
        if (tags.length > 0) {
            parts.push(tags.join('、'));
        }
    }

    if (poi.business_area) {
        parts.push(`位于${poi.business_area}`);
    }

    if (poi.type) {
        parts.push(poi.type);
    }

    return parts.join('。') || '长沙热门景点，值得一游';
}

/**
 * 构建酒店描述
 */
function buildHotelDescription(poi) {
    const parts = [];

    if (poi.tag) {
        const tags = Array.isArray(poi.tag) ? poi.tag : poi.tag.split(';').filter(t => t);
        if (tags.length > 0) {
            parts.push(tags.join('、'));
        }
    }

    if (poi.business_area) {
        parts.push(`位于${poi.business_area}`);
    }

    return parts.join('。') || '舒适的住宿环境，完善的服务设施';
}

/**
 * 构建餐厅描述
 */
function buildRestaurantDescription(poi) {
    const parts = [];

    if (poi.tag) {
        const tags = Array.isArray(poi.tag) ? poi.tag : poi.tag.split(';').filter(t => t);
        if (tags.length > 0) {
            parts.push(tags.join('、'));
        }
    }

    if (poi.business_area) {
        parts.push(`位于${poi.business_area}`);
    }

    if (poi.type) {
        parts.push(poi.type);
    }

    return parts.join('。') || '美味佳肴，值得品尝';
}

/**
 * 延迟函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主函数
 */
async function main() {
    console.log('\n🚀 开始导入长沙热门数据...\n');
    console.log('城市: 长沙');
    console.log('数据类型: 景点、酒店、餐厅、美食');
    console.log('筛选条件: 必须有图片\n');

    try {
        // 1. 导入景点
        await importAttractions();

        // 2. 导入酒店
        await importHotels();

        // 3. 导入餐厅
        await importRestaurants();

        // 4. 显示统计信息
        console.log('\n========== 数据统计 ==========\n');

        const [attractions] = await pool.query(
            'SELECT COUNT(*) as count FROM attractions WHERE location_city = ?',
            ['长沙']
        );
        console.log(`📍 景点数量: ${attractions[0].count}`);

        const [hotels] = await pool.query(
            'SELECT COUNT(*) as count FROM hotels WHERE location LIKE ? OR address LIKE ?',
            ['%长沙%', '%长沙%']
        );
        console.log(`🏨 酒店数量: ${hotels[0].count}`);

        const [restaurants] = await pool.query(
            'SELECT COUNT(*) as count FROM restaurants WHERE location_city = ?',
            ['长沙']
        );
        console.log(`🍴 餐厅数量: ${restaurants[0].count}`);

        console.log('\n✅ 所有数据导入完成！\n');

    } catch (error) {
        console.error('❌ 导入过程出错:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// 运行主函数
main().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
});
