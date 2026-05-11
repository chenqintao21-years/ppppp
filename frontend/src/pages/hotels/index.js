// 酒店列表页面脚本

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 加载特色功能
async function loadFeatures() {
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/features`);
        const result = await response.json();

        if (result.success && result.data) {
            renderFeatures(result.data);
        }
    } catch (error) {
        console.error('加载特色功能失败:', error);
        // 保持现有的静态HTML作为后备
    }
}

// 渲染特色功能
function renderFeatures(features) {
    const featureGrid = document.querySelector('.features .feature-grid');
    if (!featureGrid) return;

    featureGrid.innerHTML = features.map(feature => `
        <div class="feature-card">
            <div class="feature-icon">${feature.icon}</div>
            <h3>${feature.title}</h3>
            <p>${feature.description}</p>
        </div>
    `).join('');
}

// 加载热门酒店
async function loadPopularHotels(city = null) {
    try {
        // 如果没有指定城市，尝试从localStorage获取
        if (!city) {
            city = localStorage.getItem('currentCity') || '北京';
        }

        // 从数据库获取酒店数据
        const response = await fetch(`${API_BASE_URL}/hotels/search?city=${encodeURIComponent(city)}&limit=20`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            // 转换为热门酒店格式
            const hotels = result.data.slice(0, 4).map((hotel, index) => ({
                id: hotel.id,
                name: hotel.name,
                rating: hotel.rating || 4.5,
                reviews: hotel.reviews || 0,
                price: hotel.price || 899,
                currency: hotel.currency || 'CNY',
                location: hotel.location,
                image: hotel.images && hotel.images.length > 0 ? hotel.images[0] : hotel.image,
                badge: '旅行者之选',
                rank: index + 1
            }));
            renderPopularHotels(hotels);
        } else {
            // 如果没有数据，尝试从原API获取
            const fallbackResponse = await fetch(`${API_BASE_URL}/hotels/popular`);
            const fallbackResult = await fallbackResponse.json();
            if (fallbackResult.success && fallbackResult.data) {
                renderPopularHotels(fallbackResult.data);
            }
        }
    } catch (error) {
        console.error('加载热门酒店失败:', error);
        // 保持现有的静态HTML作为后备
    }
}

// 渲染热门酒店
function renderPopularHotels(hotels) {
    const hotelGrid = document.querySelector('.travelers-choice .hotel-grid');
    if (!hotelGrid) return;

    hotelGrid.innerHTML = hotels.map(hotel => `
        <div class="hotel-card" data-hotel-id="${hotel.id}">
            <div class="hotel-image">
                <img src="${hotel.image}" alt="${hotel.name}">
                <button class="favorite-btn">♡</button>
                ${hotel.badge ? `<span class="badge travelers-choice">${hotel.badge}</span>` : ''}
            </div>
            <div class="hotel-info">
                <div class="rank">${hotel.rank}</div>
                <div class="hotel-details">
                    <h3>${hotel.name}</h3>
                    <div class="rating">
                        <span class="stars">${generateStars(hotel.rating)}</span>
                        <span class="reviews">(${hotel.reviews.toLocaleString()})</span>
                    </div>
                    <div class="price">
                        <span class="from">起价</span>
                        <span class="amount">${hotel.currency}$${hotel.price}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // 添加点击事件
    attachHotelCardClickEvents();
}

// 生成星级评分
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '●';
    }

    if (hasHalfStar) {
        stars += '◐';
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '○';
    }

    return stars;
}

// 加载最近浏览
async function loadRecentViews() {
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/recent-views`);
        const result = await response.json();

        if (result.success && result.data) {
            renderRecentViews(result.data);
        }
    } catch (error) {
        console.error('加载最近浏览失败:', error);
        // 保持现有的静态HTML作为后备
    }
}

// 加载亚洲最佳酒店
async function loadAsiaBestHotels() {
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/asia-best`);
        const result = await response.json();

        if (result.success && result.data) {
            renderAsiaBestHotels(result.data);
        }
    } catch (error) {
        console.error('加载亚洲最佳酒店失败:', error);
        // 保持现有的静态HTML作为后备
    }
}

