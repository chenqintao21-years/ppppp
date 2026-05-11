// 使用示例：如何在页面中使用API服务

// ==================== 示例1: 酒店详情页 ====================
import { hotelsService } from '../services/index.js';

async function loadHotelDetail(hotelId) {
    try {
        // 获取酒店详情
        const result = await hotelsService.getHotelDetail(hotelId);

        if (result.success) {
            const hotel = result.data;
            renderHotelDetail(hotel);
        }
    } catch (error) {
        console.error('加载酒店详情失败:', error.message);
        alert('加载失败，请稍后重试');
    }
}

async function loadHotelReviews(hotelId, page = 1) {
    try {
        const result = await hotelsService.getHotelReviews(hotelId, {
            page,
            limit: 10
        });

        if (result.success) {
            renderReviews(result.data);
        }
    } catch (error) {
        console.error('加载评论失败:', error.message);
    }
}

// ==================== 示例2: 景点详情页 ====================
import { attractionsService } from '../services/index.js';

async function loadAttractionDetail(attractionId) {
    try {
        const result = await attractionsService.getAttractionDetail(attractionId);

        if (result.success) {
            renderAttractionDetail(result.data);
        }
    } catch (error) {
        console.error('加载景点详情失败:', error.message);
    }
}

async function bookAttraction() {
    const date = document.getElementById('booking-date').value;
    const travelers = document.getElementById('travelers-count').value;

    if (!date) {
        alert('请选择日期');
        return;
    }

    try {
        const result = await attractionsService.bookAttraction({
            attractionId: 'louvre-museum',
            attractionName: '巴黎卢浮宫博物馆免排队门票',
            date: date,
            travelers: parseInt(travelers),
            price: 21.00
        });

        if (result.success) {
            alert('预订成功！');
        }
    } catch (error) {
        console.error('预订错误:', error.message);
        alert('预订失败，请稍后重试');
    }
}

async function toggleFavorite(attractionId) {
    try {
        const result = await attractionsService.toggleFavorite(attractionId);

        if (result.success) {
            updateFavoriteButton(result.data.isFavorited);
        }
    } catch (error) {
        console.error('收藏操作失败:', error.message);
    }
}

// ==================== 示例3: 餐厅详情页 ====================
import { restaurantsService } from '../services/index.js';

async function loadRestaurantDetail(restaurantId) {
    try {
        const result = await restaurantsService.getRestaurantDetail(restaurantId);

        if (result.success) {
            displayRestaurantDetails(result.data);
        }
    } catch (error) {
        console.error('加载餐厅详情失败:', error.message);
        // 降级到模拟数据
        displayRestaurantDetails(getMockData());
    }
}

async function loadRestaurantReviews(restaurantId) {
    try {
        const result = await restaurantsService.getRestaurantReviews(restaurantId, {
            page: 1,
            limit: 10
        });

        if (result.success) {
            displayReviews(result.data);
        }
    } catch (error) {
        console.error('加载点评失败:', error.message);
    }
}

async function createBooking(restaurantId) {
    try {
        const result = await restaurantsService.createRestaurantBooking({
            restaurantId,
            date: '2026-05-01',
            time: '19:00',
            guests: 4,
            specialRequests: '靠窗座位'
        });

        if (result.success) {
            alert('预订成功！');
        }
    } catch (error) {
        console.error('预订失败:', error.message);
        alert('预订失败，请稍后重试');
    }
}

// ==================== 示例4: 搜索页面 ====================
import { commonService, hotelsService, attractionsService } from '../services/index.js';

async function performGlobalSearch(query) {
    try {
        const result = await commonService.globalSearch({
            query,
            type: 'all'
        });

        if (result.success) {
            renderSearchResults(result.data);
        }
    } catch (error) {
        console.error('搜索失败:', error.message);
    }
}

async function searchHotels(params) {
    try {
        const result = await hotelsService.searchHotels({
            destination: params.destination,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            guests: params.guests,
            priceRange: params.priceRange
        });

        if (result.success) {
            renderHotelResults(result.data);
        }
    } catch (error) {
        console.error('搜索酒店失败:', error.message);
    }
}

