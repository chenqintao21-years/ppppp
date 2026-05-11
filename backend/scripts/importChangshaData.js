const { AmapService } = require('../services/mapService');
const { pool } = require('../src/config/database');

const amapService = new AmapService();

// 搜索并导入长沙目的地
async function importChangshaDestination() {
    console.log('\n========== 导入长沙目的地 ==========\n');

    try {
        // 搜索长沙相关的风景名胜
        const result = await amapService.searchAttractions('长沙', '长沙', 20, 1);

        if (!result.pois || result.pois.length === 0) {
            console.log('❌ 未找到长沙相关数据');
            return;
        }

        console.log(`找到 ${result.pois.length} 个POI，筛选有图片的...`);

        let imported = 0;
        let skipped = 0;

        for (const poi of result.pois) {
            // 只导入有图片的
            if (!poi.photos || poi.photos.length === 0) {
                console.log(`⊘ 跳过 ${poi.name} - 无图片`);
                skipped++;
                continue;
            }

            // 检查是否已存在
            const [existing] = await pool.query(
                'SELECT id FROM destinations WHERE name = ?',
                [poi.name]
            );

            if (existing.length > 0) {
                console.log(`⊘ 跳过 ${poi.name} - 已存在`);
                skipped++;
                continue;
            }

            // 准备图片数据
            const coverImage = poi.photos[0].url;
            const images = poi.photos.map(p => p.url).join(',');

            // 插入数据
            await pool.query(
                `INSERT INTO destinations
                (name, name_en, country, region, description, cover_image, images, rating, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    poi.name,
                    poi.name, // 暂时用中文名
                    '中国',
                    '湖南',
                    poi.address || poi.name,
                    coverImage,
                    images,
                    parseFloat(poi.biz_ext?.rating) || 4.5,
                    'active'
                ]
            );

            console.log(`✅ 导入 ${poi.name} - ${poi.photos.length} 张图片`);
            imported++;
        }

        console.log(`\n导入完成: 成功 ${imported}, 跳过 ${skipped}`);

    } catch (error) {
        console.error('导入长沙目的地失败:', error);
    }
}

// 搜索并导入长沙景点
async function importChangshaAttractions() {
    console.log('\n========== 导入长沙景点 ==========\n');

    try {
        // 搜索多个关键词
        const keywords = ['长沙景点', '长沙旅游', '橘子洲', '岳麓山', '太平街'];
        let allPois = [];

        for (const keyword of keywords) {
            console.log(`搜索关键词: ${keyword}`);
            const result = await amapService.searchAttractions(keyword, '长沙', 20, 1);
            if (result.pois && result.pois.length > 0) {
                allPois.push(...result.pois);
            }
        }

        // 去重
        const uniquePois = [];
        const seenIds = new Set();
        for (const poi of allPois) {
            if (!seenIds.has(poi.id)) {
                seenIds.add(poi.id);
                uniquePois.push(poi);
            }
        }

        console.log(`\n找到 ${uniquePois.length} 个唯一景点，筛选有图片的...`);

        let imported = 0;
        let skipped = 0;

        for (const poi of uniquePois) {
            // 只导入有图片的
            if (!poi.photos || poi.photos.length === 0) {
                console.log(`⊘ 跳过 ${poi.name} - 无图片`);
                skipped++;
                continue;
            }

            // 检查是否已存在
            const [existing] = await pool.query(
                'SELECT id FROM attractions WHERE name = ?',
                [poi.name]
            );

            if (existing.length > 0) {
                console.log(`⊘ 跳过 ${poi.name} - 已存在`);
                skipped++;
                continue;
            }

            // 准备数据
            const location = poi.location ? poi.location.split(',') : [null, null];
            const image = poi.photos[0].url;
            const rating = parseFloat(poi.biz_ext?.rating) || 4.5;

            // 插入数据
            await pool.query(
                `INSERT INTO attractions
                (name, description, rating, review_count, price, currency, location_city, location_country,
                 latitude, longitude, duration, image, type, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    poi.name,
                    poi.address || poi.name,
                    rating,
                    Math.floor(Math.random() * 1000) + 100, // 模拟评论数
                    0, // 价格暂时为0
                    '¥',
                    '长沙',
                    '中国',
                    location[1],
                    location[0],
                    '2-3小时',
                    image,
                    poi.type || '风景名胜'
                ]
            );

            console.log(`✅ 导入 ${poi.name} - 评分: ${rating}, 图片: ${poi.photos.length}张`);
            imported++;
        }

        console.log(`\n导入完成: 成功 ${imported}, 跳过 ${skipped}`);

    } catch (error) {
        console.error('导入长沙景点失败:', error);
    }
}

