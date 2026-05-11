const mysql = require('mysql2/promise');
const axios = require('axios');

const AMAP_KEY = '0c4c21c26cf0ed2fcebc2fabef2d6a0c';

// 热门城市配置
const cities = [
    { name: '北京', keywords: ['故宫', '长城', '天坛', '颐和园', '圆明园'] },
    { name: '上海', keywords: ['外滩', '东方明珠', '迪士尼', '南京路', '豫园'] },
    { name: '杭州', keywords: ['西湖', '灵隐寺', '雷峰塔', '宋城', '千岛湖'] },
    { name: '成都', keywords: ['大熊猫基地', '宽窄巷子', '锦里', '都江堰', '青城山'] },
    { name: '西安', keywords: ['兵马俑', '大雁塔', '华清池', '城墙', '钟楼'] },
    { name: '广州', keywords: ['广州塔', '长隆', '陈家祠', '沙面', '白云山'] }
];

async function searchPOI(city, keyword) {
    try {
        const response = await axios.get('https://restapi.amap.com/v3/place/text', {
            params: {
                key: AMAP_KEY,
                keywords: keyword,
                city: city,
                types: '风景名胜|旅游景点',
                extensions: 'all',
                offset: 1
            }
        });

        if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
            return response.data.pois[0];
        }
        return null;
    } catch (error) {
        console.error(`搜索失败 ${city} - ${keyword}:`, error.message);
        return null;
    }
}

function extractImages(poi) {
    const images = [];

    // 从photos字段提取
    if (poi.photos && poi.photos.length > 0) {
        poi.photos.forEach(photo => {
            if (photo.url) {
                images.push(photo.url);
            }
        });
    }

    // 如果没有图片，使用默认图片
    if (images.length === 0) {
        images.push(`https://source.unsplash.com/800x600/?${encodeURIComponent(poi.name)},china,landmark`);
    }

    return images;
}

function extractFacilities(poi) {
    const facilities = [];

    if (poi.biz_ext) {
        if (poi.biz_ext.parking) facilities.push('停车场');
        if (poi.biz_ext.wifi) facilities.push('WiFi');
    }

    // 默认设施
    if (facilities.length === 0) {
        facilities.push('游客中心', '卫生间', '无障碍通道');
    }

    return facilities;
}

async function importData() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'tripadvisor'
    });

    console.log('开始导入数据...\n');

    let destinationId = 1;
    let attractionId = 1;
    let totalAttractions = 0;

    for (const city of cities) {
        console.log(`\n处理城市: ${city.name}`);

        // 插入目的地
        await conn.query(
            `INSERT INTO destinations (id, name, country, description, cover_image, rating, view_count)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                destinationId,
                city.name,
                '中国',
                `${city.name}是中国著名的旅游城市，拥有丰富的历史文化和自然景观。`,
                `https://source.unsplash.com/800x600/?${encodeURIComponent(city.name)},china,cityscape`,
                4.5 + Math.random() * 0.5,
                Math.floor(Math.random() * 5000) + 1000
            ]
        );

        console.log(`  ✓ 目的地已添加`);

        // 搜索并插入景点
        for (const keyword of city.keywords) {
            try {
                const poi = await searchPOI(city.name, keyword);

                if (poi) {
                    const images = extractImages(poi);
                    const facilities = extractFacilities(poi);

                    // 确保所有字段都有有效值
                    const openingHours = (poi.business_area && String(poi.business_area).trim()) ||
                                        (poi.opentime && String(poi.opentime).trim()) ||
                                        '全天开放';
                    const phone = (poi.tel && String(poi.tel).trim()) || '暂无';
                    const address = (poi.address && String(poi.address).trim()) ||
                                   `${poi.pname || ''}${poi.cityname || ''}${poi.adname || ''}`.trim() ||
                                   `${city.name}市`;

                    await conn.query(
                        `INSERT INTO attractions
                        (id, name, description, rating, review_count, price, currency,
                         location_city, location_country, latitude, longitude,
                         image, image_url, type, is_trending,
                         photos, opening_hours, phone, address, facilities)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            attractionId,
                            poi.name,
                            poi.type || '著名景点',
                            4.0 + Math.random(),
                            Math.floor(Math.random() * 3000) + 500,
                            Math.floor(Math.random() * 100) + 50,
                            'CNY',
                            city.name,
                            '中国',
                            poi.location ? parseFloat(poi.location.split(',')[1]) : null,
                            poi.location ? parseFloat(poi.location.split(',')[0]) : null,
                            images[0],
                            images[0],
                            '景点',
                            attractionId <= 8 ? 1 : 0,
                            JSON.stringify(images),
                            openingHours,
                            phone,
                            address,
                            JSON.stringify(facilities)
                        ]
                    );

                    console.log(`  ✓ ${poi.name} (${images.length}张图片)`);
                    attractionId++;
                    totalAttractions++;
                } else {
                    console.log(`  ✗ ${keyword} - 未找到`);
                }
            } catch (error) {
                console.error(`  ✗ ${keyword} - 插入失败:`, error.message);
            }

            // 延迟避免API限流
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        destinationId++;
    }

    await conn.end();

    console.log('\n导入完成！');
    console.log(`总计: ${cities.length}个城市, ${totalAttractions}个景点`);
}

importData().catch(console.error);
