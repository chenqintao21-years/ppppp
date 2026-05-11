// 导入贵港酒店数据脚本
const { pool } = require('./src/config/database');
const { mapDataMergeService } = require('./services/mapService');

/**
 * 导入贵港酒店数据
 */
async function importGuigangHotels() {
    console.log('\n========== 开始导入贵港酒店数据 ==========\n');

    try {
        // 1. 搜索贵港的酒店（使用高德地图API）
        console.log('📍 正在从高德地图搜索贵港酒店...');

        const hotels = await mapDataMergeService.searchAndMergeHotels({
            city: '贵港',
            keywords: '酒店',
            limit: 50 // 获取50家酒店
        });

        if (hotels.length === 0) {
            console.log('❌ 未找到贵港的酒店数据');
            return;
        }

        console.log(`✅ 找到 ${hotels.length} 家酒店\n`);

        // 2. 导入到数据库
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const hotel of hotels) {
            try {
                // 检查是否已存在（根据名称和地址）
                const [existing] = await pool.query(
                    'SELECT id FROM hotels WHERE name = ? AND address = ?',
                    [hotel.name, hotel.address]
                );

                if (existing.length > 0) {
                    console.log(`⏭️  跳过已存在: ${hotel.name}`);
                    skipCount++;
                    continue;
                }

                // 构建描述信息
                const description = buildDescription(hotel);

                // 处理可能为空的商圈和地址
                const businessArea = hotel.businessArea || '贵港市';
                const address = hotel.address || '';

                // 插入数据库
                await pool.query(`
                    INSERT INTO hotels (
                        name,
                        description,
                        rating,
                        review_count,
                        location,
                        address,
                        phone,
                        latitude,
                        longitude,
                        image
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    hotel.name,
                    description,
                    hotel.rating || hotel.ratingBreakdown.overall || 4.0,
                    hotel.reviews || 0,
                    businessArea,
                    address,
                    hotel.tel || '',
                    hotel.location.lat,
                    hotel.location.lng,
                    hotel.images[0] || null
                ]);

                console.log(`✅ 导入成功: ${hotel.name} (评分: ${hotel.rating || '无'}, 评论: ${hotel.reviews})`);
                successCount++;

            } catch (error) {
                console.error(`❌ 导入失败: ${hotel.name} - ${error.message}`);
                errorCount++;
            }
        }

        // 3. 显示统计信息
        console.log('\n========== 导入完成 ==========');
        console.log(`✅ 成功导入: ${successCount} 家`);
        console.log(`⏭️  跳过重复: ${skipCount} 家`);
        console.log(`❌ 导入失败: ${errorCount} 家`);
        console.log(`📊 总计处理: ${hotels.length} 家\n`);

        // 4. 查询并显示导入的数据
        const [importedHotels] = await pool.query(`
            SELECT id, name, rating, review_count, location, address
            FROM hotels
            WHERE address LIKE '%贵港%' OR location LIKE '%贵港%'
            ORDER BY rating DESC, review_count DESC
            LIMIT 10
        `);

        console.log('📋 贵港酒店数据（前10条）:');
        importedHotels.forEach((h, index) => {
            console.log(`${index + 1}. ${h.name}`);
            console.log(`   评分: ${h.rating} | 评论: ${h.review_count} | 位置: ${h.location}`);
            console.log(`   地址: ${h.address}\n`);
        });

    } catch (error) {
        console.error('❌ 导入过程出错:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

/**
 * 构建酒店描述
 */
function buildDescription(hotel) {
    const parts = [];

    // 添加标签
    if (hotel.tags && hotel.tags.length > 0) {
        parts.push(hotel.tags.join('、'));
    }

    // 添加商圈信息
    if (hotel.businessArea) {
        parts.push(`位于${hotel.businessArea}`);
    }

    // 添加星级
    if (hotel.level) {
        parts.push(`${hotel.level}星级酒店`);
    }

    // 添加服务信息
    if (hotel.hotelService) {
        parts.push(`服务设施：${hotel.hotelService}`);
    }

    // 添加内部设施
    if (hotel.innerFacility) {
        parts.push(`房间设施：${hotel.innerFacility}`);
    }

    // 添加设施列表
    if (hotel.amenities && hotel.amenities.length > 0) {
        const amenitiesText = hotel.amenities.slice(0, 8).join('、');
        parts.push(`提供${amenitiesText}等设施`);
    }

    return parts.join('。') || '舒适的住宿环境，完善的服务设施';
}

// 运行导入
importGuigangHotels().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
});
