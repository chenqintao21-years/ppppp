// API拦截器和中间件

class APIInterceptor {
    constructor() {
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];
    }

    // 添加请求拦截器
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    // 添加响应拦截器
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    // 添加错误拦截器
    addErrorInterceptor(interceptor) {
        this.errorInterceptors.push(interceptor);
    }

    // 执行请求拦截器
    async executeRequestInterceptors(config) {
        let modifiedConfig = { ...config };
        for (const interceptor of this.requestInterceptors) {
            modifiedConfig = await interceptor(modifiedConfig);
        }
        return modifiedConfig;
    }

    // 执行响应拦截器
    async executeResponseInterceptors(response) {
        let modifiedResponse = response;
        for (const interceptor of this.responseInterceptors) {
            modifiedResponse = await interceptor(modifiedResponse);
        }
        return modifiedResponse;
    }

    // 执行错误拦截器
    async executeErrorInterceptors(error) {
        let modifiedError = error;
        for (const interceptor of this.errorInterceptors) {
            modifiedError = await interceptor(modifiedError);
        }
        return modifiedError;
    }
}

export const apiInterceptor = new APIInterceptor();

// 默认请求拦截器 - 添加时间戳
apiInterceptor.addRequestInterceptor((config) => {
    config.timestamp = Date.now();
    return config;
});

// 默认请求拦截器 - 日志记录
apiInterceptor.addRequestInterceptor((config) => {
    console.log(`[API Request] ${config.method} ${config.url}`, config.data);
    return config;
});

// 默认响应拦截器 - 日志记录
apiInterceptor.addResponseInterceptor((response) => {
    console.log(`[API Response]`, response);
    return response;
});

// 默认错误拦截器 - 统一错误处理
apiInterceptor.addErrorInterceptor((error) => {
    if (error.status === 401) {
        console.error('认证失败，请重新登录');
        // 可以在这里触发登录页面跳转
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
    } else if (error.status === 403) {
        console.error('没有权限访问该资源');
    } else if (error.status === 404) {
        console.error('请求的资源不存在');
    } else if (error.status >= 500) {
        console.error('服务器错误，请稍后重试');
    }
    return error;
});

export default apiInterceptor;
