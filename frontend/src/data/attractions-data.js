// 景点页面数据
const attractionsData = {
    // 热门讲座
    trendingLectures: [
        {
            id: 1,
            title: '巴黎卢浮宫博物馆免排队门票',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#e76f51'
            },
            rating: 5,
            reviews: 603
        },
        {
            id: 2,
            title: '罗马斗兽场、古罗马广场和帕拉蒂尼山',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#2a9d8f'
            },
            rating: 4.5,
            reviews: 1820
        },
        {
            id: 3,
            title: '伦敦塔桥体验及皇冠珠宝',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#f4a261'
            },
            rating: 4,
            reviews: 1201
        },
        {
            id: 4,
            title: '威尼斯贡多拉游船体验',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#264653'
            },
            rating: 4.5,
            reviews: 2456
        },
        {
            id: 5,
            title: '巴塞罗那圣家堂快速通道门票',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#e9c46a'
            },
            rating: 5,
            reviews: 3892
        },
        {
            id: 6,
            title: '阿姆斯特丹梵高博物馆门票',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#f4a261'
            },
            rating: 4.5,
            reviews: 1567
        }
    ],

    // 推荐景点
    recommendations: [
        {
            id: 1,
            badge: 1,
            title: '曼谷河畔夜市和晚餐游船之旅',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                color: '#457b9d'
            },
            rating: 5,
            reviews: 8234,
            description: '游船 • 晚餐游船',
            price: 35
        },
        {
            id: 2,
            badge: 2,
            title: '大城府历史公园，泰寺和卧佛寺私人文化遗产之旅',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                color: '#e63946'
            },
            rating: 4.5,
            reviews: null,
            description: '文化之旅 • 历史遗迹',
            price: 41
        },
        {
            id: 3,
            badge: 3,
            title: '从曼谷到大城府和阿瑜陀耶的小团之旅',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                color: '#06d6a0'
            },
            rating: 4,
            reviews: null,
            description: '一日游 • 文化之旅',
            price: 35
        },
        {
            id: 4,
            badge: 4,
            title: 'Ayutthaya日落之旅：联合国教科文组织世界遗产和泰国遗迹',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                color: '#118ab2'
            },
            rating: 5,
            reviews: null,
            description: '历史遗迹 • 文化之旅',
            price: 48
        },
        {
            id: 5,
            badge: 5,
            title: '普吉岛攀牙湾皮划艇探险一日游',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                color: '#2a9d8f'
            },
            rating: 4.5,
            reviews: 5621,
            description: '水上运动 • 自然探险',
            price: 52
        },
        {
            id: 6,
            badge: 6,
            title: '清迈大象保护区半日游',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                color: '#e76f51'
            },
            rating: 5,
            reviews: 4892,
            description: '动物体验 • 生态旅游',
            price: 45
        },
        {
            id: 7,
            badge: 7,
            title: '芭提雅珊瑚岛浮潜和水上活动',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                color: '#f4a261'
            },
            rating: 4,
            reviews: 3456,
            description: '浮潜 • 海滩活动',
            price: 38
        },
        {
            id: 8,
            badge: 8,
            title: '曼谷夜间美食街头小吃之旅',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
                color: '#264653'
            },
            rating: 4.5,
            reviews: 2789,
            description: '美食之旅 • 夜间活动',
            price: 28
        }
    ],

    // 热门地点
    popularDestinations: [
        {
            id: 1,
            name: '罗马',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#e76f51'
            },
            tags: ['罗马斗兽场门票', '梵蒂冈博物馆门票', '古罗马广场游览']
        },
        {
            id: 2,
            name: '瓦胡岛',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#2a9d8f'
            },
            tags: ['海洋观光游船', '威基基海滩度假区', '珍珠港游览']
        },
        {
            id: 3,
            name: '纽约市',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#264653'
            },
            tags: ['百老汇演出门票', '自由女神像游船', '帝国大厦观景台']
        },
        {
            id: 4,
            name: '巴塞罗那',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#f4a261'
            },
            tags: ['圣家堂门票', '高迪建筑之旅']
        },
        {
            id: 5,
            name: '东京',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#457b9d'
            },
            tags: ['和服体验', '东京塔门票', '富士山一日游']
        },
        {
            id: 6,
            name: '巴黎',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#e63946'
            },
            tags: ['埃菲尔铁塔门票', '塞纳河游船', '凡尔赛宫一日游']
        },
        {
            id: 7,
            name: '伦敦',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#06d6a0'
            },
            tags: ['伦敦眼门票', '大英博物馆', '哈利波特影城']
        },
        {
            id: 8,
            name: '迪拜',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))',
                color: '#118ab2'
            },
            tags: ['哈利法塔观景台', '沙漠冲沙', '迪拜购物中心']
        }
    ],

    // 分类
    categories: [
        {
            id: 1,
            name: '户外活动',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
                color: '#e63946'
            }
        },
        {
            id: 2,
            name: '景点',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
                color: '#06d6a0'
            }
        },
        {
            id: 3,
            name: '文化',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
                color: '#118ab2'
            }
        },
        {
            id: 4,
            name: '水上活动',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
                color: '#f4a261'
            }
        },
        {
            id: 5,
            name: '美食体验',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
                color: '#e76f51'
            }
        },
        {
            id: 6,
            name: '冒险运动',
            image: {
                gradient: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
                color: '#2a9d8f'
            }
        }
    ],

    // 旅行者之选奖
    travelersChoice: [
        {
            id: 1,
            title: '至尊奖',
            description: '最佳旅行者点评的景点体验，由旅行者们评选'
        },
        {
            id: 2,
            title: '年度最佳旅行体验中心一个人气景点',
            description: '最受欢迎的景点体验'
        },
        {
            id: 3,
            title: '从曼谷出发的热门一日游',
            description: '探索周边精彩景点'
        },
        {
            id: 4,
            title: '特色美食体验与烹饪课程',
            description: '品尝当地美食文化'
        },
        {
            id: 5,
            title: '最佳户外探险活动',
            description: '刺激的户外冒险体验'
        },
        {
            id: 6,
            title: '家庭亲子友好景点',
            description: '适合全家出游的精选景点'
        }
    ],

    // 优势特点
    benefits: [
        {
            id: 1,
            icon: 'shield',
            title: '免费取消',
            description: '大部分体验都可以在出发前24小时内取消，并获得全额退款。'
        },
        {
            id: 2,
            icon: 'users',
            title: '旅行者参考',
            description: '基于来自全球旅行者的评分，我们精选出最佳体验。'
        },
        {
            id: 3,
            icon: 'calendar',
            title: '低价保证',
            description: '在其他地方找到更低的价格？我们将退还差价。'
        }
    ]
};

// SVG 图标库
const svgIcons = {
    heart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>`,

    shield: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>`,

    users: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>`,

    calendar: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>`,

    badge: `<svg width="32" height="32" viewBox="0 0 24 24" fill="#00aa6c">
        <circle cx="12" cy="12" r="10"/>
    </svg>`
};
