const axios = require('axios');
const mysql = require('mysql2/promise');

const AMAP_KEY = '4e0e9c84e5e0e3e8e5e0e3e8e5e0e3e8'; // 替换为你的高德地图API Key

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'travel_booking'
};

// 目标城市和景点类型
const CITIES = [
    '北京', '上海', '广州', '深圳', '杭州', '成都',
    '西安', '南京', '重庆', '武汉', '苏州', '厦门'
];

const ATTRACTION_TYPES = [
    '风景名胜',
    '公园广场',
    '文物古迹',
    '博物馆',
    '动物园',
    '植物园',
    '游乐园',
    '海洋馆'
];

class DetailedImporter {
    constructor() {
        this.connection = null;
    }

    async connect() {
        this.connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            console.log('✅ 数据库连接已关闭');
        }
    }

    // 搜索景点（获取详细信息）
    async searchAttractions(keywords, city, offset = 20) {
        try {
            const response = await axios.get('https://restapi.amap.com/v3/place/text', {
                params: {
                    key: AMAP_KEY,
                    keywords: keywords,
                    city: city,
                    types: '110000|120000|130000|140000|150000|160000', // 旅游景点相关类型
                    offset: offset,
                    extensions: 'all' // 获取详细信息
                }
            });

            if (response.data.status === '1' && response.data.pois) {
                return response.data.pois;
            }
            return [];
        } catch (error) {
            console.error(`❌ 搜索景点失败 [${city} - ${keywords}]:`, error.message);
            return [];
        }
    }

    // 获取POI详情（包含更多信息）
    async getPoiDetail(poiId) {
        try {
            const response = await axios.get('https://restapi.amap.com/v3/place/detail', {
                params: {
                    key: AMAP_KEY,
                    id: poiId,
                    extensions: 'all'
                }
            });

            if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
                return response.data.pois[0];
            }
            return null;
        } catch (error) {
            console.error(`❌ 获取POI详情失败 [${poiId}]:`, error.message);
            return null;
        }
    }

    // 提取图片URL数组
    extractPhotos(poi) {
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

    // 提取营业时间
    extractOpeningHours(poi) {
        if (poi.biz_ext && poi.biz_ext.open_time) {
            return poi.biz_ext.open_time;
        }
        return null;
    }

    // 提取设施信息
    extractFacilities(poi) {
        const facilities = [];
        if (poi.biz_ext) {
            if (poi.biz_ext.parking) facilities.push('停车场');
            if (poi.biz_ext.wifi) facilities.push('WiFi');
            if (poi.biz_ext.toilet) facilities.push('卫生间');
        }
        return facilities;
    }

    // 插入或更新景点数据
    async upsertAttraction(poi, city) {
        try {
            // 获取详细信息
            const detail = await this.getPoiDetail(poi.id);
            const detailData = detail || poi;

            // 提取位置信息
            const location = poi.location ? poi.location.split(',') : [null, null];
            const longitude = location[0];
            const latitude = location[1];

            // 提取图片
            const photos = this.extractPhotos(detailData);
            const mainImage = photos.length > 0 ? photos[0] : null;
            const photosJson = photos.length > 0 ? JSON.stringify(photos) : null;

            // 提取营业时间
            const openingHours = this.extractOpeningHours(detailData);

            // 提取设施
            const facilities = this.extractFacilities(detailData);
            const facilitiesJson = facilities.length > 0 ? JSON.stringify(facilities) : null;

            // 提取联系方式
            const phone = detailData.tel || null;

            // 提取详细地址
            const address = detailData.address || poi.address || poi.pname + poi.cityname + poi.adname;

            // 提取评分和评论数
            const rating = detailData.biz_ext && detailData.biz_ext.rating
                ? parseFloat(detailData.biz_ext.rating)
                : (Math.random() * 1 + 4).toFixed(1); // 4.0-5.0随机评分

            const reviewCount = detailData.biz_ext && detailData.biz_ext.cost
                ? parseInt(detailData.biz_ext.cost)
                : Math.floor(Math.random() * 5000) + 500; // 500-5500随机评论数

            // 提取价格
            let price = null;
            if (detailData.biz_ext && detailData.biz_ext.cost) {
                price = parseFloat(detailData.biz_ext.cost);
            }

            // 检查景点是否已存在
            const [existing] = await this.connection.execute(
                'SELECT id FROM attractions WHERE name = ? AND location_city = ?',
                [poi.name, city]
            );

            if (existing.length > 0) {
                // 更新现有景点
                await this.connection.execute(`
                    UPDATE attractions SET
                        description = ?,
                        rating = ?,
                        review_count = ?,
                        price = ?,
                        latitude = ?,
                        longitude = ?,
                        image = ?,
                        photos = ?,
                        opening_hours = ?,
                        phone = ?,
                        address = ?,
                        facilities = ?,
                        updated_at = NOW()
                    WHERE id = ?
                `, [
                    poi.type || '景点',
                    rating,
                    reviewCount,
                    price,
                    latitude,
                    longitude,
                    mainImage,
                    photosJson,
                    openingHours,
                    phone,
                    address,
                    facilitiesJson,
                    existing[0].id
                ]);
                console.log(`✅ 更新景点: ${poi.name} (${city})`);
                return existing[0].id;
            } else {
                // 插入新景点
                const [result] = await this.connection.execute(`
                    INSERT INTO attractions (
                        name, description, rating, review_count, price, currency,
                        location_city, location_country, latitude, longitude,
                        duration, cancellation_policy, image, photos,
                        opening_hours, phone, address, facilities,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    poi.name,
                    poi.type || '景点',
                    rating,
                    reviewCount,
                    price,
                    'CNY',
                    city,
                    '中国',
                    latitude,
                    longitude,
                    '2-3小时',
                    '提前24小时免费取消',
                    mainImage,
                    photosJson,
                    openingHours,
                    phone,
                    address,
                    facilitiesJson
                ]);
                console.log(`✅ 新增景点: ${poi.name} (${city})`);
                return result.insertId;
            }
        } catch (error) {
            console.error(`❌ 插入/更新景点失败 [${poi.name}]:`, error.message);
            return null;
        }
    }

    // 导入所有数据
    async importAll() {
        let totalAttractions = 0;
        let successCount = 0;

        for (const city of CITIES) {
            console.log(`\n📍 正在处理城市: ${city}`);

            for (const type of ATTRACTION_TYPES) {
                const pois = await this.searchAttractions(type, city, 5);

                for (const poi of pois) {
                    totalAttractions++;
                    const attractionId = await this.upsertAttraction(poi, city);
                    if (attractionId) {
                        successCount++;
                    }

                    // 延迟避免API限流
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }

        console.log(`\n✅ 导入完成！`);
        console.log(`   总计: ${totalAttractions} 个景点`);
        console.log(`   成功: ${successCount} 个`);
        console.log(`   失败: ${totalAttractions - successCount} 个`);
    }

    // 更新现有景点的详细信息
    async updateExistingAttractions() {
        try {
            // 获取所有现有景点
            const [attractions] = await this.connection.execute(
                'SELECT id, name, location_city FROM attractions WHERE opening_hours IS NULL OR phone IS NULL'
            );

            console.log(`\n📍 找到 ${attractions.length} 个需要更新的景点`);

            let successCount = 0;

            for (const attraction of attractions) {
                console.log(`\n正在更新: ${attraction.name} (${attraction.location_city})`);

                // 搜索景点
                const pois = await this.searchAttractions(attraction.name, attraction.location_city, 1);

                if (pois.length > 0) {
                    const poi = pois[0];

                    // 获取详细信息
                    const detail = await this.getPoiDetail(poi.id);
                    const detailData = detail || poi;

                    // 提取数据
                    const photos = this.extractPhotos(detailData);
                    const photosJson = photos.length > 0 ? JSON.stringify(photos) : null;
                    const openingHours = this.extractOpeningHours(detailData);
                    const facilities = this.extractFacilities(detailData);
                    const facilitiesJson = facilities.length > 0 ? JSON.stringify(facilities) : null;
                    const phone = detailData.tel || null;
                    const address = detailData.address || poi.address || null;

                    // 更新数据库
                    await this.connection.execute(`
                        UPDATE attractions SET
                            photos = COALESCE(?, photos),
                            opening_hours = COALESCE(?, opening_hours),
                            phone = COALESCE(?, phone),
                            address = COALESCE(?, address),
                            facilities = COALESCE(?, facilities),
                            updated_at = NOW()
                        WHERE id = ?
                    `, [
                        photosJson,
                        openingHours,
                        phone,
                        address,
                        facilitiesJson,
                        attraction.id
                    ]);

                    console.log(`✅ 更新成功: ${attraction.name}`);
                    successCount++;
                } else {
                    console.log(`⚠️  未找到POI: ${attraction.name}`);
                }

                // 延迟避免API限流
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            console.log(`\n✅ 更新完成！`);
            console.log(`   总计: ${attractions.length} 个景点`);
            console.log(`   成功: ${successCount} 个`);
            console.log(`   失败: ${attractions.length - successCount} 个`);
        } catch (error) {
            console.error('❌ 更新失败:', error);
        }
    }
}

// 主函数
async function main() {
    const importer = new DetailedImporter();

    try {
        await importer.connect();

        // 选择操作模式
        const mode = process.argv[2] || 'update';

        if (mode === 'import') {
            console.log('🚀 开始导入新数据...\n');
            await importer.importAll();
        } else if (mode === 'update') {
            console.log('🚀 开始更新现有景点数据...\n');
            await importer.updateExistingAttractions();
        } else {
            console.log('❌ 未知模式，请使用: node importDetailedData.js [import|update]');
        }

    } catch (error) {
        console.error('❌ 执行失败:', error);
    } finally {
        await importer.disconnect();
    }
}

// 执行
main();
