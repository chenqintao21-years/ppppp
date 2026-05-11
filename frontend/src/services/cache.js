// API缓存管理

class APICache {
    constructor(ttl = 5 * 60 * 1000) { // 默认5分钟
        this.cache = new Map();
        this.ttl = ttl;
    }

    // 生成缓存key
    generateKey(url, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});
        return `${url}?${JSON.stringify(sortedParams)}`;
    }

    // 设置缓存
    set(url, params, data) {
        const key = this.generateKey(url, params);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // 获取缓存
    get(url, params) {
        const key = this.generateKey(url, params);
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // 检查是否过期
        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    // 清除指定缓存
    clear(url, params) {
        const key = this.generateKey(url, params);
        this.cache.delete(key);
    }

    // 清除所有缓存
    clearAll() {
        this.cache.clear();
    }

    // 清除过期缓存
    clearExpired() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

export const apiCache = new APICache();

// 定期清理过期缓存
setInterval(() => {
    apiCache.clearExpired();
}, 60 * 1000); // 每分钟清理一次

export default apiCache;
