const express = require('express');
const router = express.Router();

// 导入API模块
const authAPI = require('./auth');
const commonAPI = require('./common');
const hotelsAPI = require('./hotels');
const attractionsAPI = require('./attractions');
const restaurantsAPI = require('./restaurants');
const searchAPI = require('./search');
const usersAPI = require('./users');
const reviewsAPI = require('./reviews');
const favoritesAPI = require('./favorites');
const uploadAPI = require('./upload');
const destinationsAPI = require('./destinations');
const cityAutoImportAPI = require('./cityAutoImport');
const guigangHotelsAPI = require('./guigangHotels');

// ============ 认证接口 ============

// 用户注册
router.post('/auth/register', authAPI.register);
router.post('/users/register', authAPI.register);

// 用户登录
router.post('/auth/login', authAPI.login);
router.post('/users/login', authAPI.login);

// 验证令牌
router.get('/auth/verify', authAPI.verifyToken);

// 退出登录
router.post('/auth/logout', authAPI.logout);

// 用户信息
router.get('/users/profile', authAPI.authenticateToken, usersAPI.getUserProfile);
router.put('/users/profile', authAPI.authenticateToken, usersAPI.updateUserProfile);
router.put('/users/password', authAPI.authenticateToken, usersAPI.changePassword);
router.post('/users/avatar', authAPI.authenticateToken, uploadAPI.upload.single('avatar'), uploadAPI.uploadAvatar);

// 用户预订
router.get('/users/bookings', authAPI.authenticateToken, usersAPI.getUserBookings);
router.get('/bookings/:id', authAPI.authenticateToken, usersAPI.getBookingDetail);
router.delete('/bookings/:id', authAPI.authenticateToken, usersAPI.cancelBooking);

// 用户收藏（兼容旧接口）
router.get('/users/favorites', authAPI.authenticateToken, favoritesAPI.getFavorites);

// 用户点评
router.get('/users/reviews', authAPI.authenticateToken, usersAPI.getUserReviews);
router.put('/reviews/:id', authAPI.authenticateToken, usersAPI.updateReview);
router.delete('/reviews/:id', authAPI.authenticateToken, usersAPI.deleteReview);

// ============ 通用接口 ============

// 全局搜索
router.post('/search', commonAPI.globalSearch);

// ============ 搜索接口 ============

// 统一搜索建议
router.get('/search/suggestions', searchAPI.getUnifiedSearchSuggestions);

// 热门搜索
router.get('/search/trending', searchAPI.getTrendingSearches);

// 全局搜索（GET方式）
router.get('/search', searchAPI.globalSearch);

// ============ 收藏接口 ============

// 获取收藏列表（支持分类）
router.get('/favorites', authAPI.authenticateToken, favoritesAPI.getFavorites);

// 检查收藏状态
router.get('/favorites/check', authAPI.authenticateToken, favoritesAPI.checkFavoriteStatus);

// 批量检查收藏状态
router.post('/favorites/check-batch', authAPI.authenticateToken, favoritesAPI.checkFavoriteStatusBatch);

// 获取收藏统计
router.get('/favorites/stats', authAPI.authenticateToken, favoritesAPI.getFavoriteStats);

// Toggle收藏（推荐使用）
router.post('/favorites/toggle', authAPI.authenticateToken, favoritesAPI.toggleFavorite);

// 添加收藏
router.post('/favorites', authAPI.authenticateToken, favoritesAPI.addFavorite);

// 取消收藏
router.delete('/favorites/:id', authAPI.authenticateToken, favoritesAPI.removeFavorite);

// 目的地
router.get('/destinations', commonAPI.getDestinations);

// 推荐内容
router.get('/recommendations', commonAPI.getRecommendations);

// ============ 城市自动导入接口 ============

// 自动搜索并导入城市数据
router.post('/city/auto-import', cityAutoImportAPI.autoImportCityData);

// 获取当前位置
router.get('/city/location', cityAutoImportAPI.getCurrentLocation);

// 搜索城市
router.post('/city/search', cityAutoImportAPI.searchCity);

