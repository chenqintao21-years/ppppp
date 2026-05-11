import { post, get } from './api.js';

export const authService = {
    login: async (email, password, rememberMe = false) => {
        const data = await post('/auth/login', { email, password, rememberMe });

        if (data.success && data.data) {
            const { token, user } = data.data;
            if (rememberMe) {
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                sessionStorage.setItem('authToken', token);
                sessionStorage.setItem('user', JSON.stringify(user));
            }
        }

        return data;
    },

    register: async (username, email, password) => {
        const data = await post('/auth/register', { username, email, password });

        if (data.success && data.data) {
            const { token, user } = data.data;
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(user));
        }

        return data;
    },

    logout: async () => {
        try {
            await post('/auth/logout');
        } catch (error) {
            console.error('退出登录失败:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('user');
            window.location.href = 'index.html';
        }
    },

    verifyToken: async () => {
        try {
            const data = await get('/auth/verify');
            if (data.success && data.data && data.data.user) {
                authService.updateUser(data.data.user);
            }
            return data;
        } catch (error) {
            return { success: false, valid: false };
        }
    },

    getUserProfile: async () => {
        try {
            const data = await get('/users/profile');
            if (data.success && data.data) {
                authService.updateUser(data.data);
            }
            return data;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            throw error;
        }
    },

    updateUserProfile: async (updates) => {
        try {
            const data = await post('/users/profile', updates);
            if (data.success && data.data) {
                authService.updateUser(data.data);
            }
            return data;
        } catch (error) {
            console.error('更新用户信息失败:', error);
            throw error;
        }
    },

    getToken: () => {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    },

    getUser: () => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    updateUser: (user) => {
        const storage = localStorage.getItem('authToken') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(user));
    },

    isAuthenticated: () => {
        return !!authService.getToken();
    },

    requireAuth: (redirectUrl = '/views/auth.html') => {
        if (!authService.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },
};

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePassword = (password) => {
    return password.length >= 8;
};

export const validateUsername = (username) => {
    return username.length >= 3 && username.length <= 20;
};
