import { authService } from '../services/auth.js';

// 初始化用户界面状态
export function initAuthUI() {
    const user = authService.getUser();
    const isAuthenticated = authService.isAuthenticated();

    // 更新所有页面的认证UI
    updateAuthUI(isAuthenticated, user);

    // 如果已登录，验证token是否有效
    if (isAuthenticated) {
        authService.verifyToken().then(result => {
            if (!result.success) {
                // Token无效，清除登录状态
                authService.logout();
            }
        }).catch(() => {
            authService.logout();
        });
    }
}

// 更新认证UI
export function updateAuthUI(isAuthenticated, user) {
    // 主导航栏
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');

    // 滚动导航栏
    const authButtonsScrolled = document.getElementById('authButtonsScrolled');
    const userMenuScrolled = document.getElementById('userMenuScrolled');

    if (isAuthenticated && user) {
        // 显示用户菜单，隐藏登录按钮
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            updateUserInfo(user);
        }

        if (authButtonsScrolled) authButtonsScrolled.style.display = 'none';
        if (userMenuScrolled) {
            userMenuScrolled.style.display = 'flex';
            updateUserInfoScrolled(user);
        }
    } else {
        // 显示登录按钮，隐藏用户菜单
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';

        if (authButtonsScrolled) authButtonsScrolled.style.display = 'flex';
        if (userMenuScrolled) userMenuScrolled.style.display = 'none';
    }
}

// 更新用户信息显示
function updateUserInfo(user) {
    // 更新头像
    const avatarBtn = document.getElementById('avatarBtn');
    if (avatarBtn) {
        const avatarImg = avatarBtn.querySelector('img');
        if (avatarImg) {
            avatarImg.src = user.avatar || getDefaultAvatar(user.username);
            avatarImg.alt = user.username;
        }
    }

    // 更新用户名和邮箱
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (userName) userName.textContent = user.username;
    if (userEmail) userEmail.textContent = user.email;
}

// 更新滚动导航栏的用户信息
function updateUserInfoScrolled(user) {
    const avatarBtnScrolled = document.getElementById('avatarBtnScrolled');
    if (avatarBtnScrolled) {
        const avatarImg = avatarBtnScrolled.querySelector('img');
        if (avatarImg) {
            avatarImg.src = user.avatar || getDefaultAvatar(user.username);
            avatarImg.alt = user.username;
        }
    }

    // 更新滚动导航栏的用户名和邮箱
    const userNameScrolled = document.getElementById('userNameScrolled');
    const userEmailScrolled = document.getElementById('userEmailScrolled');

    if (userNameScrolled) userNameScrolled.textContent = user.username;
    if (userEmailScrolled) userEmailScrolled.textContent = user.email;
}

// 生成默认头像
function getDefaultAvatar(username) {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
    const initial = username ? username.charAt(0).toUpperCase() : 'U';
    const colorIndex = username ? username.charCodeAt(0) % colors.length : 0;
    const color = colors[colorIndex];

    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='0.35em' font-family='Arial' font-size='40' fill='white'%3E${initial}%3C/text%3E%3C/svg%3E`;
}

// 初始化用户下拉菜单
export function initUserDropdown() {
    // 主导航栏
    const avatarBtn = document.getElementById('avatarBtn');
    const userMenu = document.getElementById('userMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    if (avatarBtn && userMenu) {
        const dropdown = userMenu.querySelector('.user-dropdown');

        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });

        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 滚动导航栏
    const avatarBtnScrolled = document.getElementById('avatarBtnScrolled');
    const userMenuScrolled = document.getElementById('userMenuScrolled');

    if (avatarBtnScrolled && userMenuScrolled) {
        const dropdownScrolled = userMenuScrolled.querySelector('.user-dropdown');

        avatarBtnScrolled.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownScrolled.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            dropdownScrolled.classList.remove('show');
        });

        dropdownScrolled.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 退出登录
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('确定要退出登录吗？')) {
                await authService.logout();
            }
        });
    }

    // 滚动导航栏的退出按钮
    const logoutBtnScrolled = document.getElementById('logoutBtnScrolled');
    if (logoutBtnScrolled) {
        logoutBtnScrolled.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('确定要退出登录吗？')) {
                await authService.logout();
            }
        });
    }
}

// 检查页面权限
export function checkPageAuth(redirectUrl = 'auth.html') {
    if (!authService.isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// 页面加载时初始化
export function initAuth() {
    initAuthUI();
    initUserDropdown();
}
