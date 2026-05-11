// API配置
const API_BASE_URL = 'http://localhost:3000/api';

// 导航栏滚动效果
let lastScrollTop = 0;
const headerTop = document.querySelector('.header-top');
const headerScrolled = document.querySelector('.header-scrolled');
const scrollThreshold = 100;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > scrollThreshold) {
        if (scrollTop > lastScrollTop) {
            if (headerTop) headerTop.classList.add('hidden');
            if (headerScrolled) headerScrolled.classList.add('visible');
        } else {
            if (headerScrolled) headerScrolled.classList.add('visible');
        }
    } else {
        if (headerTop) headerTop.classList.remove('hidden');
        if (headerScrolled) headerScrolled.classList.remove('visible');
    }

    lastScrollTop = scrollTop;
});

// ==================== 搜索功能 ====================
let currentSearchTab = 'all'; // 当前选中的搜索类型

// 初始化搜索功能
function initializeSearch() {
    // 搜索标签切换
    const searchTabs = document.querySelectorAll('.tab-hero');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            searchTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentSearchTab = this.dataset.tab;

            // 更新搜索框占位符
            const searchInput = document.querySelector('.search-input-hero');
            if (searchInput) {
                switch(currentSearchTab) {
                    case 'hotels':
                        searchInput.placeholder = '搜索酒店...';
                        break;
                    case 'attractions':
                        searchInput.placeholder = '搜索景点...';
                        break;
                    case 'restaurants':
                        searchInput.placeholder = '搜索美食...';
                        break;
                    default:
                        searchInput.placeholder = '景点玩乐、酒店...';
                }
            }
        });
    });

    // 主搜索框 - 按钮点击
    const searchBtnHero = document.querySelector('.search-btn-hero');
    if (searchBtnHero) {
        searchBtnHero.addEventListener('click', handleHeroSearch);
    }

    // 主搜索框 - 回车键
    const searchInputHero = document.querySelector('.search-input-hero');
    if (searchInputHero) {
        searchInputHero.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleHeroSearch();
            }
        });
    }

    // 导航栏搜索框 - 回车键
    const compactSearchInput = document.querySelector('.search-input-compact');
    if (compactSearchInput) {
        compactSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleCompactSearch();
            }
        });
    }
}

// 处理主搜索框搜索
function handleHeroSearch() {
    const searchInput = document.querySelector('.search-input-hero');
    const searchValue = searchInput.value.trim();

    if (!searchValue) {
        alert('请输入搜索关键词');
        return;
    }

    // 根据选中的标签跳转到相应页面
    switch(currentSearchTab) {
        case 'hotels':
            window.location.href = `hotel-page.html?location=${encodeURIComponent(searchValue)}`;
            break;
        case 'attractions':
            window.location.href = `attractions-search.html?location=${encodeURIComponent(searchValue)}`;
            break;
        case 'restaurants':
            window.location.href = `restaurant-search.html?location=${encodeURIComponent(searchValue)}`;
            break;
        case 'all':
        default:
            // 默认跳转到餐厅搜索页
            window.location.href = `restaurant-search.html?location=${encodeURIComponent(searchValue)}`;
            break;
    }
}

// 处理导航栏搜索框搜索
function handleCompactSearch() {
    const compactSearchInput = document.querySelector('.search-input-compact');
    const searchValue = compactSearchInput.value.trim();

    if (!searchValue) {
        return;
    }

    // 默认跳转到餐厅搜索页
    window.location.href = `restaurant-search.html?location=${encodeURIComponent(searchValue)}`;
}


