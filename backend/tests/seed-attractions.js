/**
 * 景点测试数据初始化脚本
 * 向数据库插入测试景点数据
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../src/config/database');

// 测试景点数据
const testAttractions = [
    {
        name: '故宫博物院',
        description: '中国明清两代的皇家宫殿，世界上现存规模最大的木质结构古建筑群。',
        rating: 4.8,
        review_count: 28934,
        price: 60.00,
        currency: 'CNY',
        location_city: '北京',
        location_country: '中国',
        latitude: 39.9163,
        longitude: 116.3972,
        duration: '3-4小时',
        cancellation_policy: '提前24小时免费取消',
        image: '/images/forbidden-city.jpg'
    },
    {
        name: '长城',
        description: '中国古代的军事防御工程，世界文化遗产。',
        rating: 4.9,
        review_count: 32145,
        price: 40.00,
        currency: 'CNY',
        location_city: '北京',
        location_country: '中国',
        latitude: 40.4319,
        longitude: 116.5704,
        duration: '4-5小时',
        cancellation_policy: '提前24小时免费取消',
        image: '/images/great-wall.jpg'
    },
    {
        name: '天坛',
        description: '明清两代皇帝祭天祈谷的场所，世界文化遗产。',
        rating: 4.6,
        review_count: 18765,
        price: 15.00,
        currency: 'CNY',
        location_city: '北京',
        location_country: '中国',
        latitude: 39.8822,
        longitude: 116.4066,
        duration: '2-3小时',
        cancellation_policy: '提前24小时免费取消',
        image: '/images/temple-of-heaven.jpg'
    },
    {
        name: '西湖',
        description: '杭州最著名的景点，中国最美的湖泊之一。',
        rating: 4.7,
        review_count: 32145,
        price: 0.00,
        currency: 'CNY',
        location_city: '杭州',
        location_country: '中国',
        latitude: 30.2489,
        longitude: 120.1480,
        duration: '半天',
        cancellation_policy: '免费参观',
        image: '/images/west-lake.jpg'
    },
    {
        name: '兵马俑',
        description: '秦始皇陵的陪葬坑，世界第八大奇迹。',
        rating: 4.8,
        review_count: 28765,
        price: 120.00,
        currency: 'CNY',
        location_city: '西安',
        location_country: '中国',
        latitude: 34.3848,
        longitude: 109.2789,
        duration: '2-3小时',
        cancellation_policy: '提前24小时免费取消',
        image: '/images/terracotta-warriors.jpg'
    },
    {
        name: '外滩',
        description: '上海最著名的地标，万国建筑博览群。',
        rating: 4.6,
        review_count: 35678,
        price: 0.00,
        currency: 'CNY',
        location_city: '上海',
        location_country: '中国',
        latitude: 31.2397,
        longitude: 121.4900,
        duration: '1-2小时',
        cancellation_policy: '免费参观',
        image: '/images/the-bund.jpg'
    },
    {
        name: '桂林山水',
        description: '中国最美的山水风光，"桂林山水甲天下"。',
        rating: 4.8,
        review_count: 22345,
        price: 210.00,
        currency: 'CNY',
        location_city: '桂林',
        location_country: '中国',
        latitude: 25.2736,
        longitude: 110.2900,
        duration: '全天',
        cancellation_policy: '提前24小时免费取消',
        image: '/images/guilin.jpg'
    },
    {
        name: '九寨沟',
        description: '中国最美的水景，被誉为"人间仙境"。',
        rating: 4.9,
        review_count: 26543,
        price: 169.00,
        currency: 'CNY',
        location_city: '九寨沟',
        location_country: '中国',
        latitude: 33.2600,
        longitude: 103.9200,
        duration: '全天',
        cancellation_policy: '提前24小时免费取消',
        image: '/images/jiuzhaigou.jpg'
    },
    {
        name: '黄山',
        description: '中国最著名的山岳风景区，以奇松、怪石、云海、温泉闻名。',
        rating: 4.8,
        review_count: 24567,
        price: 190.00,
        currency: 'CNY',
        location_city: '黄山',
        location_country: '中国',
        latitude: 30.1333,
        longitude: 118.1667,
        duration: '全天',
        cancellation_policy: '提前24小时免费取消',
        image: '/images/huangshan.jpg'
    },
    {
        name: '张家界国家森林公园',
        description: '中国第一个国家森林公园，阿凡达取景地。',
        rating: 4.7,
        review_count: 19876,
        price: 228.00,
        currency: 'CNY',
        location_city: '张家界',
        location_country: '中国',
        latitude: 29.3255,
        longitude: 110.4793,
        duration: '全天',
        cancellation_policy: '提前24小时免费取消',
        image: '/images/zhangjiajie.jpg'
    }
];

// 测试用户数据
const testUsers = [
    {
        username: 'testuser1',
        email: 'test1@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        avatar: '/images/avatar1.jpg'
    },
    {
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        avatar: '/images/avatar2.jpg'
    }
];

// 测试评论数据
const testReviews = [
    {
        user_id: 1,
        entity_type: 'attraction',
        entity_id: 1,
        rating: 5.0,
        title: '非常值得参观',
        content: '故宫的建筑令人惊叹，历史文化底蕴深厚。强烈推荐提前购买门票。',
        helpful_count: 15
    },
    {
        user_id: 2,
        entity_type: 'attraction',
        entity_id: 1,
        rating: 4.5,
        title: '历史的殿堂',
        content: '作为世界文化遗产，故宫确实名不虚传。建议穿舒适的鞋子，因为要走很多路。',
        helpful_count: 10
    },
    {
        user_id: 1,
        entity_type: 'attraction',
        entity_id: 2,
        rating: 5.0,
        title: '北京必去景点',
        content: '长城非常壮观，登上长城可以俯瞰整个山脉。',
        helpful_count: 20
    }
];

// 初始化数据
async function seedData() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');

        // 清空现有数据
        console.log('\n🗑️  清空现有数据...');
        await connection.query('DELETE FROM reviews');
        await connection.query('DELETE FROM bookings');
        await connection.query('DELETE FROM favorites');
        await connection.query('DELETE FROM attractions');
        await connection.query('DELETE FROM users');
        console.log('✅ 现有数据已清空');

        // 插入测试用户
        console.log('\n👤 插入测试用户...');
        for (const user of testUsers) {
            await connection.query(
                'INSERT INTO users (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)',
                [user.username, user.email, user.password_hash, user.avatar]
            );
        }
        console.log(`✅ 已插入 ${testUsers.length} 个测试用户`);

        // 插入测试景点
        console.log('\n📍 插入测试景点...');
        for (const attraction of testAttractions) {
            await connection.query(
                `INSERT INTO attractions
                (name, description, rating, review_count, price, currency,
                location_city, location_country, latitude, longitude,
                duration, cancellation_policy, image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    attraction.name,
                    attraction.description,
                    attraction.rating,
                    attraction.review_count,
                    attraction.price,
                    attraction.currency,
                    attraction.location_city,
                    attraction.location_country,
                    attraction.latitude,
                    attraction.longitude,
                    attraction.duration,
                    attraction.cancellation_policy,
                    attraction.image
                ]
            );
        }
        console.log(`✅ 已插入 ${testAttractions.length} 个测试景点`);

        // 获取插入的用户 ID
        const [users] = await connection.query('SELECT id FROM users ORDER BY id LIMIT 2');
        const userIds = users.map(u => u.id);

        // 插入测试评论
        console.log('\n💬 插入测试评论...');
        for (const review of testReviews) {
            const userId = userIds[review.user_id - 1] || userIds[0];
            await connection.query(
                `INSERT INTO reviews
                (user_id, entity_type, entity_id, rating, title, content, helpful_count)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    review.entity_type,
                    review.entity_id,
                    review.rating,
                    review.title,
                    review.content,
                    review.helpful_count
                ]
            );
        }
        console.log(`✅ 已插入 ${testReviews.length} 条测试评论`);

        // 验证数据
        console.log('\n📊 验证插入的数据...');
        const [attractionsCount] = await connection.query('SELECT COUNT(*) as count FROM attractions');
        const [usersCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [reviewsCount] = await connection.query('SELECT COUNT(*) as count FROM reviews');

        console.log(`   景点数量: ${attractionsCount[0].count}`);
        console.log(`   用户数量: ${usersCount[0].count}`);
        console.log(`   评论数量: ${reviewsCount[0].count}`);

        console.log('\n✨ 测试数据初始化完成!');

    } catch (error) {
        console.error('❌ 数据初始化失败:', error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
    }
}

// 运行初始化
seedData().catch(error => {
    console.error('💥 脚本执行失败:', error);
    process.exit(1);
});
