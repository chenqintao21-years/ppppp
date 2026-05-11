// 通用API服务
import { get, post } from './api.js';

export const commonService = {
    // 全局搜索
    globalSearch: async (searchParams) => {
        return await post('/search', searchParams);
    },

    // 获取目的地列表
    getDestinations: async (params = {}) => {
        return await get('/destinations', params);
    },

    // 获取推荐内容
    getRecommendations: async (params = {}) => {
        return await get('/recommendations', params);
    },

    // 添加收藏
    addFavorite: async (favoriteData) => {
        return await post('/favorites', {
            ...favoriteData,
            action: 'add'
        });
    },

    // 移除收藏
    removeFavorite: async (favoriteData) => {
        return await post('/favorites', {
            ...favoriteData,
            action: 'remove'
        });
    },

    // 获取收藏列表
    getFavorites: async (params = {}) => {
        return await get('/favorites', params);
    }
};