// 动态加载热门城市
async function loadPopularDestinations() {
    const grid = document.getElementById('destinationsGrid');
    if (!grid) return;

    try {
        console.log('开始加载城市数据...');
        // 显示加载状态
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">加载中...</p>';

        const response = await fetch(`${API_BASE_URL}/destinations/popular?limit=12`);
        console.log('城市API响应状态:', response.status);
        const result = await response.json();
        console.log('城市数据:', result);

        if (result.success && result.data.length > 0) {
            grid.innerHTML = result.data.map(dest => {
                // 对图片路径进行URL编码，处理中文字符
                const imageUrl = dest.cover_image ? encodeURI(dest.cover_image) : '';
                return `
                <div class="destination-card" data-id="${dest.id}">
                    <div class="card-image-wrapper">
                        <div class="card-image" style="background-image: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('${imageUrl}'); background-position: center; background-size: cover;">
                        </div>
                    </div>
                    <div class="card-content">
                        <h3>${dest.name}</h3>
                        <p style="font-size: 14px; color: #666; margin-top: 4px;">
                            ${dest.attraction_count || 0} 个景点
                        </p>
                    </div>
                </div>
                `;
            }).join('');

            // 重新绑定点击事件
            bindDestinationCardEvents();
        } else {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">暂无城市数据</p>';
        }
    } catch (error) {
        console.error('加载城市失败:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e63946;">加载失败，请刷新重试</p>';
    }
}

// 动态加载热门景点
async function loadPopularAttractions() {
    const grid = document.getElementById('attractionsGrid');
    if (!grid) return;

    try {
        console.log('开始加载景点数据...');
        // 显示加载状态
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">加载中...</p>';

        const response = await fetch(`${API_BASE_URL}/attractions/popular?limit=20&page=1`);
        console.log('景点API响应状态:', response.status);
        const result = await response.json();
        console.log('景点数据:', result);

        if (result.success && result.data.length > 0) {
            grid.innerHTML = result.data.map(attraction => {
                const rating = parseFloat(attraction.rating) || 0;
                const fullStars = Math.floor(rating);
                const hasHalf = rating % 1 >= 0.5;

                let starsHtml = '';
                for (let i = 0; i < fullStars; i++) {
                    starsHtml += '<span class="bubble filled"></span>';
                }
                if (hasHalf) {
                    starsHtml += '<span class="bubble half"></span>';
                }
                const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
                for (let i = 0; i < emptyStars; i++) {
                    starsHtml += '<span class="bubble"></span>';
                }

                return `
                    <div class="attraction-card" data-id="${attraction.id}">
                        <button class="favorite-btn-card">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <div class="card-image-wrapper">
                            <div class="card-image" style="background: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url('${attraction.image || ''}') center/cover;"></div>
                        </div>
                        <div class="card-content">
                            <h3>${attraction.name}</h3>
                            <div class="rating-line">
                                <div class="rating-bubbles">
                                    ${starsHtml}
                                </div>
                                <span class="review-text">${attraction.review_count || 0} 条评论</span>
                            </div>
                            <p class="card-description">${attraction.location_city || ''} · ${attraction.type || '景点'}</p>
                            ${attraction.price && attraction.price > 0 ? `
                            <div class="price-line">
                                <span class="from-text">低至</span>
                                <span class="price-amount">${attraction.currency || 'CNY'} ${attraction.price}</span>
                                <span class="per-person">每位成人</span>
                            </div>
                            ` : '<div class="price-line"><span class="from-text">免费参观</span></div>'}
                        </div>
                    </div>
                `;
            }).join('');

            // 重新绑定事件
            bindAttractionCardEvents();
        } else {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">暂无景点数据</p>';
        }
    } catch (error) {
        console.error('加载景点失败:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e63946;">加载失败，请刷新重试</p>';
    }
}

// 绑定城市卡片事件
function bindDestinationCardEvents() {
    document.querySelectorAll('.destination-card').forEach(card => {
        card.addEventListener('click', function() {
            const id = this.dataset.id;
            window.location.href = `destination.html?id=${id}`;
        });
    });
}

// 绑定景点卡片事件
function bindAttractionCardEvents() {
    document.querySelectorAll('.attraction-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.favorite-btn-card')) {
                const id = this.dataset.id;
                window.location.href = `attraction-detail.html?id=${id}`;
            }
        });
    });

    // 收藏按钮
    document.querySelectorAll('.favorite-btn-card').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const svg = this.querySelector('svg');
            const isFavorited = svg.getAttribute('fill') === 'currentColor';

            if (isFavorited) {
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', '#fff');
            } else {
                svg.setAttribute('fill', 'currentColor');
                svg.setAttribute('stroke', '#ff385c');
                svg.style.color = '#ff385c';
            }
        });
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    console.log('首页加载完成，开始加载数据...');
    initializeSearch();
    loadPopularDestinations();
    loadPopularAttractions();
});
