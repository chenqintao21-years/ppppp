// 酒店详情页面配置 - 动态内容配置

// API基础URL配置
export const API_BASE_URL = 'http://localhost:3000';

// 页面标签配置（可以从后端动态获取）
export const PAGE_LABELS = {
    about: '关于',
    amenities: '便利设施',
    rooms: '选择房间',
    location: '位置',
    reviews: '点评',
    booking: {
        title: '预订信息',
        checkIn: '入住日期',
        checkOut: '退房日期',
        guests: '客人',
        viewDeals: '预订',
        noCharge: '预订时不收费',
        priceLabel: '起价',
        priceUnit: '每晚'
    },
    actions: {
        save: '保存',
        saved: '已保存',
        share: '分享',
        viewAllPhotos: '查看所有照片',
        loadMoreReviews: '查看更多点评',
        select: '选择'
    }
};

// 评分类别配置
export const RATING_CATEGORIES = [
    { key: 'service', label: '服务' },
    { key: 'cleanliness', label: '清洁度' },
    { key: 'location', label: '位置' }
];

// 设施图标映射（SVG路径）
export const AMENITY_ICONS = {
    wifi: {
        viewBox: '0 0 24 24',
        paths: [
            'M5 12.55a11 11 0 0 1 14.08 0',
            'M1.42 9a16 16 0 0 1 21.16 0',
            'M8.53 16.11a6 6 0 0 1 6.95 0',
            'M12 20h.01'
        ]
    },
    gym: {
        viewBox: '0 0 24 24',
        paths: [
            'M6.5 6.5h11',
            'M6.5 17.5h11',
            'M3 12h3',
            'M18 12h3',
            'M6.5 6.5v11',
            'M17.5 6.5v11'
        ]
    },
    pool: {
        viewBox: '0 0 24 24',
        paths: [
            'M2 15c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
            'M2 19c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
            'M20 5L10 15l-5-5'
        ]
    },
    restaurant: {
        viewBox: '0 0 24 24',
        paths: [
            'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2',
            'M7 2v20',
            'M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'
        ]
    },
    spa: {
        viewBox: '0 0 24 24',
        paths: [
            'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5',
            'M8.5 8.5v.01',
            'M16 15.5v.01',
            'M12 12v.01'
        ]
    },
    parking: {
        viewBox: '0 0 24 24',
        paths: [
            'M3 3h18v18H3z',
            'M9 17V7h4a4 4 0 0 1 0 8h-4'
        ]
    },
    ac: {
        viewBox: '0 0 24 24',
        paths: [
            'M8 16l-4 4',
            'M8 8l-4-4',
            'M16 16l4 4',
            'M16 8l4-4',
            'M12 4v4',
            'M12 16v4'
        ]
    },
    bar: {
        viewBox: '0 0 24 24',
        paths: [
            'M5 8h14M5 8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1M5 8l7 8m7-8l-7 8m0 0v4m0 0H9m3 0h3'
        ]
    },
    business: {
        viewBox: '0 0 24 24',
        paths: [
            'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
            'M9 22V12h6v10'
        ]
    },
    meeting: {
        viewBox: '0 0 24 24',
        paths: [
            'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
            'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
            'M23 21v-2a4 4 0 0 0-3-3.87',
            'M16 3.13a4 4 0 0 1 0 7.75'
        ]
    },
    beach: {
        viewBox: '0 0 24 24',
        paths: [
            'M2 18h20',
            'M3.6 15.4c.9-.6 1.8-.9 2.8-.9 2.3 0 4.1 1.8 4.1 4.1 0 .4 0 .8-.1 1.2',
            'M12 15.4c.9-.6 1.8-.9 2.8-.9 2.3 0 4.1 1.8 4.1 4.1 0 .4 0 .8-.1 1.2'
        ]
    },
    kids: {
        viewBox: '0 0 24 24',
        paths: [
            'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z',
            'M12 12v10',
            'M8 22h8'
        ]
    },
    default: {
        viewBox: '0 0 24 24',
        paths: [
            'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
        ]
    }
};

// 获取设施图标
export function getAmenityIcon(iconType) {
    return AMENITY_ICONS[iconType] || AMENITY_ICONS.default;
}

// 生成SVG图标HTML
export function generateIconSVG(iconType, width = 24, height = 24) {
    const icon = getAmenityIcon(iconType);
    const pathsHTML = icon.paths.map(path => {
        // 判断是否是闭合路径（用于填充）
        const isClosed = path.includes('z') || path.includes('Z');
        return `<path d="${path}" ${isClosed ? 'fill="currentColor"' : ''}></path>`;
    }).join('');

    return `
        <svg width="${width}" height="${height}" viewBox="${icon.viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${pathsHTML}
        </svg>
    `;
}

// 客人数量选项配置
export const GUEST_OPTIONS = [
    { value: 1, label: '1位客人' },
    { value: 2, label: '2位客人' },
    { value: 3, label: '3位客人' },
    { value: 4, label: '4位客人' },
    { value: 5, label: '5位客人' },
    { value: 6, label: '6位客人' }
];

// 面包屑配置
export const BREADCRUMB_ITEMS = [
    { label: '首页', url: 'index.html' },
    { label: '酒店', url: 'hotel-page.html' }
];
