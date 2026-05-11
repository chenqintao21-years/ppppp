/**
 * 景点 API 测试脚本
 * 测试所有景点相关的 API 端点
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
    cyan: '\x1b[36m'
};

// 日志函数
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试辅助函数
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
        log(`   响应: ${JSON.stringify(data, null, 2).substring(0, 200)}...`, 'reset');

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

// 主测试函数
async function runTests() {
    log('\n🚀 开始测试景点 API', 'blue');
    log('='.repeat(60), 'blue');

    // 1. 测试搜索景点
    log('\n📍 1. 搜索景点测试', 'yellow');
    await testAPI(
        '搜索景点 - 无参数',
        '/attractions/search'
    );

    await testAPI(
        '搜索景点 - 关键词搜索',
        '/attractions/search?keyword=故宫'
    );

    await testAPI(
        '搜索景点 - 按类型搜索',
        '/attractions/search?type=museum'
    );

    await testAPI(
        '搜索景点 - 按位置搜索',
        '/attractions/search?location=北京'
    );

    await testAPI(
        '搜索景点 - 组合搜索',
        '/attractions/search?keyword=长城&location=北京'
    );

    // 2. 测试获取热门景点
    log('\n🔥 2. 热门景点测试', 'yellow');
    await testAPI(
        '获取热门景点',
        '/attractions/trending'
    );

    // 3. 测试获取推荐景点
    log('\n⭐ 3. 推荐景点测试', 'yellow');
    await testAPI(
        '获取推荐景点 - 无参数',
        '/attractions/recommendations'
    );

    await testAPI(
        '获取推荐景点 - 指定位置',
        '/attractions/recommendations?location=北京'
    );

    // 4. 测试获取热门目的地
    log('\n🌍 4. 热门目的地测试', 'yellow');
    await testAPI(
        '获取热门目的地',
        '/attractions/destinations'
    );

    // 5. 测试获取景点详情
    log('\n📋 5. 景点详情测试', 'yellow');

    // 先获取一个有效的景点ID
    const searchResult = await testAPI(
        '获取景点列表（用于获取有效ID）',
        '/attractions/search'
    );

    const validId = searchResult.data?.data?.[0]?.id || 1;

    await testAPI(
        `获取景点详情 - ID: ${validId}`,
        `/attractions/${validId}`
    );

    await testAPI(
        '获取景点详情 - 不存在的ID',
        '/attractions/99999'
    );

    // 6. 测试收藏功能
    log('\n❤️  6. 收藏功能测试', 'yellow');

    // 获取有效的用户ID
    const usersResult = await fetch(`${API_BASE_URL}/../health`);
    const validUserId = 5; // 从数据库获取的实际用户ID

    await testAPI(
        '添加收藏',
        '/attractions/favorites',
        {
            method: 'POST',
            body: JSON.stringify({
                attractionId: validId,
                userId: validUserId,
                action: 'add'
            })
        }
    );

    await testAPI(
        '移除收藏',
        '/attractions/favorites',
        {
            method: 'POST',
            body: JSON.stringify({
                attractionId: validId,
                userId: validUserId,
                action: 'remove'
            })
        }
    );

    await testAPI(
        '收藏 - 缺少参数',
        '/attractions/favorites',
        {
            method: 'POST',
            body: JSON.stringify({
                attractionId: 1
            })
        }
    );

    // 7. 测试预订功能
    log('\n🎫 7. 预订功能测试', 'yellow');
    await testAPI(
        '创建预订 - 完整信息',
        '/bookings',
        {
            method: 'POST',
            body: JSON.stringify({
                attractionId: 1,
                attractionName: '故宫博物院',
                date: '2026-05-15',
                travelers: 2,
                price: 60
            })
        }
    );

    await testAPI(
        '创建预订 - 缺少必填字段',
        '/bookings',
        {
            method: 'POST',
            body: JSON.stringify({
                attractionId: 1
            })
        }
    );

    // 8. 测试评论功能
    log('\n💬 8. 评论功能测试', 'yellow');
    await testAPI(
        '获取评论列表 - 无参数',
        '/reviews'
    );

    await testAPI(
        '获取评论列表 - 指定景点',
        '/reviews?attractionId=1'
    );

    await testAPI(
        '获取评论列表 - 分页',
        '/reviews?attractionId=1&offset=0&limit=5'
    );

    // 9. 测试图片上传
    log('\n📸 9. 图片上传测试', 'yellow');
    await testAPI(
        '上传图片 - 有景点ID',
        '/attractions/upload',
        {
            method: 'POST',
            body: JSON.stringify({
                attractionId: 1
            })
        }
    );

    await testAPI(
        '上传图片 - 缺少景点ID',
        '/attractions/upload',
        {
            method: 'POST',
            body: JSON.stringify({})
        }
    );

    // 10. 测试健康检查
    log('\n🏥 10. 健康检查测试', 'yellow');
    await testAPI(
        '服务器健康检查',
        '/../health'
    );

    // 输出测试结果
    log('\n' + '='.repeat(60), 'blue');
    log('📊 测试结果统计', 'blue');
    log('='.repeat(60), 'blue');
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
    log('='.repeat(60), 'blue');
}

// 运行测试
runTests().catch(error => {
    log(`\n💥 测试运行失败: ${error.message}`, 'red');
    process.exit(1);
});