// 渲染亚洲最佳酒店
function renderAsiaBestHotels(destinations) {
    const destinationGrid = document.querySelector('.asia-hotels .destination-grid');
    if (!destinationGrid) return;

    destinationGrid.innerHTML = destinations.map(dest => `
        <div class="destination-card ${dest.size === 'large' ? 'large' : ''}">
            <img src="${dest.image}" alt="${dest.name}">
            <div class="destination-info">
                <h3>${dest.name}</h3>
                ${dest.rating && dest.reviews ? `
                    <div class="rating">
                        <span class="stars">${generateStars(dest.rating)}</span>
                        <span class="reviews">(${dest.reviews.toLocaleString()})</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // 添加点击事件
    attachDestinationCardClickEvents();
}

// 加载全包式度假酒店
async function loadAllInclusiveHotels() {
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/all-inclusive`);
        const result = await response.json();

        if (result.success && result.data) {
            renderAllInclusiveHotels(result.data);
        }
    } catch (error) {
        console.error('加载全包式度假酒店失败:', error);
        // 保持现有的静态HTML作为后备
    }
}

// 加载热门酒店链接
async function loadPopularHotelLinks() {
    try {
        const response = await fetch(`${API_BASE_URL}/hotels/popular-links`);
        const result = await response.json();

        if (result.success && result.data) {
            renderPopularHotelLinks(result.data);
        }
    } catch (error) {
        console.error('加载热门酒店链接失败:', error);
        // 如果加载失败，显示默认链接
        renderDefaultHotelLinks();
    }
}

// 渲染热门酒店链接
function renderPopularHotelLinks(linkData) {
    const hotelLinks = document.querySelector('.popular-hotels .hotel-links');
    if (!hotelLinks) return;

    hotelLinks.innerHTML = linkData.columns.map(column => `
        <div class="link-column">
            ${column.links.map(link => `
                <a href="${link.url}">${link.text}</a>
            `).join('')}
        </div>
    `).join('');
}

// 渲染默认酒店链接（后备方案）
function renderDefaultHotelLinks() {
    const hotelLinks = document.querySelector('.popular-hotels .hotel-links');
    if (!hotelLinks) return;

    const defaultLinks = {
        columns: [
            {
                links: [
                    { text: '世界', url: '#' },
                    { text: '旅行论坛', url: '#' },
                    { text: '航空公司', url: '#' },
                    { text: '旅游指南', url: '#' },
                    { text: '旅行酒店', url: '#' },
                    { text: '度假租赁', url: '#' },
                    { text: '旅行故事', url: '#' },
                    { text: '邮轮', url: '#' },
                    { text: '租车', url: '#' }
                ]
            },
            {
                links: [
                    { text: '成都酒店', url: '#' },
                    { text: '华盛顿特区酒店', url: '#' },
                    { text: '巴黎酒店', url: '#' },
                    { text: '纽约市酒店', url: '#' },
                    { text: '洛杉矶酒店', url: '#' },
                    { text: '伦敦酒店', url: '#' },
                    { text: '东京酒店', url: '#' },
                    { text: '罗马酒店', url: '#' }
                ]
            },
            {
                links: [
                    { text: '圣地亚哥酒店', url: '#' },
                    { text: '巴塞罗那酒店', url: '#' },
                    { text: '旧金山酒店', url: '#' },
                    { text: '新奥尔良酒店', url: '#' },
                    { text: '迈阿密酒店', url: '#' },
                    { text: '拉斯维加斯酒店', url: '#' },
                    { text: '芝加哥酒店', url: '#' },
                    { text: '西雅图酒店', url: '#' }
                ]
            }
        ]
    };

    renderPopularHotelLinks(defaultLinks);
}

// 渲染全包式度假酒店
function renderAllInclusiveHotels(hotels) {
    const hotelGrid = document.querySelector('.all-inclusive .hotel-grid-small');
    if (!hotelGrid) return;

    hotelGrid.innerHTML = hotels.map(hotel => `
        <div class="hotel-card-small" data-hotel-id="${hotel.id}">
            <div class="hotel-image">
                <img src="${hotel.image}" alt="${hotel.name}">
                <button class="favorite-btn">♡</button>
                ${hotel.badge ? `<span class="badge travelers-choice">${hotel.badge}</span>` : ''}
            </div>
            <div class="hotel-info">
                <h3>${hotel.name}</h3>
                <div class="rating">
                    <span class="stars">${generateStars(hotel.rating)}</span>
                    <span class="reviews">(${hotel.reviews.toLocaleString()})</span>
                </div>
            </div>
        </div>
    `).join('');

    // 添加点击事件
    attachAllInclusiveClickEvents();
}

// 渲染最近浏览
function renderRecentViews(items) {
    const recentCarousel = document.querySelector('.recent-views .recent-carousel');
    if (!recentCarousel) return;

    // 保留下一页按钮
    const nextBtn = recentCarousel.querySelector('.carousel-btn.next');

    recentCarousel.innerHTML = items.map(item => `
        <div class="recent-card" data-id="${item.id}" data-type="${item.type}">
            <img src="${item.image}" alt="${item.name}">
            <div class="recent-info">
                <h4>${item.name}</h4>
                <div class="rating">${generateStars(item.rating)}</div>
                ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
            </div>
        </div>
    `).join('');

    // 重新添加下一页按钮
    if (nextBtn) {
        recentCarousel.appendChild(nextBtn);
    }

    // 添加点击事件
    attachRecentCardClickEvents();
}

// 为酒店卡片添加点击事件
function attachHotelCardClickEvents() {
    const hotelCards = document.querySelectorAll('.travelers-choice .hotel-card');
    hotelCards.forEach(card => {
        card.style.cursor = 'pointer';

        card.addEventListener('click', (e) => {
            // 如果点击的是收藏按钮，不跳转
            if (e.target.classList.contains('favorite-btn') || e.target.closest('.favorite-btn')) {
                e.stopPropagation();
                toggleFavorite(e.target.closest('.favorite-btn'));
                return;
            }

            const hotelId = card.getAttribute('data-hotel-id');
            window.location.href = `hotel-detail.html?id=${hotelId}`;
        });
    });

    // 为收藏按钮添加独立事件
    const favoriteBtns = document.querySelectorAll('.travelers-choice .hotel-card .favorite-btn');
    favoriteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(btn);
        });
    });
}

// 为最近浏览卡片添加点击事件
function attachRecentCardClickEvents() {
    const recentCards = document.querySelectorAll('.recent-card');
    recentCards.forEach(card => {
        card.style.cursor = 'pointer';

        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const type = card.dataset.type;

            if (type === 'tour') {
                // 跳转到景点详情页
                window.location.href = `attraction-detail.html?id=${id}`;
            } else if (type === 'destination') {
                // 跳转到目的地页面
                window.location.href = `destination.html?id=${id}`;
            } else if (type === 'hotel') {
                // 跳转到酒店详情页
                window.location.href = `hotel-detail.html?id=${id}`;
            }
        });
    });
}

// 为目的地卡片添加点击事件
function attachDestinationCardClickEvents() {
    const destinationCards = document.querySelectorAll('.destination-card');
    destinationCards.forEach(card => {
        card.style.cursor = 'pointer';

        card.addEventListener('click', () => {
            // 跳转到目的地详情页
            alert('目的地详情页功能即将推出！');
        });
    });
}

// 为全包式酒店卡片添加点击事件
function attachAllInclusiveClickEvents() {
    const hotelCards = document.querySelectorAll('.all-inclusive .hotel-card-small');
    hotelCards.forEach(card => {
        card.style.cursor = 'pointer';

        card.addEventListener('click', (e) => {
            // 如果点击的是收藏按钮，不跳转
            if (e.target.classList.contains('favorite-btn') || e.target.closest('.favorite-btn')) {
                e.stopPropagation();
                toggleFavorite(e.target.closest('.favorite-btn'));
                return;
            }

            const hotelId = card.getAttribute('data-hotel-id');
            window.location.href = `hotel-detail.html?id=${hotelId}`;
        });
    });

    // 为收藏按钮添加独立事件
    const favoriteBtns = document.querySelectorAll('.all-inclusive .hotel-card-small .favorite-btn');
    favoriteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(btn);
        });
    });
}

// 切换收藏状态
function toggleFavorite(btn) {
    const isFavorited = btn.textContent === '♥';

    if (isFavorited) {
        btn.textContent = '♡';
        btn.style.color = '';
    } else {
        btn.textContent = '♥';
        btn.style.color = '#ff385c';
    }
}

// 轮播图功能
function initCarousel() {
    const carousels = document.querySelectorAll('.hotel-carousel, .recent-carousel');

    carousels.forEach(carousel => {
        const prevBtn = carousel.querySelector('.carousel-btn.prev');
        const nextBtn = carousel.querySelector('.carousel-btn.next');
        const grid = carousel.querySelector('.hotel-grid, .hotel-grid-small');

        if (!grid) return;

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                grid.scrollBy({
                    left: -300,
                    behavior: 'smooth'
                });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                grid.scrollBy({
                    left: 300,
                    behavior: 'smooth'
                });
            });
        }
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 加载动态内容
    loadFeatures();
    loadPopularHotels();
    loadRecentViews();
    loadAsiaBestHotels();
    loadAllInclusiveHotels();
    loadPopularHotelLinks();

    // 初始化轮播图
    initCarousel();

    // 搜索功能
    const searchBtn = document.querySelector('.hero .search-btn');
    const searchInput = document.querySelector('.hero .search-box input');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `hotel-search.html?q=${encodeURIComponent(query)}`;
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `hotel-search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
});
