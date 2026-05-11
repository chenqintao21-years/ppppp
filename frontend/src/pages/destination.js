// 目的地页面动态内容管理

// API配置
const API_BASE_URL = 'http://localhost:3000/api';

// 当前选中的类型
let currentType = 'attractions';
let destinationId = null;
let destinationData = null;
let currentPage = 1;
const itemsPerPage = 20;

// 从URL获取城市ID或名称
function getDestinationFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const name = urlParams.get('name');

    if (id) {
        return { type: 'id', value: id };
    } else if (name) {
        return { type: 'name', value: decodeURIComponent(name) };
    }

    return null;
}

// 根据名称搜索城市获取ID
async function searchDestinationByName(name) {
    try {
        const response = await fetch(`${API_BASE_URL}/destinations/search?q=${encodeURIComponent(name)}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            return result.data[0].id;
        }
        return null;
    } catch (error) {
        console.error('搜索城市失败:', error);
        return null;
    }
}

// 获取城市详情
async function fetchDestinationDetail(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/destinations/${id}`);
        const result = await response.json();

        if (result.success) {
            return result.data;
        }
        return null;
    } catch (error) {
        console.error('获取城市详情失败:', error);
        return null;
    }
}

// 获取城市的景点列表
async function fetchDestinationAttractions(id, page = 1, sort = 'rating') {
    try {
        const response = await fetch(`${API_BASE_URL}/destinations/${id}/attractions?page=${page}&limit=${itemsPerPage}&sort=${sort}`);
        const result = await response.json();

        if (result.success) {
            return result;
        }
        return null;
    } catch (error) {
        console.error('获取城市景点失败:', error);
        return null;
    }
}

// 获取城市的酒店列表
async function fetchDestinationHotels(id, page = 1, sort = 'rating') {
    try {
        const response = await fetch(`${API_BASE_URL}/destinations/${id}/hotels?page=${page}&limit=${itemsPerPage}&sort=${sort}`);
        const result = await response.json();

        if (result.success) {
            return result;
        }
        return null;
    } catch (error) {
        console.error('获取城市酒店失败:', error);
        return null;
    }
}

// 获取城市的餐厅列表
async function fetchDestinationRestaurants(id, page = 1, sort = 'rating') {
    try {
        const response = await fetch(`${API_BASE_URL}/destinations/${id}/restaurants?page=${page}&limit=${itemsPerPage}&sort=${sort}`);
        const result = await response.json();

        if (result.success) {
            return result;
        }
        return null;
    } catch (error) {
        console.error('获取城市餐厅失败:', error);
        return null;
    }
}

// 导航栏滚动效果
let lastScrollTop = 0;
const headerScrolled = document.querySelector('.header-scrolled');
const scrollThreshold = 100;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > scrollThreshold) {
        if (headerScrolled) headerScrolled.classList.add('visible');
    } else {
        if (headerScrolled) headerScrolled.classList.remove('visible');
    }

    lastScrollTop = scrollTop;
});

// 初始化目的地页面
async function initDestinationPage() {
    // 显示加载状态
    showLoading();

    // 获取城市信息
    const destination = getDestinationFromURL();

    if (!destination) {
        showError('未指定城市');
        return;
    }

    // 如果是名称，先搜索获取ID
    if (destination.type === 'name') {
        destinationId = await searchDestinationByName(destination.value);
        if (!destinationId) {
            showError('未找到该城市');
            return;
        }
    } else {
        destinationId = destination.value;
    }

    // 获取城市详情
    destinationData = await fetchDestinationDetail(destinationId);

    if (!destinationData) {
        showError('获取城市信息失败');
        return;
    }

    // 更新页面标题
    document.title = `${destinationData.name}景点玩乐 - Tripadvisor`;

    // 更新面包屑
    updateBreadcrumb(destinationData.name);

    // 更新头部图片
    updateHeaderImage(destinationData);

    // 设置导航标签点击事件
    const navTabs = document.querySelectorAll('.dest-nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            switchContent(type);
        });
    });

    // 设置排序选择器
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentPage = 1;
            loadContent(currentType);
        });
    }

    // 设置加载更多按钮
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            currentPage++;
            loadContent(currentType, true);
        });
    }

    // 加载初始内容
    await loadContent(currentType);
}

// 更新面包屑
function updateBreadcrumb(cityName) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        const lastSpan = breadcrumb.querySelector('span:last-child');
        if (lastSpan) {
            lastSpan.textContent = cityName;
        }
    }
}

// 更新头部图片
function updateHeaderImage(data) {
    const headerImage = document.querySelector('.header-image img');
    if (headerImage && data.cover_image) {
        headerImage.src = data.cover_image;
        headerImage.alt = data.name;
    }
}

