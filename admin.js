// js/admin.js - V4.0 FINAL: Sử dụng Modal tùy chỉnh để xác nhận xóa

// ==================== Global Variables ====================
let products = [];
let users = [];
let orders = [];
let categories = [];

let orderDetailsModalInstance = null;
let editProductModalInstance = null;
let editUserModalAdminInstance = null;
let editCategoryModalInstance = null;
let confirmationModalInstance = null; // Modal xác nhận chung

const SALT = "MINIMART_VERY_SECRET_SALT_V3";

// ==================== Auth & Init ====================
function checkAdminAuth() {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.email === 'admin@minimart.com' && typeof currentUser.isAdmin === 'undefined') {
        currentUser.isAdmin = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    if (!currentUser || !currentUser.isAdmin) {
        alert('请使用管理员账户登录');
        window.location.href = 'login.html';
        return false;
    }
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.textContent = currentUser.name || currentUser.email;
    return true;
}

window.adminLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
};

function loadData() {
    products = JSON.parse(localStorage.getItem('products') || '[]');
    users = JSON.parse(localStorage.getItem('users') || '[]');
    orders = JSON.parse(localStorage.getItem('orders') || '[]');
    let storedCategories = localStorage.getItem('categories');
    if (storedCategories && JSON.parse(storedCategories).length > 0) {
        categories = JSON.parse(storedCategories);
    } else {
        categories = ["热销产品", "食品", "零食 / 小吃", "饮料 / 啤酒", "方便面 / 粥 / 米粉 / 粉丝", "香烟", "0元购物", "即食食品", "蔬菜 / 水果", "日常食品", "牛奶", "咖啡", "药品", "书籍推荐"];
        saveCategories();
    }
    console.log("Admin.js: Data Loaded:", { productsCt: products.length, usersCt: users.length, ordersCt: orders.length, categoriesCt: categories.length });
}

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;
    loadData();

    // Init Modals
    orderDetailsModalInstanceAdmin = new bootstrap.Modal(document.getElementById('orderDetailsModalAdmin'));
    editProductModalInstance = new bootstrap.Modal(document.getElementById('editProductModal'));
    editUserModalAdminInstance = new bootstrap.Modal(document.getElementById('editUserModalAdmin'));
    editCategoryModalInstance = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    confirmationModalInstance = new bootstrap.Modal(document.getElementById('confirmationModal')); // Khởi tạo Modal xác nhận

    // Event Listeners
    document.getElementById('productForm')?.addEventListener('submit', handleAddProduct);
    document.getElementById('filterCategory')?.addEventListener('change', renderProductTable);
    document.getElementById('sortBy')?.addEventListener('change', renderProductTable);
    document.getElementById('productImageFile')?.addEventListener('change', (e) => previewImage(e.target, 'addProductImagePreview'));
    document.getElementById('editProductImageFile')?.addEventListener('change', (e) => previewImage(e.target, 'editNewImagePreview'));
    document.getElementById('categoryForm')?.addEventListener('submit', handleAddCategory);
    document.getElementById('refreshUsers')?.addEventListener('click', handleRefreshUsers);
    document.getElementById('searchUsers')?.addEventListener('input', handleSearchUsers);
    document.getElementById('userTableBody')?.addEventListener('click', handleUserTableClick);
    document.getElementById('userTableBody')?.addEventListener('change', handleUserTableChange);
    document.getElementById('searchOrdersAdmin')?.addEventListener('input', handleSearchOrdersAdmin);
    document.getElementById('timeRange')?.addEventListener('change', window.updateAnalytics);

    // Initial Render
    renderCategoryDropdowns();
    renderCategoryTable();
    renderProductTable();
    renderUserTable();
    renderOrderTable();
    window.updateAnalytics();
});

