import { authService } from '../../services/auth.js';
import { apiService } from '../../services/users.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (!authService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // DOM 元素
    const avatarPreview = document.getElementById('avatarPreview');
    const headerAvatar = document.getElementById('headerAvatar');
    const headerUsername = document.getElementById('headerUsername');
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileFormActions = document.getElementById('profileFormActions');
    const logoutBtn = document.getElementById('logoutBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    let isEditing = false;
    let originalData = {};

    // 加载用户资料
    await loadUserProfile();

    // 上传头像
    uploadAvatarBtn.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            showErrorMessage('请选择图片文件');
            return;
        }

        // 验证文件大小（5MB）
        if (file.size > 5 * 1024 * 1024) {
            showErrorMessage('图片大小不能超过 5MB');
            return;
        }

        // 预览图片
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview.src = e.target.result;
            headerAvatar.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // 上传图片
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            uploadAvatarBtn.disabled = true;
            uploadAvatarBtn.textContent = '上传中...';

            const response = await apiService.uploadAvatar(formData);
            showSuccessMessage('头像上传成功');

            // 更新本地存储的用户信息
            const user = authService.getCurrentUser();
            user.avatar = response.data.avatar;
            localStorage.setItem('user', JSON.stringify(user));

        } catch (error) {
            showErrorMessage(error.message || '头像上传失败');
            // 恢复原头像
            await loadUserProfile();
        } finally {
            uploadAvatarBtn.disabled = false;
            uploadAvatarBtn.textContent = '上传新头像';
        }
    });

    // 编辑资料
    editProfileBtn.addEventListener('click', () => {
        isEditing = true;
        document.getElementById('username').removeAttribute('readonly');
        document.getElementById('email').removeAttribute('readonly');
        profileFormActions.style.display = 'flex';
        editProfileBtn.style.display = 'none';
    });

    // 取消编辑
    cancelEditBtn.addEventListener('click', () => {
        isEditing = false;
        document.getElementById('username').value = originalData.username;
        document.getElementById('email').value = originalData.email;
        document.getElementById('username').setAttribute('readonly', true);
        document.getElementById('email').setAttribute('readonly', true);
        profileFormActions.style.display = 'none';
        editProfileBtn.style.display = 'block';
        clearFormErrors(profileForm);
    });

    // 保存资料
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!isEditing) return;

        clearFormErrors(profileForm);

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();

        let hasError = false;

        if (!username) {
            showFormError('username', '用户名不能为空');
            hasError = true;
        }

        if (!email) {
            showFormError('email', '邮箱不能为空');
            hasError = true;
        } else if (!validateEmail(email)) {
            showFormError('email', '请输入有效的邮箱地址');
            hasError = true;
        }

        if (hasError) return;

        const submitBtn = profileForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '保存中...';

        try {
            const response = await apiService.updateProfile({ username, email });
            showSuccessMessage('资料更新成功');

            // 更新本地存储
            const user = authService.getCurrentUser();
            user.username = response.data.username;
            user.email = response.data.email;
            localStorage.setItem('user', JSON.stringify(user));

            // 更新页面显示
            headerUsername.textContent = username;
            originalData = { username, email };

            // 退出编辑模式
            isEditing = false;
            document.getElementById('username').setAttribute('readonly', true);
            document.getElementById('email').setAttribute('readonly', true);
            profileFormActions.style.display = 'none';
            editProfileBtn.style.display = 'block';

        } catch (error) {
            showErrorMessage(error.message || '资料更新失败');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '保存更改';
        }
    });

    // 修改密码
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        clearFormErrors(passwordForm);

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        let hasError = false;

        if (!currentPassword) {
            showFormError('currentPassword', '请输入当前密码');
            hasError = true;
        }

        if (!newPassword) {
            showFormError('newPassword', '请输入新密码');
            hasError = true;
        } else if (newPassword.length < 8) {
            showFormError('newPassword', '密码至少需要8位');
            hasError = true;
        }

        if (!confirmPassword) {
            showFormError('confirmPassword', '请确认新密码');
            hasError = true;
        } else if (newPassword !== confirmPassword) {
            showFormError('confirmPassword', '两次输入的密码不一致');
            hasError = true;
        }

        if (hasError) return;

        const submitBtn = passwordForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '修改中...';

        try {
            await apiService.changePassword({ currentPassword, newPassword });
            showSuccessMessage('密码修改成功');
            passwordForm.reset();
        } catch (error) {
            showErrorMessage(error.message || '密码修改失败');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '修改密码';
        }
    });

    // 退出登录
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
        window.location.href = 'login.html';
    });

    // 用户菜单
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        userDropdown.classList.remove('show');
    });

    // 加载用户资料
    async function loadUserProfile() {
        try {
            const response = await apiService.getUserProfile();
            const user = response.data;

            // 设置头像
            const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23e0e0e0"/%3E%3Cpath d="M50 50c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zm0 7.5c-10 0-30 5-30 15v7.5h60v-7.5c0-10-20-15-30-15z" fill="%23999"/%3E%3C/svg%3E';
            const avatarUrl = user.avatar || defaultAvatar;
            avatarPreview.src = avatarUrl;
            headerAvatar.src = avatarUrl;

            // 设置基本信息
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('createdAt').value = formatDate(user.created_at);
            headerUsername.textContent = user.username;

            // 保存原始数据
            originalData = {
                username: user.username,
                email: user.email
            };

            // 设置统计信息
            if (user.stats) {
                document.getElementById('bookingsCount').textContent = user.stats.bookings;
                document.getElementById('favoritesCount').textContent = user.stats.favorites;
                document.getElementById('reviewsCount').textContent = user.stats.reviews;
            }

        } catch (error) {
            console.error('加载用户资料失败:', error);
            showErrorMessage('加载用户资料失败');
        }
    }

    // 工具函数
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function showFormError(fieldName, message) {
        const input = document.getElementById(fieldName);
        const errorElement = document.getElementById(fieldName + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
            input.classList.add('error');
        }
    }

    function clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.form-error');
        errorElements.forEach(el => el.textContent = '');
        const inputElements = form.querySelectorAll('.form-input');
        inputElements.forEach(el => el.classList.remove('error'));
        removeMessages();
    }

    function showSuccessMessage(message) {
        removeMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message success-message';
        messageDiv.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;
        document.querySelector('.profile-content').insertBefore(
            messageDiv,
            document.querySelector('.profile-header').nextSibling
        );
        setTimeout(removeMessages, 3000);
    }

    function showErrorMessage(message) {
        removeMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message error-message';
        messageDiv.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>${message}</span>
        `;
        document.querySelector('.profile-content').insertBefore(
            messageDiv,
            document.querySelector('.profile-header').nextSibling
        );
        setTimeout(removeMessages, 5000);
    }

    function removeMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
    }
});
