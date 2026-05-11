// 轮播图功能
document.addEventListener('DOMContentLoaded', function() {
    // 英雄区域轮播点
    const heroDots = document.querySelectorAll('.hero-dots .dot');
    heroDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            heroDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });

    // 自动轮播英雄图片
    let currentSlide = 0;
    setInterval(() => {
        currentSlide = (currentSlide + 1) % heroDots.length;
        heroDots.forEach(d => d.classList.remove('active'));
        heroDots[currentSlide].classList.add('active');
    }, 5000);

    // 酒店卡片轮播
    setupCarousel('.travelers-choice .hotel-carousel');
    setupCarousel('.all-inclusive .hotel-carousel');

    // 收藏按钮功能
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (btn.textContent === '♡') {
                btn.textContent = '♥';
                btn.style.color = '#ff5533';
            } else {
                btn.textContent = '♡';
                btn.style.color = '#000';
            }
        });
    });

    // 搜索功能
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
        });

        input.addEventListener('blur', function() {
            this.style.boxShadow = 'none';
        });
    });

    // 酒店卡片悬停效果和点击跳转
    const hotelCards = document.querySelectorAll('.hotel-card, .hotel-card-small');
    hotelCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });

        card.addEventListener('click', function(e) {
            // 如果点击的是收藏按钮，不跳转
            if (e.target.closest('.favorite-btn')) {
                return;
            }

            // 获取酒店ID（这里使用索引+1作为示例，实际应该从数据属性获取）
            const hotelId = this.dataset.hotelId || (index + 1);
            console.log('跳转到酒店详情页:', hotelId);
            window.location.href = `hotel-detail.html?id=${hotelId}`;
        });
    });

    // 目的地卡片点击
    const destinationCards = document.querySelectorAll('.destination-card');
    destinationCards.forEach(card => {
        card.addEventListener('click', function() {
            console.log('目的地卡片被点击');
            // 这里可以添加跳转逻辑
        });
    });

    // 导航链接激活状态
    const subNavLinks = document.querySelectorAll('.sub-nav-link');
    subNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 只有当链接指向当前页面或锚点时才阻止默认行为
            const href = this.getAttribute('href');
            if (href.startsWith('#') || href === window.location.pathname.split('/').pop()) {
                e.preventDefault();
                subNavLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
            // 否则允许正常跳转到其他页面
        });
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 添加滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 观察所有section
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});

// 轮播设置函数
function setupCarousel(selector) {
    const carousel = document.querySelector(selector);
    if (!carousel) return;

    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    const grid = carousel.querySelector('.hotel-grid, .hotel-grid-small');

    if (!grid) return;

    let scrollAmount = 0;
    const cardWidth = 300; // 卡片宽度 + 间距

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            scrollAmount += cardWidth;
            grid.style.transform = `translateX(-${scrollAmount}px)`;
            grid.style.transition = 'transform 0.3s ease';
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            scrollAmount = Math.max(0, scrollAmount - cardWidth);
            grid.style.transform = `translateX(-${scrollAmount}px)`;
            grid.style.transition = 'transform 0.3s ease';
        });
    }
}

// 价格格式化
function formatPrice(price) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

// 评分星级生成
function generateStars(rating) {
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

// 加载更多酒店
function loadMoreHotels() {
    console.log('加载更多酒店...');
    // 这里可以添加AJAX请求来加载更多酒店数据
}

// 筛选功能
function filterHotels(criteria) {
    console.log('筛选酒店:', criteria);
    // 这里可以添加筛选逻辑
}

// 排序功能
function sortHotels(sortBy) {
    console.log('排序方式:', sortBy);
    // 这里可以添加排序逻辑
}

// 响应式菜单切换
function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    if (nav) {
        nav.classList.toggle('mobile-active');
    }
}

// 搜索建议
function showSearchSuggestions(query) {
    console.log('搜索建议:', query);
    // 这里可以添加搜索建议逻辑
}

// 地图视图切换
function toggleMapView() {
    console.log('切换地图视图');
    // 这里可以添加地图视图逻辑
}

// 价格范围筛选
function filterByPriceRange(min, max) {
    console.log(`价格范围: ${min} - ${max}`);
    // 这里可以添加价格筛选逻辑
}

// 评分筛选
function filterByRating(minRating) {
    console.log('最低评分:', minRating);
    // 这里可以添加评分筛选逻辑
}

// 设施筛选
function filterByAmenities(amenities) {
    console.log('设施筛选:', amenities);
    // 这里可以添加设施筛选逻辑
}

// 保存到收藏夹
function saveToFavorites(hotelId) {
    console.log('保存到收藏夹:', hotelId);
    // 这里可以添加保存逻辑
    // 可以使用localStorage或发送到服务器
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favorites.includes(hotelId)) {
        favorites.push(hotelId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

// 从收藏夹移除
function removeFromFavorites(hotelId) {
    console.log('从收藏夹移除:', hotelId);
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(hotelId);
    if (index > -1) {
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

// 分享功能
function shareHotel(hotelId, platform) {
    console.log(`分享酒店 ${hotelId} 到 ${platform}`);
    // 这里可以添加社交媒体分享逻辑
}

// 比较酒店
function compareHotels(hotelIds) {
    console.log('比较酒店:', hotelIds);
    // 这里可以添加酒店比较逻辑
}

// 查看可用性
function checkAvailability(hotelId, checkIn, checkOut, guests) {
    console.log('查看可用性:', { hotelId, checkIn, checkOut, guests });
    // 这里可以添加可用性检查逻辑
}