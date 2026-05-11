const fs = require('fs');
const path = require('path');

/**
 * 图片上传功能测试
 *
 * 测试说明：
 * 1. 需要先启动服务器: npm run dev
 * 2. 需要有效的JWT token（先登录获取）
 * 3. 准备测试图片文件
 */

const API_BASE = 'http://localhost:3000/api';
let authToken = '';

// 测试用户登录
async function testLogin() {
    console.log('\n=== 测试登录 ===');

    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
        })
    });

    const data = await response.json();

    if (data.success && data.data.token) {
        authToken = data.data.token;
        console.log('✅ 登录成功');
        return true;
    } else {
        console.log('❌ 登录失败:', data.message);
        return false;
    }
}

// 测试上传头像
async function testUploadAvatar() {
    console.log('\n=== 测试上传头像 ===');

    // 创建测试图片（1x1 像素的PNG）
    const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );

    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'test-avatar.png');

    const response = await fetch(`${API_BASE}/upload/avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    });

    const data = await response.json();

    if (data.success) {
        console.log('✅ 头像上传成功');
        console.log('   图片URL:', data.data.url);
        console.log('   缩略图URL:', data.data.thumbnail);
        return data.data;
    } else {
        console.log('❌ 头像上传失败:', data.message);
        return null;
    }
}

// 测试上传点评图片（单张）
async function testUploadReviewImage() {
    console.log('\n=== 测试上传点评图片（单张） ===');

    const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );

    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'test-review.png');

    const response = await fetch(`${API_BASE}/upload/review`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    });

    const data = await response.json();

    if (data.success) {
        console.log('✅ 点评图片上传成功');
        console.log('   图片URL:', data.data.url);
        return data.data;
    } else {
        console.log('❌ 点评图片上传失败:', data.message);
        return null;
    }
}

// 测试批量上传图片
async function testUploadMultipleImages() {
    console.log('\n=== 测试批量上传图片 ===');

    const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );

    const formData = new FormData();

    // 添加3张图片
    for (let i = 0; i < 3; i++) {
        const blob = new Blob([testImageBuffer], { type: 'image/png' });
        formData.append('images', blob, `test-${i}.png`);
    }

    formData.append('type', 'reviews');

    const response = await fetch(`${API_BASE}/upload/reviews`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    });

    const data = await response.json();

    if (data.success) {
        console.log('✅ 批量上传成功');
        console.log(`   上传了 ${data.data.length} 张图片`);
        return data.data;
    } else {
        console.log('❌ 批量上传失败:', data.message);
        return null;
    }
}

// 测试删除图片
async function testDeleteImage(imageUrl) {
    console.log('\n=== 测试删除图片 ===');

    const response = await fetch(`${API_BASE}/upload/image`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: imageUrl
        })
    });

    const data = await response.json();

    if (data.success) {
        console.log('✅ 图片删除成功');
        return true;
    } else {
        console.log('❌ 图片删除失败:', data.message);
        return false;
    }
}

// 运行所有测试
async function runTests() {
    console.log('开始测试图片上传功能...\n');

    try {
        // 1. 登录
        const loginSuccess = await testLogin();
        if (!loginSuccess) {
            console.log('\n⚠️  请先创建测试用户或修改登录凭据');
            return;
        }

        // 2. 测试上传头像
        const avatarResult = await testUploadAvatar();

        // 3. 测试上传点评图片
        const reviewResult = await testUploadReviewImage();

        // 4. 测试批量上传
        const multipleResults = await testUploadMultipleImages();

        // 5. 测试删除图片
        if (reviewResult) {
            await testDeleteImage(reviewResult.url);
        }

        console.log('\n=== 测试完成 ===');

    } catch (error) {
        console.error('\n❌ 测试出错:', error.message);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    runTests();
}

module.exports = {
    testLogin,
    testUploadAvatar,
    testUploadReviewImage,
    testUploadMultipleImages,
    testDeleteImage
};
