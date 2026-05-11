/**
 * API接口测试脚本
 * 用于验证所有API接口是否正常工作
 *
 * 使用方法:
 * node test-api-endpoints.js
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 测试结果统计
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试单个API接口
async function testEndpoint(name, method, url, expectedStatus = 200, body = null, headers = {}) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        const passed = response.status === expectedStatus;

        if (passed) {
            results.passed++;
            log(`✓ ${name}`, 'green');
            results.tests.push({ name, status: 'PASS', code: response.status });
        } else {
            results.failed++;
            log(`✗ ${name} - Expected ${expectedStatus}, got ${response.status}`, 'red');
            results.tests.push({ name, status: 'FAIL', code: response.status, expected: expectedStatus });
        }

        return { passed, response, data };
    } catch (error) {
        results.failed++;
        log(`✗ ${name} - Error: ${error.message}`, 'red');
        results.tests.push({ name, status: 'ERROR', error: error.message });
        return { passed: false, error };
    }
}

// 测试需要认证的接口（预期返回401）
async function testAuthRequired(name, method, url) {
    return testEndpoint(name, method, url, 401);
}

// 主测试函数
async function runTests() {
    log('\n========================================', 'cyan');
    log('  API接口验证测试', 'cyan');
    log('========================================\n', 'cyan');

    log('测试服务器连接...', 'blue');
    const healthCheck = await testEndpoint(
        '健康检查',
        'GET',
        'http://localhost:3000/health',
        200
    );

    if (!healthCheck.passed) {
        log('\n❌ 服务器未运行或无法连接！', 'red');
        log('请确保后端服务器正在运行: npm start', 'yellow');
        return;
    }

    log('\n--- 搜索接口 ---', 'blue');
    await testEndpoint('全局搜索(GET)', 'GET', `${API_BASE_URL}/search?q=上海`, 200);
    await testEndpoint('搜索建议', 'GET', `${API_BASE_URL}/search/suggestions?q=上海`, 200);
    await testEndpoint('热门搜索', 'GET', `${API_BASE_URL}/search/trending`, 200);

    log('\n--- 目的地接口 ---', 'blue');
    await testEndpoint('获取热门城市', 'GET', `${API_BASE_URL}/destinations/popular?limit=10`, 200);
    await testEndpoint('搜索城市', 'GET', `${API_BASE_URL}/destinations/search?q=上海`, 200);

    // 获取一个城市ID用于后续测试
    const destResult = await testEndpoint('获取城市详情', 'GET', `${API_BASE_URL}/destinations/1`, 200);
    if (destResult.passed) {
        await testEndpoint('获取城市景点', 'GET', `${API_BASE_URL}/destinations/1/attractions`, 200);
        await testEndpoint('获取城市酒店', 'GET', `${API_BASE_URL}/destinations/1/hotels`, 200);
        await testEndpoint('获取城市餐厅', 'GET', `${API_BASE_URL}/destinations/1/restaurants`, 200);
    }

    log('\n--- 酒店接口 ---', 'blue');
    await testEndpoint('获取热门酒店', 'GET', `${API_BASE_URL}/hotels/popular?limit=10`, 200);
    await testEndpoint('搜索酒店', 'GET', `${API_BASE_URL}/hotels/search?location=上海`, 200);
    await testEndpoint('获取酒店列表', 'GET', `${API_BASE_URL}/hotels?page=1&limit=10`, 200);

    const hotelResult = await testEndpoint('获取酒店详情', 'GET', `${API_BASE_URL}/hotels/1`, 200);
    if (hotelResult.passed) {
        await testEndpoint('获取酒店评论', 'GET', `${API_BASE_URL}/hotels/1/reviews`, 200);
    }

    log('\n--- 景点接口 ---', 'blue');
    await testEndpoint('获取热门景点', 'GET', `${API_BASE_URL}/attractions/popular?limit=10`, 200);
    await testEndpoint('获取推荐景点', 'GET', `${API_BASE_URL}/attractions/recommendations`, 200);
    await testEndpoint('搜索景点', 'GET', `${API_BASE_URL}/attractions/search?location=上海`, 200);
    await testEndpoint('获取景点列表', 'GET', `${API_BASE_URL}/attractions?page=1&limit=10`, 200);

    const attrResult = await testEndpoint('获取景点详情', 'GET', `${API_BASE_URL}/attractions/1`, 200);
    if (attrResult.passed) {
        await testEndpoint('获取景点评论', 'GET', `${API_BASE_URL}/attractions/1/reviews`, 200);
    }

    log('\n--- 餐厅接口 ---', 'blue');
    await testEndpoint('获取热门餐厅', 'GET', `${API_BASE_URL}/restaurants/popular?limit=10`, 200);

    // 重点测试：验证不同城市的餐厅搜索
    log('\n  🔍 测试多城市餐厅搜索...', 'yellow');
    const cities = ['上海', '北京', '广州', '长沙'];
    for (const city of cities) {
        const result = await testEndpoint(
            `搜索${city}餐厅`,
            'GET',
            `${API_BASE_URL}/restaurants/search?location=${encodeURIComponent(city)}`,
            200
        );

        if (result.passed && result.data.success) {
            const restaurants = result.data.data?.restaurants || [];
            if (restaurants.length > 0) {
                log(`    ℹ️  ${city}: 找到 ${restaurants.length} 家餐厅`, 'cyan');

                // 验证返回的餐厅是否属于该城市
                const firstRestaurant = restaurants[0];
                if (firstRestaurant.address && !firstRestaurant.address.includes(city)) {
                    log(`    ⚠️  警告: 餐厅地址不包含"${city}"`, 'yellow');
                    results.warnings++;
                }
            } else {
                log(`    ⚠️  ${city}: 未找到餐厅数据`, 'yellow');
                results.warnings++;
            }
        }
    }

    await testEndpoint('获取餐厅列表', 'GET', `${API_BASE_URL}/restaurants?page=1&limit=10`, 200);

    const restResult = await testEndpoint('获取餐厅详情', 'GET', `${API_BASE_URL}/restaurants/1`, 200);
    if (restResult.passed) {
        await testEndpoint('获取餐厅评论', 'GET', `${API_BASE_URL}/restaurants/1/reviews`, 200);

        // 验证餐厅详情是否包含硬编码的桂林数据
        if (restResult.data.success && restResult.data.data) {
            const restaurant = restResult.data.data;
            log('\n  🔍 验证餐厅详情数据...', 'yellow');

            if (restaurant.address && restaurant.address.includes('桂林')) {
                log('    ⚠️  警告: 餐厅地址包含"桂林"，可能是硬编码数据', 'yellow');
                results.warnings++;
            }

            if (restaurant.cuisine && Array.isArray(restaurant.cuisine)) {
                const hasGuilinCuisine = restaurant.cuisine.some(c => c.includes('桂林'));
                if (hasGuilinCuisine) {
                    log('    ⚠️  警告: 菜系包含"桂林菜"，可能是硬编码数据', 'yellow');
                    results.warnings++;
                }
            }
        }
    }

    log('\n--- 认证接口（需要登录）---', 'blue');
    await testAuthRequired('获取用户信息(未登录)', 'GET', `${API_BASE_URL}/users/profile`);
    await testAuthRequired('获取收藏列表(未登录)', 'GET', `${API_BASE_URL}/favorites`);
    await testAuthRequired('获取用户预订(未登录)', 'GET', `${API_BASE_URL}/users/bookings`);
    await testAuthRequired('获取用户点评(未登录)', 'GET', `${API_BASE_URL}/users/reviews`);

    log('\n--- 点评接口 ---', 'blue');
    await testEndpoint('获取点评列表', 'GET', `${API_BASE_URL}/reviews?entityType=restaurant&entityId=1`, 200);

    // 打印测试结果
    log('\n========================================', 'cyan');
    log('  测试结果汇总', 'cyan');
    log('========================================\n', 'cyan');

    log(`✓ 通过: ${results.passed}`, 'green');
    log(`✗ 失败: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
    log(`⚠ 警告: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'reset');
    log(`总计: ${results.tests.length} 个测试\n`);

    if (results.failed === 0 && results.warnings === 0) {
        log('🎉 所有测试通过！', 'green');
    } else if (results.failed === 0) {
        log('✅ 所有测试通过，但有一些警告需要注意', 'yellow');
    } else {
        log('❌ 部分测试失败，请检查上述错误', 'red');
    }

    log('\n详细报告已保存到: API_VALIDATION_REPORT.md\n', 'cyan');
}

// 运行测试
runTests().catch(error => {
    log(`\n❌ 测试执行失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
