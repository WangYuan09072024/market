// js/admin.js - V2.7: Definitive Complete Version with All Features

// Global variables
let products = [];
let users = [];
let orders = [];
let currentEditProductId = null;
let currentEditingUserIdAdmin = null;
let currentViewingOrderIdAdmin = null;

let orderDetailsModalInstanceAdmin = null;
let editProductModalInstance = null;
let editUserModalAdminInstance = null;

const SALT = "MINIMART_VERY_SECRET_SALT_V3"; // Must be consistent with auth.js and account.js

// ==================== Auth & Init ====================
function checkAdminAuth() {
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (
    currentUser &&
    currentUser.email === "admin@minimart.com" &&
    typeof currentUser.isAdmin === "undefined"
  ) {
    console.log(
      "Admin.js: Assigning isAdmin = true to admin@minimart.com because flag was missing"
    );
    currentUser.isAdmin = true;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }

  if (!currentUser || !currentUser.isAdmin) {
    alert("请使用管理员账户登录");
    window.location.href = "login.html"; // Assuming admin.html is in root
    return false;
  }
  const adminNameEl = document.getElementById("adminName");
  if (adminNameEl)
    adminNameEl.textContent = currentUser.name || currentUser.email;
  return true;
}

window.adminLogout = () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
};

function loadData() {
  products = JSON.parse(localStorage.getItem("products") || "[]");
  users = JSON.parse(localStorage.getItem("users") || "[]");
  orders = JSON.parse(localStorage.getItem("orders") || "[]");
  console.log("Admin.js: Data Loaded:", {
    productsCt: products.length,
    usersCt: users.length,
    ordersCt: orders.length,
  });
}

document.addEventListener("DOMContentLoaded", function () {
  if (!checkAdminAuth()) return;
  loadData();

  const orderModalEl = document.getElementById("orderDetailsModalAdmin");
  if (orderModalEl)
    orderDetailsModalInstanceAdmin = new bootstrap.Modal(orderModalEl);
  const editProdModalEl = document.getElementById("editProductModal");
  if (editProdModalEl)
    editProductModalInstance = new bootstrap.Modal(editProdModalEl);
  const editUserModalEl = document.getElementById("editUserModalAdmin");
  if (editUserModalEl)
    editUserModalAdminInstance = new bootstrap.Modal(editUserModalEl);

  document
    .getElementById("productForm")
    ?.addEventListener("submit", handleAddProduct);
  document
    .getElementById("filterCategory")
    ?.addEventListener("change", renderProductTable);
  document
    .getElementById("sortBy")
    ?.addEventListener("change", renderProductTable);
  document
    .getElementById("productImageFile")
    ?.addEventListener("change", (e) =>
      previewImage(e.target, "addProductImagePreview")
    );
  document
    .getElementById("editProductImageFile")
    ?.addEventListener("change", (e) =>
      previewImage(e.target, "editNewImagePreview")
    );

  document
    .getElementById("refreshUsers")
    ?.addEventListener("click", handleRefreshUsers);
  document
    .getElementById("searchUsers")
    ?.addEventListener("input", handleSearchUsers);
  document
    .getElementById("userTableBody")
    ?.addEventListener("click", handleUserTableClick);
  document
    .getElementById("userTableBody")
    ?.addEventListener("change", handleUserTableChange);

  document
    .getElementById("searchOrdersAdmin")
    ?.addEventListener("input", handleSearchOrdersAdmin);

  // Nút trong modal gọi hàm global qua onclick, không cần gán listener ở đây nếu HTML đã có onclick
  // Ví dụ: editProductModal save button -> onclick="window.saveEditedProduct()"
  // editUserModalAdmin save button -> onclick="window.handleSaveEditedUserAdmin()"
  // orderDetailsModalAdmin update button -> onclick="window.handleUpdateOrderAdmin()"

  document
    .getElementById("timeRange")
    ?.addEventListener("change", window.updateAnalytics);
  document
    .querySelector('#analytics button[onclick="window.updateAnalytics()"]')
    ?.addEventListener("click", window.updateAnalytics);

  populateCategoryDropdowns();
  renderProductTable();
  renderUserTable();
  renderOrderTable();
  window.updateAnalytics();
});