// ==================== 示例5: 用户认证 ====================
import { authService, validateEmail, validatePassword } from '../services/index.js';

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;

    // 验证输入
    if (!validateEmail(email)) {
        alert('请输入有效的邮箱地址');
        return;
    }

    if (!validatePassword(password)) {
        alert('密码长度至少为8位');
        return;
    }

    try {
        const result = await authService.login(email, password, rememberMe);

        if (result.success) {
            alert('登录成功！');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('登录失败:', error.message);
        alert(error.message || '登录失败，请检查邮箱和密码');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const result = await authService.register(username, email, password);

        if (result.success) {
            alert('注册成功！');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('注册失败:', error.message);
        alert(error.message || '注册失败，请稍后重试');
    }
}

// ==================== 示例6: 收藏管理 ====================
import { commonService } from '../services/index.js';

async function addToFavorites(itemId, itemType) {
    try {
        const result = await commonService.addFavorite({
            itemId,
            itemType // 'hotel', 'attraction', 'restaurant'
        });

        if (result.success) {
            alert('已添加到收藏');
            updateFavoriteUI(true);
        }
    } catch (error) {
        console.error('添加收藏失败:', error.message);
    }
}

async function removeFromFavorites(itemId, itemType) {
    try {
        const result = await commonService.removeFavorite({
            itemId,
            itemType
        });

        if (result.success) {
            alert('已取消收藏');
            updateFavoriteUI(false);
        }
    } catch (error) {
        console.error('取消收藏失败:', error.message);
    }
}

async function loadFavorites() {
    try {
        const result = await commonService.getFavorites({
            type: 'all'
        });

        if (result.success) {
            renderFavoritesList(result.data);
        }
    } catch (error) {
        console.error('加载收藏列表失败:', error.message);
    }
}

// ==================== 示例7: 使用缓存 ====================
import { get, apiCache } from '../services/index.js';

// 使用缓存的GET请求（默认启用）
async function loadDataWithCache() {
    const data = await get('/hotels/popular', {}, true); // 第三个参数为true启用缓存
    return data;
}

// 不使用缓存的GET请求
async function loadDataWithoutCache() {
    const data = await get('/hotels/popular', {}, false); // 第三个参数为false禁用缓存
    return data;
}

// 手动清除缓存
function clearCache() {
    apiCache.clearAll();
    console.log('缓存已清除');
}

// ==================== 示例8: 自定义拦截器 ====================
import { apiInterceptor } from '../services/index.js';

// 添加自定义请求拦截器
apiInterceptor.addRequestInterceptor((config) => {
    // 添加自定义请求头
    config.headers = {
        ...config.headers,
        'X-Custom-Header': 'custom-value'
    };
    return config;
});

// 添加自定义响应拦截器
apiInterceptor.addResponseInterceptor((response) => {
    // 处理响应数据
    if (response.data) {
        response.data = transformData(response.data);
    }
    return response;
});

// 添加自定义错误拦截器
apiInterceptor.addErrorInterceptor((error) => {
    // 自定义错误处理
    if (error.status === 401) {
        // 跳转到登录页
        window.location.href = '/login.html';
    }
    return error;
});

// ==================== 辅助函数 ====================
function renderHotelDetail(hotel) {
    // 渲染酒店详情的实现
}

function renderReviews(reviews) {
    // 渲染评论列表的实现
}

function renderAttractionDetail(attraction) {
    // 渲染景点详情的实现
}

function displayRestaurantDetails(restaurant) {
    // 显示餐厅详情的实现
}

function displayReviews(reviews) {
    // 显示评论的实现
}

function renderSearchResults(results) {
    // 渲染搜索结果的实现
}

function renderHotelResults(hotels) {
    // 渲染酒店搜索结果的实现
}

function updateFavoriteButton(isFavorited) {
    // 更新收藏按钮状态的实现
}

function updateFavoriteUI(isFavorited) {
    // 更新收藏UI的实现
}

function renderFavoritesList(favorites) {
    // 渲染收藏列表的实现
}

function transformData(data) {
    // 数据转换的实现
    return data;
}

function getMockData() {
    // 返回模拟数据
    return {};
}
