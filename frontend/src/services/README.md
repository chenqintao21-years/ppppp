# API 服务使用指南

## 概述

前端API服务层提供了统一的接口调用方式，包含认证、酒店、景点、餐厅和通用服务。支持请求拦截、响应拦截、错误处理、缓存管理等高级功能。

## 目录结构

```
services/
├── index.js          # 统一导出
├── api.js            # 基础API配置和请求方法
├── auth.js           # 认证服务
├── hotels.js         # 酒店服务
├── attractions.js    # 景点服务
├── restaurants.js    # 餐厅服务
├── common.js         # 通用服务
├── config.js         # API配置
├── cache.js          # 缓存管理
├── interceptors.js   # 拦截器
├── examples.js       # 使用示例
├── test.js           # API测试工具
└── README.md         # 文档
```

## 核心特性

- ✅ 统一的API调用接口
- ✅ 自动token认证
- ✅ 请求/响应拦截器
- ✅ 智能缓存管理
- ✅ 错误统一处理
- ✅ 请求超时控制
- ✅ TypeScript友好
- ✅ 完整的使用示例

## 使用方法

### 1. 导入服务

```javascript
// 导入单个服务
import { authService } from './services/auth.js';
import { hotelsService } from './services/hotels.js';

// 或从index.js统一导入
import { authService, hotelsService, attractionsService } from './services/index.js';
```

### 2. 认证服务 (authService)

```javascript
// 用户登录
try {
    const result = await authService.login('user@example.com', 'password123', true);
    console.log('登录成功:', result);
} catch (error) {
    console.error('登录失败:', error.message);
}

// 用户注册
try {
    const result = await authService.register('username', 'user@example.com', 'password123');
    console.log('注册成功:', result);
} catch (error) {
    console.error('注册失败:', error.message);
}

// 验证token
const isValid = await authService.verifyToken();

// 退出登录
authService.logout();

// 检查是否已登录
if (authService.isAuthenticated()) {
    const user = authService.getUser();
    console.log('当前用户:', user);
}
```

### 3. 酒店服务 (hotelsService)

```javascript
// 搜索酒店
const hotels = await hotelsService.searchHotels({
    destination: '巴黎',
    checkIn: '2026-05-01',
    checkOut: '2026-05-05',
    guests: 2
});

// 获取酒店详情
const hotel = await hotelsService.getHotelDetail('hotel-123');

// 获取酒店评论
const reviews = await hotelsService.getHotelReviews('hotel-123', {
    page: 1,
    limit: 10
});

// 预订酒店
const booking = await hotelsService.bookHotel({
    hotelId: 'hotel-123',
    checkIn: '2026-05-01',
    checkOut: '2026-05-05',
    guests: 2,
    roomType: 'deluxe'
});
```

### 4. 景点服务 (attractionsService)

```javascript
// 搜索景点
const attractions = await attractionsService.searchAttractions({
    destination: '巴黎',
    category: 'museum',
    date: '2026-05-01'
});

// 获取景点详情
const attraction = await attractionsService.getAttractionDetail('louvre-museum');

// 获取热门景点
const trending = await attractionsService.getTrendingAttractions({
    limit: 10
});

// 收藏景点
await attractionsService.toggleFavorite('louvre-museum');

// 预订景点
const booking = await attractionsService.bookAttraction({
    attractionId: 'louvre-museum',
    date: '2026-05-01',
    travelers: 2,
    price: 21.00
});

// 获取评论
const reviews = await attractionsService.getReviews({
    attractionId: 'louvre-museum',
    offset: 0,
    limit: 10
});
```

### 5. 餐厅服务 (restaurantsService)

```javascript
// 搜索餐厅
const restaurants = await restaurantsService.searchRestaurants({
    location: '桂林',
    cuisine: '中餐',
    priceRange: '¥¥'
});

// 获取餐厅详情
const restaurant = await restaurantsService.getRestaurantDetail('restaurant-123');

// 获取餐厅点评
const reviews = await restaurantsService.getRestaurantReviews('restaurant-123', {
    page: 1,
    limit: 10
});

// 创建餐厅预订
const booking = await restaurantsService.createRestaurantBooking({
    restaurantId: 'restaurant-123',
    date: '2026-05-01',
    time: '19:00',
    guests: 4
});

// 获取附近餐厅
const nearby = await restaurantsService.getNearbyRestaurants('restaurant-123', {
    radius: 5
});
```

### 6. 通用服务 (commonService)

```javascript
// 全局搜索
const results = await commonService.globalSearch({
    query: '巴黎',
    type: 'all' // 'hotels', 'attractions', 'restaurants', 'all'
});

// 获取目的地列表
const destinations = await commonService.getDestinations();

// 获取推荐内容
const recommendations = await commonService.getRecommendations({
    type: 'popular'
});

// 添加收藏
await commonService.addFavorite({
    itemId: 'item-123',
    itemType: 'hotel' // 'hotel', 'attraction', 'restaurant'
});

// 移除收藏
await commonService.removeFavorite({
    itemId: 'item-123',
    itemType: 'hotel'
});

// 获取收藏列表
const favorites = await commonService.getFavorites({
    type: 'all'
});
```

## 错误处理

所有API调用都应该使用try-catch进行错误处理：

```javascript
try {
    const result = await hotelsService.searchHotels(params);
    // 处理成功结果
} catch (error) {
    console.error('API调用失败:', error.message);
    // 显示错误提示给用户
    alert('操作失败，请稍后重试');
}
```

## 认证机制

- API服务会自动从localStorage或sessionStorage获取token
- token会自动添加到请求头的Authorization字段
- 如果token过期，需要重新登录

## 高级功能

### 缓存管理

GET请求默认启用缓存（5分钟TTL）：

```javascript
import { get, apiCache } from './services/index.js';

// 使用缓存
const data = await get('/hotels/popular', {}, true);

// 禁用缓存
const freshData = await get('/hotels/popular', {}, false);

// 手动清除缓存
apiCache.clearAll();

// 清除特定缓存
apiCache.clear('/hotels/popular', {});
```

### 自定义拦截器

```javascript
import { apiInterceptor } from './services/index.js';

// 添加请求拦截器
apiInterceptor.addRequestInterceptor((config) => {
    config.headers['X-Custom'] = 'value';
    return config;
});

// 添加响应拦截器
apiInterceptor.addResponseInterceptor((response) => {
    // 处理响应数据
    return response;
});

// 添加错误拦截器
apiInterceptor.addErrorInterceptor((error) => {
    // 自定义错误处理
    return error;
});
```

### API测试

使用内置测试工具测试所有API：

```javascript
import { apiTester } from './services/test.js';

// 运行所有测试
await apiTester.runAllTests();

// 运行单个模块测试
await apiTester.testHotels();
await apiTester.testAttractions();
```

## 配置

在 `config.js` 中修改配置：

```javascript
export const API_BASE_URL = 'http://localhost:3000/api';
export const API_TIMEOUT = 30000; // 30秒
export const CACHE_TTL = 5 * 60 * 1000; // 5分钟
```

生产环境需要修改为实际的API地址。

## 完整示例

查看 `examples.js` 文件获取更多使用示例。

## 注意事项

1. 所有API调用都应使用try-catch进行错误处理
2. GET请求默认启用缓存，POST/PUT/DELETE会自动清除相关缓存
3. token会自动从localStorage或sessionStorage获取并添加到请求头
4. 401错误会自动清除token，需要重新登录
5. 请求超时时间为30秒，可在config.js中修改