function previewImage(fileInput, previewElementId) {
  const previewContainer = document.getElementById(previewElementId);
  if (!previewContainer) return;
  previewContainer.innerHTML = "";
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewContainer.innerHTML = `<img src="${e.target.result}" class="img-thumbnail" style="max-height: 90px; max-width: 90px; object-fit: contain;">`;
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

function populateCategoryDropdowns() {
  const categories = [
    "热销产品",
    "食品",
    "零食 / 小吃",
    "饮料 / 啤酒",
    "方便面 / 粥 / 米粉 / 粉丝",
    "香烟",
    "0元购物",
    "即食食品",
    "蔬菜 / 水果",
    "日常食品",
    "牛奶",
    "咖啡",
    "药品",
    "书籍推荐",
  ];
  const selects = [
    document.getElementById("productCategory"),
    document.getElementById("editCategory"),
    document.getElementById("filterCategory"),
  ];
  selects.forEach((select) => {
    if (select) {
      const firstOptionValue =
        select.options.length > 0 ? select.options[0].value : "";
      const firstOptionText =
        select.options.length > 0
          ? select.options[0].textContent
          : select.id === "filterCategory"
          ? "所有分类"
          : "选择分类...";

      select.innerHTML = `<option value="${firstOptionValue}">${firstOptionText}</option>`; // Reset giữ lại option đầu tiên

      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      });
    }
  });
}

function processImageFile(fileInput) {
  return new Promise((resolve) => {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      if (file.size > 400 * 1024) {
        // ~400KB limit
        showAdminToast("图片文件太大，请选择小于400KB的图片。", "warning");
        fileInput.value = "";
        const previewId =
          fileInput.id === "productImageFile"
            ? "addProductImagePreview"
            : "editNewImagePreview";
        document.getElementById(previewId).innerHTML = "";
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => {
        showAdminToast("读取文件失败。", "danger");
        resolve(null);
      };
      reader.readAsDataURL(file);
    } else {
      resolve(null);
    }
  });
}

// ==================== Product Management ====================
async function handleAddProduct(e) {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const discount = parseFloat(document.getElementById("productDiscount").value);
  const description = document
    .getElementById("productDescription")
    .value.trim();
  const category = document.getElementById("productCategory").value;
  const stock = parseInt(document.getElementById("productStock").value);
  const status = document.getElementById("productStatus").value;
  const isBestSeller = document.getElementById("productBestSeller").checked;
  const imageFileInput = document.getElementById("productImageFile");

  if (!name || isNaN(price) || !category) {
    showAdminToast("产品名称、价格和分类不能为空。", "danger");
    return;
  }

  let imageDataUrl = "img/new.png"; // Default placeholder
  if (imageFileInput.files && imageFileInput.files[0]) {
    showAdminToast("正在处理图片...", "info");
    imageDataUrl = await processImageFile(imageFileInput);
    if (!imageDataUrl && imageFileInput.files[0]) return;
  } else {
    showAdminToast("提示: 未选择图片，将使用默认图。", "info");
  }

  const newProduct = {
    id:
      "prod_" +
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 5),
    name,
    price,
    discountPrice: !isNaN(discount) && discount < price ? discount : null,
    description,
    category,
    stock: isNaN(stock) ? 0 : stock,
    status,
    isBestSeller,
    images: [imageDataUrl || "img/new.png"],
    createdAt: new Date().toISOString(),
  };
  products.unshift(newProduct);
  saveProducts();
  renderProductTable();
  document.getElementById("productForm").reset();
  document.getElementById("addProductImagePreview").innerHTML = "";
  showAdminToast("产品添加成功。", "success");
}

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
  console.log("Admin.js: Products saved. Total:", products.length);
}

