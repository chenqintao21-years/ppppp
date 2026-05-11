// 城市自动导入服务
import { get, post } from './api.js';

export const cityAutoImportService = {
    /**
     * 自动搜索并导入城市数据
     * @param {Object} params - 参数
     * @param {string} params.city - 城市名称
     * @param {Object} params.location - 经纬度 {lng, lat}
     */
    autoImportCity: async (params) => {
        return await post('/city/auto-import', params);
    },

    /**
     * 获取当前位置
     */
    getCurrentLocation: async () => {
        return await get('/city/location');
    },

    /**
     * 搜索城市
     * @param {string} query - 搜索关键词
     */
    searchCity: async (query) => {
        return await post('/city/search', { query });
    },

    /**
     * 获取城市统计信息
     * @param {string} cityName - 城市名称
     */
    getCityStats: async (cityName) => {
        if (!cityName || cityName === '') {
            return {
                success: false,
                message: '城市名称不能为空'
            };
        }
        // URL编码城市名称，处理中文字符
        const encodedCity = encodeURIComponent(cityName);
        return await get(`/cities/stats/${encodedCity}`);
    },

    /**
     * 获取已导入的城市列表
     */
    getImportedCities: async () => {
        return await get('/cities/list');
    }
};
