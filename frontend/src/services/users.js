// 用户相关 API 服务
import { get, post, put, del } from './api.js';

// ============ 用户资料管理 ============

/**
 * 获取用户资料
 */
export const getUserProfile = () => {
    return get('/users/profile', {}, false); // 不缓存用户资料
};

/**
 * 更新用户资料
 */
export const updateProfile = (data) => {
    return put('/users/profile', data);
};

/**
 * 修改密码
 */
export const changePassword = (data) => {
    return put('/users/password', data);
};

/**
 * 上传头像
 */
export const uploadAvatar = async (formData) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    const response = await fetch('http://localhost:3000/api/users/avatar', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || '上传失败');
    }

    return data;
};

// ============ 预订管理 ============

/**
 * 获取用户的所有预订
 */
export const getUserBookings = (params = {}) => {
    return get('/users/bookings', params, false);
};

/**
 * 获取预订详情
 */
export const getBookingDetail = (bookingId) => {
    return get(`/bookings/${bookingId}`, {}, false);
};

/**
 * 取消预订
 */
export const cancelBooking = (bookingId) => {
    return del(`/bookings/${bookingId}`);
};

// ============ 收藏管理 ============

/**
 * 获取用户的所有收藏
 */
export const getUserFavorites = (params = {}) => {
    return get('/users/favorites', params, false);
};

/**
 * 添加收藏
 */
export const addFavorite = (data) => {
    return post('/favorites', data);
};

/**
 * 取消收藏（通过ID）
 */
export const removeFavorite = (favoriteId) => {
    return del(`/favorites/${favoriteId}`);
};

/**
 * 取消收藏（通过实体信息）
 */
export const removeFavoriteByEntity = (data) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    return fetch('http://localhost:3000/api/favorites/entity', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    }).then(res => res.json());
};

// ============ 点评管理 ============

/**
 * 获取用户的所有点评
 */
export const getUserReviews = (params = {}) => {
    return get('/users/reviews', params, false);
};

/**
 * 更新点评
 */
export const updateReview = (reviewId, data) => {
    return put(`/reviews/${reviewId}`, data);
};

/**
 * 删除点评
 */
export const deleteReview = (reviewId) => {
    return del(`/reviews/${reviewId}`);
};

// 导出所有方法
export const apiService = {
    // 用户资料
    getUserProfile,
    updateProfile,
    changePassword,
    uploadAvatar,

    // 预订管理
    getUserBookings,
    getBookingDetail,
    cancelBooking,

    // 收藏管理
    getUserFavorites,
    addFavorite,
    removeFavorite,
    removeFavoriteByEntity,

    // 点评管理
    getUserReviews,
    updateReview,
    deleteReview
};

export default apiService;