function renderProductTable() {
  const productTbody = document.getElementById("productTableBody");
  if (!productTbody) {
    console.error("productTableBody not found!");
    return;
  }

  const categoryFilter = document.getElementById("filterCategory").value;
  const sortBy = document.getElementById("sortBy").value;
  let displayProducts = [...products];

  if (categoryFilter)
    displayProducts = displayProducts.filter(
      (p) => p.category === categoryFilter
    );

  displayProducts.sort((a, b) => {
    const priceA = a.discountPrice || a.price;
    const priceB = b.discountPrice || b.price;
    switch (sortBy) {
      case "price-asc":
        return priceA - priceB;
      case "price-desc":
        return priceB - priceA;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  productTbody.innerHTML = "";
  if (displayProducts.length === 0) {
    productTbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">没有找到产品</td></tr>`;
    return;
  }
  displayProducts.forEach((p) => {
    const tr = productTbody.insertRow();
    tr.innerHTML = `
            <td><small>${p.id.slice(-6)}</small></td>
            <td>
                <img src="${
                  p.images && p.images[0] ? p.images[0] : "img/new.png"
                }" width="40" height="40" class="rounded me-2 object-fit-cover" onerror="this.src='img/new.png'; this.onerror=null;">
                ${p.name}
            </td>
            <td>
                ${
                  p.discountPrice
                    ? `<span class="text-danger fw-bold">₱${p.discountPrice.toFixed(
                        2
                      )}</span><br><small class="text-muted text-decoration-line-through">₱${p.price.toFixed(
                        2
                      )}</small>`
                    : `₱${p.price.toFixed(2)}`
                }
            </td>
            <td><span class="badge bg-secondary">${p.category}</span></td>
            <td>${p.stock}</td>
            <td><span class="badge ${
              p.status === "active" ? "bg-success" : "bg-danger"
            }">${p.status === "active" ? "上架中" : "已下架"}</span></td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary me-1 py-0 px-1" onclick="window.openEditProductModal('${
                  p.id
                }')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="window.deleteProduct('${
                  p.id
                }')"><i class="bi bi-trash"></i></button>
            </td>
        `;
  });
}

window.openEditProductModal = (productId) => {
  const product = products.find((p) => p.id === productId);
  if (!product) {
    showAdminToast("找不到产品。", "danger");
    return;
  }
  currentEditProductId = productId;

  document.getElementById("editProductId").value = product.id;
  document.getElementById("editName").value = product.name;
  document.getElementById("editPrice").value = product.price;
  document.getElementById("editDiscountPrice").value =
    product.discountPrice || "";
  document.getElementById("editDescription").value = product.description || "";
  document.getElementById("editCategory").value = product.category;
  document.getElementById("editStock").value = product.stock;
  document.getElementById("editIsBestSeller").checked = product.isBestSeller;

  const currentPreviewContainer = document.getElementById(
    "editCurrentImagePreview"
  );
  if (currentPreviewContainer) {
    if (product.images && product.images[0]) {
      currentPreviewContainer.innerHTML = `<img src="${product.images[0]}" class="img-thumbnail me-2" style="max-height: 80px; max-width: 80px; object-fit: contain;" onerror="this.src='img/new.png'; this.onerror=null;">`;
    } else {
      currentPreviewContainer.innerHTML =
        '<small class="text-muted">无图</small>';
    }
  }
  document.getElementById("editNewImagePreview").innerHTML = "";
  document.getElementById("editProductImageFile").value = "";

  if (editProductModalInstance) editProductModalInstance.show();
  else console.error("Edit product modal instance not found");
};

window.saveEditedProduct = async () => {
  if (!currentEditProductId) return;
  const index = products.findIndex((p) => p.id === currentEditProductId);
  if (index === -1) {
    showAdminToast("找不到要更新的产品。", "danger");
    return;
  }

  products[index].name = document.getElementById("editName").value.trim();
  products[index].price = parseFloat(
    document.getElementById("editPrice").value
  );
  const discount = parseFloat(
    document.getElementById("editDiscountPrice").value
  );
  products[index].discountPrice =
    !isNaN(discount) && discount < products[index].price ? discount : null;
  products[index].description = document
    .getElementById("editDescription")
    .value.trim();
  products[index].category = document.getElementById("editCategory").value;
  products[index].stock =
    parseInt(document.getElementById("editStock").value) || 0;
  products[index].isBestSeller =
    document.getElementById("editIsBestSeller").checked;
  // products[index].status = document.getElementById('editProductStatus').value; // Add this if you have a status field in edit modal

  const imageEditFileInput = document.getElementById("editProductImageFile");
  if (imageEditFileInput.files && imageEditFileInput.files[0]) {
    showAdminToast("正在处理新图片...", "info");
    const newImageDataUrl = await processImageFile(imageEditFileInput);
    if (newImageDataUrl) products[index].images = [newImageDataUrl];
    else if (imageEditFileInput.files[0]) {
      return;
    }
  }

  saveProducts();
  renderProductTable();
  editProductModalInstance?.hide();
  showAdminToast("产品更新成功。", "success");
  currentEditProductId = null;
};

window.deleteProduct = (productId) => {
  if (confirm(`确定要删除产品ID: ${productId.slice(-6)} 吗？`)) {
    products = products.filter((p) => p.id !== productId);
    saveProducts();
    renderProductTable();
    showAdminToast("产品已删除。", "success");
  }
};

// ==================== User Management ====================
function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
  console.log("Admin.js: Users saved. Total:", users.length);
}

function renderUserTable(usersToRender = users) {
  const userTbody = document.getElementById("userTableBody");
  if (!userTbody) {
    console.error("userTableBody not found!");
    return;
  }
  userTbody.innerHTML = "";

  if (usersToRender.length === 0) {
    userTbody.innerHTML = `<tr><td colspan="9" class="text-center p-4 text-muted">没有用户数据</td></tr>`;
    return;
  }
  usersToRender.forEach((user) => {
    const tr = userTbody.insertRow();
    tr.innerHTML = `
            <td><small>${user.id ? user.id.slice(-6) : "N/A"}</small></td>
            <td>${user.name || "N/A"} ${
      user.isAdmin ? '<span class="badge bg-danger ms-1">Admin</span>' : ""
    }</td>
            <td>${user.email || "N/A"}</td>
            <td><span class="password-field text-muted" data-password="${
              user.password || ""
            }">•••••••• <i class="bi bi-eye-slash-fill ms-1 text-secondary" style="cursor:pointer;"></i></span></td>
            <td><small>${
              user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"
            }</small></td>
            <td><small>${
              user.lastLogin
                ? new Date(user.lastLogin).toLocaleString()
                : "从未登录"
            }</small></td>
            <td><span class="badge ${
              user.status === "active" ? "bg-success" : "bg-secondary"
            }">${user.status === "active" ? "活跃" : "禁用"}</span></td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary py-0 px-1 me-1" onclick="window.openEditUserModalAdmin('${
                  user.id
                }')"><i class="bi bi-pencil-square"></i> 编辑</button>
                <button class="btn btn-sm btn-outline-warning py-0 px-1 me-1" onclick="window.toggleUserStatus('${
                  user.id
                }')">
                    ${
                      user.status === "active"
                        ? '<i class="bi bi-slash-circle"></i> 禁用'
                        : '<i class="bi bi-check-circle"></i> 启用'
                    }
                </button>
                <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="window.deleteUser('${
                  user.id
                }')"><i class="bi bi-trash"></i></button>
            </td>
            <td>
                <select class="form-select form-select-sm payment-method-select" data-userid="${
                  user.id
                }">
                    <option value="cash" ${
                      user.paymentMethod === "cash" ? "selected" : ""
                    }>现金</option>
                    <option value="gcash" ${
                      user.paymentMethod === "gcash" ? "selected" : ""
                    }>GCash</option>
                    <option value="card" ${
                      user.paymentMethod === "card" ? "selected" : ""
                    }>信用卡</option>
                </select>
            </td>
        `;
  });
}

function handleUserTableClick(e) {
  if (e.target.closest(".password-field i")) {
    const passSpan = e.target.closest(".password-field");
    const eyeIcon = e.target;
    if (passSpan.textContent.startsWith("••••")) {
      passSpan.textContent = passSpan.dataset.password || "N/A";
      eyeIcon.classList.replace("bi-eye-slash-fill", "bi-eye-fill");
    } else {
      passSpan.innerHTML = `•••••••• <i class="bi bi-eye-slash-fill ms-1 text-secondary" style="cursor:pointer;"></i>`;
    }
  }
}

function handleUserTableChange(e) {
  if (e.target.classList.contains("payment-method-select")) {
    const userId = e.target.dataset.userid;
    const newMethod = e.target.value;
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].paymentMethod = newMethod;
      saveUsers();
      showAdminToast(
        `用户 ${users[userIndex].name} 的支付方式已更新为 ${newMethod}`,
        "success"
      );
    }
  }
}

