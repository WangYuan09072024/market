// js/account.js - V1.4: Complete User Account Page Logic

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const SALT = "MINIMART_VERY_SECRET_SALT_V3"; // !!! PHẢI GIỐNG HỆT SALT TRONG auth.js !!!

    // Cache DOM Elements
    const elements = {
        // User Info Tab
        userInfoForm: document.getElementById('userInfoForm'),
        accountDetailNameInput: document.getElementById('accountDetailName'),
        accountDetailEmailInput: document.getElementById('accountDetailEmail'),
        accountDetailPhoneInput: document.getElementById('accountDetailPhone'),
        accountDetailAddressInput: document.getElementById('accountDetailAddress'),
        accountDetailJoinedSpan: document.getElementById('accountDetailJoined'),
        
        // Order History Tab
        orderHistoryContainer: document.getElementById('orderHistoryContainer'),
        
        // Change Password Tab
        changePasswordForm: document.getElementById('changePasswordForm'),
        currentPasswordInput: document.getElementById('currentPassword'),
        newPasswordInput: document.getElementById('newPassword'),
        confirmNewPasswordInput: document.getElementById('confirmNewPassword'),
    };

    // Redirect if not logged in
    if (!currentUser) {
        alert('请先登录以查看您的账户 .');
        window.location.href = 'login.html';
        return;
    }

    // --- Utility Functions ---
    const hashPassword = (password) => {
        if (typeof CryptoJS === 'undefined') {
            console.error("CryptoJS not loaded! Cannot hash password for account page.");
            if (window.showMainToast) window.showMainToast("系统错误：无法处理密码.", "danger");
            else alert("系统错误：无法处理密码.");
            return null;
        }
        return CryptoJS.SHA256(password + SALT).toString();
    };

    const validatePasswordComplexity = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return regex.test(password);
    };

    // --- Load User Information into Form ---
    function loadUserInfo() {
        if (!currentUser) return;
        console.log("Account.js: Loading user info for form:", currentUser);

        if (elements.accountDetailNameInput) elements.accountDetailNameInput.value = currentUser.name || '';
        if (elements.accountDetailEmailInput) {
            elements.accountDetailEmailInput.value = currentUser.email || '';
            elements.accountDetailEmailInput.readOnly = true; // Email should not be editable
        }
        if (elements.accountDetailPhoneInput) elements.accountDetailPhoneInput.value = currentUser.phone || '';
        if (elements.accountDetailAddressInput) elements.accountDetailAddressInput.value = currentUser.address || '';
        
        if (elements.accountDetailJoinedSpan && currentUser.createdAt) {
            try {
                elements.accountDetailJoinedSpan.textContent = new Date(currentUser.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
            } catch (e) {
                elements.accountDetailJoinedSpan.textContent = currentUser.createdAt.substring(0,10); // Fallback to YYYY-MM-DD
            }
        } else if (elements.accountDetailJoinedSpan) {
            elements.accountDetailJoinedSpan.textContent = 'N/A';
        }
    }

    // --- Save User Information ---
    function handleSaveUserInfo(event) {
        event.preventDefault();
        if (!currentUser) return;
        console.log("Account.js: Attempting to save user info...");

        const newName = elements.accountDetailNameInput.value.trim();
        const newPhone = elements.accountDetailPhoneInput.value.trim();
        const newAddress = elements.accountDetailAddressInput.value.trim();

        if (!newName) {
            if(window.showMainToast) window.showMainToast('姓名不能为空 ', 'warning');
            else alert('姓名不能为空');
            return;
        }

        currentUser.name = newName;
        currentUser.phone = newPhone;
        currentUser.address = newAddress;

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log("Account.js: currentUser updated in localStorage:", currentUser);

        let users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].name = newName;
            users[userIndex].phone = newPhone;
            users[userIndex].address = newAddress;
            localStorage.setItem('users', JSON.stringify(users));
            console.log("Account.js: User details updated in global 'users' list.");
        } else {
            console.warn("Account.js: Could not find user in global 'users' list to update details.");
        }

        if (window.showMainToast) window.showMainToast('用户信息已成功更新 !', 'success');
        else alert('用户信息已成功更新!');
        
        const welcomeNameEl = document.getElementById('welcomeName'); // Update header in real-time
        if(welcomeNameEl) welcomeNameEl.textContent = newName;
    }

    if (elements.userInfoForm) {
        elements.userInfoForm.addEventListener('submit', handleSaveUserInfo);
    }

    // --- Load Order History ---
    function loadOrderHistory() {
        console.log("Account.js: loadOrderHistory() CALLED. Current User ID:", currentUser?.id);
        if (!elements.orderHistoryContainer) {
            console.error("Account.js: orderHistoryContainer element not found!");
            return;
        }

        const allOrdersString = localStorage.getItem('orders');
        console.log("Account.js: Raw 'orders' string from localStorage:", allOrdersString);
        const allOrders = JSON.parse(allOrdersString || '[]');
        console.log("Account.js: All orders parsed from localStorage:", allOrders);

        if (!Array.isArray(allOrders)) {
            console.error("Account.js: Parsed orders is not an array!", allOrders);
            elements.orderHistoryContainer.innerHTML = '<p class="text-danger text-center mt-3">无法加载订单历史。</p>';
            return;
        }

        const userOrders = allOrders.filter(order => order.userId === currentUser.id);
        console.log("Account.js: Filtered orders for current user:", userOrders);

        if (userOrders.length === 0) {
            elements.orderHistoryContainer.innerHTML = '<p class="text-muted text-center mt-3">您还没有任何订单。</p>';
            return;
        }

        let orderHtml = `
            <table class="table table-hover table-sm order-table">
                <thead class="table-light">
                    <tr>
                        <th>订单ID</th><th>日期</th><th class="text-end">总金额</th><th>状态</th><th>操作</th>
                    </tr>
                </thead>
                <tbody>`;
        userOrders.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest first
        userOrders.forEach(order => {
            orderHtml += `
                <tr>
                    <td><small>#${order.id.slice(-8)}</small></td>
                    <td><small>${new Date(order.date).toLocaleDateString('zh-CN', {day:'2-digit', month:'2-digit', year:'numeric'})}</small></td>
                    <td class="text-end fw-bold">₱${order.totalAmount.toFixed(2)}</td>
                    <td><span class="badge bg-${getOrderStatusClass(order.status)}">${translateOrderStatus(order.status)}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary py-0 px-1" 
                                type="button" data-bs-toggle="collapse" 
                                data-bs-target="#orderDetails-${order.id}" 
                                aria-expanded="false" 
                                aria-controls="orderDetails-${order.id}">
                            <i class="bi bi-eye"></i> <small>详情</small>
                        </button>
                    </td>
                </tr>
                <tr class="collapse" id="orderDetails-${order.id}">
                    <td colspan="5">
                        <div class="p-2 bg-light rounded mt-1 mb-2 shadow-sm">
                            <p class="small mb-1"><strong>收货人:</strong> ${order.shippingInfo?.name || 'N/A'}</p>
                            <p class="small mb-1"><strong>地址:</strong> ${order.shippingInfo?.address || 'N/A'}</p>
                            <p class="small mb-2"><strong>电话:</strong> ${order.shippingInfo?.phone || 'N/A'}</p>
                            <strong>产品列表:</strong>
                            ${order.items.map(item => `
                                <p class="order-item-details mb-1 ps-2 small d-flex justify-content-between">
                                    <span>- ${item.name} (x${item.quantity})</span>
                                    <span>₱${(item.price * item.quantity).toFixed(2)}</span>
                                </p>
                            `).join('')}
                        </div>
                    </td>
                </tr>`;
        });
        orderHtml += `</tbody></table>`;
        elements.orderHistoryContainer.innerHTML = orderHtml;
        console.log("Account.js: Order history rendered for", userOrders.length, "orders.");
    }

    function getOrderStatusClass(status) { 
        switch (status?.toLowerCase()) {
            case 'pending': return 'warning text-dark'; case 'confirmed': return 'info text-dark';
            case 'shipped': return 'primary';       case 'delivered': return 'success';
            case 'completed': return 'success';     case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    }
    function translateOrderStatus(status) { 
        const statusMap = {
            'pending': '待处理', 'confirmed': '已确认 ',
            'shipped': '运输中', 'delivered': '已送达',
            'completed': '已完成', 'cancelled': '已取消 '
        };
        return statusMap[status?.toLowerCase()] || status || '未知';
    }
    
    // --- Change Password Logic ---
    if (elements.changePasswordForm) {
        elements.changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Account.js: Attempting to change password...");

            const currentPassword = elements.currentPasswordInput.value;
            const newPassword = elements.newPasswordInput.value;
            const confirmNewPassword = elements.confirmNewPasswordInput.value;

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                if(window.showMainToast) window.showMainToast('所有密码字段均为必填项 ', 'warning');
                else alert('所有密码字段均为必填项');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                if(window.showMainToast) window.showMainToast('新密码和确认密码不匹配', 'danger');
                else alert('新密码和确认密码不匹配');
                return;
            }
            if (!validatePasswordComplexity(newPassword)) {
                 if(window.showMainToast) window.showMainToast('新密码必须包含至少8个字符，包括大小写字母和数字 ', 'warning');
                 else alert('新密码必须包含至少8个字符，包括大小写字母和数字');
                return;
            }
            if (!currentUser.password) { 
                if(window.showMainToast) window.showMainToast('无法验证当前用户密码', 'danger');
                else alert('无法验证当前用户密码');
                return;
            }

            const hashedCurrentPassword = hashPassword(currentPassword);
            if (!hashedCurrentPassword) return; // Error during hashing

            if (hashedCurrentPassword !== currentUser.password) {
                if(window.showMainToast) window.showMainToast('当前密码不正确', 'danger');
                else alert('当前密码不正确');
                return;
            }
             if (hashPassword(newPassword) === currentUser.password) { // Check if new is same as old
                if(window.showMainToast) window.showMainToast('新密码不能与旧密码相同', 'warning');
                else alert('新密码不能与旧密码相同');
                return;
            }

            const hashedNewPassword = hashPassword(newPassword);
            if (!hashedNewPassword) return; // Error during hashing

            currentUser.password = hashedNewPassword;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log("Account.js: Password changed for currentUser in localStorage.");

            let users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].password = hashedNewPassword;
                localStorage.setItem('users', JSON.stringify(users));
                console.log("Account.js: Password updated in global 'users' list in localStorage.");
            } else {
                console.warn("Account.js: Could not find user in global 'users' list to update password for persistence across logins.");
            }
            
            if(window.showMainToast) window.showMainToast('密码已成功更改', 'success');
            else alert('密码已成功更改!');
            elements.changePasswordForm.reset();
        });
    } else {
        console.warn("Change password form (changePasswordForm) not found in account.html");
    }

    // --- Initial calls ---
    loadUserInfo();
    loadOrderHistory();
});