// 获取城市数据统计
router.get('/cities/stats/:cityName', cityAutoImportAPI.getCityStats);

// ============ 城市/目的地接口 ============

// 获取热门城市（必须在 :id 之前）
router.get('/destinations/popular', destinationsAPI.getPopularDestinations);

// 搜索城市
router.get('/destinations/search', destinationsAPI.searchDestinations);

// 获取城市详情
router.get('/destinations/:id', destinationsAPI.getDestinationDetail);

// 获取城市的景点列表
router.get('/destinations/:id/attractions', destinationsAPI.getDestinationAttractions);

// 获取城市的酒店列表
router.get('/destinations/:id/hotels', destinationsAPI.getDestinationHotels);

// 获取城市的餐厅列表
router.get('/destinations/:id/restaurants', destinationsAPI.getDestinationRestaurants);

// ============ 酒店接口 ============

// 获取热门酒店（必须在 :id 之前）
router.get('/hotels/popular', hotelsAPI.getPopularHotels);

// 获取贵港酒店
router.get('/hotels/guigang', guigangHotelsAPI.getGuigangHotels);

// 获取最近浏览
router.get('/hotels/recent-views', hotelsAPI.getRecentViews);

// 获取特色功能
router.get('/hotels/features', hotelsAPI.getFeatures);

// 获取亚洲最佳酒店
router.get('/hotels/asia-best', hotelsAPI.getAsiaBestHotels);

// 获取全包式度假酒店
router.get('/hotels/all-inclusive', hotelsAPI.getAllInclusiveHotels);

// 获取热门酒店链接
router.get('/hotels/popular-links', hotelsAPI.getPopularHotelLinks);

// 搜索酒店
router.get('/hotels/search', hotelsAPI.searchHotels);
router.post('/hotels/search', hotelsAPI.searchHotels);

// 获取酒店建议
router.get('/hotels/suggestions', hotelsAPI.getHotelSuggestions);

// 获取酒店列表
router.get('/hotels', hotelsAPI.getHotels);

// 获取酒店详情
router.get('/hotels/:id', hotelsAPI.getHotelDetail);

// 获取酒店评论
router.get('/hotels/:id/reviews', reviewsAPI.getReviews);

// 预订酒店
router.post('/hotels/book', hotelsAPI.bookHotel);

// ============ 景点玩乐接口 ============

// 获取热门景点（必须在 :id 之前）
router.get('/attractions/popular', attractionsAPI.getPopularAttractions);
router.get('/attractions/trending', attractionsAPI.getTrendingAttractions);

// 获取推荐景点
router.get('/attractions/recommendations', attractionsAPI.getRecommendations);

// 获取热门目的地
router.get('/attractions/destinations', attractionsAPI.getPopularDestinations);

// 搜索景点
router.get('/attractions/search', attractionsAPI.searchAttractions);

// 搜索建议
router.get('/attractions/suggestions', searchAPI.getSearchSuggestions);

// 获取搜索过滤器选项
router.get('/attractions/filters', searchAPI.getSearchFilters);

// 获取景点列表
router.get('/attractions', attractionsAPI.getAttractions);

// 获取景点分类
router.get('/attractions/categories', attractionsAPI.getAttractionCategories);

// 获取附近景点
router.get('/attractions/nearby', attractionsAPI.getNearbyAttractions);

// 收藏景点
router.post('/attractions/favorites', attractionsAPI.toggleFavorite);

// 获取景点详情
router.get('/attractions/:id', attractionsAPI.getAttractionDetail);

// 获取景点照片
router.get('/attractions/:id/photos', attractionsAPI.getAttractionPhotos);

// 获取景点营业时间
router.get('/attractions/:id/hours', attractionsAPI.getAttractionHours);

// 获取景点游览建议
router.get('/attractions/:id/tips', attractionsAPI.getAttractionTips);

// 获取景点评论
router.get('/attractions/:id/reviews', reviewsAPI.getReviews);

// 预订景点
router.post('/attractions/book', attractionsAPI.bookAttraction);