window.toggleUserStatus = (userId) => {
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].status =
      users[userIndex].status === "active" ? "inactive" : "active";
    saveUsers();
    renderUserTable();
    showAdminToast(`用户状态已更新为 ${users[userIndex].status}`, "success");
  }
};

window.deleteUser = (userId) => {
  if (confirm(`确定要删除用户ID: ${userId.slice(-6)} 吗？此操作不可恢复!`)) {
    users = users.filter((u) => u.id !== userId);
    saveUsers();
    renderUserTable();
    showAdminToast("用户已删除。", "success");
  }
};

window.openEditUserModalAdmin = (userId) => {
  // Already defined in V2.6
  const user = users.find((u) => u.id === userId);
  if (!user) {
    showAdminToast("找不到用户信息。", "danger");
    return;
  }
  currentEditingUserIdAdmin = userId;
  document.getElementById("editUserIdAdmin").value = user.id;
  document.getElementById("editUserNameAdmin").value = user.name || "";
  document.getElementById("editUserEmailAdmin").value = user.email || "";
  document.getElementById("editUserPhoneAdmin").value = user.phone || "";
  document.getElementById("editUserAddressAdmin").value = user.address || "";
  document.getElementById("editUserStatusAdmin").value =
    user.status || "active";
  document.getElementById("editUserNewPasswordAdmin").value = "";
  document.getElementById("editUserConfirmPasswordAdmin").value = "";
  if (editUserModalAdminInstance) editUserModalAdminInstance.show();
  else console.error("Edit User Admin Modal instance not found");
};