function previewImage(fileInput, previewElementId) {
    const previewContainer = document.getElementById(previewElementId);
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `<img src="${e.target.result}" class="img-thumbnail" style="max-height: 90px; max-width: 90px; object-fit: contain;">`;
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function processImageFile(fileInput) {
    return new Promise((resolve) => {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.size > 400 * 1024) {
                showAdminToast('图片文件太大，请选择小于400KB的图片。', 'warning');
                fileInput.value = '';
                document.getElementById(fileInput.id === 'productImageFile' ? 'addProductImagePreview' : 'editNewImagePreview').innerHTML = '';
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => {
                showAdminToast('读取文件失败。', 'danger');
                resolve(null);
            };
            reader.readAsDataURL(file);
        } else {
            resolve(null);
        }
    });
}

// ==================== Category Management ====================
function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

function renderCategoryDropdowns() {
    const selects = [document.getElementById('productCategory'), document.getElementById('editCategory'), document.getElementById('filterCategory')];
    selects.forEach(select => {
        if (select) {
            const currentValue = select.value;
            const firstOption = select.options[0].cloneNode(true);
            select.innerHTML = '';
            select.appendChild(firstOption);
            categories.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')).forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                select.appendChild(option);
            });
            if (categories.includes(currentValue)) {
                select.value = currentValue;
            }
        }
    });
}

function renderCategoryTable() {
    const categoryTbody = document.getElementById('categoryTableBody');
    if (!categoryTbody) return;
    categoryTbody.innerHTML = '';
    categories.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')).forEach(cat => {
        const productCount = products.filter(p => p.category === cat).length;
        const tr = categoryTbody.insertRow();
        tr.innerHTML = `<td>${cat}</td><td class="text-center"><span class="badge bg-info rounded-pill">${productCount}</span></td><td class="text-center"><button class="btn btn-sm btn-outline-primary py-0 px-1 me-1" onclick="window.openEditCategoryModal('${cat}')"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="window.handleDeleteCategory('${cat}')"><i class="bi bi-trash"></i></button></td>`;
    });
}

function handleAddCategory(e) {
    e.preventDefault();
    const catNameInput = document.getElementById('categoryName');
    const newCategoryName = catNameInput.value.trim();
    if (!newCategoryName) {
        showAdminToast('分类名称不能为空。', 'warning');
        return;
    }
    if (categories.some(cat => cat.toLowerCase() === newCategoryName.toLowerCase())) {
        showAdminToast('该分类已存在。', 'warning');
        return;
    }
    categories.push(newCategoryName);
    saveCategories();
    renderCategoryTable();
    renderCategoryDropdowns();
    catNameInput.value = '';
    showAdminToast('分类添加成功。', 'success');
}

window.openEditCategoryModal = (categoryName) => {
    document.getElementById('oldCategoryName').value = categoryName;
    document.getElementById('editCategoryName').value = categoryName;
    editCategoryModalInstance.show();
};

window.handleSaveEditedCategory = () => {
    const oldName = document.getElementById('oldCategoryName').value;
    const newName = document.getElementById('editCategoryName').value.trim();
    if (!newName) {
        showAdminToast('分类名称不能为空。', 'warning');
        return;
    }
    if (newName.toLowerCase() !== oldName.toLowerCase() && categories.some(cat => cat.toLowerCase() === newName.toLowerCase())) {
        showAdminToast('该分类名称已存在。', 'warning');
        return;
    }
    const index = categories.indexOf(oldName);
    if (index > -1) {
        categories[index] = newName;
    }
    saveCategories();
    products.forEach(p => {
        if (p.category === oldName) {
            p.category = newName;
        }
    });
    saveProducts();
    renderCategoryTable();
    renderProductTable();
    renderCategoryDropdowns();
    editCategoryModalInstance.hide();
    showAdminToast('分类更新成功。', 'success');
};

window.handleDeleteCategory = (categoryName) => {
    const productCount = products.filter(p => p.category === categoryName).length;
    if (productCount > 0) {
        showAdminToast(`无法删除！该类别中仍有 ${productCount} 个产品 "${categoryName}".`, 'warning');
        return;
    }

    const modalBody = document.getElementById('confirmationModalBody');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    modalBody.textContent = `您确定要永久删除该 "${categoryName}类别吗？" 此操作无法撤消。`;
    
    confirmBtn.onclick = () => {
        categories = categories.filter(cat => cat !== categoryName);
        saveCategories();
        renderCategoryTable();
        renderCategoryDropdowns();
        showAdminToast('分类已删除.', 'success');
        confirmationModalInstance.hide();
    };

    confirmationModalInstance.show();
};