// 搜索并导入长沙餐厅
async function importChangshaRestaurants() {
    console.log('\n========== 导入长沙餐厅 ==========\n');

    try {
        // 搜索多个关键词
        const keywords = ['美食', '餐厅', '湘菜', '小吃', '火锅'];
        let allPois = [];

        for (const keyword of keywords) {
            console.log(`搜索关键词: ${keyword}`);
            const result = await amapService.searchRestaurants(keyword, '长沙', 20, 1);
            if (result.pois && result.pois.length > 0) {
                allPois.push(...result.pois);
            }
        }

        // 去重
        const uniquePois = [];
        const seenIds = new Set();
        for (const poi of allPois) {
            if (!seenIds.has(poi.id)) {
                seenIds.add(poi.id);
                uniquePois.push(poi);
            }
        }

        console.log(`\n找到 ${uniquePois.length} 个唯一餐厅，筛选有图片的...`);

        let imported = 0;
        let skipped = 0;

        for (const poi of uniquePois) {
            // 只导入有图片的
            if (!poi.photos || poi.photos.length === 0) {
                console.log(`⊘ 跳过 ${poi.name} - 无图片`);
                skipped++;
                continue;
            }

            // 检查是否已存在
            const [existing] = await pool.query(
                'SELECT id FROM restaurants WHERE name = ?',
                [poi.name]
            );

            if (existing.length > 0) {
                console.log(`⊘ 跳过 ${poi.name} - 已存在`);
                skipped++;
                continue;
            }

            // 准备数据
            const image = poi.photos[0].url;
            const rating = parseFloat(poi.biz_ext?.rating) || 4.0;
            const cost = poi.biz_ext?.cost || '¥50';

            // 处理价格范围
            let priceRange = '¥¥';
            if (cost) {
                const price = parseFloat(cost);
                if (price < 30) priceRange = '¥';
                else if (price < 80) priceRange = '¥¥';
                else if (price < 150) priceRange = '¥¥¥';
                else priceRange = '¥¥¥¥';
            }

            // 插入数据
            await pool.query(
                `INSERT INTO restaurants
                (name, description, rating, review_count, price_range, address, phone, image, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    poi.name,
                    poi.address || poi.name,
                    rating,
                    Math.floor(Math.random() * 500) + 50,
                    priceRange,
                    poi.address || '',
                    poi.tel || '',
                    image
                ]
            );

            console.log(`✅ 导入 ${poi.name} - 评分: ${rating}, 价格: ${priceRange}, 图片: ${poi.photos.length}张`);
            imported++;
        }

        console.log(`\n导入完成: 成功 ${imported}, 跳过 ${skipped}`);

    } catch (error) {
        console.error('导入长沙餐厅失败:', error);
    }
}

async function main() {
    console.log('开始导入长沙数据...\n');

    await importChangshaDestination();
    await importChangshaAttractions();
    await importChangshaRestaurants();

    console.log('\n========== 全部导入完成 ==========\n');
    process.exit(0);
}

main().catch(error => {
    console.error('导入失败:', error);
    process.exit(1);
});