window.handleSaveEditedUserAdmin = () => {
  if (!currentEditingUserIdAdmin) return;
  const userIndex = users.findIndex((u) => u.id === currentEditingUserIdAdmin);
  if (userIndex === -1) {
    showAdminToast("找不到要更新的用户。", "danger");
    return;
  }

  const newName = document.getElementById("editUserNameAdmin").value.trim();
  const newPhone = document.getElementById("editUserPhoneAdmin").value.trim();
  const newAddress = document
    .getElementById("editUserAddressAdmin")
    .value.trim();
  const newStatus = document.getElementById("editUserStatusAdmin").value;
  const newPassword = document.getElementById("editUserNewPasswordAdmin").value;
  const confirmPassword = document.getElementById(
    "editUserConfirmPasswordAdmin"
  ).value;

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
    // Add password complexity validation (optional)
    // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    // if (!passwordRegex.test(newPassword)) { showAdminToast("新密码不够复杂。", "warning"); return; }
    if (typeof CryptoJS === "undefined") {
      showAdminToast("CryptoJS library not loaded.", "danger");
      return;
    }
    users[userIndex].password = CryptoJS.SHA256(newPassword + SALT).toString();
    showAdminToast("用户密码已重置。", "info");
  }
  saveUsers();
  renderUserTable();

  let currentUserInStorage = JSON.parse(localStorage.getItem("currentUser"));
  if (
    currentUserInStorage &&
    currentUserInStorage.id === currentEditingUserIdAdmin
  ) {
    currentUserInStorage.name = newName;
    // ... update other fields for current admin if they edit themselves ...
    localStorage.setItem("currentUser", JSON.stringify(currentUserInStorage));
    document.getElementById("adminName").textContent =
      newName || currentUserInStorage.email;
  }
  if (editUserModalAdminInstance) editUserModalAdminInstance.hide();
  showAdminToast("用户信息更新成功。", "success");
  currentEditingUserIdAdmin = null;
};

function handleRefreshUsers() {
  loadData();
  renderUserTable();
  showAdminToast("用户列表已刷新。", "info");
}
function handleSearchUsers(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      user.id?.toLowerCase().includes(searchTerm)
  );
  renderUserTable(filteredUsers);
}

// ==================== Order Management ====================
function saveOrders() {
  localStorage.setItem("orders", JSON.stringify(orders));
  console.log("Admin.js: Orders saved. Total:", orders.length);
}

function renderOrderTable(ordersToDisplay = orders) {
  const tbody = document.getElementById("adminOrderTableBody");
  if (!tbody) {
    console.error("adminOrderTableBody not found!");
    return;
  }
  tbody.innerHTML = "";
  const sortedOrders = [...ordersToDisplay].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  if (sortedOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">没有订单数据</td></tr>`;
    return;
  }
  sortedOrders.forEach((order) => {
    const tr = tbody.insertRow();
    tr.innerHTML = `
            <td><small>${order.id ? order.id.slice(-8) : "N/A"}</small></td>
            <td>${order.shippingInfo?.name || order.userName || "N/A"}</td>
            <td><small>${
              order.shippingInfo?.email || order.userEmail || "N/A"
            }</small></td>
            <td><small>${
              order.date ? new Date(order.date).toLocaleDateString() : "N/A"
            }</small></td>
            <td class="text-end fw-bold">₱${
              order.totalAmount?.toFixed(2) || "0.00"
            }</td>
            <td><span class="badge bg-${getOrderStatusClassAdmin(
              order.status
            )}">${translateOrderStatusAdmin(order.status)}</span></td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-info py-0 px-1" onclick="window.showAdminOrderDetails('${
                  order.id
                }')"><i class="bi bi-eye-fill"></i> 查看</button>
            </td>`;
  });
}