// ==================== Product Management ====================
async function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const discount = parseFloat(document.getElementById('productDiscount').value);
    const description = document.getElementById('productDescription').value.trim();
    const category = document.getElementById('productCategory').value;
    const stock = parseInt(document.getElementById('productStock').value);
    const status = document.getElementById('productStatus').value;
    const isBestSeller = document.getElementById('productBestSeller').checked;
    const imageFileInput = document.getElementById('productImageFile');
    if (!name || isNaN(price) || !category) {
        showAdminToast('产品名称、价格和分类不能为空。', 'danger');
        return;
    }
    let imageDataUrl = 'new.png';
    if (imageFileInput.files[0]) {
        imageDataUrl = await processImageFile(imageFileInput);
        if (!imageDataUrl) return;
    }
    const newProduct = {
        id: 'prod_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name,
        price,
        discountPrice: (!isNaN(discount) && discount < price) ? discount : null,
        description,
        category,
        stock: isNaN(stock) ? 0 : stock,
        status,
        isBestSeller,
        images: [imageDataUrl],
        createdAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    saveProducts();
    renderProductTable();
    renderCategoryTable();
    document.getElementById('productForm').reset();
    document.getElementById('addProductImagePreview').innerHTML = '';
    showAdminToast('产品添加成功。', 'success');
}

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

function renderProductTable() {
    const productTbody = document.getElementById('productTableBody');
    if (!productTbody) return;
    const categoryFilter = document.getElementById('filterCategory').value;
    const sortBy = document.getElementById('sortBy').value;
    let displayProducts = [...products];
    if (categoryFilter) {
        displayProducts = displayProducts.filter(p => p.category === categoryFilter);
    }
    displayProducts.sort((a, b) => {
        const priceA = a.discountPrice || a.price;
        const priceB = b.discountPrice || b.price;
        switch (sortBy) {
            case 'price-asc':
                return priceA - priceB;
            case 'price-desc':
                return priceB - priceA;
            case 'name-asc':
                return a.name.localeCompare(b.name, 'zh-Hans-CN');
            case 'name-desc':
                return b.name.localeCompare(a.name, 'zh-Hans-CN');
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    productTbody.innerHTML = '';
    if (displayProducts.length === 0) {
        productTbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">没有找到产品</td></tr>`;
        return;
    }
    displayProducts.forEach(p => {
        const tr = productTbody.insertRow();
        tr.innerHTML = `<td><small>${p.id.slice(-6)}</small></td><td><img src="${p.images?.[0] || 'new.png'}" width="40" height="40" class="rounded me-2 object-fit-cover" onerror="this.src='new.png';"> ${p.name}</td><td>${p.discountPrice ? `<span class="text-danger fw-bold">MMK${p.discountPrice.toFixed(2)}</span><br><small class="text-muted text-decoration-line-through">MMK${p.price.toFixed(2)}</small>` : `MMK${p.price.toFixed(2)}`}</td><td><span class="badge bg-secondary">${p.category}</span></td><td>${p.stock}</td><td><span class="badge ${p.status === 'active' ? 'bg-success' : 'bg-danger'}">${p.status === 'active' ? '上架中' : '已下架'}</span></td><td class="text-center"><button class="btn btn-sm btn-outline-primary me-1 py-0 px-1" onclick="window.openEditProductModal('${p.id}')"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="window.deleteProduct('${p.id}')"><i class="bi bi-trash"></i></button></td>`;
    });
}

window.openEditProductModal = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showAdminToast("找不到产品。", "danger");
        return;
    }
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editDiscountPrice').value = product.discountPrice || '';
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editCategory').value = product.category;
    document.getElementById('editStock').value = product.stock;
    document.getElementById('editIsBestSeller').checked = product.isBestSeller;
    document.getElementById('editCurrentImagePreview').innerHTML = `<img src="${product.images?.[0] || 'new.png'}" class="img-thumbnail me-2" style="max-height:80px;" onerror="this.src='new.png';">`;
    document.getElementById('editNewImagePreview').innerHTML = '';
    document.getElementById('editProductImageFile').value = '';
    editProductModalInstance.show();
};

window.saveEditedProduct = async () => {
    const productId = document.getElementById('editProductId').value;
    if (!productId) return;
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) {
        showAdminToast("找不到要更新的产品。", "danger");
        return;
    }
    products[index].name = document.getElementById('editName').value.trim();
    products[index].price = parseFloat(document.getElementById('editPrice').value);
    const discount = parseFloat(document.getElementById('editDiscountPrice').value);
    products[index].discountPrice = (!isNaN(discount) && discount < products[index].price) ? discount : null;
    products[index].description = document.getElementById('editDescription').value.trim();
    products[index].category = document.getElementById('editCategory').value;
    products[index].stock = parseInt(document.getElementById('editStock').value) || 0;
    products[index].isBestSeller = document.getElementById('editIsBestSeller').checked;
    const imageEditFileInput = document.getElementById('editProductImageFile');
    if (imageEditFileInput.files[0]) {
        const newImageDataUrl = await processImageFile(imageEditFileInput);
        if (newImageDataUrl) products[index].images = [newImageDataUrl];
    }
    saveProducts();
    renderProductTable();
    renderCategoryTable();
    editProductModalInstance.hide();
    showAdminToast('产品更新成功。', 'success');
};

