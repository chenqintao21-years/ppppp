// ==================== API 配置 ====================
const API_BASE_URL = 'http://localhost:3000/api';

const API_ENDPOINTS = {
    searchAttractions: `${API_BASE_URL}/attractions/search`,
    getAttractionDetails: (id) => `${API_BASE_URL}/attractions/${id}`,
};

// ==================== 全局变量 ====================
let currentPage = 1;
let currentFilters = {
    location: '',
    type: [],
    suitable: [],
    price: [],
    sort: 'recommended'
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadAttractions();
});

function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const location = urlParams.get('location');

    if (location) {
        currentFilters.location = location;
        document.getElementById('searchInput').value = location;
    }
}

function setupEventListeners() {
    // 搜索按钮
    document.querySelector('.search-btn').addEventListener('click', handleSearch);

    // 搜索输入框回车
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 快速筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 分类筛选
    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.filter-category-item').forEach(item => {
                item.classList.remove('active');
            });
            this.closest('.filter-category-item').classList.add('active');
            handleCategoryChange(this.value);
        });
    });

    // 排序选择
    document.getElementById('sortSelect').addEventListener('change', function() {
        currentFilters.sort = this.value;
        currentPage = 1;
        loadAttractions();
    });

    // 类型筛选
    document.querySelectorAll('input[name="type"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // 适合人群筛选
    document.querySelectorAll('input[name="suitable"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // 价格筛选
    document.querySelectorAll('input[name="price"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // 清除筛选
    document.querySelector('.clear-filters-btn').addEventListener('click', clearFilters);

    // 加载更多
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreAttractions);

    // 侧边栏小组件
    document.querySelectorAll('.widget-item').forEach(item => {
        item.addEventListener('click', function() {
            const attractionName = this.querySelector('h4').textContent;
            alert(`查看 ${attractionName} 详情`);
        });
    });
}

// ==================== 分类切换 ====================
function handleCategoryChange(category) {
    switch(category) {
        case 'all':
            window.location.href = 'restaurant-search.html';
            break;
        case 'attractions':
            currentPage = 1;
            loadAttractions();
            break;
        case 'hotels':
            window.location.href = 'hotel-page.html';
            break;
        case 'destinations':
            alert('跳转到目的地页面');
            break;
        case 'restaurants':
            window.location.href = 'restaurant-search.html';
            break;
    }
}

// ==================== 搜索功能 ====================
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentFilters.location = searchInput.value.trim();
    currentPage = 1;
    loadAttractions();
}

// ==================== 筛选功能 ====================
function handleFilterChange() {
    currentFilters.type = Array.from(document.querySelectorAll('input[name="type"]:checked'))
        .map(cb => cb.value);

    currentFilters.suitable = Array.from(document.querySelectorAll('input[name="suitable"]:checked'))
        .map(cb => cb.value);

    currentFilters.price = Array.from(document.querySelectorAll('input[name="price"]:checked'))
        .map(cb => cb.value);

    currentPage = 1;
    loadAttractions();
}

function clearFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    currentFilters.type = [];
    currentFilters.suitable = [];
    currentFilters.price = [];

    currentPage = 1;
    loadAttractions();
}

