// API 基础配置和通用请求方法
import { apiInterceptor } from './interceptors.js';
import { apiCache } from './cache.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30秒超时

// 请求拦截器 - 添加认证token
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// 超时处理
const fetchWithTimeout = (url, options, timeout = API_TIMEOUT) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('请求超时')), timeout)
        )
    ]);
};

// 通用请求处理
const request = async (url, options = {}) => {
    const config = {
        url,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body) : null,
        headers: options.headers
    };

    try {
        // 执行请求拦截器
        const modifiedConfig = await apiInterceptor.executeRequestInterceptors(config);

        const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || `请求失败: ${response.status}`);
            error.status = response.status;
            error.data = data;

            // 执行错误拦截器
            await apiInterceptor.executeErrorInterceptors(error);
            throw error;
        }

        // 执行响应拦截器
        const modifiedResponse = await apiInterceptor.executeResponseInterceptors(data);

        return modifiedResponse;
    } catch (error) {
        console.error('API请求错误:', error);

        // 执行错误拦截器
        if (!error.status) {
            await apiInterceptor.executeErrorInterceptors(error);
        }

        throw error;
    }
};

// GET 请求（支持缓存）
export const get = (url, params = {}, useCache = true) => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // 检查缓存
    if (useCache) {
        const cached = apiCache.get(fullUrl, params);
        if (cached) {
            console.log('[Cache Hit]', fullUrl);
            return Promise.resolve(cached);
        }
    }

    return request(fullUrl, { method: 'GET' }).then(data => {
        // 缓存GET请求结果
        if (useCache) {
            apiCache.set(fullUrl, params, data);
        }
        return data;
    });
};

// POST 请求
export const post = (url, data = {}) => {
    // POST请求后清除相关缓存
    apiCache.clear(url);

    return request(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

// PUT 请求
export const put = (url, data = {}) => {
    // PUT请求后清除相关缓存
    apiCache.clear(url);

    return request(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

// DELETE 请求
export const del = (url) => {
    // DELETE请求后清除相关缓存
    apiCache.clear(url);

    return request(url, { method: 'DELETE' });
};

export default {
    get,
    post,
    put,
    del
};
