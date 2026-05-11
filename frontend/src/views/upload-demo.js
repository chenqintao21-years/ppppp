// 图片上传示例 JavaScript

const API_BASE_URL = 'http://localhost:3000/api';

// 获取token（从localStorage）
function getAuthToken() {
    return localStorage.getItem('token');
}

// 通用上传函数
async function uploadImage(endpoint, formData, progressCallback) {
    const token = getAuthToken();

    if (!token) {
        throw new Error('请先登录');
    }

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // 监听上传进度
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                if (progressCallback) {
                    progressCallback(percentComplete);
                }
            }
        });

        // 监听完成
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('解析响应失败'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.message || '上传失败'));
                } catch {
                    reject(new Error('上传失败'));
                }
            }
        });

        // 监听错误
        xhr.addEventListener('error', () => {
            reject(new Error('网络错误'));
        });

        xhr.open('POST', `${API_BASE_URL}${endpoint}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
}

// 显示预览
function showPreview(file, previewContainer, onRemove) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';

        const img = document.createElement('img');
        img.src = e.target.result;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => {
            previewItem.remove();
            if (onRemove) onRemove();
        };

        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        previewContainer.appendChild(previewItem);
    };

    reader.readAsDataURL(file);
}

// 显示结果
function showResult(resultElement, success, message) {
    resultElement.className = `result ${success ? 'success' : 'error'}`;
    resultElement.textContent = message;
    resultElement.style.display = 'block';

    setTimeout(() => {
        resultElement.style.display = 'none';
    }, 5000);
}

// 更新进度条
function updateProgress(progressElement, percent) {
    const fill = progressElement.querySelector('.progress-bar-fill');
    fill.style.width = `${percent}%`;
    progressElement.style.display = 'block';

    if (percent >= 100) {
        setTimeout(() => {
            progressElement.style.display = 'none';
            fill.style.width = '0%';
        }, 1000);
    }
}

// ========== 头像上传 ==========
let avatarFile = null;

const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
const avatarResult = document.getElementById('avatarResult');
const avatarProgress = document.getElementById('avatarProgress');

avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        avatarFile = file;
        avatarPreview.innerHTML = '';
        showPreview(file, avatarPreview, () => {
            avatarFile = null;
            uploadAvatarBtn.disabled = true;
        });
        uploadAvatarBtn.disabled = false;
    }
});

uploadAvatarBtn.addEventListener('click', async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append('image', avatarFile);

    uploadAvatarBtn.disabled = true;
    uploadAvatarBtn.textContent = '上传中...';

    try {
        const response = await uploadImage('/upload/avatar', formData, (percent) => {
            updateProgress(avatarProgress, percent);
        });

        showResult(avatarResult, true, `上传成功！图片URL: ${response.data.url}`);
        console.log('上传结果:', response.data);

        // 清空预览
        avatarPreview.innerHTML = '';
        avatarFile = null;
        avatarInput.value = '';

    } catch (error) {
        showResult(avatarResult, false, error.message);
    } finally {
        uploadAvatarBtn.disabled = false;
        uploadAvatarBtn.textContent = '上传头像';
    }
});

// ========== 点评图片上传（多张）==========
let reviewFiles = [];

const reviewInput = document.getElementById('reviewInput');
const reviewPreview = document.getElementById('reviewPreview');
const uploadReviewBtn = document.getElementById('uploadReviewBtn');
const reviewResult = document.getElementById('reviewResult');
const reviewProgress = document.getElementById('reviewProgress');

reviewInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 10) {
        showResult(reviewResult, false, '最多只能上传10张图片');
        return;
    }

    reviewFiles = files;
    reviewPreview.innerHTML = '';

    files.forEach((file, index) => {
        showPreview(file, reviewPreview, () => {
            reviewFiles.splice(index, 1);
            if (reviewFiles.length === 0) {
                uploadReviewBtn.disabled = true;
            }
        });
    });

    uploadReviewBtn.disabled = files.length === 0;
});

uploadReviewBtn.addEventListener('click', async () => {
    if (reviewFiles.length === 0) return;

    const formData = new FormData();
    reviewFiles.forEach(file => {
        formData.append('images', file);
    });
    formData.append('type', 'reviews');

    uploadReviewBtn.disabled = true;
    uploadReviewBtn.textContent = '上传中...';

    try {
        const response = await uploadImage('/upload/reviews', formData, (percent) => {
            updateProgress(reviewProgress, percent);
        });

        showResult(reviewResult, true, `成功上传 ${response.data.length} 张图片！`);
        console.log('上传结果:', response.data);

        // 清空预览
        reviewPreview.innerHTML = '';
        reviewFiles = [];
        reviewInput.value = '';

    } catch (error) {
        showResult(reviewResult, false, error.message);
    } finally {
        uploadReviewBtn.disabled = false;
        uploadReviewBtn.textContent = '上传图片';
    }
});

// ========== 城市封面上传 ==========
let destinationFile = null;

const destinationInput = document.getElementById('destinationInput');
const destinationPreview = document.getElementById('destinationPreview');
const uploadDestinationBtn = document.getElementById('uploadDestinationBtn');
const destinationResult = document.getElementById('destinationResult');
const destinationProgress = document.getElementById('destinationProgress');
const destinationIdInput = document.getElementById('destinationId');

destinationInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        destinationFile = file;
        destinationPreview.innerHTML = '';
        showPreview(file, destinationPreview, () => {
            destinationFile = null;
            uploadDestinationBtn.disabled = true;
        });
        uploadDestinationBtn.disabled = false;
    }
});

uploadDestinationBtn.addEventListener('click', async () => {
    if (!destinationFile) return;

    const destinationId = destinationIdInput.value;
    if (!destinationId) {
        showResult(destinationResult, false, '请输入城市ID');
        return;
    }

    const formData = new FormData();
    formData.append('image', destinationFile);
    formData.append('destinationId', destinationId);

    uploadDestinationBtn.disabled = true;
    uploadDestinationBtn.textContent = '上传中...';

    try {
        const response = await uploadImage('/upload/destination', formData, (percent) => {
            updateProgress(destinationProgress, percent);
        });

        showResult(destinationResult, true, `上传成功！图片URL: ${response.data.url}`);
        console.log('上传结果:', response.data);

        // 清空预览
        destinationPreview.innerHTML = '';
        destinationFile = null;
        destinationInput.value = '';

    } catch (error) {
        showResult(destinationResult, false, error.message);
    } finally {
        uploadDestinationBtn.disabled = false;
        uploadDestinationBtn.textContent = '上传封面';
    }
});

// 拖拽上传支持
function setupDragAndDrop(uploadArea, input) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = '#e8f5e9';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = '#fafafa';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = '#fafafa';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const dataTransfer = new DataTransfer();
            Array.from(files).forEach(file => dataTransfer.items.add(file));
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });
}

// 启用拖拽上传
setupDragAndDrop(document.getElementById('avatarUploadArea'), avatarInput);
setupDragAndDrop(document.getElementById('reviewUploadArea'), reviewInput);
setupDragAndDrop(document.getElementById('destinationUploadArea'), destinationInput);

// 检查登录状态
window.addEventListener('load', () => {
    const token = getAuthToken();
    if (!token) {
        alert('请先登录！将跳转到登录页面...');
        // window.location.href = 'login.html';
        console.warn('未登录，上传功能将无法使用');
    }
});