function getOrderStatusClassAdmin(status) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "warning text-dark";
    case "confirmed":
      return "info text-dark";
    case "processing":
      return "secondary";
    case "shipped":
      return "primary";
    case "delivered":
      return "success";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "failed":
      return "danger";
    default:
      return "light text-dark";
  }
}
function translateOrderStatusAdmin(status) {
  const statusMap = {
    pending: "待处理",
    confirmed: "已确认",
    processing: "处理中",
    shipped: "运输中",
    delivered: "已送达",
    completed: "已完成",
    cancelled: "已取消",
    failed: "失败",
  };
  return statusMap[status?.toLowerCase()] || status || "未知";
}

window.showAdminOrderDetails = (orderId) => {
  const order = orders.find((o) => o.id === orderId);
  if (!order || !orderDetailsModalInstanceAdmin) {
    showAdminToast("找不到订单详情。", "danger");
    return;
  }
  currentViewingOrderIdAdmin = orderId;

  const modalBody = document.getElementById("orderDetailsModalAdminBody");
  const modalTitle = document.getElementById("orderDetailsModalAdminLabel");
  const statusSelect = document.getElementById("adminOrderStatusSelect");
  if (!modalBody || !modalTitle || !statusSelect) {
    console.error("Order details modal inner elements missing");
    return;
  }

  modalTitle.textContent = `订单详情: #${order.id.slice(-8)}`;
  statusSelect.value = order.status || "Pending";

  let itemsHtml = '<ul class="list-group list-group-flush">';
  order.items.forEach((item) => {
    itemsHtml += `<li class="list-group-item py-1 px-0 d-flex justify-content-between"><small>${
      item.name
    } (x${item.quantity})</small> <small>₱${(
      item.price * item.quantity
    ).toFixed(2)}</small></li>`;
  });
  itemsHtml += `</ul>`;

  modalBody.innerHTML = `
        <div class="row"><div class="col-md-6"><h6>客户信息:</h6><p class="mb-1"><small><strong>姓名:</strong> ${
          order.shippingInfo?.name || "N/A"
        }</small></p><p class="mb-1"><small><strong>邮箱:</strong> ${
    order.shippingInfo?.email || "N/A"
  }</small></p><p class="mb-1"><small><strong>电话:</strong> ${
    order.shippingInfo?.phone || "N/A"
  }</small></p><p class="mb-3"><small><strong>地址:</strong> ${
    order.shippingInfo?.address || "N/A"
  }</small></p></div><div class="col-md-6"><h6>订单信息:</h6><p class="mb-1"><small><strong>付款方式:</strong> ${
    order.paymentMethod || "N/A"
  }</small></p><p class="mb-1"><small><strong>当前状态:</strong> <span class="badge bg-${getOrderStatusClassAdmin(
    order.status
  )}">${translateOrderStatusAdmin(
    order.status
  )}</span></small></p><p class="mb-1"><small><strong>日期:</strong> ${new Date(
    order.date
  ).toLocaleString()}</small></p><p class="mb-3"><small><strong>总金额:</strong> <span class="fw-bold">₱${order.totalAmount.toFixed(
    2
  )}</span></small></p></div></div>
        ${
          order.notes
            ? `<h6 class="mt-2">客户备注:</h6><p class="bg-light p-2 rounded_sm small">${order.notes}</p>`
            : ""
        }
        <div class="mt-3"><label for="adminOrderNotesTextarea" class="form-label fw-bold">管理员备注:</label><textarea class="form-control form-control-sm" id="adminOrderNotesTextarea" rows="2">${
          order.adminNotes || ""
        }</textarea></div>
        <hr class="my-3"><h6>订购产品:</h6> ${itemsHtml}`;
  orderDetailsModalInstanceAdmin.show();
};

