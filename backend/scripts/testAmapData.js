const { AmapService } = require('../services/mapService');
const { pool } = require('../src/config/database');

const amapService = new AmapService();

async function testDestinations() {
    console.log('\n========== 测试目的地数据 ==========\n');

    try {
        // 获取数据库中的目的地
        const [destinations] = await pool.query(
            'SELECT id, name, name_en FROM destinations WHERE status = "active" LIMIT 5'
        );

        const results = {
            success: [],
            failed: []
        };

        for (const dest of destinations) {
            console.log(`\n测试城市: ${dest.name} (${dest.name_en})`);

            // 搜索城市POI
            const cityResult = await amapService.searchAttractions(dest.name, dest.name, 1, 1);

            if (cityResult.pois && cityResult.pois.length > 0) {
                const poi = cityResult.pois[0];
                console.log(`✅ 找到数据:`);
                console.log(`   名称: ${poi.name}`);
                console.log(`   地址: ${poi.address}`);
                console.log(`   图片数量: ${poi.photos ? poi.photos.length : 0}`);
                if (poi.photos && poi.photos.length > 0) {
                    console.log(`   第一张图片: ${poi.photos[0].url}`);
                }

                results.success.push({
                    city: dest.name,
                    hasPhotos: poi.photos && poi.photos.length > 0,
                    photoCount: poi.photos ? poi.photos.length : 0
                });
            } else {
                console.log(`❌ 未找到数据`);
                results.failed.push(dest.name);
            }
        }

        console.log('\n========== 目的地测试总结 ==========');
        console.log(`成功: ${results.success.length}/${destinations.length}`);
        console.log(`失败: ${results.failed.length}/${destinations.length}`);
        if (results.failed.length > 0) {
            console.log(`失败的城市: ${results.failed.join(', ')}`);
        }

    } catch (error) {
        console.error('测试目的地失败:', error);
    }
}

async function testAttractions() {
    console.log('\n========== 测试景点数据 ==========\n');

    try {
        // 获取数据库中的景点
        const [attractions] = await pool.query(
            'SELECT id, name, location_city FROM attractions LIMIT 10'
        );

        const results = {
            success: [],
            failed: []
        };

        for (const attr of attractions) {
            console.log(`\n测试景点: ${attr.name} (${attr.location_city})`);

            // 搜索景点
            const result = await amapService.searchAttractions(attr.name, attr.location_city, 1, 1);

            if (result.pois && result.pois.length > 0) {
                const poi = result.pois[0];
                console.log(`✅ 找到数据:`);
                console.log(`   名称: ${poi.name}`);
                console.log(`   类型: ${poi.type}`);
                console.log(`   图片数量: ${poi.photos ? poi.photos.length : 0}`);
                console.log(`   评分: ${poi.biz_ext?.rating || '无'}`);
                console.log(`   标签: ${poi.tag || '无'}`);

                results.success.push({
                    name: attr.name,
                    hasPhotos: poi.photos && poi.photos.length > 0,
                    photoCount: poi.photos ? poi.photos.length : 0,
                    hasRating: !!poi.biz_ext?.rating
                });
            } else {
                console.log(`❌ 未找到数据`);
                results.failed.push(attr.name);
            }
        }

        console.log('\n========== 景点测试总结 ==========');
        console.log(`成功: ${results.success.length}/${attractions.length}`);
        console.log(`失败: ${results.failed.length}/${attractions.length}`);
        console.log(`有图片的: ${results.success.filter(r => r.hasPhotos).length}`);
        console.log(`有评分的: ${results.success.filter(r => r.hasRating).length}`);
        if (results.failed.length > 0) {
            console.log(`\n失败的景点:`);
            results.failed.forEach(name => console.log(`  - ${name}`));
        }

    } catch (error) {
        console.error('测试景点失败:', error);
    }
}

async function testRestaurants() {
    console.log('\n========== 测试餐厅数据 ==========\n');

    try {
        // 测试几个城市的餐厅搜索
        const testCities = ['桂林', '北京', '上海'];

        for (const city of testCities) {
            console.log(`\n测试城市: ${city}`);

            const result = await amapService.searchRestaurants('美食', city, 5, 1);

            if (result.pois && result.pois.length > 0) {
                console.log(`✅ 找到 ${result.pois.length} 个餐厅`);

                const poi = result.pois[0];
                console.log(`\n示例餐厅:`);
                console.log(`   名称: ${poi.name}`);
                console.log(`   地址: ${poi.address}`);
                console.log(`   图片数量: ${poi.photos ? poi.photos.length : 0}`);
                console.log(`   评分: ${poi.biz_ext?.rating || '无'}`);
                console.log(`   价格: ${poi.biz_ext?.cost || '无'}`);
                console.log(`   标签: ${poi.tag || '无'}`);

                // 统计有图片的餐厅
                const withPhotos = result.pois.filter(p => p.photos && p.photos.length > 0).length;
                console.log(`   有图片的餐厅: ${withPhotos}/${result.pois.length}`);
            } else {
                console.log(`❌ 未找到数据`);
            }
        }

    } catch (error) {
        console.error('测试餐厅失败:', error);
    }
}

async function main() {
    console.log('开始测试高德地图API数据...\n');

    await testDestinations();
    await testAttractions();
    await testRestaurants();

    console.log('\n========== 测试完成 ==========\n');
    process.exit(0);
}

main().catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
});
