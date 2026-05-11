const { pool } = require('./config/database');

const destinations = [
    {
        name: '北京',
        name_en: 'Beijing',
        slug: 'beijing',
        country: '中国',
        country_code: 'CN',
        region: '华北',
        description: '中国首都，拥有悠久的历史文化',
        cover_image: '/images/destinations/beijing.jpg',
        rating: 4.8
    },
    {
        name: '上海',
        name_en: 'Shanghai',
        slug: 'shanghai',
        country: '中国',
        country_code: 'CN',
        region: '华东',
        description: '现代化国际大都市，东方明珠',
        cover_image: '/images/destinations/shanghai.jpg',
        rating: 4.9
    },
    {
        name: '广州',
        name_en: 'Guangzhou',
        slug: 'guangzhou',
        country: '中国',
        country_code: 'CN',
        region: '华南',
        description: '千年商都，岭南文化中心',
        cover_image: '/images/destinations/guangzhou.jpg',
        rating: 4.7
    },
    {
        name: '深圳',
        name_en: 'Shenzhen',
        slug: 'shenzhen',
        country: '中国',
        country_code: 'CN',
        region: '华南',
        description: '改革开放窗口，创新科技之城',
        cover_image: '/images/destinations/shenzhen.jpg',
        rating: 4.6
    },
    {
        name: '杭州',
        name_en: 'Hangzhou',
        slug: 'hangzhou',
        country: '中国',
        country_code: 'CN',
        region: '华东',
        description: '人间天堂，西湖美景甲天下',
        cover_image: '/images/destinations/hangzhou.jpg',
        rating: 4.8
    },
    {
        name: '成都',
        name_en: 'Chengdu',
        slug: 'chengdu',
        country: '中国',
        country_code: 'CN',
        region: '西南',
        description: '天府之国，美食之都',
        cover_image: '/images/destinations/chengdu.jpg',
        rating: 4.7
    },
    {
        name: '西安',
        name_en: "Xi'an",
        slug: 'xian',
        country: '中国',
        country_code: 'CN',
        region: '西北',
        description: '十三朝古都，兵马俑的故乡',
        cover_image: '/images/destinations/xian.jpg',
        rating: 4.8
    },
    {
        name: '重庆',
        name_en: 'Chongqing',
        slug: 'chongqing',
        country: '中国',
        country_code: 'CN',
        region: '西南',
        description: '山城雾都，火锅之都',
        cover_image: '/images/destinations/chongqing.jpg',
        rating: 4.6
    },
    {
        name: '南京',
        name_en: 'Nanjing',
        slug: 'nanjing',
        country: '中国',
        country_code: 'CN',
        region: '华东',
        description: '六朝古都，历史文化名城',
        cover_image: '/images/destinations/nanjing.jpg',
        rating: 4.7
    },
    {
        name: '苏州',
        name_en: 'Suzhou',
        slug: 'suzhou',
        country: '中国',
        country_code: 'CN',
        region: '华东',
        description: '园林之城，东方威尼斯',
        cover_image: '/images/destinations/suzhou.jpg',
        rating: 4.7
    },
    {
        name: '武汉',
        name_en: 'Wuhan',
        slug: 'wuhan',
        country: '中国',
        country_code: 'CN',
        region: '华中',
        description: '九省通衢，长江之城',
        cover_image: '/images/destinations/wuhan.jpg',
        rating: 4.5
    },
    {
        name: '厦门',
        name_en: 'Xiamen',
        slug: 'xiamen',
        country: '中国',
        country_code: 'CN',
        region: '华南',
        description: '海上花园，鼓浪屿风光',
        cover_image: '/images/destinations/xiamen.jpg',
        rating: 4.8
    },
    {
        name: '青岛',
        name_en: 'Qingdao',
        slug: 'qingdao',
        country: '中国',
        country_code: 'CN',
        region: '华东',
        description: '帆船之都，啤酒之城',
        cover_image: '/images/destinations/qingdao.jpg',
        rating: 4.6
    },
    {
        name: '大连',
        name_en: 'Dalian',
        slug: 'dalian',
        country: '中国',
        country_code: 'CN',
        region: '东北',
        description: '浪漫之都，北方明珠',
        cover_image: '/images/destinations/dalian.jpg',
        rating: 4.5
    },
    {
        name: '桂林',
        name_en: 'Guilin',
        slug: 'guilin',
        country: '中国',
        country_code: 'CN',
        region: '华南',
        description: '山水甲天下，喀斯特地貌奇观',
        cover_image: '/images/destinations/guilin.jpg',
        rating: 4.9
    },
    {
        name: '长沙',
        name_en: 'Changsha',
        slug: 'changsha',
        country: '中国',
        country_code: 'CN',
        region: '华中',
        description: '星城长沙，湖湘文化发源地，美食之都',
        cover_image: '/images/destinations/changsha.jpg',
        rating: 4.7
    }
];

async function seedDestinations() {
    let connection;
    try {
        connection = await pool.getConnection();

        console.log('开始填充城市数据...');

        for (const dest of destinations) {
            try {
                await connection.query(
                    `INSERT INTO destinations (name, name_en, slug, country, country_code, region, description, cover_image, rating, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                     ON DUPLICATE KEY UPDATE
                     name_en = VALUES(name_en),
                     country = VALUES(country),
                     country_code = VALUES(country_code),
                     region = VALUES(region),
                     description = VALUES(description),
                     cover_image = VALUES(cover_image),
                     rating = VALUES(rating)`,
                    [dest.name, dest.name_en, dest.slug, dest.country, dest.country_code, dest.region, dest.description, dest.cover_image, dest.rating]
                );
                console.log(`✅ 已添加/更新城市: ${dest.name}`);
            } catch (error) {
                console.error(`❌ 添加城市 ${dest.name} 失败:`, error.message);
            }
        }

        console.log('✅ 城市数据填充完成');

    } catch (error) {
        console.error('❌ 填充城市数据失败:', error);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    seedDestinations();
}

module.exports = { seedDestinations };
