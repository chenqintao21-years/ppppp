// 酒店相关API服务
import { get, post } from './api.js';

export const hotelsService = {
    // 搜索酒店
    searchHotels: async (searchParams) => {
        return await post('/hotels/search', searchParams);
    },

    // 获取酒店详情
    getHotelDetail: async (hotelId) => {
        return await get(`/hotels/${hotelId}`);
    },

    // 获取酒店评论
    getHotelReviews: async (hotelId, params = {}) => {
        return await get(`/hotels/${hotelId}/reviews`, params);
    },

    // 获取热门酒店
    getPopularHotels: async (params = {}) => {
        return await get('/hotels/popular', params);
    },

    // 获取最近浏览
    getRecentViews: async () => {
        return await get('/hotels/recent-views');
    },

    // 获取特色功能
    getFeatures: async () => {
        return await get('/hotels/features');
    },

    // 获取亚洲最佳酒店
    getAsiaBestHotels: async () => {
        return await get('/hotels/asia-best');
    },

    // 获取全包式度假酒店
    getAllInclusiveHotels: async () => {
        return await get('/hotels/all-inclusive');
    },

    // 预订酒店
    bookHotel: async (bookingData) => {
        return await post('/hotels/book', bookingData);
    }
};
