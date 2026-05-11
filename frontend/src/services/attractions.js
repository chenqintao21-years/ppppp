// 景点相关API服务
import { get, post } from './api.js';

export const attractionsService = {
    // 搜索景点
    searchAttractions: async (searchParams) => {
        return await post('/attractions/search', searchParams);
    },

    // 获取景点详情
    getAttractionDetail: async (attractionId) => {
        return await get(`/attractions/${attractionId}`);
    },

    // 获取热门景点
    getTrendingAttractions: async (params = {}) => {
        return await get('/attractions/trending', params);
    },

    // 获取推荐景点
    getRecommendations: async (params = {}) => {
        return await get('/attractions/recommendations', params);
    },

    // 获取热门目的地
    getPopularDestinations: async () => {
        return await get('/attractions/destinations');
    },

    // 收藏/取消收藏景点
    toggleFavorite: async (attractionId) => {
        return await post('/attractions/favorites', { attractionId });
    },

    // 预订景点
    bookAttraction: async (bookingData) => {
        return await post('/attractions/book', bookingData);
    },

    // 创建预订（新接口）
    createBooking: async (bookingData) => {
        return await post('/bookings', bookingData);
    },

    // 获取评论列表
    getReviews: async (params = {}) => {
        return await get('/reviews', params);
    },

    // 上传景点图片
    uploadImage: async (formData) => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/attractions/upload', {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });
        return await response.json();
    }
};
