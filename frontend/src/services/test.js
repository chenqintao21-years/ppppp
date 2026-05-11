// API测试工具

import {
    authService,
    hotelsService,
    attractionsService,
    restaurantsService,
    commonService
} from './index.js';

class APITester {
    constructor() {
        this.results = [];
    }

    // 测试认证API
    async testAuth() {
        console.log('========== 测试认证API ==========');

        try {
            // 测试注册
            console.log('测试注册...');
            const registerResult = await authService.register(
                'testuser',
                'test@example.com',
                'password123'
            );
            this.logResult('注册', registerResult);

            // 测试登录
            console.log('测试登录...');
            const loginResult = await authService.login(
                'test@example.com',
                'password123',
                false
            );
            this.logResult('登录', loginResult);

            // 测试验证token
            console.log('测试验证token...');
            const verifyResult = await authService.verifyToken();
            this.logResult('验证token', verifyResult);

        } catch (error) {
            this.logError('认证测试', error);
        }
    }

    // 测试酒店API
    async testHotels() {
        console.log('========== 测试酒店API ==========');

        try {
            // 测试搜索酒店
            console.log('测试搜索酒店...');
            const searchResult = await hotelsService.searchHotels({
                destination: '巴黎',
                checkIn: '2026-05-01',
                checkOut: '2026-05-05',
                guests: 2
            });
            this.logResult('搜索酒店', searchResult);

            // 测试获取酒店详情
            console.log('测试获取酒店详情...');
            const detailResult = await hotelsService.getHotelDetail('1');
            this.logResult('酒店详情', detailResult);

            // 测试获取酒店评论
            console.log('测试获取酒店评论...');
            const reviewsResult = await hotelsService.getHotelReviews('1', {
                page: 1,
                limit: 10
            });
            this.logResult('酒店评论', reviewsResult);

            // 测试获取热门酒店
            console.log('测试获取热门酒店...');
            const popularResult = await hotelsService.getPopularHotels();
            this.logResult('热门酒店', popularResult);

        } catch (error) {
            this.logError('酒店测试', error);
        }
    }

    // 测试景点API
    async testAttractions() {
        console.log('========== 测试景点API ==========');

        try {
            // 测试搜索景点
            console.log('测试搜索景点...');
            const searchResult = await attractionsService.searchAttractions({
                destination: '巴黎',
                category: 'museum'
            });
            this.logResult('搜索景点', searchResult);

            // 测试获取景点详情
            console.log('测试获取景点详情...');
            const detailResult = await attractionsService.getAttractionDetail('louvre-museum');
            this.logResult('景点详情', detailResult);

            // 测试获取热门景点
            console.log('测试获取热门景点...');
            const trendingResult = await attractionsService.getTrendingAttractions();
            this.logResult('热门景点', trendingResult);

            // 测试获取推荐景点
            console.log('测试获取推荐景点...');
            const recommendResult = await attractionsService.getRecommendations();
            this.logResult('推荐景点', recommendResult);

        } catch (error) {
            this.logError('景点测试', error);
        }
    }

    // 测试餐厅API
    async testRestaurants() {
        console.log('========== 测试餐厅API ==========');

        try {
            // 测试搜索餐厅
            console.log('测试搜索餐厅...');
            const searchResult = await restaurantsService.searchRestaurants({
                location: '桂林',
                cuisine: '中餐'
            });
            this.logResult('搜索餐厅', searchResult);

            // 测试获取餐厅详情
            console.log('测试获取餐厅详情...');
            const detailResult = await restaurantsService.getRestaurantDetail('1');
            this.logResult('餐厅详情', detailResult);

            // 测试获取餐厅点评
            console.log('测试获取餐厅点评...');
            const reviewsResult = await restaurantsService.getRestaurantReviews('1');
            this.logResult('餐厅点评', reviewsResult);

        } catch (error) {
            this.logError('餐厅测试', error);
        }
    }

    // 测试通用API
    async testCommon() {
        console.log('========== 测试通用API ==========');

        try {
            // 测试全局搜索
            console.log('测试全局搜索...');
            const searchResult = await commonService.globalSearch({
                query: '巴黎',
                type: 'all'
            });
            this.logResult('全局搜索', searchResult);

            // 测试获取目的地
            console.log('测试获取目的地...');
            const destResult = await commonService.getDestinations();
            this.logResult('目的地列表', destResult);

            // 测试获取推荐
            console.log('测试获取推荐...');
            const recommendResult = await commonService.getRecommendations();
            this.logResult('推荐内容', recommendResult);

        } catch (error) {
            this.logError('通用测试', error);
        }
    }

    // 运行所有测试
    async runAllTests() {
        console.log('开始运行所有API测试...\n');

        await this.testAuth();
        await this.testHotels();
        await this.testAttractions();
        await this.testRestaurants();
        await this.testCommon();

        console.log('\n========== 测试完成 ==========');
        this.printSummary();
    }

    // 记录成功结果
    logResult(testName, result) {
        console.log(`✓ ${testName} 成功:`, result);
        this.results.push({ test: testName, status: 'success', data: result });
    }

    // 记录错误
    logError(testName, error) {
        console.error(`✗ ${testName} 失败:`, error.message);
        this.results.push({ test: testName, status: 'error', error: error.message });
    }

    // 打印测试摘要
    printSummary() {
        const total = this.results.length;
        const success = this.results.filter(r => r.status === 'success').length;
        const failed = this.results.filter(r => r.status === 'error').length;

        console.log(`\n总测试数: ${total}`);
        console.log(`成功: ${success}`);
        console.log(`失败: ${failed}`);
        console.log(`成功率: ${((success / total) * 100).toFixed(2)}%`);
    }
}

// 导出测试器实例
export const apiTester = new APITester();

// 在浏览器控制台中使用：
// import { apiTester } from './services/test.js';
// apiTester.runAllTests();

export default apiTester;
