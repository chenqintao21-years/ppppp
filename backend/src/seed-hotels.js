const { pool } = require('./config/database');

async function seedHotels() {
    try {
        const connection = await pool.getConnection();

        // 检查是否已有数据
        const [existing] = await connection.query('SELECT COUNT(*) as count FROM hotels');
        console.log(`当前酒店数量: ${existing[0].count}`);

        if (existing[0].count > 0) {
            console.log('⚠️  酒店表已有数据');
            const [result] = await pool.query('SELECT id, name, location, rating FROM hotels LIMIT 10');
            console.log('\n🏨 现有酒店（前10条）：');
            result.forEach(hotel => {
                console.log(`  ${hotel.id}. ${hotel.name} - ${hotel.location} (${hotel.rating}⭐)`);
            });
            connection.release();
            process.exit();
            return;
        }

        // 插入测试酒店数据
        const hotels = [
            // 北京酒店
            {
                name: '北京瑰丽酒店',
                description: '位于朝阳区CBD核心区域的现代奢华酒店，设计独特，服务一流',
                rating: 4.8,
                review_count: 5678,
                location: '北京，中国',
                address: '北京市朝阳区建国路1号',
                phone: '+86 10-6536-0066',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 39.9088,
                longitude: 116.4575,
                image: '/images/hotels/rosewood-beijing.jpg'
            },
            {
                name: '北京四季酒店',
                description: '位于金融街的五星级酒店，提供优质的商务和休闲设施',
                rating: 4.7,
                review_count: 5432,
                location: '北京，中国',
                address: '北京市西城区金融大街48号',
                phone: '+86 10-5695-8888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 39.9127,
                longitude: 116.3609,
                image: '/images/hotels/four-seasons-beijing.jpg'
            },
            {
                name: '北京颐和安缦',
                description: '位于颐和园旁的精品酒店，融合传统中式建筑与现代奢华',
                rating: 4.9,
                review_count: 4321,
                location: '北京，中国',
                address: '北京市海淀区宫门前街1号',
                phone: '+86 10-5987-9999',
                check_in_time: '14:00:00',
                check_out_time: '12:00:00',
                latitude: 39.9988,
                longitude: 116.2753,
                image: '/images/hotels/aman-summer-palace.jpg'
            },

            // 上海酒店
            {
                name: '上海浦东丽思卡尔顿酒店',
                description: '位于陆家嘴金融区的顶级奢华酒店，俯瞰黄浦江美景',
                rating: 4.8,
                review_count: 8765,
                location: '上海，中国',
                address: '上海市浦东新区世纪大道8号',
                phone: '+86 21-2020-1888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 31.2352,
                longitude: 121.5050,
                image: '/images/hotels/ritz-carlton-shanghai.jpg'
            },
            {
                name: '上海和平饭店',
                description: '外滩标志性的历史建筑，装饰艺术风格的经典酒店',
                rating: 4.7,
                review_count: 6543,
                location: '上海，中国',
                address: '上海市黄浦区南京东路20号',
                phone: '+86 21-2329-8888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 31.2397,
                longitude: 121.4900,
                image: '/images/hotels/peace-hotel.jpg'
            },
            {
                name: '上海养云安缦',
                description: '隐匿于都市中的世外桃源，拥有古樟树林和明清古宅',
                rating: 4.9,
                review_count: 2345,
                location: '上海，中国',
                address: '上海市闵行区马桥镇旗忠村',
                phone: '+86 21-8011-1111',
                check_in_time: '14:00:00',
                check_out_time: '12:00:00',
                latitude: 31.0456,
                longitude: 121.3897,
                image: '/images/hotels/amanyangyun.jpg'
            },

            // 杭州酒店
            {
                name: '杭州西子湖四季酒店',
                description: '坐落于西湖湖畔的园林式酒店，尽享湖光山色',
                rating: 4.9,
                review_count: 4567,
                location: '杭州，中国',
                address: '浙江省杭州市西湖区灵隐路5号',
                phone: '+86 571-8829-8888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 30.2489,
                longitude: 120.1363,
                image: '/images/hotels/four-seasons-hangzhou.jpg'
            },
            {
                name: '杭州法云安缦',
                description: '隐于灵隐寺旁的禅意酒店，由古村落改建而成',
                rating: 4.8,
                review_count: 3456,
                location: '杭州，中国',
                address: '浙江省杭州市西湖区法云弄22号',
                phone: '+86 571-8732-9999',
                check_in_time: '14:00:00',
                check_out_time: '12:00:00',
                latitude: 30.2456,
                longitude: 120.1123,
                image: '/images/hotels/amanfayun.jpg'
            },

            // 广州酒店
            {
                name: '广州文华东方酒店',
                description: '位于天河CBD的现代奢华酒店，设施完善',
                rating: 4.7,
                review_count: 5678,
                location: '广州，中国',
                address: '广东省广州市天河区天河路389号',
                phone: '+86 20-3808-8888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 23.1353,
                longitude: 113.3267,
                image: '/images/hotels/mandarin-oriental-guangzhou.jpg'
            },
            {
                name: '广州白天鹅宾馆',
                description: '珠江畔的经典五星级酒店，岭南文化特色浓郁',
                rating: 4.6,
                review_count: 7654,
                location: '广州，中国',
                address: '广东省广州市荔湾区沙面南街1号',
                phone: '+86 20-8188-6968',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 23.1089,
                longitude: 113.2345,
                image: '/images/hotels/white-swan-hotel.jpg'
            },

            // 深圳酒店
            {
                name: '深圳瑞吉酒店',
                description: '位于深圳湾的顶级奢华酒店，海景房视野开阔',
                rating: 4.8,
                review_count: 4321,
                location: '深圳，中国',
                address: '广东省深圳市南山区科苑南路2666号',
                phone: '+86 755-3333-6888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 22.5289,
                longitude: 113.9456,
                image: '/images/hotels/st-regis-shenzhen.jpg'
            },
            {
                name: '深圳柏悦酒店',
                description: '位于京基100大厦的高空酒店，俯瞰城市全景',
                rating: 4.7,
                review_count: 5432,
                location: '深圳，中国',
                address: '广东省深圳市罗湖区深南东路5016号',
                phone: '+86 755-8266-1234',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 22.5456,
                longitude: 114.1234,
                image: '/images/hotels/park-hyatt-shenzhen.jpg'
            },

            // 成都酒店
            {
                name: '成都博舍酒店',
                description: '位于太古里的精品设计酒店，融合川西文化与现代设计',
                rating: 4.8,
                review_count: 6789,
                location: '成都，中国',
                address: '四川省成都市锦江区中纱帽街8号',
                phone: '+86 28-6789-9999',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 30.6556,
                longitude: 104.0889,
                image: '/images/hotels/the-temple-house.jpg'
            },
            {
                name: '成都钓鱼台精品酒店',
                description: '位于锦江河畔的园林式酒店，环境清幽',
                rating: 4.7,
                review_count: 4567,
                location: '成都，中国',
                address: '四川省成都市锦江区滨江东路156号',
                phone: '+86 28-6789-1234',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 30.6445,
                longitude: 104.0967,
                image: '/images/hotels/diaoyutai-chengdu.jpg'
            },

            // 西安酒店
            {
                name: '西安索菲特传奇酒店',
                description: '由百年历史建筑改建，融合法式优雅与中式古韵',
                rating: 4.8,
                review_count: 3456,
                location: '西安，中国',
                address: '陕西省西安市新城区东新街319号',
                phone: '+86 29-8792-8888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 34.2656,
                longitude: 108.9656,
                image: '/images/hotels/sofitel-legend-xian.jpg'
            },
            {
                name: '西安威斯汀大酒店',
                description: '位于高新区的现代商务酒店，设施齐全',
                rating: 4.6,
                review_count: 5678,
                location: '西安，中国',
                address: '陕西省西安市高新区科技路66号',
                phone: '+86 29-8826-8888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 34.2345,
                longitude: 108.8789,
                image: '/images/hotels/westin-xian.jpg'
            },

            // 苏州酒店
            {
                name: '苏州香格里拉大酒店',
                description: '位于金鸡湖畔的园林式酒店，江南韵味浓郁',
                rating: 4.7,
                review_count: 6543,
                location: '苏州，中国',
                address: '江苏省苏州市工业园区塔园路168号',
                phone: '+86 512-6808-0168',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 31.3089,
                longitude: 120.6889,
                image: '/images/hotels/shangri-la-suzhou.jpg'
            },
            {
                name: '苏州书香府邸酒店',
                description: '古城区内的精品酒店，苏式园林建筑风格',
                rating: 4.8,
                review_count: 4321,
                location: '苏州，中国',
                address: '江苏省苏州市姑苏区书院巷27号',
                phone: '+86 512-6531-8888',
                check_in_time: '14:00:00',
                check_out_time: '12:00:00',
                latitude: 31.3156,
                longitude: 120.6234,
                image: '/images/hotels/scholars-hotel-suzhou.jpg'
            },

            // 厦门酒店
            {
                name: '厦门鼓浪屿别墅酒店',
                description: '鼓浪屿上的历史别墅改建酒店，海景优美',
                rating: 4.8,
                review_count: 5432,
                location: '厦门，中国',
                address: '福建省厦门市思明区鼓浪屿鹿礁路8号',
                phone: '+86 592-206-5888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 24.4456,
                longitude: 118.0656,
                image: '/images/hotels/gulangyu-villa.jpg'
            },
            {
                name: '厦门海悦山庄酒店',
                description: '环岛路海边的度假酒店，私家沙滩和无敌海景',
                rating: 4.7,
                review_count: 6789,
                location: '厦门，中国',
                address: '福建省厦门市思明区环岛南路1888号',
                phone: '+86 592-208-8888',
                check_in_time: '15:00:00',
                check_out_time: '12:00:00',
                latitude: 24.4389,
                longitude: 118.1234,
                image: '/images/hotels/haiyue-xiamen.jpg'
            }
        ];

        // 批量插入
        const sql = `
            INSERT INTO hotels
            (name, description, rating, review_count, location, address, phone, check_in_time, check_out_time, latitude, longitude, image)
            VALUES ?
        `;

        const values = hotels.map(hotel => [
            hotel.name,
            hotel.description,
            hotel.rating,
            hotel.review_count,
            hotel.location,
            hotel.address,
            hotel.phone,
            hotel.check_in_time,
            hotel.check_out_time,
            hotel.latitude,
            hotel.longitude,
            hotel.image
        ]);

        await connection.query(sql, [values]);

        console.log(`✅ 成功插入 ${hotels.length} 条酒店数据`);
        connection.release();

        // 显示插入的数据
        const [result] = await pool.query('SELECT id, name, location, rating FROM hotels LIMIT 10');
        console.log('\n🏨 已插入的酒店（前10条）：');
        result.forEach(hotel => {
            console.log(`  ${hotel.id}. ${hotel.name} - ${hotel.location} (${hotel.rating}⭐)`);
        });

    } catch (error) {
        console.error('❌ 插入酒店数据失败:', error.message);
    } finally {
        process.exit();
    }
}

seedHotels();
