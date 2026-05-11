import { authService, validateEmail, validatePassword, validateUsername } from '../../services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');

    if (authService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        clearErrors();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const agreeTerms = agreeTermsCheckbox.checked;

        let hasError = false;

        if (!username) {
            showError('usernameError', '请输入用户名');
            hasError = true;
        } else if (!validateUsername(username)) {
            showError('usernameError', '用户名长度应为3-20个字符');
            hasError = true;
        }

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
        } else if (!validatePassword(password)) {
            showError('passwordError', '密码至少需要8个字符');
            hasError = true;
        }

        if (!confirmPassword) {
            showError('confirmPasswordError', '请确认密码');
            hasError = true;
        } else if (password !== confirmPassword) {
            showError('confirmPasswordError', '两次输入的密码不一致');
            hasError = true;
        }

        if (!agreeTerms) {
            showErrorMessage('请同意服务条款和隐私政策');
            hasError = true;
        }

        if (hasError) return;

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '注册中...';

        try {
            await authService.register(username, email, password);
            showSuccessMessage('注册成功！正在跳转...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            showErrorMessage(error.message || '注册失败，请稍后重试');
            submitBtn.disabled = false;
            submitBtn.textContent = '注册';
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
        registerForm.insertBefore(messageDiv, registerForm.firstChild);
    }

    function showErrorMessage(message) {
        removeMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.textContent = message;
        registerForm.insertBefore(messageDiv, registerForm.firstChild);
    }

    function removeMessages() {
        const messages = registerForm.querySelectorAll('.success-message, .error-message');
        messages.forEach(msg => msg.remove());
    }
});
