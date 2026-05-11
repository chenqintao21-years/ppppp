// 价格格式化
export function formatPrice(price) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

// 评分星级生成
export function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '●';
    }

    if (hasHalfStar) {
        stars += '◐';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '○';
    }

    return stars;
}
