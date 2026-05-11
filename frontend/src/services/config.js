// API配置文件

// 根据环境变量确定API基础URL
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// API超时时间（毫秒）
export const API_TIMEOUT = 30000;

// 请求重试次数
export const MAX_RETRIES = 3;

// 分页默认配置
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// 缓存配置
export const CACHE = {
    ENABLED: true,
    TTL: 5 * 60 * 1000 // 5分钟
};

// 错误消息映射
export const ERROR_MESSAGES = {
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    TIMEOUT_ERROR: '请求超时，请稍后重试',
    AUTH_ERROR: '认证失败，请重新登录',
    NOT_FOUND: '请求的资源不存在',
    SERVER_ERROR: '服务器错误，请稍后重试',
    VALIDATION_ERROR: '数据验证失败',
    UNKNOWN_ERROR: '未知错误，请稍后重试'
};

// HTTP状态码映射
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

export default {
    API_BASE_URL,
    API_TIMEOUT,
    MAX_RETRIES,
    PAGINATION,
    CACHE,
    ERROR_MESSAGES,
    HTTP_STATUS
};
