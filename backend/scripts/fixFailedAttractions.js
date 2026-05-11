require('dotenv').config();
const mysql = require('mysql2/promise');
const axios = require('axios');

const AMAP_KEY = process.env.AMAP_KEY || '0c4c21c26cf0ed2fcebc2fabef2d6a0c';

// 失败的景点列表
const failedAttractions = [
    '景山公园', '什刹海', '陶然亭公园', '北京金海湖风景区', '虎峪自然风景区',
    '上海迪士尼度假区', '上海海昌海洋公园', '上海共青森林公园', '上海野生动物园', '彩虹桥',
    '广州曼古园', '花都融创文旅城', '天河湿地公园', '莲花山旅游区', '南湖国家旅游度假区',
    '大佛寺', '红花山公园', '深圳湾公园', '宝安西湾红树林公园'
];

async function searchPOI(name, city) {
    try {
        const response = await axios.get('https://restapi.amap.com/v5/place/text', {
            params: {
                key: AMAP_KEY,
                keywords: name,
                region: city,
                types: '风景名胜|公园广场|旅游景点',
                show_fields: 'photos,business,children'
            }
        });

        if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
            return response.data.pois[0];
        }
        return null;
    } catch (error) {
        console.error(`  ✗ API错误: ${error.message}`);
        return null;
    }
}

function extractPhotos(poi) {
    const photos = [];
    if (poi.photos && Array.isArray(poi.photos)) {
        poi.photos.slice(0, 5).forEach(photo => {
            if (photo.url) {
                photos.push(photo.url);
            }
        });
    }
    return photos;
}

function extractOpeningHours(poi) {
    if (poi.business && poi.business.opentime_GDF) {
        return poi.business.opentime_GDF;
    }
    if (poi.business && poi.business.opentime) {
        return poi.business.opentime;
    }
    return '营业时间请咨询景点';
}

function extractFacilities(poi) {
    const facilities = [];
    if (poi.biz_ext) {
        if (poi.biz_ext.parking) facilities.push('停车场');
        if (poi.biz_ext.wifi) facilities.push('WiFi');
        if (poi.biz_ext.toilet) facilities.push('卫生间');
    }
    return facilities;
}

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'tripadvisor'
    });

    console.log('╔════════════════════════════════════════════════╗');
    console.log('║      修复失败的景点数据                        ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    let successCount = 0;
    let failCount = 0;

    for (const name of failedAttractions) {
        try {
            // 从数据库获取景点信息
            const [rows] = await connection.query(
                'SELECT id, name, location_city, image FROM attractions WHERE name = ?',
                [name]
            );

            if (rows.length === 0) {
                console.log(`⚠️  未找到景点: ${name}`);
                failCount++;
                continue;
            }

            const attraction = rows[0];
            console.log(`\n正在处理: ${attraction.name} (${attraction.location_city})`);

            // 搜索POI
            const poi = await searchPOI(attraction.name, attraction.location_city);

            let photos, openingHours, phone, address, facilities;

            if (poi) {
                photos = extractPhotos(poi);
                if (photos.length === 0) {
                    photos = [attraction.image];
                }
                openingHours = extractOpeningHours(poi);
                phone = poi.tel || '';
                address = poi.address || '';
                facilities = extractFacilities(poi);
            } else {
                console.log('  ⚠️  未找到POI，使用默认数据');
                photos = [attraction.image];
                openingHours = '营业时间请咨询景点';
                phone = '';
                address = `${attraction.location_city}市`;
                facilities = [];
            }

            // 安全地转换为JSON
            const photosJson = JSON.stringify(photos);
            const facilitiesJson = JSON.stringify(facilities);

            // 确保所有字符串值都不为null
            const safePhone = phone || '';
            const safeAddress = address || `${attraction.location_city}市`;
            const safeOpeningHours = openingHours || '营业时间请咨询景点';

            // 更新数据库
            await connection.execute(
                `UPDATE attractions SET
                    photos = ?,
                    opening_hours = ?,
                    phone = ?,
                    address = ?,
                    facilities = ?
                WHERE id = ?`,
                [
                    photosJson,
                    safeOpeningHours,
                    safePhone,
                    safeAddress,
                    facilitiesJson,
                    attraction.id
                ]
            );

            console.log('  ✓ 更新成功');
            console.log(`    - 图片: ${photos.length} 张`);
            console.log(`    - 营业时间: ${safeOpeningHours}`);
            console.log(`    - 电话: ${safePhone || '暂无'}`);
            console.log(`    - 地址: ${safeAddress}`);
            console.log(`    - 设施: ${facilities.length} 项`);

            successCount++;

        } catch (error) {
            console.log(`  ✗ 更新失败: ${error.message}`);
            failCount++;
        }

        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    await connection.end();

    console.log('\n========== 修复完成 ==========');
    console.log(`总计: ${failedAttractions.length} 个景点`);
    console.log(`成功: ${successCount} 个`);
    console.log(`失败: ${failCount} 个`);
}

main().catch(console.error);