// 创建预订（新接口）
router.post('/bookings', attractionsAPI.bookAttraction);

// ============ 点评接口 ============

// 发布点评
router.post('/reviews', authAPI.authenticateToken, reviewsAPI.createReview);

// 获取点评列表
router.get('/reviews', reviewsAPI.getReviews);

// 获取点评详情
router.get('/reviews/:id', reviewsAPI.getReviewDetail);

// 更新点评
router.put('/reviews/:id', authAPI.authenticateToken, usersAPI.updateReview);

// 删除点评
router.delete('/reviews/:id', authAPI.authenticateToken, usersAPI.deleteReview);

// 点评点赞/有用
router.post('/reviews/:id/helpful', authAPI.authenticateToken, reviewsAPI.markReviewHelpful);

// 回复点评
router.post('/reviews/:id/reply', authAPI.authenticateToken, reviewsAPI.replyToReview);

// 举报点评
router.post('/reviews/:id/report', authAPI.authenticateToken, reviewsAPI.reportReview);

// 获取实体的点评列表（带排序和筛选）
router.get('/:entityType(attractions|hotels|restaurants)/:id/reviews', reviewsAPI.getReviews);

// 获取实体的点评统计
router.get('/:entityType(attractions|hotels|restaurants)/:id/reviews/stats', reviewsAPI.getReviewStats);

// ============ 图片上传接口 ============

// 上传头像
router.post('/upload/avatar', authAPI.authenticateToken, uploadAPI.upload.single('image'), uploadAPI.uploadAvatar);

// 上传点评图片（单张）
router.post('/upload/review', authAPI.authenticateToken, uploadAPI.upload.single('image'), uploadAPI.uploadReviewImage);

// 上传点评图片（多张）
router.post('/upload/reviews', authAPI.authenticateToken, uploadAPI.upload.array('images', 10), uploadAPI.uploadMultipleImages);

// 上传景点图片
router.post('/upload/attraction', authAPI.authenticateToken, uploadAPI.upload.single('image'), uploadAPI.uploadAttractionImage);

// 上传景点图片（多张）
router.post('/upload/attractions', authAPI.authenticateToken, uploadAPI.upload.array('images', 10), uploadAPI.uploadMultipleImages);

// 上传城市封面图片
router.post('/upload/destination', authAPI.authenticateToken, uploadAPI.upload.single('image'), uploadAPI.uploadDestinationImage);

// 获取图片信息
router.get('/upload/info', uploadAPI.getImageInfo);

// 删除图片
router.delete('/upload/image', authAPI.authenticateToken, uploadAPI.deleteImage);

// ============ 餐厅接口 ============

// 获取热门餐厅（必须在 :id 之前）
router.get('/restaurants/popular', restaurantsAPI.getPopularRestaurants);

// 搜索餐厅（必须在 :id 之前）
router.get('/restaurants/search', restaurantsAPI.searchRestaurants);

// 获取搜索建议
router.get('/restaurants/suggestions', restaurantsAPI.getRestaurantSuggestions);

// 获取附近餐厅（通用）
router.get('/restaurants/nearby', restaurantsAPI.getNearbyRestaurantsGeneric);

// 获取餐厅列表
router.get('/restaurants', restaurantsAPI.getRestaurants);

// 获取餐厅详情
router.get('/restaurants/:id', restaurantsAPI.getRestaurantDetail);

// 获取餐厅点评
router.get('/restaurants/:id/reviews', reviewsAPI.getReviews);

// 获取餐厅菜单
router.get('/restaurants/:id/menu', restaurantsAPI.getRestaurantMenu);

// 获取附近餐厅（特定餐厅）
router.get('/restaurants/:id/nearby', restaurantsAPI.getNearbyRestaurants);

// 预订餐厅
router.post('/restaurants/:id/book', restaurantsAPI.bookRestaurant);

// 创建餐厅预订
router.post('/bookings/restaurant', authAPI.authenticateToken, restaurantsAPI.createRestaurantBooking);

module.exports = router;
