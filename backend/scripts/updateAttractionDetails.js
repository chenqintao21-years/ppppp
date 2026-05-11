/**
 * 为景点表添加详细信息字段并更新数据
 * 使用方法: node scripts/updateAttractionDetails.js
 */

const { pool } = require('../src/config/database');
const { AmapService } = require('../services/mapService');

const amapService = new AmapService();

// 添加新字段到attractions表
async function addNewFields() {
    console.log('\n========== 添加新字段到attractions表 ==========\n');

    const connection = await pool.getConnection();

    try {
        // 添加photos字段（JSON格式存储多张图片）
        await connection.query(`
            ALTER TABLE attractions
            ADD COLUMN IF NOT EXISTS photos TEXT COMMENT '景点图片数组(JSON格式)'
        `).catch(() => console.log('  photos字段已存在'));

        // 添加opening_hours字段
        await connection.query(`
            ALTER TABLE attractions
            ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(255) COMMENT '营业时间'
        `).catch(() => console.log('  opening_hours字段已存在'));

        // 添加phone字段
        await connection.query(`
            ALTER TABLE attractions
            ADD COLUMN IF NOT EXISTS phone VARCHAR(50) COMMENT '联系电话'
        `).catch(() => console.log('  phone字段已存在'));

        // 添加address字段
        await connection.query(`
            ALTER TABLE attractions
            ADD COLUMN IF NOT EXISTS address TEXT COMMENT '详细地址'
        `).catch(() => console.log('  address字段已存在'));

        // 添加facilities字段
        await connection.query(`
            ALTER TABLE attractions
            ADD COLUMN IF NOT EXISTS facilities TEXT COMMENT '设施信息(JSON格式)'
        `).catch(() => console.log('  facilities字段已存在'));

        console.log('✓ 字段添加完成\n');

    } catch (error) {
        console.error('✗ 添加字段失败:', error.message);
    } finally {
        connection.release();
    }
}

// 从POI数据中提取图片
function extractPhotos(poi) {
    const photos = [];
    if (poi.photos && Array.isArray(poi.photos)) {
        poi.photos.forEach(photo => {
            if (photo.url) {
                photos.push(photo.url);
            }
        });
    }
    return photos;
}

// 从POI数据中提取营业时间
function extractOpeningHours(poi) {
    if (poi.biz_ext && poi.biz_ext.open_time) {
        return poi.biz_ext.open_time;
    }
    return '09:00-18:00'; // 默认营业时间
}

// 从POI数据中提取设施信息
function extractFacilities(poi) {
    const facilities = [];
    if (poi.biz_ext) {
        if (poi.biz_ext.parking) facilities.push('停车场');
        if (poi.biz_ext.wifi) facilities.push('免费WiFi');
    }
    // 添加一些通用设施
    facilities.push('卫生间', '无障碍通道', '游客中心');
    return facilities;
}

// 更新现有景点的详细信息
async function updateExistingAttractions() {
    console.log('========== 更新现有景点详细信息 ==========\n');

    const connection = await pool.getConnection();
    let successCount = 0;
    let totalCount = 0;

    try {
        // 获取所有景点
        const [attractions] = await connection.query(
            'SELECT id, name, location_city, image FROM attractions LIMIT 50'
        );

        console.log(`找到 ${attractions.length} 个景点需要更新\n`);
        totalCount = attractions.length;

        for (const attraction of attractions) {
            try {
                console.log(`正在更新: ${attraction.name} (${attraction.location_city})`);

                // 搜索景点获取详细信息
                const result = await amapService.searchAttractions(
                    attraction.name,
                    attraction.location_city,
                    1,
                    1
                );

                if (result.pois && result.pois.length > 0) {
                    const poi = result.pois[0];

                    // 提取详细信息
                    const photos = extractPhotos(poi);
                    const photosJson = photos.length > 0 ? JSON.stringify(photos) : JSON.stringify([attraction.image]);

                    const openingHours = extractOpeningHours(poi);
                    const phone = poi.tel || '暂无电话';
                    const address = poi.address || `${attraction.location_city}市`;

                    const facilities = extractFacilities(poi);
                    const facilitiesJson = JSON.stringify(facilities);

                    // 更新数据库
                    await connection.query(`
                        UPDATE attractions SET
                            photos = ?,
                            opening_hours = ?,
                            phone = ?,
                            address = ?,
                            facilities = ?,
                            description = ?
                        WHERE id = ?
                    `, [
                        photosJson,
                        openingHours,
                        phone,
                        address,
                        facilitiesJson,
                        poi.type || attraction.name + '是' + attraction.location_city + '的热门景点',
                        attraction.id
                    ]);

                    console.log(`  ✓ 更新成功`);
                    console.log(`    - 图片: ${photos.length} 张`);
                    console.log(`    - 营业时间: ${openingHours}`);
                    console.log(`    - 电话: ${phone}`);
                    console.log(`    - 设施: ${facilities.length} 项\n`);

                    successCount++;
                } else {
                    // 即使没找到POI，也添加默认数据
                    await connection.query(`
                        UPDATE attractions SET
                            photos = ?,
                            opening_hours = ?,
                            phone = ?,
                            address = ?,
                            facilities = ?
                        WHERE id = ?
                    `, [
                        JSON.stringify([attraction.image]),
                        '09:00-18:00',
                        '暂无电话',
                        `${attraction.location_city}市`,
                        JSON.stringify(['卫生间', '无障碍通道', '游客中心']),
                        attraction.id
                    ]);

                    console.log(`  ⚠️  未找到POI，使用默认数据\n`);
                    successCount++;
                }

                // 延迟避免API限流
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`  ✗ 更新失败: ${error.message}\n`);
            }
        }

        console.log('========== 更新完成 ==========\n');
        console.log(`总计: ${totalCount} 个景点`);
        console.log(`成功: ${successCount} 个`);
        console.log(`失败: ${totalCount - successCount} 个\n`);

    } catch (error) {
        console.error('✗ 更新过程出错:', error.message);
    } finally {
        connection.release();
    }
}

// 主函数
async function main() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║      更新景点详细信息                          ║');
    console.log('╚════════════════════════════════════════════════╝');

    try {
        // 1. 添加新字段
        await addNewFields();

        // 2. 更新现有数据
        await updateExistingAttractions();

        console.log('✅ 所有操作完成！');
        console.log('\n现在景点详情页面将显示：');
        console.log('  - 多张景点图片');
        console.log('  - 营业时间');
        console.log('  - 联系电话');
        console.log('  - 详细地址');
        console.log('  - 设施信息\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
