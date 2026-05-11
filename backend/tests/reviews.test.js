/**
 * 点评系统测试
 * 测试所有点评相关的API功能
 */

const BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = '';
let testUserId = null;
let testReviewId = null;

/**
 * 1. 用户注册和登录
 */
async function testAuth() {
    console.log('\n========== 测试用户认证 ==========');

    // 注册测试用户
    const registerData = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test123456'
    };

    try {
        const registerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });
        const registerResult = await registerRes.json();

        if (registerResult.success) {
            // 注册成功，直接使用返回的token
            authToken = registerResult.data.token;
            testUserId = registerResult.data.user.id;
            console.log('✅ 注册成功:', registerResult.data.user.username);
            return;
        }
    } catch (error) {
        console.log('⚠️  注册失败，尝试登录...');
    }

    // 如果注册失败，尝试登录
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: registerData.username,
            password: registerData.password
        })
    });
    const loginResult = await loginRes.json();

    if (loginResult.success) {
        authToken = loginResult.data.token;
        testUserId = loginResult.data.user.id;
        console.log('✅ 登录成功');
    } else {
        console.error('登录失败:', loginResult.message);
        throw new Error('登录失败: ' + loginResult.message);
    }
}

/**
 * 2. 发布点评
 */
async function testCreateReview() {
    console.log('\n========== 测试发布点评 ==========');

    const reviewData = {
        entityType: 'attraction',
        entityId: 21,
        rating: 4.5,
        title: '非常棒的体验！',
        content: '这是一个很棒的景点，风景优美，服务周到。强烈推荐给大家！',
        photos: [
            'https://example.com/photo1.jpg',
            'https://example.com/photo2.jpg'
        ]
    };

    const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(reviewData)
    });

    const result = await res.json();

    if (result.success) {
        testReviewId = result.data.id;
        console.log('✅ 发布点评成功');
        console.log('   点评ID:', result.data.id);
        console.log('   评分:', result.data.rating);
        console.log('   标题:', result.data.title);
    } else {
        console.log('❌ 发布点评失败:', result.message);
    }
}

/**
 * 3. 获取点评列表（不同排序方式）
 */
async function testGetReviews() {
    console.log('\n========== 测试获取点评列表 ==========');

    // 测试不同的排序方式
    const sortOptions = ['recent', 'helpful', 'rating_high', 'rating_low'];

    for (const sort of sortOptions) {
        const res = await fetch(`${BASE_URL}/attractions/21/reviews?sort=${sort}&limit=5`);
        const result = await res.json();

        if (result.success) {
            console.log(`✅ 获取点评列表成功 (排序: ${sort})`);
            console.log(`   总数: ${result.data.pagination.total}`);
            console.log(`   当前页: ${result.data.reviews.length} 条`);
        } else {
            console.log(`❌ 获取点评列表失败 (排序: ${sort}):`, result.message);
        }
    }
}

/**
 * 4. 按评分筛选点评
 */
async function testFilterReviews() {
    console.log('\n========== 测试按评分筛选点评 ==========');

    const ratings = [5, 4, 3, 2, 1];

    for (const rating of ratings) {
        const res = await fetch(`${BASE_URL}/attractions/21/reviews?rating=${rating}`);
        const result = await res.json();

        if (result.success) {
            console.log(`✅ 筛选 ${rating} 星点评成功: ${result.data.pagination.total} 条`);
        } else {
            console.log(`❌ 筛选点评失败:`, result.message);
        }
    }
}

/**
 * 5. 获取点评详情
 */
async function testGetReviewDetail() {
    console.log('\n========== 测试获取点评详情 ==========');

    if (!testReviewId) {
        console.log('⚠️  跳过测试：没有可用的点评ID');
        return;
    }

    const res = await fetch(`${BASE_URL}/reviews/${testReviewId}`);
    const result = await res.json();

    if (result.success) {
        console.log('✅ 获取点评详情成功');
        console.log('   标题:', result.data.title);
        console.log('   评分:', result.data.rating);
        console.log('   点赞数:', result.data.helpful_count);
        console.log('   回复数:', result.data.replies.length);
    } else {
        console.log('❌ 获取点评详情失败:', result.message);
    }
}