window.deleteProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showAdminToast('未找到要删除的产品.', 'danger');
        return;
    }

    const modalBody = document.getElementById('confirmationModalBody');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    modalBody.textContent = `您确定要永久删除该产品吗？ "${product.name}" không?`;
    
    confirmBtn.onclick = () => {
        products = products.filter(p => p.id !== productId);
        saveProducts();
        renderProductTable();
        renderCategoryTable(); // Cập nhật số lượng trong danh mục
        showAdminToast('产品已删除.', 'success');
        confirmationModalInstance.hide();
    };

    confirmationModalInstance.show();
};


// ==================== User Management ====================
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function renderUserTable(usersToRender = users) {
    const userTbody = document.getElementById('userTableBody');
    if (!userTbody) {
        console.error("userTableBody not found!");
        return;
    }
    userTbody.innerHTML = '';
    if (usersToRender.length === 0) {
        userTbody.innerHTML = `<tr><td colspan="9" class="text-center p-4 text-muted">没有用户数据</td></tr>`;
        return;
    }
    usersToRender.forEach(user => {
        const tr = userTbody.insertRow();
        tr.innerHTML = `
        <td><small>${user.id ? user.id.slice(-6) : 'N/A'}</small></td>
        <td>${user.name || 'N/A'} ${user.isAdmin ? '<span class="badge bg-danger ms-1">Admin</span>' : ''}</td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.phone || 'N/A'}</td>
        <td><span class="password-field text-muted" data-password="${user.password || ''}">•••••••• <i class="bi bi-eye-slash-fill ms-1 text-secondary"></i></span></td>
        <td><small>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</small></td>
        <td><small>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '从未登录'}</small></td>
        <td><span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}">${user.status === 'active' ? '活跃' : '禁用'}</span></td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary py-0 px-1 me-1" onclick="window.openEditUserModalAdmin('${user.id}')" ${user.isAdmin ? 'disabled' : ''}><i class="bi bi-pencil-square"></i></button>
          <button class="btn btn-sm btn-outline-warning py-0 px-1 me-1" onclick="window.toggleUserStatus('${user.id}')" ${user.isAdmin ? 'disabled' : ''}><i class="bi bi-slash-circle"></i></button>
          <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="window.deleteUser('${user.id}')" ${user.isAdmin ? 'disabled' : ''}><i class="bi bi-trash"></i></button>
        </td>
        <td>
          <select class="form-select form-select-sm payment-method-select" data-userid="${user.id}">
            <option value="cash" ${user.paymentMethod === 'cash' ? 'selected' : ''}>现金</option>
            <option value="kpay" ${user.paymentMethod === 'kpay' ? 'selected' : ''}>Kpay</option>
            <option value="kbzbanking" ${user.paymentMethod === 'kbzbanking' ? 'selected' : ''}>KBZbanking</option>
            <option value="alipay" ${user.paymentMethod === 'alipay' ? 'selected' : ''}>支付宝</option>
            <option value="wechat" ${user.paymentMethod === 'wechat' ? 'selected' : ''}>微信</option>
          </select>
        </td>
      `;
      
    });
}

