/**
 * 收藏功能测试
 * 测试所有收藏相关的API功能
 */

const BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = '';
let testUserId = null;
let testFavoriteId = null;

/**
 * 1. 用户认证
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
 * 2. 添加收藏
 */
async function testAddFavorite() {
    console.log('\n========== 测试添加收藏 ==========');

    const favoriteData = {
        entityType: 'attraction',
        entityId: 21
    };

    const res = await fetch(`${BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(favoriteData)
    });

    const result = await res.json();

    if (result.success) {
        testFavoriteId = result.data.favoriteId;
        console.log('✅ 添加收藏成功');
        console.log('   收藏ID:', result.data.favoriteId);
        console.log('   收藏状态:', result.data.isFavorited);
    } else {
        console.log('❌ 添加收藏失败:', result.message);
    }
}

/**
 * 3. 检查收藏状态
 */
async function testCheckFavoriteStatus() {
    console.log('\n========== 测试检查收藏状态 ==========');

    const res = await fetch(`${BASE_URL}/favorites/check?type=attraction&id=21`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const result = await res.json();

    if (result.success) {
        console.log('✅ 检查收藏状态成功');
        console.log('   是否已收藏:', result.data.isFavorited);
        console.log('   收藏ID:', result.data.favoriteId);
    } else {
        console.log('❌ 检查收藏状态失败:', result.message);
    }
}

/**
 * 4. 批量检查收藏状态
 */
async function testCheckFavoriteStatusBatch() {
    console.log('\n========== 测试批量检查收藏状态 ==========');

    const items = [
        { type: 'attraction', id: 21 },
        { type: 'attraction', id: 22 },
        { type: 'hotel', id: 1 },
        { type: 'restaurant', id: 1 }
    ];

    const res = await fetch(`${BASE_URL}/favorites/check-batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ items })
    });

    const result = await res.json();

    if (result.success) {
        console.log('✅ 批量检查收藏状态成功');
        Object.entries(result.data).forEach(([key, value]) => {
            console.log(`   ${key}: ${value.isFavorited ? '已收藏' : '未收藏'}`);
        });
    } else {
        console.log('❌ 批量检查收藏状态失败:', result.message);
    }
}

/**
 * 5. Toggle收藏
 */
async function testToggleFavorite() {
    console.log('\n========== 测试Toggle收藏 ==========');

    // 第一次Toggle（应该添加收藏）
    const res1 = await fetch(`${BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            entityType: 'hotel',
            entityId: 1
        })
    });

    const result1 = await res1.json();

    if (result1.success) {
        console.log('✅ 第一次Toggle成功:', result1.data.action);
        console.log('   收藏状态:', result1.data.isFavorited);
    } else {
        console.log('❌ 第一次Toggle失败:', result1.message);
    }

    // 第二次Toggle（应该取消收藏）
    const res2 = await fetch(`${BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            entityType: 'hotel',
            entityId: 1
        })
    });

    const result2 = await res2.json();

    if (result2.success) {
        console.log('✅ 第二次Toggle成功:', result2.data.action);
        console.log('   收藏状态:', result2.data.isFavorited);
    } else {
        console.log('❌ 第二次Toggle失败:', result2.message);
    }
}

/**
 * 6. 获取收藏列表
 */
async function testGetFavorites() {
    console.log('\n========== 测试获取收藏列表 ==========');

    // 添加多个收藏用于测试
    await fetch(`${BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ entityType: 'attraction', entityId: 22 })
    });

    await fetch(`${BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ entityType: 'restaurant', entityId: 1 })
    });

    // 获取所有收藏
    const res1 = await fetch(`${BASE_URL}/favorites`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const result1 = await res1.json();

    if (result1.success) {
        console.log('✅ 获取所有收藏成功');
        console.log('   总数:', result1.data.pagination.total);
        console.log('   当前页:', result1.data.favorites.length, '条');
    } else {
        console.log('❌ 获取所有收藏失败:', result1.message);
    }

    // 按类型筛选
    const res2 = await fetch(`${BASE_URL}/favorites?type=attraction`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const result2 = await res2.json();

    if (result2.success) {
        console.log('✅ 获取景点收藏成功');
        console.log('   景点收藏数:', result2.data.pagination.total);
    } else {
        console.log('❌ 获取景点收藏失败:', result2.message);
    }
}

/**
 * 7. 获取收藏统计
 */
async function testGetFavoriteStats() {
    console.log('\n========== 测试获取收藏统计 ==========');

    const res = await fetch(`${BASE_URL}/favorites/stats`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const result = await res.json();

    if (result.success) {
        console.log('✅ 获取收藏统计成功');
        console.log('   总收藏数:', result.data.total);
        console.log('   景点:', result.data.byType.attraction);
        console.log('   酒店:', result.data.byType.hotel);
        console.log('   餐厅:', result.data.byType.restaurant);
    } else {
        console.log('❌ 获取收藏统计失败:', result.message);
    }
}

/**
 * 8. 取消收藏
 */
async function testRemoveFavorite() {
    console.log('\n========== 测试取消收藏 ==========');

    if (!testFavoriteId) {
        console.log('⚠️  跳过测试：没有可用的收藏ID');
        return;
    }

    const res = await fetch(`${BASE_URL}/favorites/${testFavoriteId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const result = await res.json();

    if (result.success) {
        console.log('✅ 取消收藏成功');
        console.log('   收藏状态:', result.data.isFavorited);
    } else {
        console.log('❌ 取消收藏失败:', result.message);
    }
}

/**
 * 9. 分页测试
 */
async function testPagination() {
    console.log('\n========== 测试分页功能 ==========');

    const res = await fetch(`${BASE_URL}/favorites?page=1&limit=5`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const result = await res.json();

    if (result.success) {
        console.log('✅ 分页测试成功');
        console.log('   当前页:', result.data.pagination.page);
        console.log('   每页数量:', result.data.pagination.limit);
        console.log('   总数:', result.data.pagination.total);
        console.log('   总页数:', result.data.pagination.totalPages);
    } else {
        console.log('❌ 分页测试失败:', result.message);
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('========================================');
    console.log('       收藏功能测试');
    console.log('========================================');

    try {
        await testAuth();
        await testAddFavorite();
        await testCheckFavoriteStatus();
        await testCheckFavoriteStatusBatch();
        await testToggleFavorite();
        await testGetFavorites();
        await testGetFavoriteStats();
        await testRemoveFavorite();
        await testPagination();

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
