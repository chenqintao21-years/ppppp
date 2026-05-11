// 导航工具函数
// 统一管理页面跳转和导航逻辑

const Navigation = {
    // 跳转到首页
    toHome() {
        window.location.href = 'index.html';
    },

    // 跳转到景点列表
    toAttractions() {
        window.location.href = 'attractions.html';
    },

    // 跳转到景点搜索
    toAttractionSearch(params = {}) {
        const query = new URLSearchParams(params).toString();
        window.location.href = `attractions-search.html${query ? '?' + query : ''}`;
    },

    // 跳转到景点详情
    toAttractionDetail(id) {
        window.location.href = `attraction-detail.html?id=${encodeURIComponent(id)}`;
    },

    // 跳转到餐厅列表
    toRestaurants() {
        window.location.href = 'restaurant.html';
    },

    // 跳转到餐厅搜索
    toRestaurantSearch(params = {}) {
        const query = new URLSearchParams(params).toString();
        window.location.href = `restaurant-search.html${query ? '?' + query : ''}`;
    },

    // 跳转到餐厅详情
    toRestaurantDetail(id) {
        window.location.href = `restaurant-detail.html?id=${encodeURIComponent(id)}`;
    },

    // 跳转到酒店列表
    toHotels() {
        window.location.href = 'hotel-page.html';
    },

    // 跳转到酒店详情
    toHotelDetail(id) {
        window.location.href = `hotel-detail.html?id=${encodeURIComponent(id)}`;
    },

    // 跳转到目的地页面
    toDestination(name) {
        window.location.href = `destination.html?name=${encodeURIComponent(name)}`;
    },

    // 跳转到登录页
    toLogin() {
        window.location.href = 'login.html';
    },

    // 跳转到注册页
    toRegister() {
        window.location.href = 'register.html';
    },

    // 返回上一页
    back() {
        window.history.back();
    },

    // 刷新当前页
    reload() {
        window.location.reload();
    },

    // 通用搜索跳转
    search(query, type = 'all') {
        const params = { query };

        switch(type) {
            case 'attractions':
                this.toAttractionSearch({ location: query });
                break;
            case 'restaurants':
                this.toRestaurantSearch({ location: query });
                break;
            case 'hotels':
                this.toHotels();
                break;
            default:
                this.toRestaurantSearch({ location: query });
        }
    }
};

// 导出为全局对象
if (typeof window !== 'undefined') {
    window.Navigation = Navigation;
}

export default Navigation;