window.handleUpdateOrderAdmin = () => {
  if (!currentViewingOrderIdAdmin) {
    showAdminToast("没有选择订单。", "warning");
    return;
  }
  const orderIndex = orders.findIndex(
    (o) => o.id === currentViewingOrderIdAdmin
  );
  if (orderIndex === -1) {
    showAdminToast("找不到订单。", "danger");
    return;
  }

  const newStatus = document.getElementById("adminOrderStatusSelect").value;
  const adminNotes =
    document.getElementById("adminOrderNotesTextarea")?.value.trim() || "";

  orders[orderIndex].status = newStatus;
  orders[orderIndex].adminNotes = adminNotes;
  saveOrders();
  renderOrderTable();
  orderDetailsModalInstanceAdmin?.hide();
  showAdminToast(
    `订单 #${orders[orderIndex].id.slice(-8)} 已更新。`,
    "success"
  );
  currentViewingOrderIdAdmin = null;
};

function handleSearchOrdersAdmin(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm) ||
      (order.shippingInfo?.email || order.userEmail || "")
        .toLowerCase()
        .includes(searchTerm) ||
      (order.shippingInfo?.name || order.userName || "")
        .toLowerCase()
        .includes(searchTerm)
  );
  renderOrderTable(filteredOrders);
}

// ==================== Analytics ====================
window.updateAnalytics = () => {
  const totalRevenueEl = document.getElementById("totalRevenue");
  const totalOrdersEl = document.getElementById("totalOrders");
  const totalUsersEl = document.getElementById("totalUsers");
  const topProductEl = document.getElementById("topProduct");
  if (!totalRevenueEl || !totalOrdersEl || !totalUsersEl || !topProductEl)
    return;

  const startDateVal = document.getElementById("startDate").value;
  const endDateVal = document.getElementById("endDate").value;
  const timeRange = document.getElementById("timeRange").value;
  let startFilter = new Date(0),
    endFilter = new Date();
  const todayForAnalytics = new Date();
  const year = todayForAnalytics.getFullYear();
  const month = todayForAnalytics.getMonth();
  const day = todayForAnalytics.getDate();

  if (timeRange) {
    switch (timeRange) {
      case "day":
        startFilter = new Date(year, month, day, 0, 0, 0, 0);
        endFilter = new Date(year, month, day, 23, 59, 59, 999);
        break;
      case "week":
        const firstDay = new Date(todayForAnalytics);
        firstDay.setDate(day - todayForAnalytics.getDay());
        startFilter = new Date(firstDay.setHours(0, 0, 0, 0));
        endFilter = new Date();
        break;
      case "month":
        startFilter = new Date(year, month, 1);
        endFilter = new Date();
        break;
      case "year":
        startFilter = new Date(year, 0, 1);
        endFilter = new Date();
        break;
    }
    if (document.getElementById("startDate"))
      document.getElementById("startDate").valueAsDate = startFilter;
    if (document.getElementById("endDate"))
      document.getElementById("endDate").valueAsDate =
        endFilter < new Date() ? endFilter : new Date();
  } else if (startDateVal && endDateVal) {
    startFilter = new Date(startDateVal);
    startFilter.setHours(0, 0, 0, 0);
    endFilter = new Date(endDateVal);
    endFilter.setHours(23, 59, 59, 999);
  }

  const filteredOrders = orders.filter(
    (o) => new Date(o.date) >= startFilter && new Date(o.date) <= endFilter
  );
  const currentRevenue = filteredOrders.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );
  const productSales = {};
  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
    });
  });
  let topProductName = "-";
  if (Object.keys(productSales).length > 0) {
    const bestSellingId = Object.entries(productSales).sort(
      (a, b) => b[1] - a[1]
    )[0][0];
    const productInfo = products.find((p) => p.id === bestSellingId);
    topProductName = productInfo
      ? `${productInfo.name} (${productSales[bestSellingId]}件)`
      : "未知产品";
  }
  totalRevenueEl.textContent = `₱${currentRevenue.toFixed(2)}`;
  totalOrdersEl.textContent = filteredOrders.length;
  totalUsersEl.textContent = users.length;
  topProductEl.textContent = topProductName;
};

// ==================== Utilities ====================
function showAdminToast(message, type = "info") {
  const toastEl = document.getElementById("adminToast");
  if (!toastEl) {
    console.error("Admin Toast element not found!");
    return;
  }
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
  const toastBody = toastEl.querySelector(".toast-body");
  if (!toastBody) {
    console.error("Admin Toast body not found!");
    return;
  }
  toastBody.textContent = message;
  toastEl.className = "toast align-items-center text-white border-0";
  toastEl.classList.add(type === "danger" ? "bg-danger" : `text-bg-${type}`);
  toast.show();
}
