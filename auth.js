// js/auth.js - V2.4: DEBUG localStorage issue - Based on Response #19 + Longer Redirect Timeout

document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_EMAIL = 'admin@minimart.com';
    const SALT = "MINIMART_VERY_SECRET_SALT_V3"; // Consistent Salt

    // --- CaptchaGenerator Class ---
    class CaptchaGenerator {
        constructor() { this.currentCaptcha = ''; }
        generate() {
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let result = '';
            for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
            this.currentCaptcha = result;
            console.log("Auth.js - CAPTCHA: Generated new code:", this.currentCaptcha);
            return result;
        }
        validate(input) { return input && input.toUpperCase() === this.currentCaptcha; }
    }
    const captcha = new CaptchaGenerator();

    // Element Cache
    const elements = {
        authForm: document.getElementById('authForm'),
        nameField: document.getElementById('nameField'),
        nameInput: document.getElementById('name'),
        emailInput: document.getElementById('email'),
        passwordInput: document.getElementById('password'),
        passwordStrength: document.getElementById('passwordStrength'),
        passwordHelp: document.getElementById('passwordHelp'),
        submitBtnText: document.getElementById('submitBtnText'),
        authTitle: document.getElementById('authTitle'),
        toggleText: document.getElementById('toggleText'),
        toggleBtn: document.getElementById('toggleBtn'),
        captchaField: document.getElementById('captchaField'),
        captchaCode: document.getElementById('captchaCode'),
        refreshCaptchaBtn: document.getElementById('refreshCaptchaBtn'),
        captchaInput: document.getElementById('captchaInput'),
        toastEl: document.getElementById('liveToast'),
        toastBody: document.querySelector('#liveToast .toast-body')
    };
    const toast = elements.toastEl ? new bootstrap.Toast(elements.toastEl) : null;
    let isLoginMode = true;

    // --- Utility Functions ---
    const showToast = (message, type = 'info') => {
        console.log(`Auth.js - Toast: [${type}] ${message}`);
        if (!toast || !elements.toastBody || !elements.toastEl) {
            alert(`${type.toUpperCase()}: ${message}`); return;
        }
        elements.toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        elements.toastEl.classList.add(`text-bg-${type}`);
        elements.toastBody.textContent = message;
        toast.show();
    };
    const hashPassword = (password) => CryptoJS.SHA256(password + SALT).toString();
    const getUsers = () => JSON.parse(localStorage.getItem('users') || '[]');
    const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

    // --- UI Logic ---
    const updateFormUI = (toLogin) => {
        isLoginMode = toLogin;
        console.log("Auth.js - UI: Updating form. isLoginMode:", isLoginMode);
        if(elements.authTitle) elements.authTitle.textContent = isLoginMode ? '欢迎回来，请登录您的账户' : '创建新账户';
        if(elements.submitBtnText) elements.submitBtnText.textContent = isLoginMode ? '登录' : '注册';
        if(elements.toggleText) elements.toggleText.textContent = isLoginMode ? '还没有账户？' : '已有账户？';
        if(elements.toggleBtn) elements.toggleBtn.textContent = isLoginMode ? '立即注册' : '立即登录';
        if(elements.nameField) elements.nameField.style.display = isLoginMode ? 'none' : 'block';
        if(elements.captchaField) elements.captchaField.style.display = isLoginMode ? 'none' : 'block';
        if(elements.passwordHelp) elements.passwordHelp.style.display = isLoginMode ? 'none' : 'block';
        if(elements.nameInput) elements.nameInput.required = !isLoginMode;
        if(elements.captchaInput) elements.captchaInput.required = !isLoginMode;
        if(elements.authForm) elements.authForm.reset();
        if (!isLoginMode && elements.captchaCode) elements.captchaCode.textContent = captcha.generate();
        else if (isLoginMode && elements.captchaCode) elements.captchaCode.textContent = '------';
    };

    elements.toggleBtn?.addEventListener('click', (e) => { e.preventDefault(); updateFormUI(!isLoginMode); });
    elements.refreshCaptchaBtn?.addEventListener('click', () => { if (!isLoginMode && elements.captchaCode) elements.captchaCode.textContent = captcha.generate(); });
    elements.passwordInput?.addEventListener('input', function() { /* ... (password strength logic copied from response #19) ... */ });

    // --- Core Logic ---
    const handleLogin = async (email, password) => {
        console.log("Auth.js - LOGIN: Attempting login for email:", email); // LOG L1
        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            console.error("Auth.js - LOGIN: User not found for email:", email); // LOG L2
            throw new Error('邮箱或密码不正确 (User not found)');
        }
        console.log("Auth.js - LOGIN: User found in 'users' list:", JSON.parse(JSON.stringify(user))); // LOG L3 (clone to avoid logging live object)

        const hashedPasswordAttempt = hashPassword(password);
        if (user.password !== hashedPasswordAttempt) {
            console.error("Auth.js - LOGIN: Password mismatch for user:", email); // LOG L4
            throw new Error('邮箱或密码不正确 (Password mismatch)');
        }
        console.log("Auth.js - LOGIN: Password matched for user:", email); // LOG L5

        if (user.status === 'inactive') {
            console.warn("Auth.js - LOGIN: Inactive user attempt:", email); // LOG L6
            throw new Error('该账户已被禁用');
        }

        user.lastLogin = new Date().toISOString();
        user.isAdmin = user.email === ADMIN_EMAIL;
        console.log("Auth.js - LOGIN: User object PREPARED for localStorage:", JSON.parse(JSON.stringify(user))); // LOG L7

        try {
            localStorage.setItem('currentUser', JSON.stringify(user));
            const retrievedUser = localStorage.getItem('currentUser');
            console.log("Auth.js - LOGIN: 'currentUser' SET in localStorage. Raw value after set:", retrievedUser); // LOG L8
            if(retrievedUser && retrievedUser !== 'null'){
                console.log("Auth.js - LOGIN: Parsed 'currentUser' immediately after set (on login.html):", JSON.parse(retrievedUser)); // LOG L8.1
            }
        } catch (e) {
            console.error("Auth.js - LOGIN: CRITICAL ERROR setting 'currentUser' in localStorage:", e); // LOG L9
            showToast('无法保存用户会话。请重试。', 'danger');
            throw e; 
        }
        
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...user };
            saveUsers(users);
            console.log("Auth.js - LOGIN: Main 'users' array in localStorage updated for user:", user.email); // LOG L10
        }

        showToast('登录成功!', 'success');
        // INCREASED TIMEOUT FOR DEBUGGING localStorage on login.html
        setTimeout(() => {
            const redirectUrl = user.isAdmin ? 'admin.html' : 'index.html';
            console.log("Auth.js - LOGIN: Redirecting to:", redirectUrl, "in 3 seconds..."); // LOG L11
            window.location.href = redirectUrl;
        }, 3000); // 3 seconds
    };

    const handleRegister = async (name, email, password) => { 
        // (Copy the full handleRegister function from response #19, which includes LOG R1 to LOG R8)
        // Ensure it's complete and includes the password validation and saving logic
        console.log("Auth.js - REGISTER: Attempting registration for email:", email); // LOG R1
        const users = getUsers();
        if (!name || !email || !password) {
            console.error("Auth.js - REGISTER: Missing fields"); // LOG R2
            throw new Error('所有字段均为必填项');
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
             console.warn("Auth.js - REGISTER: Password does not meet criteria for", email); // LOG R2.1
             throw new Error('密码必须包含至少8个字符，包括大小写字母和数字');
        }
        if (users.some(u => u.email === email)) {
            console.warn("Auth.js - REGISTER: Email already exists:", email); // LOG R3
            throw new Error('该邮箱已注册');
        }
        const newUser = {
            id: Date.now().toString(), name, email, password: hashPassword(password),
            createdAt: new Date().toISOString(), status: 'active', lastLogin: null,
            paymentMethod: 'cash', isAdmin: email === ADMIN_EMAIL
        };
        console.log("Auth.js - REGISTER: New user object created:", newUser); // LOG R4
        users.push(newUser);
        saveUsers(users);
        console.log("Auth.js - REGISTER: User saved to 'users' in localStorage. Total users:", users.length); // LOG R5
        console.log("Auth.js - REGISTER: Current content of 'users' in localStorage:", localStorage.getItem('users')); // LOG R6
        showToast('注册成功！请登录。', 'success');
        updateFormUI(true); 
        if(elements.emailInput) elements.emailInput.value = email; 
    };

    elements.authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = elements.emailInput.value.trim();
        const password = elements.passwordInput.value.trim();
        const name = elements.nameInput ? elements.nameInput.value.trim() : null;
        const captchaVal = elements.captchaInput ? elements.captchaInput.value.trim() : null;
        console.log("Auth.js - FORM SUBMIT: Mode (isLoginMode):", isLoginMode, "Email:", email); // LOG F1
        try {
            if (isLoginMode) {
                await handleLogin(email, password);
            } else { 
                if (!captcha.validate(captchaVal)) {
                    console.warn("Auth.js - REGISTER: CAPTCHA validation failed."); // LOG R7
                    if(elements.captchaCode) elements.captchaCode.textContent = captcha.generate();
                    throw new Error('验证码不正确');
                }
                console.log("Auth.js - REGISTER: CAPTCHA validation successful."); // LOG R8
                await handleRegister(name, email, password);
            }
        } catch (error) {
            console.error("Auth.js - FORM SUBMIT ERROR:", error.message); // LOG F2
            showToast(error.message, 'danger');
        }
    });
    updateFormUI(true); // Initialize to Login mode
});