function handleUserTableClick(e) {
    if (e.target.closest('.password-field i')) {
        const passSpan = e.target.closest('.password-field');
        const eyeIcon = e.target;
        if (passSpan.textContent.startsWith('••••')) {
            passSpan.textContent = passSpan.dataset.password || 'N/A';
            eyeIcon.classList.replace('bi-eye-slash-fill', 'bi-eye-fill');
        } else {
            passSpan.innerHTML = `•••••••• <i class="bi bi-eye-slash-fill ms-1 text-secondary"></i>`;
        }
    }
}

function handleUserTableChange(e) {
    if (e.target.classList.contains('payment-method-select')) {
        const userId = e.target.dataset.userid;
        const newMethod = e.target.value;
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].paymentMethod = newMethod;
            saveUsers();
            showAdminToast(`用户 ${users[userIndex].name} 的支付方式已更新为 ${newMethod}`, 'success');
        }
    }
}

window.toggleUserStatus = (userId) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        if (users[userIndex].isAdmin) {
            showAdminToast('不能更改管理员账户的状态。', 'danger');
            return;
        }
        users[userIndex].status = users[userIndex].status === 'active' ? 'inactive' : 'active';
        saveUsers();
        renderUserTable();
        showAdminToast(`用户状态已更新为 ${users[userIndex].status}`, 'success');
    }
};

window.openEditUserModalAdmin = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
        showAdminToast("找不到用户信息。", "danger");
        return;
    }
    document.getElementById('editUserIdAdmin').value = user.id;
    document.getElementById('editUserNameAdmin').value = user.name || '';
    document.getElementById('editUserEmailAdmin').value = user.email || '';
    document.getElementById('editUserPhoneAdmin').value = user.phone || '';
    document.getElementById('editUserAddressAdmin').value = user.address || '';
    document.getElementById('editUserStatusAdmin').value = user.status || 'active';
    document.getElementById('editUserNewPasswordAdmin').value = '';
    document.getElementById('editUserConfirmPasswordAdmin').value = '';
    editUserModalAdminInstance.show();
};

window.handleSaveEditedUserAdmin = () => {
    const userId = document.getElementById('editUserIdAdmin').value;
    if (!userId) return;
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        showAdminToast("找不到要更新的用户。", "danger");
        return;
    }
    const newName = document.getElementById('editUserNameAdmin').value.trim();
    const newPhone = document.getElementById('editUserPhoneAdmin').value.trim();
    const newAddress = document.getElementById('editUserAddressAdmin').value.trim();
    const newStatus = document.getElementById('editUserStatusAdmin').value;
    const newPassword = document.getElementById('editUserNewPasswordAdmin').value;
    const confirmPassword = document.getElementById('editUserConfirmPasswordAdmin').value;
    if (!newName) {
        showAdminToast("姓名不能为空。", "warning");
        return;
    }
    users[userIndex].name = newName;
    users[userIndex].phone = newPhone || "";
    users[userIndex].address = newAddress || "";
    users[userIndex].status = newStatus;
    if (newPassword) {
        if (newPassword !== confirmPassword) {
            showAdminToast("新密码和确认密码不匹配。", "danger");
            return;
        }
        users[userIndex].password = CryptoJS.SHA256(newPassword + SALT).toString();
        showAdminToast("用户密码已重置。", "info");
    }
    saveUsers();
    renderUserTable();
    let currentUserInStorage = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUserInStorage && currentUserInStorage.id === userId) {
        currentUserInStorage.name = newName;
        localStorage.setItem('currentUser', JSON.stringify(currentUserInStorage));
        document.getElementById('adminName').textContent = newName || currentUserInStorage.email;
    }
    editUserModalAdminInstance.hide();
    showAdminToast("用户信息更新成功。", "success");
};