// ==================== 加载景点数据 ====================
async function loadAttractions() {
    const container = document.getElementById('attractionContainer');

    // 检查是否有搜索关键词
    if (!currentFilters.location || currentFilters.location.trim() === '') {
        container.innerHTML = '<div style="text-align: center; padding: 100px 20px; color: #999;"><h3>请输入城市或地点进行搜索</h3></div>';
        return;
    }

    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p style="margin-top: 20px; color: #666;">加载中...</p></div>';

    try {
        // 从数据库获取景点数据
        const response = await fetch(`http://localhost:3000/api/attractions/search?location=${encodeURIComponent(currentFilters.location)}&page=${currentPage}&limit=20`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            displayAttractions(result.data);

            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (result.hasMore) {
                loadMoreBtn.style.display = 'block';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            // 没有数据
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到相关景点</div>';
            document.getElementById('loadMoreBtn').style.display = 'none';
        }

    } catch (error) {
        console.error('加载景点数据失败:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">加载失败，请稍后重试</div>';
        document.getElementById('loadMoreBtn').style.display = 'none';
    }
}

function loadMoreAttractions() {
    currentPage++;
    document.querySelector('.restaurant-list').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    setTimeout(() => {
        loadAttractions();
    }, 300);
}

// ==================== 显示景点列表 ====================
function displayAttractions(attractions) {
    const container = document.getElementById('attractionContainer');

    if (attractions.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到符合条件的景点</div>';
        return;
    }

    container.innerHTML = '';

    attractions.forEach((attraction, index) => {
        const card = createAttractionCard(attraction);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        container.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function createAttractionCard(attraction) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.onclick = () => viewAttractionDetails(attraction.id);

    // 兼容数据库字段（下划线）和模拟数据字段（驼峰）
    const rating = parseFloat(attraction.rating) || 0;
    const reviewCount = attraction.review_count || attraction.reviewCount || 0;
    const ratingCircles = generateRatingCircles(rating);

    // 处理类型标签 - 从 type 字段解析（数据库格式："风景名胜;公园广场;城市广场"）
    let tags = [];
    if (attraction.type) {
        // 数据库格式：字符串，用分号分隔
        tags = attraction.type.split(';').filter(t => t.trim()).slice(0, 3);
    } else if (attraction.types) {
        // 模拟数据格式：数组
        tags = attraction.types.concat(attraction.features || []).slice(0, 5);
    }

    const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    // 处理票价
    let ticketPrice = '免费';
    if (attraction.ticketPrice) {
        ticketPrice = attraction.ticketPrice;
    } else if (attraction.price && parseFloat(attraction.price) > 0) {
        ticketPrice = `${attraction.currency || '¥'}${parseFloat(attraction.price)}`;
    }

    card.innerHTML = `
        <img src="${attraction.image}" alt="${attraction.name}" class="restaurant-image" loading="lazy">
        <div class="restaurant-info">
            <div class="restaurant-header">
                <div>
                    <h3 class="restaurant-name">${attraction.name}</h3>
                </div>
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${attraction.id}, this)">
                    ♡
                </button>
            </div>

            <div class="restaurant-rating">
                <div class="rating-circles">${ratingCircles}</div>
                <span class="rating-score">${rating.toFixed(1)}</span>
                <span class="review-count">${reviewCount.toLocaleString()} 条点评</span>
            </div>

            <div class="restaurant-tags">
                ${tagsHtml}
            </div>

            <p class="restaurant-description">
                ${attraction.description || '暂无描述'}
            </p>

            <div class="restaurant-footer">
                <span class="price-range">${ticketPrice}</span>
                <button class="view-details-btn" onclick="event.stopPropagation(); viewAttractionDetails(${attraction.id})">
                    查看详情
                </button>
            </div>
        </div>
    `;

    return card;
}

function generateRatingCircles(rating) {
    const fullCircles = Math.floor(rating);
    const hasHalfCircle = rating % 1 >= 0.5;
    const emptyCircles = 5 - fullCircles - (hasHalfCircle ? 1 : 0);

    let html = '';

    for (let i = 0; i < fullCircles; i++) {
        html += '<div class="rating-circle"></div>';
    }

    if (hasHalfCircle) {
        html += '<div class="rating-circle"></div>';
    }

    for (let i = 0; i < emptyCircles; i++) {
        html += '<div class="rating-circle empty"></div>';
    }

    return html;
}

// ==================== 景点详情 ====================
function viewAttractionDetails(attractionId) {
    window.location.href = `attraction-detail.html?id=${attractionId}`;
}

// ==================== 收藏功能 ====================
async function toggleFavorite(attractionId, button) {
    try {
        if (button.textContent === '♡') {
            button.textContent = '♥';
            button.style.color = '#ff5533';
            button.style.animation = 'heartbeat 0.3s ease';
            setTimeout(() => {
                button.style.animation = '';
            }, 300);
        } else {
            button.textContent = '♡';
            button.style.color = '#999';
        }

        console.log('切换收藏状态:', attractionId);

    } catch (error) {
        console.error('收藏操作失败:', error);
    }
}
