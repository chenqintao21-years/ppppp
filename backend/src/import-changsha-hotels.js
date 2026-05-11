const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tripadvisor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 高德地图API配置
const AMAP_KEY = process.env.AMAP_KEY || 'your_amap_key';
const AMAP_API_BASE = 'https://restapi.amap.com/v3';

// 搜索长沙的酒店
async function searchChangshaHotels() {
    try {
        console.log('开始搜索长沙的酒店...');

        // 使用高德地图POI搜索API
        const response = await axios.get(`${AMAP_API_BASE}/place/text`, {
            params: {
                key: AMAP_KEY,
                keywords: '酒店',
                city: '长沙',
                citylimit: true,
                offset: 25, // 每页返回数量
                page: 1,
                extensions: 'all' // 返回详细信息
            }
        });

        if (response.data.status === '1' && response.data.pois) {
            console.log(`找到 ${response.data.pois.length} 家酒店`);
            return response.data.pois;
        } else {
            console.error('搜索失败:', response.data.info);
            return [];
        }
    } catch (error) {
        console.error('搜索酒店时出错:', error.message);
        return [];
    }
}

// 获取POI详情（包括图片）
async function getPoiDetail(poiId) {
    try {
        const response = await axios.get(`${AMAP_API_BASE}/place/detail`, {
            params: {
                key: AMAP_KEY,
                id: poiId
            }
        });

        if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
            return response.data.pois[0];
        }
        return null;
    } catch (error) {
        console.error(`获取POI详情失败 (${poiId}):`, error.message);
        return null;
    }
}

// 处理酒店数据
function processHotelData(poi) {
    // 提取图片URL
    let imageUrl = null;
    if (poi.photos && poi.photos.length > 0) {
        imageUrl = poi.photos[0].url;
    }

    // 提取评分（高德地图可能没有评分，使用默认值）
    const rating = parseFloat(poi.biz_ext?.rating || '4.0');

    // 提取地址和位置 - 确保location包含"长沙"
    const address = poi.address || '';
    const location = `长沙，中国`;  // 确保包含"长沙"

    // 提取电话
    const phone = poi.tel || null;

    // 提取经纬度
    let latitude = null;
    let longitude = null;
    if (poi.location) {
        const coords = poi.location.split(',');
        if (coords.length === 2) {
            longitude = parseFloat(coords[0]);
            latitude = parseFloat(coords[1]);
        }
    }

    return {
        name: poi.name,
        rating: rating,
        review_count: parseInt(poi.biz_ext?.rating_count || '0'),
        location: location,
        address: address,
        phone: phone,
        latitude: latitude,
        longitude: longitude,
        image: imageUrl,
        description: poi.type || '酒店',
        check_in_time: '15:00:00',
        check_out_time: '12:00:00',
        created_at: new Date(),
        updated_at: new Date()
    };
}

// 保存酒店到数据库
async function saveHotelToDatabase(connection, hotelData) {
    try {
        const [result] = await connection.query(
            `INSERT INTO hotels (
                name, rating, review_count, location, address, phone,
                latitude, longitude, check_in_time, check_out_time,
                image, description, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                hotelData.name,
                hotelData.rating,
                hotelData.review_count,
                hotelData.location,
                hotelData.address,
                hotelData.phone,
                hotelData.latitude,
                hotelData.longitude,
                hotelData.check_in_time,
                hotelData.check_out_time,
                hotelData.image,
                hotelData.description,
                hotelData.created_at,
                hotelData.updated_at
            ]
        );

        return result.insertId;
    } catch (error) {
        console.error('保存酒店失败:', error.message);
        return null;
    }
}

// 主函数
async function main() {
    let connection;

    try {
        // 连接数据库
        console.log('连接数据库...');
        connection = await mysql.createConnection(dbConfig);
        console.log('数据库连接成功');

        // 搜索长沙的酒店
        const hotels = await searchChangshaHotels();

        if (hotels.length === 0) {
            console.log('没有找到酒店数据');
            return;
        }

        let importedCount = 0;
        let skippedCount = 0;

        // 处理每个酒店
        for (const poi of hotels) {
            console.log(`\n处理酒店: ${poi.name}`);

            // 获取详细信息（包括图片）
            const detail = await getPoiDetail(poi.id);
            const hotelPoi = detail || poi;

            // 处理酒店数据
            const hotelData = processHotelData(hotelPoi);

            // 检查是否有图片
            if (!hotelData.image) {
                console.log(`  ⏭️  跳过（无图片）: ${hotelData.name}`);
                skippedCount++;
                continue;
            }

            // 验证图片URL是否有效
            try {
                const imageCheck = await axios.head(hotelData.image, { timeout: 5000 });
                if (imageCheck.status !== 200) {
                    console.log(`  ⏭️  跳过（图片无效）: ${hotelData.name}`);
                    skippedCount++;
                    continue;
                }
            } catch (error) {
                console.log(`  ⏭️  跳过（图片无法访问）: ${hotelData.name}`);
                skippedCount++;
                continue;
            }

            // 保存到数据库
            const hotelId = await saveHotelToDatabase(connection, hotelData);

            if (hotelId) {
                console.log(`  ✅ 导入成功 (ID: ${hotelId}): ${hotelData.name}`);
                console.log(`     评分: ${hotelData.rating}, 位置: ${hotelData.location}`);
                console.log(`     图片: ${hotelData.image}`);
                importedCount++;
            } else {
                console.log(`  ❌ 导入失败: ${hotelData.name}`);
                skippedCount++;
            }

            // 延迟，避免API请求过快
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n=================================');
        console.log(`导入完成！`);
        console.log(`成功导入: ${importedCount} 家酒店`);
        console.log(`跳过: ${skippedCount} 家酒店`);
        console.log('=================================');

    } catch (error) {
        console.error('执行过程中出错:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('数据库连接已关闭');
        }
    }
}

// 运行脚本
main();
