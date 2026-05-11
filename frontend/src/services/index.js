// 统一导出所有API服务
export { authService, validateEmail, validatePassword, validateUsername } from './auth.js';
export { hotelsService } from './hotels.js';
export { attractionsService } from './attractions.js';
export { restaurantsService } from './restaurants.js';
export { commonService } from './common.js';
export { get, post, put, del } from './api.js';
export { apiCache } from './cache.js';
export { apiInterceptor } from './interceptors.js';
export { default as config } from './config.js';