function handleRefreshUsers() {
    loadData();
    renderUserTable();
    showAdminToast('用户列表已刷新。', 'info');
}

function handleSearchUsers(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredUsers = users.filter(user => user.name?.toLowerCase().includes(searchTerm) || user.email?.toLowerCase().includes(searchTerm) || user.id?.toLowerCase().includes(searchTerm));
    renderUserTable(filteredUsers);
}

window.deleteUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (user.isAdmin) {
        showAdminToast('无法删除管理员帐户。', 'danger');
        return;
    }

    const modalBody = document.getElementById('confirmationModalBody');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    modalBody.textContent = `您确定要永久删除 "${user.name || user.email}" 吗？`;

    confirmBtn.onclick = () => {
        users = users.filter(u => u.id !== userId);
        saveUsers();
        renderUserTable();
        showAdminToast('用户已被删除.', 'success');
        confirmationModalInstance.hide();
    };

    confirmationModalInstance.show();
};


// ==================== Order Management & Analytics & Utilities ====================
function saveOrders() {
    localStorage.setItem('orders', JSON.stringify(orders));
}

function renderOrderTable(ordersToDisplay = orders) {
    const tbody = document.getElementById('adminOrderTableBody');
    if (!tbody) {
        return;
    }
    tbody.innerHTML = '';
    const sortedOrders = [...ordersToDisplay].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortedOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">没有订单数据</td></tr>`;
        return;
    }
    sortedOrders.forEach(order => {
        const tr = tbody.insertRow();
        tr.innerHTML = `<td><small>${order.id ? order.id.slice(-8) : 'N/A'}</small></td><td>${order.shippingInfo?.name || order.userName || 'N/A'}</td><td><small>${order.shippingInfo?.email || order.userEmail || 'N/A'}</small></td><td><small>${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</small></td><td class="text-end fw-bold">MMk${order.totalAmount?.toFixed(2) || '0.00'}</td><td><span class="badge bg-${getOrderStatusClassAdmin(order.status)}">${translateOrderStatusAdmin(order.status)}</span></td><td class="text-center"><button class="btn btn-sm btn-outline-info py-0 px-1" onclick="window.showAdminOrderDetails('${order.id}')"><i class="bi bi-eye-fill"></i> 查看</button></td>`;
    });
}

function getOrderStatusClassAdmin(status) {
    const statusMap = {
        'pending': 'warning text-dark',
        'confirmed': 'info text-dark',
        'processing': 'secondary',
        'shipped': 'primary',
        'delivered': 'success',
        'completed': 'success',
        'cancelled': 'danger',
        'failed': 'danger'
    };
    return statusMap[status?.toLowerCase()] || 'light text-dark';
}

function translateOrderStatusAdmin(status) {
    const statusMap = {
        'pending': '待处理',
        'confirmed': '已确认',
        'processing': '处理中',
        'shipped': '运输中',
        'delivered': '已送达',
        'completed': '已完成',
        'cancelled': '已取消',
        'failed': '失败'
    };
    return statusMap[status?.toLowerCase()] || status || '未知';
}

