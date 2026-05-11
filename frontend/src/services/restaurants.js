// 餐厅相关API服务
import { get, post } from './api.js';

export const restaurantsService = {
    // 搜索餐厅
    searchRestaurants: async (params = {}) => {
        return await get('/restaurants/search', params);
    },

    // 获取餐厅详情
    getRestaurantDetail: async (restaurantId) => {
        return await get(`/restaurants/${restaurantId}`);
    },

    // 获取餐厅点评
    getRestaurantReviews: async (restaurantId, params = {}) => {
        return await get(`/restaurants/${restaurantId}/reviews`, params);
    },

    // 获取搜索建议
    getSearchSuggestions: async (params = {}) => {
        return await get('/restaurants/suggestions', params);
    },

    // 创建餐厅预订
    createRestaurantBooking: async (bookingData) => {
        return await post('/bookings/restaurant', bookingData);
    },

    // 获取附近餐厅
    getNearbyRestaurants: async (restaurantId, params = {}) => {
        return await get(`/restaurants/${restaurantId}/nearby`, params);
    }
};
