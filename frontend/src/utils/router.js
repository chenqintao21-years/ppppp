// 路由管理工具
// 统一管理前端页面跳转

const Router = {
    // 路由配置
    routes: {
        // 主页
        home: 'index.html',

        // 认证相关
        login: 'login.html',
        register: 'register.html',

        // 景点相关
        attractions: 'attractions.html',
        attractionSearch: 'attractions-search.html',
        attractionDetail: 'attraction-detail.html',

        // 酒店相关
        hotels: 'hotel-page.html',
        hotelDetail: 'hotel-detail.html',

        // 餐厅相关
        restaurants: 'restaurant.html',
        restaurantSearch: 'restaurant-search.html',
        restaurantDetail: 'restaurant-detail.html',

        // 目的地
        destination: 'destination.html'
    },

    // 获取基础路径
    getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/views/')) {
            return '';
        }
        return '../views/';
    },

    // 跳转到指定页面
    navigate(routeName, params = {}) {
        const route = this.routes[routeName];
        if (!route) {
            console.error(`路由 "${routeName}" 不存在`);
            return;
        }

        let url = this.getBasePath() + route;

        // 添加查询参数
        const queryString = this.buildQueryString(params);
        if (queryString) {
            url += '?' + queryString;
        }

        window.location.href = url;
    },

    // 构建查询字符串
    buildQueryString(params) {
        return Object.keys(params)
            .filter(key => params[key] !== undefined && params[key] !== null)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    },

    // 获取URL参数
    getParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },

    // 获取单个参数
    getParam(key, defaultValue = null) {
        const params = this.getParams();
        return params[key] || defaultValue;
    },

    // 返回上一页
    back() {
        window.history.back();
    },

    // 刷新当前页面
    reload() {
        window.location.reload();
    },

    // 替换当前历史记录
    replace(routeName, params = {}) {
        const route = this.routes[routeName];
        if (!route) {
            console.error(`路由 "${routeName}" 不存在`);
            return;
        }

        let url = this.getBasePath() + route;
        const queryString = this.buildQueryString(params);
        if (queryString) {
            url += '?' + queryString;
        }

        window.location.replace(url);
    }
};

// 导出为全局对象
if (typeof window !== 'undefined') {
    window.Router = Router;
}

export default Router;