/**
 * 6. 点评点赞
 */
async function testMarkHelpful() {
    console.log('\n========== 测试点评点赞 ==========');

    if (!testReviewId) {
        console.log('⚠️  跳过测试：没有可用的点评ID');
        return;
    }

    // 点赞
    const res1 = await fetch(`${BASE_URL}/reviews/${testReviewId}/helpful`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    const result1 = await res1.json();

    if (result1.success) {
        console.log('✅ 点赞成功:', result1.message);
    } else {
        console.log('❌ 点赞失败:', result1.message);
    }

    // 取消点赞
    const res2 = await fetch(`${BASE_URL}/reviews/${testReviewId}/helpful`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    const result2 = await res2.json();

    if (result2.success) {
        console.log('✅ 取消点赞成功:', result2.message);
    } else {
        console.log('❌ 取消点赞失败:', result2.message);
    }
}

/**
 * 7. 回复点评
 */
async function testReplyToReview() {
    console.log('\n========== 测试回复点评 ==========');

    if (!testReviewId) {
        console.log('⚠️  跳过测试：没有可用的点评ID');
        return;
    }

    // 普通用户回复
    const replyData1 = {
        content: '感谢分享！我也想去看看。'
    };

    const res1 = await fetch(`${BASE_URL}/reviews/${testReviewId}/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(replyData1)
    });
    const result1 = await res1.json();

    if (result1.success) {
        console.log('✅ 用户回复成功');
        console.log('   回复内容:', result1.data.content);
    } else {
        console.log('❌ 用户回复失败:', result1.message);
    }

    // 商家回复
    const replyData2 = {
        content: '感谢您的好评！期待您的再次光临。',
        isOwner: true
    };

    const res2 = await fetch(`${BASE_URL}/reviews/${testReviewId}/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(replyData2)
    });
    const result2 = await res2.json();

    if (result2.success) {
        console.log('✅ 商家回复成功');
        console.log('   回复内容:', result2.data.content);
    } else {
        console.log('❌ 商家回复失败:', result2.message);
    }
}

/**
 * 8. 举报点评
 */
async function testReportReview() {
    console.log('\n========== 测试举报点评 ==========');

    if (!testReviewId) {
        console.log('⚠️  跳过测试：没有可用的点评ID');
        return;
    }

    const reportData = {
        reason: 'spam',
        description: '这是一条测试举报'
    };

    const res = await fetch(`${BASE_URL}/reviews/${testReviewId}/report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(reportData)
    });
    const result = await res.json();

    if (result.success) {
        console.log('✅ 举报成功:', result.message);
    } else {
        console.log('❌ 举报失败:', result.message);
    }
}

/**
 * 9. 获取点评统计
 */
async function testGetReviewStats() {
    console.log('\n========== 测试获取点评统计 ==========');

    const res = await fetch(`${BASE_URL}/attractions/21/reviews/stats`);
    const result = await res.json();

    if (result.success) {
        console.log('✅ 获取点评统计成功');
        console.log('   总点评数:', result.data.total);
        console.log('   平均评分:', result.data.averageRating);
        console.log('   评分分布:');
        for (let i = 5; i >= 1; i--) {
            const dist = result.data.ratingDistribution[i];
            console.log(`     ${i}星: ${dist.count} 条 (${dist.percentage}%)`);
        }
    } else {
        console.log('❌ 获取点评统计失败:', result.message);
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('========================================');
    console.log('       点评系统功能测试');
    console.log('========================================');

    try {
        await testAuth();
        await testCreateReview();
        await testGetReviews();
        await testFilterReviews();
        await testGetReviewDetail();
        await testMarkHelpful();
        await testReplyToReview();
        await testReportReview();
        await testGetReviewStats();

        console.log('\n========================================');
        console.log('       测试完成！');
        console.log('========================================\n');
    } catch (error) {
        console.error('\n❌ 测试过程中出现错误:', error.message);
        console.error(error.stack);
    }
}

// 运行测试
runAllTests();
