const { pool } = require('./config/database');

async function seedRestaurants() {
    try {
        const connection = await pool.getConnection();

        // 检查是否已有数据
        const [existing] = await connection.query('SELECT COUNT(*) as count FROM restaurants');
        console.log(`当前餐厅数量: ${existing[0].count}`);

        if (existing[0].count > 0) {
            console.log('⚠️  餐厅表已有数据');
            const [result] = await pool.query('SELECT id, name, rating, price_range FROM restaurants LIMIT 10');
            console.log('\n🍽️  现有餐厅（前10条）：');
            result.forEach(rest => {
                console.log(`  ${rest.id}. ${rest.name} - ${rest.price_range} (${rest.rating}⭐)`);
            });
            connection.release();
            process.exit();
            return;
        }

        // 插入测试餐厅数据
        const restaurants = [
            // 北京餐厅
            {
                name: '全聚德烤鸭店',
                description: '北京最著名的烤鸭餐厅，拥有150多年历史',
                rating: 4.5,
                review_count: 15678,
                price_range: '$$$',
                address: '北京市东城区前门大街30号',
                phone: '+86 10-6511-2418',
                hours: '11:00-14:00, 17:00-21:00',
                latitude: 39.8989,
                longitude: 116.3975,
                image: '/images/restaurants/quanjude.jpg'
            },
            {
                name: '大董烤鸭',
                description: '创新派北京烤鸭，将传统与现代完美结合',
                rating: 4.7,
                review_count: 9876,
                price_range: '$$$',
                address: '北京市朝阳区东三环中路39号建外SOHO',
                phone: '+86 10-5869-0329',
                hours: '11:00-14:30, 17:00-22:00',
                latitude: 39.9127,
                longitude: 116.4579,
                image: '/images/restaurants/dadong.jpg'
            },
            {
                name: '海底捞火锅',
                description: '中国最受欢迎的火锅连锁品牌，以优质服务著称',
                rating: 4.6,
                review_count: 23456,
                price_range: '$$',
                address: '北京市朝阳区建国路93号万达广场',
                phone: '+86 10-5820-1234',
                hours: '10:00-次日02:00',
                latitude: 39.9075,
                longitude: 116.4634,
                image: '/images/restaurants/haidilao.jpg'
            },
            {
                name: '鼎泰丰',
                description: '世界知名的小笼包餐厅，米其林一星',
                rating: 4.8,
                review_count: 18765,
                price_range: '$$',
                address: '北京市朝阳区建国门外大街1号国贸商城',
                phone: '+86 10-6505-5866',
                hours: '11:00-22:00',
                latitude: 39.9088,
                longitude: 116.4575,
                image: '/images/restaurants/dintaifung.jpg'
            },
            {
                name: '便宜坊烤鸭店',
                description: '始创于明朝的老字号烤鸭店，焖炉烤鸭独具特色',
                rating: 4.4,
                review_count: 8765,
                price_range: '$$',
                address: '北京市东城区崇文门外大街16号',
                phone: '+86 10-6705-5578',
                hours: '11:00-14:00, 17:00-21:00',
                latitude: 39.8956,
                longitude: 116.4234,
                image: '/images/restaurants/bianyifang.jpg'
            },

            // 上海餐厅
            {
                name: '老正兴菜馆',
                description: '上海老字号本帮菜餐厅，传承百年经典味道',
                rating: 4.6,
                review_count: 12345,
                price_range: '$$$',
                address: '上海市黄浦区福州路556号',
                phone: '+86 21-6322-5353',
                hours: '11:00-14:00, 17:00-21:00',
                latitude: 31.2345,
                longitude: 121.4789,
                image: '/images/restaurants/laozhengxing.jpg'
            },
            {
                name: '南翔馒头店',
                description: '豫园内的百年老店，小笼包闻名遐迩',
                rating: 4.5,
                review_count: 23456,
                price_range: '$',
                address: '上海市黄浦区豫园老街85号',
                phone: '+86 21-6355-4206',
                hours: '08:00-21:00',
                latitude: 31.2267,
                longitude: 121.4923,
                image: '/images/restaurants/nanxiang.jpg'
            },
            {
                name: '外婆家',
                description: '杭帮菜连锁餐厅，性价比高，深受欢迎',
                rating: 4.4,
                review_count: 34567,
                price_range: '$$',
                address: '上海市徐汇区虹桥路1号港汇广场',
                phone: '+86 21-6407-0077',
                hours: '11:00-22:00',
                latitude: 31.1956,
                longitude: 121.4356,
                image: '/images/restaurants/waipojia.jpg'
            },
            {
                name: '新荣记',
                description: '米其林三星台州菜餐厅，食材新鲜，烹饪精致',
                rating: 4.9,
                review_count: 5678,
                price_range: '$$$$',
                address: '上海市黄浦区中山东一路18号外滩18号',
                phone: '+86 21-6321-9922',
                hours: '11:30-14:00, 17:30-22:00',
                latitude: 31.2389,
                longitude: 121.4889,
                image: '/images/restaurants/xinrongji.jpg'
            },

            // 广州餐厅
            {
                name: '陶陶居',
                description: '广州百年老字号茶楼，传统粤式早茶',
                rating: 4.6,
                review_count: 15678,
                price_range: '$$',
                address: '广东省广州市荔湾区第十甫路20号',
                phone: '+86 20-8139-6111',
                hours: '07:00-15:00, 17:00-21:30',
                latitude: 23.1189,
                longitude: 113.2456,
                image: '/images/restaurants/taotaoju.jpg'
            },
            {
                name: '点都德',
                description: '广州人气早茶连锁，出品稳定，环境舒适',
                rating: 4.5,
                review_count: 28765,
                price_range: '$$',
                address: '广东省广州市天河区体育西路101号',
                phone: '+86 20-3877-3288',
                hours: '07:00-15:00, 17:00-22:00',
                latitude: 23.1345,
                longitude: 113.3234,
                image: '/images/restaurants/diandude.jpg'
            },
            {
                name: '炳胜',
                description: '高端粤菜餐厅，食材讲究，烹饪精湛',
                rating: 4.7,
                review_count: 9876,
                price_range: '$$$',
                address: '广东省广州市天河区体育东路116号',
                phone: '+86 20-3877-2288',
                hours: '11:00-14:30, 17:30-22:00',
                latitude: 23.1389,
                longitude: 113.3289,
                image: '/images/restaurants/bingsheng.jpg'
            },

            // 成都餐厅
            {
                name: '蜀九香火锅',
                description: '成都本地知名火锅品牌，麻辣鲜香',
                rating: 4.6,
                review_count: 18765,
                price_range: '$$',
                address: '四川省成都市锦江区红星路三段1号',
                phone: '+86 28-8666-8899',
                hours: '11:00-次日02:00',
                latitude: 30.6556,
                longitude: 104.0889,
                image: '/images/restaurants/shujiuxiang.jpg'
            },
            {
                name: '小龙坎火锅',
                description: '成都网红火锅店，排队名店',
                rating: 4.5,
                review_count: 32456,
                price_range: '$$',
                address: '四川省成都市武侯区玉林西路55号',
                phone: '+86 28-8555-6677',
                hours: '11:00-次日01:00',
                latitude: 30.6389,
                longitude: 104.0567,
                image: '/images/restaurants/xiaolongkan.jpg'
            },
            {
                name: '马旺子',
                description: '传统川菜馆，地道成都味道',
                rating: 4.7,
                review_count: 12345,
                price_range: '$$',
                address: '四川省成都市青羊区文殊院街39号',
                phone: '+86 28-8662-5678',
                hours: '11:00-14:00, 17:00-21:00',
                latitude: 30.6789,
                longitude: 104.0678,
                image: '/images/restaurants/mawangzi.jpg'
            },

            // 杭州餐厅
            {
                name: '楼外楼',
                description: '西湖边的百年老店，杭帮菜代表',
                rating: 4.6,
                review_count: 16789,
                price_range: '$$$',
                address: '浙江省杭州市西湖区孤山路30号',
                phone: '+86 571-8796-9682',
                hours: '11:00-14:00, 17:00-20:30',
                latitude: 30.2556,
                longitude: 120.1456,
                image: '/images/restaurants/louwailou.jpg'
            },
            {
                name: '知味观',
                description: '杭州老字号餐厅，小笼包和杭州菜都很出色',
                rating: 4.5,
                review_count: 23456,
                price_range: '$$',
                address: '浙江省杭州市上城区仁和路83号',
                phone: '+86 571-8702-8626',
                hours: '07:00-21:00',
                latitude: 30.2489,
                longitude: 120.1689,
                image: '/images/restaurants/zhiweiguan.jpg'
            },

            // 西安餐厅
            {
                name: '老孙家饭庄',
                description: '西安老字号，羊肉泡馍最为有名',
                rating: 4.5,
                review_count: 18765,
                price_range: '$$',
                address: '陕西省西安市碑林区东大街364号',
                phone: '+86 29-8721-4596',
                hours: '08:00-21:00',
                latitude: 34.2656,
                longitude: 108.9556,
                image: '/images/restaurants/laosunjia.jpg'
            },
            {
                name: '德发长饺子馆',
                description: '西安著名饺子宴餐厅，品种丰富',
                rating: 4.6,
                review_count: 12345,
                price_range: '$$',
                address: '陕西省西安市碑林区钟楼北大街3号',
                phone: '+86 29-8721-4060',
                hours: '11:00-14:00, 17:00-21:00',
                latitude: 34.2689,
                longitude: 108.9489,
                image: '/images/restaurants/defachang.jpg'
            },

            // 重庆餐厅
            {
                name: '秦妈火锅',
                description: '重庆老牌火锅，麻辣地道',
                rating: 4.6,
                review_count: 21234,
                price_range: '$$',
                address: '重庆市渝中区解放碑步行街88号',
                phone: '+86 23-6370-1234',
                hours: '11:00-次日02:00',
                latitude: 29.5589,
                longitude: 106.5789,
                image: '/images/restaurants/qinma.jpg'
            },
            {
                name: '珮姐老火锅',
                description: '重庆网红火锅店，江湖菜风格',
                rating: 4.7,
                review_count: 28765,
                price_range: '$$',
                address: '重庆市渝中区中山一路168号',
                phone: '+86 23-6380-8899',
                hours: '11:00-次日01:00',
                latitude: 29.5556,
                longitude: 106.5656,
                image: '/images/restaurants/peijie.jpg'
            },

            // 深圳餐厅
            {
                name: '探鱼',
                description: '烤鱼连锁品牌，口味多样，环境时尚',
                rating: 4.5,
                review_count: 19876,
                price_range: '$$',
                address: '广东省深圳市福田区深南大道6017号',
                phone: '+86 755-8888-6677',
                hours: '11:00-23:00',
                latitude: 22.5389,
                longitude: 114.0556,
                image: '/images/restaurants/tanyu.jpg'
            },
            {
                name: '海底捞火锅',
                description: '优质服务的火锅连锁，深受欢迎',
                rating: 4.6,
                review_count: 32456,
                price_range: '$$',
                address: '广东省深圳市南山区海岸城购物中心',
                phone: '+86 755-2688-9988',
                hours: '10:00-次日02:00',
                latitude: 22.5289,
                longitude: 113.9356,
                image: '/images/restaurants/haidilao-sz.jpg'
            },

            // 苏州餐厅
            {
                name: '松鹤楼',
                description: '苏州老字号，苏帮菜代表餐厅',
                rating: 4.6,
                review_count: 14567,
                price_range: '$$$',
                address: '江苏省苏州市姑苏区观前街141号',
                phone: '+86 512-6727-7006',
                hours: '11:00-14:00, 17:00-21:00',
                latitude: 31.3156,
                longitude: 120.6234,
                image: '/images/restaurants/songhelou.jpg'
            },
            {
                name: '得月楼',
                description: '苏州传统名店，环境雅致，菜品精致',
                rating: 4.7,
                review_count: 11234,
                price_range: '$$$',
                address: '江苏省苏州市姑苏区太监弄27号',
                phone: '+86 512-6523-8940',
                hours: '11:00-14:00, 17:00-21:00',
                latitude: 31.3189,
                longitude: 120.6289,
                image: '/images/restaurants/deyuelou.jpg'
            },

            // 南京餐厅
            {
                name: '南京大牌档',
                description: '南京特色餐厅，环境复古，菜品地道',
                rating: 4.6,
                review_count: 25678,
                price_range: '$$',
                address: '江苏省南京市秦淮区平江府路1号',
                phone: '+86 25-8480-1777',
                hours: '11:00-22:00',
                latitude: 32.0389,
                longitude: 118.7889,
                image: '/images/restaurants/njdpd.jpg'
            },
            {
                name: '绿柳居',
                description: '南京老字号素菜馆，素鸭素鹅最为有名',
                rating: 4.5,
                review_count: 9876,
                price_range: '$$',
                address: '江苏省南京市秦淮区太平南路248号',
                phone: '+86 25-8662-6668',
                hours: '11:00-14:00, 17:00-20:30',
                latitude: 32.0356,
                longitude: 118.7756,
                image: '/images/restaurants/lvliuju.jpg'
            }
        ];

        // 批量插入
        const sql = `
            INSERT INTO restaurants
            (name, description, rating, review_count, price_range, address, phone, hours, latitude, longitude, image)
            VALUES ?
        `;

        const values = restaurants.map(rest => [
            rest.name,
            rest.description,
            rest.rating,
            rest.review_count,
            rest.price_range,
            rest.address,
            rest.phone,
            rest.hours,
            rest.latitude,
            rest.longitude,
            rest.image
        ]);

        await connection.query(sql, [values]);

        console.log(`✅ 成功插入 ${restaurants.length} 条餐厅数据`);
        connection.release();

        // 显示插入的数据
        const [result] = await pool.query('SELECT id, name, rating, price_range FROM restaurants LIMIT 10');
        console.log('\n🍽️  已插入的餐厅（前10条）：');
        result.forEach(rest => {
            console.log(`  ${rest.id}. ${rest.name} - ${rest.price_range} (${rest.rating}⭐)`);
        });

    } catch (error) {
        console.error('❌ 插入餐厅数据失败:', error.message);
    } finally {
        process.exit();
    }
}

seedRestaurants();