// 切换内容
async function switchContent(type) {
    if (type === currentType) return;

    currentType = type;
    currentPage = 1;

    // 更新导航标签状态
    document.querySelectorAll('.dest-nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-type') === type) {
            tab.classList.add('active');
        }
    });

    // 加载新内容
    await loadContent(type);
}

// 加载内容
async function loadContent(type, append = false) {
    if (!append) {
        showLoading();
    }

    let result = null;
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect ? sortSelect.value : 'rating';

    // 映射排序值
    const sortMap = {
        'recommended': 'rating',
        'rating': 'rating',
        'reviews': 'review_count',
        'price-low': 'price',
        'price-high': 'price'
    };

    const sort = sortMap[sortValue] || 'rating';

    try {
        switch (type) {
            case 'attractions':
                result = await fetchDestinationAttractions(destinationId, currentPage, sort);
                break;
            case 'hotels':
                result = await fetchDestinationHotels(destinationId, currentPage, sort);
                break;
            case 'restaurants':
                result = await fetchDestinationRestaurants(destinationId, currentPage, sort);
                break;
            case 'cruises':
                // 游船功能暂未实现
                showError('游船功能开发中...');
                return;
        }

        if (result && result.success) {
            // 更新标题和元数据
            updateHeader(type, result.data.length, result.pagination.total);

            // 更新筛选器
            updateFilters(type);

            // 更新内容区域
            updateContentArea(result.data, type, append);

            // 更新加载更多按钮
            updateLoadMoreButton(type, result.pagination);
        } else {
            showError('加载数据失败');
        }
    } catch (error) {
        console.error('加载内容失败:', error);
        showError('加载数据失败');
    }
}

// 更新头部信息
function updateHeader(type, count, total) {
    const titleEl = document.getElementById('destinationTitle');
    const metaEl = document.getElementById('destinationMeta');

    const titles = {
        hotels: '酒店',
        attractions: '景点玩乐',
        restaurants: '美食',
        cruises: '游船'
    };

    if (titleEl && destinationData) {
        titleEl.textContent = `${destinationData.name}${titles[type] || ''}`;
    }

    if (metaEl && destinationData) {
        const stats = destinationData.stats || {};
        let countText = '';
        let reviewText = '';

        switch (type) {
            case 'attractions':
                countText = `${stats.attractions || total}个景点`;
                break;
            case 'hotels':
                countText = `${stats.hotels || total}家酒店`;
                break;
            case 'restaurants':
                countText = `${stats.restaurants || total}家餐厅`;
                break;
        }

        metaEl.innerHTML = `
            <span class="attraction-count">${countText}</span>
        `;
    }
}

