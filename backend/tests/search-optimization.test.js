/**
 * 优化搜索功能测试脚本
 * 测试新增的搜索功能和优化
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 测试结果统计
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(name, url, options = {}) {
    testResults.total++;
    log(`\n📝 测试: ${name}`, 'cyan');

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        log(`   状态码: ${response.status}`, response.ok ? 'green' : 'red');

        const preview = JSON.stringify(data, null, 2);
        log(`   响应: ${preview.substring(0, 300)}${preview.length > 300 ? '...' : ''}`, 'reset');

        if (response.ok && data.success !== false) {
            testResults.passed++;
            log(`   ✅ 通过`, 'green');
            return { success: true, data };
        } else {
            testResults.failed++;
            testResults.errors.push({ name, error: data.error || data.message });
            log(`   ❌ 失败: ${data.error || data.message}`, 'red');
            return { success: false, data };
        }
    } catch (error) {
        testResults.failed++;
        testResults.errors.push({ name, error: error.message });
        log(`   ❌ 错误: ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('\n🚀 开始测试优化后的搜索功能', 'blue');
    log('='.repeat(70), 'blue');

    // 1. 基础搜索测试
    log('\n🔍 1. 基础搜索功能测试', 'yellow');

    await testAPI(
        '搜索 - 无参数（显示所有）',
        '/attractions/search'
    );

    await testAPI(
        '搜索 - 关键词（博物馆）',
        '/attractions/search?keyword=博物馆'
    );

    await testAPI(
        '搜索 - 位置（巴黎）',
        '/attractions/search?location=巴黎'
    );

    // 2. 分页测试
    log('\n📄 2. 分页功能测试', 'yellow');

    await testAPI(
        '分页 - 第1页，每页5条',
        '/attractions/search?page=1&limit=5'
    );

    await testAPI(
        '分页 - 第2页，每页5条',
        '/attractions/search?page=2&limit=5'
    );

    // 3. 价格过滤测试
    log('\n💰 3. 价格过滤测试', 'yellow');

    await testAPI(
        '价格过滤 - 最低价格20',
        '/attractions/search?minPrice=20'
    );

    await testAPI(
        '价格过滤 - 最高价格30',
        '/attractions/search?maxPrice=30'
    );

    await testAPI(
        '价格过滤 - 价格区间20-40',
        '/attractions/search?minPrice=20&maxPrice=40'
    );

    // 4. 评分过滤测试
    log('\n⭐ 4. 评分过滤测试', 'yellow');

    await testAPI(
        '评分过滤 - 最低4.5分',
        '/attractions/search?minRating=4.5'
    );

    await testAPI(
        '评分过滤 - 最低4.8分',
        '/attractions/search?minRating=4.8'
    );

    // 5. 排序测试
    log('\n🔢 5. 排序功能测试', 'yellow');

    await testAPI(
        '排序 - 按评分',
        '/attractions/search?sortBy=rating'
    );

    await testAPI(
        '排序 - 按价格（低到高）',
        '/attractions/search?sortBy=price'
    );

    await testAPI(
        '排序 - 按价格（高到低）',
        '/attractions/search?sortBy=price_desc'
    );

    await testAPI(
        '排序 - 按评论数',
        '/attractions/search?sortBy=reviews'
    );

    await testAPI(
        '排序 - 按相关性',
        '/attractions/search?keyword=塔&sortBy=relevance'
    );

    // 6. 组合过滤测试
    log('\n🎯 6. 组合过滤测试', 'yellow');

    await testAPI(
        '组合 - 位置+价格+评分',
        '/attractions/search?location=法国&minPrice=20&maxPrice=50&minRating=4.5'
    );

    await testAPI(
        '组合 - 关键词+排序+分页',
        '/attractions/search?keyword=博物馆&sortBy=rating&page=1&limit=3'
    );

    // 7. 搜索建议测试
    log('\n💡 7. 搜索建议功能测试', 'yellow');

    await testAPI(
        '搜索建议 - 查询"巴"',
        '/attractions/suggestions?q=巴'
    );

    await testAPI(
        '搜索建议 - 查询"博物"',
        '/attractions/suggestions?q=博物'
    );

    await testAPI(
        '搜索建议 - 查询"塔"',
        '/attractions/suggestions?q=塔&limit=3'
    );

    await testAPI(
        '搜索建议 - 查询太短（1个字符）',
        '/attractions/suggestions?q=a'
    );

    // 8. 过滤器选项测试
    log('\n🎛️  8. 过滤器选项测试', 'yellow');

    await testAPI(
        '获取所有过滤器选项',
        '/attractions/filters'
    );

    // 9. 边界测试
    log('\n🔬 9. 边界条件测试', 'yellow');

    await testAPI(
        '边界 - 超大页码',
        '/attractions/search?page=999'
    );

    await testAPI(
        '边界 - 负数价格',
        '/attractions/search?minPrice=-10'
    );

    await testAPI(
        '边界 - 超大评分',
        '/attractions/search?minRating=10'
    );

    // 10. 性能测试
    log('\n⚡ 10. 性能测试', 'yellow');

    const startTime = Date.now();
    await testAPI(
        '性能 - 复杂查询',
        '/attractions/search?keyword=博物馆&location=法国&minPrice=10&maxPrice=100&minRating=4.0&sortBy=relevance&page=1&limit=20'
    );
    const endTime = Date.now();
    log(`   响应时间: ${endTime - startTime}ms`, endTime - startTime < 500 ? 'green' : 'yellow');

    // 输出测试结果
    log('\n' + '='.repeat(70), 'blue');
    log('📊 测试结果统计', 'blue');
    log('='.repeat(70), 'blue');
    log(`总测试数: ${testResults.total}`, 'cyan');
    log(`通过: ${testResults.passed}`, 'green');
    log(`失败: ${testResults.failed}`, 'red');
    log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'yellow');

    if (testResults.errors.length > 0) {
        log('\n❌ 失败的测试:', 'red');
        testResults.errors.forEach((err, index) => {
            log(`   ${index + 1}. ${err.name}`, 'red');
            log(`      错误: ${err.error}`, 'reset');
        });
    }

    log('\n✨ 测试完成!', 'blue');
    log('='.repeat(70), 'blue');

    // 输出功能总结
    log('\n📋 新增功能总结:', 'magenta');
    log('   ✅ 智能相关性评分', 'green');
    log('   ✅ 分页支持', 'green');
    log('   ✅ 价格范围过滤', 'green');
    log('   ✅ 评分过滤', 'green');
    log('   ✅ 多种排序方式', 'green');
    log('   ✅ 搜索建议/自动补全', 'green');
    log('   ✅ 过滤器选项API', 'green');
    log('   ✅ 组合过滤', 'green');
}

runTests().catch(error => {
    log(`\n💥 测试运行失败: ${error.message}`, 'red');
    process.exit(1);
});
