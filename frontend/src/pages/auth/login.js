import { authService, validateEmail, validatePassword } from '../../services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    if (authService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberMeCheckbox.checked;

        let hasError = false;

        if (!email) {
            showError('emailError', '请输入邮箱');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError('emailError', '请输入有效的邮箱地址');
            hasError = true;
        }

        if (!password) {
            showError('passwordError', '请输入密码');
            hasError = true;
        }

        if (hasError) return;

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';

        try {
            await authService.login(email, password, rememberMe);
            showSuccessMessage('登录成功！正在跳转...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            showErrorMessage(error.message || '登录失败，请检查您的邮箱和密码');
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
    });

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        const inputElement = errorElement.previousElementSibling;
        errorElement.textContent = message;
        inputElement.classList.add('error');
    }

    function clearErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(el => el.textContent = '');
        const inputElements = document.querySelectorAll('.form-input');
        inputElements.forEach(el => el.classList.remove('error'));
        removeMessages();
    }

    function showSuccessMessage(message) {
        removeMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        loginForm.insertBefore(messageDiv, loginForm.firstChild);
    }

    function showErrorMessage(message) {
        removeMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.textContent = message;
        loginForm.insertBefore(messageDiv, loginForm.firstChild);
    }

    function removeMessages() {
        const messages = loginForm.querySelectorAll('.success-message, .error-message');
        messages.forEach(msg => msg.remove());
    }
});