window.showAdminOrderDetails = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showAdminToast("找不到订单详情。", "danger");
        return;
    }
    const modalBody = document.getElementById('orderDetailsModalAdminBody');
    const modalTitle = document.getElementById('orderDetailsModalAdminLabel');
    const statusSelect = document.getElementById('adminOrderStatusSelect');
    if (!modalBody || !modalTitle || !statusSelect) {
        return;
    }
    modalTitle.textContent = `订单详情: #${order.id.slice(-8)}`;
    statusSelect.value = order.status || 'pending';
    let itemsHtml = '<ul class="list-group list-group-flush">';
    order.items.forEach(item => {
        itemsHtml += `<li class="list-group-item py-1 px-0 d-flex justify-content-between"><small>${item.name} (x${item.quantity})</small> <small>MMK${(item.price * item.quantity).toFixed(2)}</small></li>`;
    });
    itemsHtml += `</ul>`;
    modalBody.innerHTML = `<div class="row"><div class="col-md-6"><h6>客户信息:</h6><p class="mb-1"><small><strong>姓名:</strong> ${order.shippingInfo?.name||'N/A'}</small></p><p class="mb-1"><small><strong>邮箱:</strong> ${order.shippingInfo?.email||'N/A'}</small></p><p class="mb-1"><small><strong>电话:</strong> ${order.shippingInfo?.phone||'N/A'}</small></p><p class="mb-3"><small><strong>地址:</strong> ${order.shippingInfo?.address||'N/A'}</small></p></div><div class="col-md-6"><h6>订单信息:</h6><p class="mb-1"><small><strong>付款方式:</strong> ${order.paymentMethod||'N/A'}</small></p><p class="mb-1"><small><strong>当前状态:</strong> <span class="badge bg-${getOrderStatusClassAdmin(order.status)}">${translateOrderStatusAdmin(order.status)}</span></small></p><p class="mb-1"><small><strong>日期:</strong> ${new Date(order.date).toLocaleString()}</small></p><p class="mb-3"><small><strong>总金额:</strong> <span class="fw-bold">MMK${order.totalAmount.toFixed(2)}</span></small></p></div></div> ${order.notes ? `<h6 class="mt-2">客户备注:</h6><p class="bg-light p-2 rounded_sm small">${order.notes}</p>` : ''} <div class="mt-3"><label for="adminOrderNotesTextarea" class="form-label fw-bold">管理员备注:</label><textarea class="form-control form-control-sm" id="adminOrderNotesTextarea" rows="2">${order.adminNotes || ''}</textarea></div> <hr class="my-3"><h6>订购产品:</h6> ${itemsHtml}`;
    orderDetailsModalInstanceAdmin.show();
};

window.handleUpdateOrderAdmin = () => {
    const orderId = document.getElementById('orderDetailsModalAdminBody').closest('.modal').querySelector('[id^=orderDetailsModalAdminLabel]').textContent.split('#')[1];
    if (!orderId) return;
    const orderIndex = orders.findIndex(o => o.id.slice(-8) === orderId);
    if (orderIndex === -1) {
        showAdminToast("找不到订单。", "danger");
        return;
    }
    const newStatus = document.getElementById('adminOrderStatusSelect').value;
    const adminNotes = document.getElementById('adminOrderNotesTextarea')?.value.trim() || '';
    orders[orderIndex].status = newStatus;
    orders[orderIndex].adminNotes = adminNotes;
    saveOrders();
    renderOrderTable();
    orderDetailsModalInstanceAdmin.hide();
    showAdminToast(`订单 #${orders[orderIndex].id.slice(-8)} 已更新。`, "success");
};

function handleSearchOrdersAdmin(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredOrders = orders.filter(order => order.id.toLowerCase().includes(searchTerm) || (order.shippingInfo?.email || order.userEmail || '').toLowerCase().includes(searchTerm) || (order.shippingInfo?.name || order.userName || '').toLowerCase().includes(searchTerm));
    renderOrderTable(filteredOrders);
}