// 更新筛选器
function updateFilters(type) {
    const filterLeft = document.getElementById('filterLeft');
    if (!filterLeft) return;

    const filters = {
        hotels: [
            { id: 'all', label: '全部' },
            { id: 'luxury', label: '豪华酒店' },
            { id: 'boutique', label: '精品酒店' },
            { id: 'budget', label: '经济型酒店' }
        ],
        attractions: [
            { id: 'all', label: '全部' },
            { id: 'museums', label: '博物馆' },
            { id: 'historical', label: '历史遗迹' },
            { id: 'tours', label: '游览' }
        ],
        restaurants: [
            { id: 'all', label: '全部' },
            { id: 'italian', label: '意大利菜' },
            { id: 'pizza', label: '披萨' },
            { id: 'seafood', label: '海鲜' }
        ]
    };

    const typeFilters = filters[type] || filters.attractions;

    let html = '';
    typeFilters.forEach((filter, index) => {
        const activeClass = index === 0 ? 'active' : '';
        html += `<button class="filter-btn ${activeClass}" data-filter="${filter.id}">${filter.label}</button>`;
    });

    html += `
        <button class="filter-btn more-filters">
            更多筛选
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
    `;

    filterLeft.innerHTML = html;

    // 添加筛选按钮事件
    filterLeft.querySelectorAll('.filter-btn:not(.more-filters)').forEach(btn => {
        btn.addEventListener('click', function() {
            filterLeft.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// 更新内容区域
function updateContentArea(items, type, append = false) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    if (!append) {
        const sectionTitle = getSectionTitle(type);

        let html = `
            <section class="popular-attractions">
                <h2 class="section-title">${sectionTitle}</h2>
                <div class="attractions-grid" id="itemsGrid">
        `;

        items.forEach(item => {
            html += createCard(item, type);
        });

        html += `
                </div>
            </section>
        `;

        contentArea.innerHTML = html;
    } else {
        // 追加模式
        const grid = document.getElementById('itemsGrid');
        if (grid) {
            items.forEach(item => {
                grid.innerHTML += createCard(item, type);
            });
        }
    }

    // 重新绑定事件
    bindCardEvents(type);
}

// 获取区域标题
function getSectionTitle(type) {
    const titles = {
        hotels: '热门酒店',
        attractions: '热门景点',
        restaurants: '热门餐厅',
        cruises: '热门游船'
    };
    return titles[type] || '热门推荐';
}

// 创建卡片HTML
function createCard(item, type) {
    const badgeHtml = item.badge ? `<span class="badge-top">${item.badge}</span>` : '';
    const ratingStars = generateRatingStars(item.rating || 0);
    const reviewCount = item.review_count || 0;

    // 根据类型生成不同的描述和价格
    let description = item.description || '';
    let priceHtml = '';

    if (type === 'attractions') {
        description = item.description || `${item.location_city || ''} • ${item.duration || ''}`;
        if (item.price) {
            priceHtml = `<span class="price">起价 <strong>${item.currency || 'USD'} ${item.price}</strong></span>`;
        }
    } else if (type === 'hotels') {
        description = item.location || '';
    } else if (type === 'restaurants') {
        description = `${item.price_range || ''} • ${item.address || ''}`;
    }

    const imageUrl = item.image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23cccccc' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23666' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(item.name)}%3C/text%3E%3C/svg%3E`;

    return `
        <div class="attraction-card" data-id="${item.id}" data-type="${type}">
            <div class="card-image">
                <img src="${imageUrl}" alt="${item.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Crect fill=\\'%23cccccc\\' width=\\'400\\' height=\\'300\\'/%3E%3C/svg%3E'">
                <button class="favorite-btn-card">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                ${badgeHtml}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.name}</h3>
                <div class="rating-line">
                    <div class="rating-bubbles">
                        ${ratingStars}
                    </div>
                    <span class="rating-score">${item.rating || 0}</span>
                    <span class="review-count">(${reviewCount.toLocaleString()})</span>
                </div>
                <p class="card-description">${description}</p>
                <div class="card-footer">
                    ${priceHtml}
                    <span class="badge-green">可订</span>
                </div>
            </div>
        </div>
    `;
}

// 生成评分星星
function generateRatingStars(rating) {
    let html = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
        html += '<span class="bubble filled"></span>';
    }

    if (hasHalfStar) {
        html += '<span class="bubble half"></span>';
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        html += '<span class="bubble"></span>';
    }

    return html;
}

// 绑定卡片事件
function bindCardEvents(type) {
    // 卡片点击
    const cards = document.querySelectorAll('.attraction-card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.favorite-btn-card')) {
                const id = this.dataset.id;
                const cardType = this.dataset.type;

                // 根据类型跳转到不同页面
                if (cardType === 'hotels') {
                    window.location.href = `hotel-detail.html?id=${id}`;
                } else if (cardType === 'restaurants') {
                    window.location.href = `restaurant-detail.html?id=${id}`;
                } else {
                    window.location.href = `attraction-detail.html?id=${id}`;
                }
            }
        });
    });

    // 收藏按钮
    const favoriteBtns = document.querySelectorAll('.favorite-btn-card');
    favoriteBtns.forEach(btn => {
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
                svg.style.fill = '#ff385c';

                // 添加动画效果
                this.style.animation = 'heartBeat 0.5s ease';
                setTimeout(() => {
                    this.style.animation = '';
                }, 500);
            }
        });
    });
}

// 更新加载更多按钮
function updateLoadMoreButton(type, pagination) {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (!loadMoreBtn) return;

    const buttonTexts = {
        hotels: '加载更多酒店',
        attractions: '加载更多景点',
        restaurants: '加载更多餐厅',
        cruises: '加载更多游船'
    };

    loadMoreBtn.textContent = buttonTexts[type] || '加载更多';

    // 如果没有更多数据，隐藏按钮
    if (pagination && pagination.page >= pagination.totalPages) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// 显示加载状态
function showLoading() {
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <p style="font-size: 18px; color: #666;">加载中...</p>
            </div>
        `;
    }
}

// 显示错误信息
function showError(message) {
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <p style="font-size: 18px; color: #e63946;">${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #00aa6c; color: white; border: none; border-radius: 4px; cursor: pointer;">重新加载</button>
            </div>
        `;
    }
}

// 添加心跳动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.3); }
        50% { transform: scale(1.1); }
        75% { transform: scale(1.25); }
    }
`;
document.head.appendChild(style);

// 页面加载完成
window.addEventListener('DOMContentLoaded', () => {
    console.log('目的地页面加载完成');
    initDestinationPage();
});
