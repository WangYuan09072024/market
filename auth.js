// js/auth.js - V1.6: Final version with "not focusable" error fix

document.addEventListener('DOMContentLoaded', () => {
    // --- Cache DOM Elements ---
    const elements = {
        authForm: document.getElementById('authForm'),
        authTitle: document.getElementById('authTitle'),
        emailInput: document.getElementById('email'),
        passwordInput: document.getElementById('password'),
        nameField: document.getElementById('nameField'),
        nameInput: document.getElementById('name'),
        phoneField: document.getElementById('phoneField'),
        phoneInput: document.getElementById('phone'),
        captchaField: document.getElementById('captchaField'),
        captchaCode: document.getElementById('captchaCode'),
        captchaInput: document.getElementById('captchaInput'),
        refreshCaptchaBtn: document.getElementById('refreshCaptchaBtn'),
        passwordHelp: document.getElementById('passwordHelp'),
        passwordStrength: document.getElementById('passwordStrength'),
        submitBtn: document.getElementById('submitBtn'),
        submitBtnText: document.getElementById('submitBtnText'),
        toggleText: document.getElementById('toggleText'),
        toggleBtn: document.getElementById('toggleBtn'),
    };

    const SALT = "MINIMART_VERY_SECRET_SALT_V3";
    let isLoginMode = true;
    let currentCaptcha = '';

    // --- Utility Functions ---
    const hashPassword = (password) => CryptoJS.SHA256(password + SALT).toString();

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        currentCaptcha = result;
        if(elements.captchaCode) elements.captchaCode.textContent = currentCaptcha;
    };

    const validatePassword = (password) => {
        // Mật khẩu ít nhất 8 ký tự, có chữ hoa, chữ thường và số
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return regex.test(password);
    };

    // --- Mode Toggling ---
    const toggleMode = () => {
        isLoginMode = !isLoginMode;
        elements.authForm.reset();
        if(elements.passwordStrength) elements.passwordStrength.style.width = '0%';

        if (isLoginMode) {
            elements.authTitle.textContent = '欢迎回来，请登录您的账户';
            elements.nameField.style.display = 'none';
            elements.phoneField.style.display = 'none';
            elements.captchaField.style.display = 'none';
            elements.passwordHelp.style.display = 'none';
            elements.submitBtnText.textContent = '登录';
            elements.toggleText.textContent = '还没有账户？';
            elements.toggleBtn.textContent = '立即注册';
            elements.nameInput.required = false; // QUAN TRỌNG: Bỏ yêu cầu khi đăng nhập
        } else { // Chế độ Đăng ký
            elements.authTitle.textContent = '创建您的新账户';
            elements.nameField.style.display = 'block';
            elements.phoneField.style.display = 'block';
            elements.captchaField.style.display = 'block';
            elements.passwordHelp.style.display = 'block';
            elements.submitBtnText.textContent = '注册';
            elements.toggleText.textContent = '已经有账户了？';
            elements.toggleBtn.textContent = '返回登录';
            elements.nameInput.required = true; // QUAN TRỌNG: Thêm yêu cầu khi đăng ký
            generateCaptcha();
        }
    };

    // --- Form Handlers ---
    const handleLogin = () => {
        const email = elements.emailInput.value.trim();
        const password = elements.passwordInput.value;
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const foundUser = users.find(user => user.email === email);

        if (foundUser && foundUser.password === hashPassword(password)) {
            if (foundUser.status === 'inactive') {
                alert('您的账户已被禁用。请联系管理员。');
                return;
            }
            // Cập nhật thời gian đăng nhập cuối
            foundUser.lastLogin = new Date().toISOString();
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
            
            // Cập nhật thời gian đăng nhập trong danh sách user tổng
            const userIndex = users.findIndex(u => u.id === foundUser.id);
            if(userIndex > -1) {
                users[userIndex].lastLogin = foundUser.lastLogin;
            }
            localStorage.setItem('users', JSON.stringify(users));

            // Chuyển hướng
            window.location.href = foundUser.isAdmin ? 'admin.html' : 'index.html';
        } else {
            alert('邮箱或密码不正确。');
        }
    };

    const handleRegister = () => {
        const name = elements.nameInput.value.trim();
        const email = elements.emailInput.value.trim();
        const phone = elements.phoneInput.value.trim();
        const password = elements.passwordInput.value;
        const captcha = elements.captchaInput.value.trim();
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Validation
        if (!name || !email || !password) {
            alert('请填写所有必填字段。');
            return;
        }
        if (captcha.toLowerCase() !== currentCaptcha.toLowerCase()) {
            alert('验证码不正确。');
            generateCaptcha();
            return;
        }
        if (!validatePassword(password)) {
            alert('密码必须包含至少8个字符，包括大小写字母和数字。');
            return;
        }
        if (users.some(user => user.email === email)) {
            alert('此邮箱已被注册。请使用其他邮箱或登录。');
            return;
        }
        
        // Tạo đối tượng người dùng mới
        const newUser = {
            id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            name: name,
            email: email,
            phone: phone,
            password: hashPassword(password),
            address: '',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            status: 'active',
            paymentMethod: 'cash'
        };

        // Lưu và chuyển hướng
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        alert('注册成功！正在跳转到首页...');
        window.location.href = 'index.html';
    };

    // --- Event Listeners ---
    if(elements.toggleBtn) {
        elements.toggleBtn.addEventListener('click', toggleMode);
    }
    if(elements.refreshCaptchaBtn) {
        elements.refreshCaptchaBtn.addEventListener('click', generateCaptcha);
    }
    if(elements.authForm) {
        elements.authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (isLoginMode) {
                handleLogin();
            } else {
                handleRegister();
            }
        });
    }

    // --- Initialize Page ---
    // Đảm bảo trang bắt đầu ở chế độ đăng nhập và thuộc tính 'required' được đặt đúng
    if (document.getElementById('nameField')) { // Chỉ chạy logic này nếu các trường tồn tại
         elements.nameField.style.display = 'none';
         elements.phoneField.style.display = 'none';
         elements.captchaField.style.display = 'none';
         elements.passwordHelp.style.display = 'none';
         elements.nameInput.required = false;
    }
});