window.updateAnalytics = () => {
    const totalSuccessfulRevenueEl = document.getElementById('totalSuccessfulRevenue');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalUsersEl = document.getElementById('totalUsers');
    const topProductEl = document.getElementById('topProduct');
    const dailyReportBodyEl = document.getElementById('dailyReportBody');
    if (!totalSuccessfulRevenueEl || !dailyReportBodyEl) return;
    const startDateVal = document.getElementById('startDate').value;
    const endDateVal = document.getElementById('endDate').value;
    const timeRange = document.getElementById('timeRange').value;
    let startFilter = new Date(0),
        endFilter = new Date();
    const today = new Date();
    const year = today.getFullYear(),
        month = today.getMonth(),
        day = today.getDate();
    if (timeRange) {
        switch (timeRange) {
            case 'day':
                startFilter = new Date(year, month, day, 0, 0, 0, 0);
                endFilter = new Date(year, month, day, 23, 59, 59, 999);
                break;
            case 'week':
                const firstDay = new Date(today);
                firstDay.setDate(day - today.getDay());
                startFilter = new Date(firstDay.setHours(0, 0, 0, 0));
                endFilter = new Date();
                break;
            case 'month':
                startFilter = new Date(year, month, 1);
                endFilter = new Date();
                break;
            case 'year':
                startFilter = new Date(year, 0, 1);
                endFilter = new Date();
                break;
        }
        if (document.getElementById('startDate')) document.getElementById('startDate').valueAsDate = startFilter;
        if (document.getElementById('endDate')) document.getElementById('endDate').valueAsDate = endFilter < new Date() ? endFilter : new Date();
    } else if (startDateVal && endDateVal) {
        startFilter = new Date(startDateVal);
        startFilter.setHours(0, 0, 0, 0);
        endFilter = new Date(endDateVal);
        endFilter.setHours(23, 59, 59, 999);
    }
    const filteredOrders = orders.filter(o => new Date(o.date) >= startFilter && new Date(o.date) <= endFilter);
    let totalSuccessfulRevenue = 0;
    const productSales = {};
    const dailyData = {};
    filteredOrders.forEach(order => {
        const dateKey = new Date(order.date).toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                successfulRevenue: 0,
                successfulOrders: 0,
                cancelledValue: 0,
                cancelledOrders: 0,
                processingValue: 0,
                processingOrders: 0
            };
        }
        const status = order.status?.toLowerCase();
        const amount = order.totalAmount || 0;
        if (['delivered', 'completed', 'shipped'].includes(status)) {
            dailyData[dateKey].successfulRevenue += amount;
            dailyData[dateKey].successfulOrders++;
            order.items.forEach(item => {
                productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
            });
        } else if (['cancelled', 'failed'].includes(status)) {
            dailyData[dateKey].cancelledValue += amount;
            dailyData[dateKey].cancelledOrders++;
        } else {
            dailyData[dateKey].processingValue += amount;
            dailyData[dateKey].processingOrders++;
        }
    });
    totalSuccessfulRevenue = Object.values(dailyData).reduce((sum, day) => sum + day.successfulRevenue, 0);
    let topProductName = '-';
    if (Object.keys(productSales).length > 0) {
        const bestSellingId = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0][0];
        const productInfo = products.find(p => p.id === bestSellingId);
        topProductName = productInfo ? `${productInfo.name} (${productSales[bestSellingId]}件)` : '未知产品';
    }
    totalSuccessfulRevenueEl.textContent = `MMK${totalSuccessfulRevenue.toFixed(2)}`;
    totalOrdersEl.textContent = filteredOrders.length;
    totalUsersEl.textContent = users.length;
    topProductEl.textContent = topProductName;
    dailyReportBodyEl.innerHTML = '';
    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(b) - new Date(a));
    if (sortedDates.length === 0) {
        dailyReportBodyEl.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-4">该时间段内无数据</td></tr>`;
    } else {
        sortedDates.forEach(date => {
            const day = dailyData[date];
            const row = dailyReportBodyEl.insertRow();
            row.innerHTML = `<td>${date}</td><td class="text-end text-success fw-bold">MMK${day.successfulRevenue.toFixed(2)}</td><td class="text-center">${day.successfulOrders}</td><td class="text-end text-primary">MMK${day.processingValue.toFixed(2)}</td><td class="text-center">${day.processingOrders}</td><td class="text-end text-danger">MMK${day.cancelledValue.toFixed(2)}</td><td class="text-center">${day.cancelledOrders}</td>`;
        });
    }
};

function showAdminToast(message, type = 'info') {
    const toastEl = document.getElementById('adminToast');
    if (!toastEl) return;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    const toastBody = toastEl.querySelector('.toast-body');
    if (!toastBody) return;
    toastBody.textContent = message;
    toastEl.className = 'toast align-items-center text-white border-0';
    toastEl.classList.add((type === 'danger') ? 'bg-danger' : (type === 'warning' ? 'bg-warning' : `bg-${type}`));
    toast.show();
}
