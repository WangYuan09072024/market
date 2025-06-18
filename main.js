// js/main.js - V4.0: Danh mục động được quản lý từ Admin (Phiên bản đầy đủ)

document.addEventListener("DOMContentLoaded", () => {
  // --- Application State ---
  let allProducts = [];
  let allCategories = []; // Thêm biến để lưu danh mục
  let cart = [];
  let currentUser = null;

  // --- DOM Element Cache ---
  const elements = {
      productGrid: document.getElementById("productGrid"),
      bestSellerGrid: document.getElementById("bestSellerGrid"),
      specialOfferGrid: document.getElementById("specialOfferGrid"),
      categoryListSidebar: document.getElementById("categoryListSidebar"), 
      featuredCategoriesContainer: document.getElementById("featuredCategoriesContainer"),
      cartCountNodes: document.querySelectorAll("#cartCount, #cartCountLoggedIn"),
      cartModalBody: document.getElementById("cartModalBody"),
      cartTotalPrice: document.getElementById("cartTotalPrice"),
      cartModalEl: document.getElementById("cartModal"),
      checkoutModalEl: document.getElementById("checkoutModal"),
      checkoutModalBody: document.getElementById("checkoutModalBody"),
      authSection: document.getElementById("authSection"),
      welcomeSection: document.getElementById("welcomeSection"),
      welcomeName: document.getElementById("welcomeName"),
      searchInput: document.getElementById("searchInput"),
      sidebar: document.getElementById("sidebar"),
      loadingOverlay: document.getElementById("loadingOverlay"),
      liveToastEl: document.getElementById("liveToast"),
  };
  const toastInstance = elements.liveToastEl ? bootstrap.Toast.getOrCreateInstance(elements.liveToastEl) : null;
  const cartModalInstance = elements.cartModalEl ? bootstrap.Modal.getOrCreateInstance(elements.cartModalEl) : null;
  const checkoutModalInstance = elements.checkoutModalEl ? bootstrap.Modal.getOrCreateInstance(elements.checkoutModalEl) : null;

  // --- Utility Functions ---
  window.showMainToast = (message, type = "info") => {
      if (!elements.liveToastEl || !toastInstance) {
          alert(`${type.toUpperCase()}: ${message}`);
          return;
      }
      const toastBody = elements.liveToastEl.querySelector(".toast-body");
      toastBody.textContent = message;
      elements.liveToastEl.className = "toast align-items-center border-0";
      elements.liveToastEl.classList.add(`text-bg-${type || 'secondary'}`);
      toastInstance.show();
  };

  const showLoading = (show) => {
      if (elements.loadingOverlay) elements.loadingOverlay.style.display = show ? "flex" : "none";
  };

  // --- Data Loading ---
  const loadCurrentUser = () => {
      try {
          const storedUser = localStorage.getItem("currentUser");
          currentUser = storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {
          currentUser = null;
      }
  };

  const loadProducts = () => {
      try {
          const storedProducts = localStorage.getItem("products");
          allProducts = storedProducts ? JSON.parse(storedProducts) : [];
          if (allProducts.length === 0) {
               allProducts = [
                  { id: "mock1", name: "经典可乐 (330ml)", price: 20, images: ["new.png"], category: "饮料 / 啤酒", stock: 100, status: "active", description: "清爽提神，经典口味", createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), isBestSeller: false, discountPrice: null },
                  { id: "mock2", name: "香辣牛肉味方便面 (袋装)", price: 15, discountPrice: 12, images: ["discount.png"], category: "方便面 / 粥 / 米粉 / 粉丝", stock: 50, status: "active", isBestSeller: true, description: "浓郁汤底，劲道面条", createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
              ];
              localStorage.setItem("products", JSON.stringify(allProducts));
          }
      } catch (e) {
          console.error("Lỗi tải sản phẩm:", e);
          allProducts = [];
      }
  };
  
  const loadCategories = () => {
      try {
          const storedCategories = localStorage.getItem("categories");
          allCategories = storedCategories ? JSON.parse(storedCategories) : [];
          if (allCategories.length === 0) {
              allCategories = ["热销产品", "食品", "零食 / 小吃", "饮料 / 啤酒", "方便面 / 粥 / 米粉 / 粉丝", "香烟", "0元购物", "即食食品", "蔬菜 / 水果", "日常食品", "牛奶", "咖啡", "药品", "书籍推荐"];
              localStorage.setItem("categories", JSON.stringify(allCategories));
          }
      } catch (e) {
          console.error("Lỗi tải danh mục:", e);
          allCategories = [];
      }
  };
  
  const getIconForCategory = (categoryName) => {
      const iconMap = {
          '热销产品': 'bi-star-fill',
          '食品': 'bi-basket-fill',
          '零食 / 小吃': 'bi-cookie',
          '饮料 / 啤酒': 'bi-cup-straw',
          '方便面 / 粥 / 米粉 / 粉丝': 'bi-minecart-loaded',
          '0元购物': 'bi-gift-fill',
          '即食食品': 'bi-egg-fried',
          '蔬菜 / 水果': 'bi-apple',
          '日常食品': 'bi-basket2-fill',
          '牛奶': 'bi-cup-hot',
          '咖啡': 'bi-cup-hot-fill',
          '药品': 'bi-capsule',
          '书籍推荐': 'bi-book-fill',
          '默认': 'bi-tag-fill'
      };
      return iconMap[categoryName] || iconMap['默认'];
  };

  const loadCartFromLocalStorage = () => {
      try {
          cart = JSON.parse(localStorage.getItem("cart") || "[]");
          if (!Array.isArray(cart)) cart = [];
      } catch (e) {
          cart = [];
      }
  };

  const saveCartToLocalStorage = () => {
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCountUI();
  };
  
  // --- UI Rendering ---
  const updateHeader = () => {
      if (!elements.authSection || !elements.welcomeSection) return;
      if (currentUser) {
          elements.authSection.style.display = "none";
          elements.welcomeSection.style.display = "flex";
          if (elements.welcomeName) elements.welcomeName.textContent = currentUser.name || currentUser.email;
          if (!document.getElementById('myAccountLinkOnHeader')) {
              const accountLink = document.createElement("a");
              accountLink.id = "myAccountLinkOnHeader";
              accountLink.href = "account.html";
              accountLink.className = "btn btn-sm btn-outline-info me-2";
              accountLink.style.color = 'black'; // Màu chữ và icon
              accountLink.style.border = '2px solid black'; // Độ dày, kiểu, và màu viền
              accountLink.innerHTML = ' 我的账户'; accountLink.style.color = 'black'; // Màu chữ và icon
              accountLink.innerHTML = '<i class="bi bi-person-lines-fill"></i> 我的账户';

              elements.welcomeSection.insertBefore(accountLink, elements.welcomeSection.querySelector('button.btn-success'));
          }
      } else {
          elements.authSection.style.display = "flex";
          elements.welcomeSection.style.display = "none";
      }
  };

  const updateCartCountUI = () => {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      elements.cartCountNodes.forEach(el => el.textContent = totalItems);
  };

  const renderProducts = (productsToRender, containerElement) => {
      if (!containerElement) return;
      const activeProducts = productsToRender.filter(p => p.status === "active");
      
      containerElement.innerHTML = activeProducts.length === 0 
          ? `<div class="col-12 text-center py-5"><p class="text-muted">没有找到符合条件的产品。</p></div>`
          : activeProducts.map(product => `
              <div class="col-6 col-md-4 col-lg-3">
                  <div class="card product-card h-100">
                       <div class="product-image-wrapper">
                          <img src="${product.images?.[0] || 'new.png'}" class="card-img-top" alt="${product.name}" onerror="this.src='new.png';">
                          ${product.discountPrice ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">- ${Math.round((1 - product.discountPrice / product.price) * 100)}%</span>` : ''}
                          ${product.isBestSeller ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2"><i class="bi bi-star-fill"></i> 热销</span>` : ''}
                      </div>
                      <div class="card-body d-flex flex-column p-2">
                          <h5 class="card-title product-title flex-grow-1">${product.name}</h5>
                          <p class="card-text product-price">
                              <span class="text-danger fs-5 fw-bold">₱${(product.discountPrice || product.price).toFixed(2)}</span>
                              ${product.discountPrice ? `<small class="text-muted text-decoration-line-through ms-2">₱${product.price.toFixed(2)}</small>` : ''}
                          </p>
                      </div>
                      <div class="card-footer p-2 border-0 bg-transparent">
                          <button class="btn btn-success w-100" onclick="window.addToCart('${product.id}')" ${product.stock <= 0 ? "disabled" : ""}>
                              <i class="bi bi-cart-plus"></i> ${product.stock <= 0 ? "已售罄" : "加入购物车"}
                          </button>
                      </div>
                  </div>
              </div>
          `).join('');
  };
  
  const renderSidebarCategories = () => {
      if (!elements.categoryListSidebar) return;
      let categoryHtml = allCategories.map(cat => `
          <li><a href="#" onclick="window.filterByCategory('${cat}'); return false;">
              <i class="bi ${getIconForCategory(cat)}"></i> ${cat}
          </a></li>
      `).join('');
      categoryHtml += `<li><a href="#" class="fw-bold" onclick="window.filterByCategory(''); return false;">
          <i class="bi bi-grid-fill"></i> 全部产品
      </a></li>`;
      elements.categoryListSidebar.innerHTML = categoryHtml;
  };
  
  const renderFeaturedCategories = () => {
      if (!elements.featuredCategoriesContainer) return;
      const featured = allCategories.slice(0, 4);
      elements.featuredCategoriesContainer.innerHTML = featured.map(cat => {
          const productCount = allProducts.filter(p => p.category === cat).length;
          return `
              <div class="col-6 col-md-3">
                  <div class="category-card" onclick="window.filterByCategory('${cat}')">
                      <div class="category-icon bg-success text-white">
                         <i class="bi ${getIconForCategory(cat)}"></i>
                      </div>
                      <h5>${cat}</h5>
                      <p>${productCount} 个产品</p>
                  </div>
              </div>`;
      }).join('');
  };

  // --- App Initialization ---
  const initializeApp = () => {
      showLoading(true);
      loadCurrentUser();
      loadProducts();
      loadCategories();
      loadCartFromLocalStorage();

      updateHeader();
      updateCartCountUI();
      
      // Chỉ render các thành phần có trên trang hiện tại
      if (elements.categoryListSidebar) renderSidebarCategories();
      if (elements.featuredCategoriesContainer) renderFeaturedCategories();
      
      if (elements.bestSellerGrid) {
          const bestSellers = allProducts.filter(p => p.isBestSeller && p.status === 'active');
          renderProducts(bestSellers.slice(0, 4), elements.bestSellerGrid);
      }
      if (elements.specialOfferGrid) {
          const specialOffers = allProducts.filter(p => p.discountPrice && p.status === 'active');
          renderProducts(specialOffers.slice(0, 4), elements.specialOfferGrid);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      const searchParam = urlParams.get('search');

      if (elements.productGrid) { // Logic này chỉ chạy trên home.html
          if (categoryParam) {
              window.filterByCategory(decodeURIComponent(categoryParam), true);
          } else if (searchParam) {
              if(elements.searchInput) elements.searchInput.value = decodeURIComponent(searchParam);
              window.handleSearch(new Event('submit'), true);
          } else {
              renderProducts(allProducts, elements.productGrid);
          }
      }
      
      showLoading(false);
  };

  initializeApp();
}); // --- End of DOMContentLoaded ---

// ===============================================
// == CÁC HÀM TOÀN CỤC (GLOBAL FUNCTIONS) ==
// ===============================================

window.addToCart = (productId) => {
  const products = JSON.parse(localStorage.getItem("products") || "[]");
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const product = products.find(p => p.id === productId);

  if (!product) return;
  if (product.stock <= 0) {
      window.showMainToast("Sản phẩm đã hết hàng!", "warning");
      return;
  }

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
      if (existingItem.quantity < product.stock) {
          existingItem.quantity++;
      } else {
          window.showMainToast("购物车中的数量已达到库存限制!", "warning");
          return;
      }
  } else {
      cart.push({
          id: product.id,
          name: product.name,
          price: product.discountPrice || product.price,
          quantity: 1,
      });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cartCount, #cartCountLoggedIn").forEach(el => el.textContent = totalItems);
  window.showMainToast(`${product.name} 已加入购物车`, "success");
};

window.filterByCategory = (category, calledFromLoad = false) => {
  const isOnHomePage = window.location.pathname.endsWith('home.html');

  if (!isOnHomePage) {
      window.location.href = `home.html?category=${encodeURIComponent(category)}`;
      return;
  }

  // Nếu đã ở trang home.html, thì thực hiện lọc
  const productGrid = document.getElementById("productGrid");
  const allProducts = JSON.parse(localStorage.getItem("products") || "[]");
  if (!productGrid) return;

  const filtered = category ? allProducts.filter(p => p.category === category) : allProducts;
  
  // Tạm thời tạo hàm render cục bộ để dùng
  const render = (p, c) => {
      c.innerHTML = p.length > 0 ? p.filter(i => i.status === 'active').map(item => `
      <div class="col-6 col-md-4 col-lg-3">
          <div class="card product-card h-100">
               <div class="product-image-wrapper">
                  <img src="${item.images?.[0] || 'new.png'}" class="card-img-top" alt="${item.name}" onerror="this.src='new.png';">
                  ${item.discountPrice ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">- ${Math.round((1 - item.discountPrice / item.price) * 100)}%</span>` : ''}
                  ${item.isBestSeller ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2"><i class="bi bi-star-fill"></i> 热销</span>` : ''}
              </div>
              <div class="card-body d-flex flex-column p-2">
                  <h5 class="card-title product-title flex-grow-1">${item.name}</h5>
                  <p class="card-text product-price">
                      <span class="text-danger fs-5 fw-bold">₱${(item.discountPrice || item.price).toFixed(2)}</span>
                      ${item.discountPrice ? `<small class="text-muted text-decoration-line-through ms-2">₱${item.price.toFixed(2)}</small>` : ''}
                  </p>
              </div>
              <div class="card-footer p-2 border-0 bg-transparent">
                  <button class="btn btn-success w-100" onclick="window.addToCart('${item.id}')" ${item.stock <= 0 ? "disabled" : ""}>
                      <i class="bi bi-cart-plus"></i> ${item.stock <= 0 ? "已售罄" : "加入购物车"}
                  </button>
              </div>
          </div>
      </div>`).join('') : `<div class="col-12 text-center py-5"><p class="text-muted">没有找到符合条件的产品。</p></div>`;
  };
  render(filtered, productGrid);

  document.querySelectorAll("#categoryListSidebar a").forEach(a => {
      const linkCategory = a.getAttribute('onclick').match(/filterByCategory\('(.*?)'\)/)[1];
      if (linkCategory === category) {
          a.classList.add('active-category');
      } else {
          a.classList.remove('active-category');
      }
  });

  if (calledFromLoad) {
       const sidebarLink = document.querySelector(`#categoryListSidebar a[onclick*="'${category}'"]`);
       if(sidebarLink) sidebarLink.classList.add('active-category');
  }
  
  const sidebar = document.getElementById("sidebar");
  if (sidebar?.classList.contains("active")) window.toggleSidebar();
};

window.handleSearch = (event, calledFromLoad = false) => {
  if(!calledFromLoad) event.preventDefault();
  const searchInput = document.getElementById("searchInput");
  const keyword = searchInput.value.trim();

  if (!window.location.pathname.endsWith('home.html')) {
      window.location.href = `home.html?search=${encodeURIComponent(keyword)}`;
      return;
  }
  
  const productGrid = document.getElementById("productGrid");
  const allProducts = JSON.parse(localStorage.getItem("products") || "[]");
  if (!productGrid) return;
  
  const searchLower = keyword.toLowerCase();
  const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      (p.description && p.description.toLowerCase().includes(searchLower))
  );
   const render = (p, c) => {
      c.innerHTML = p.length > 0 ? p.filter(i => i.status === 'active').map(item => `
      <div class="col-6 col-md-4 col-lg-3">
          <div class="card product-card h-100">
               <div class="product-image-wrapper">
                  <img src="${item.images?.[0] || 'new.png'}" class="card-img-top" alt="${item.name}" onerror="this.src='new.png';">
                  ${item.discountPrice ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">- ${Math.round((1 - item.discountPrice / item.price) * 100)}%</span>` : ''}
                  ${item.isBestSeller ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2"><i class="bi bi-star-fill"></i> 热销</span>` : ''}
              </div>
              <div class="card-body d-flex flex-column p-2">
                  <h5 class="card-title product-title flex-grow-1">${item.name}</h5>
                  <p class="card-text product-price">
                      <span class="text-danger fs-5 fw-bold">₱${(item.discountPrice || item.price).toFixed(2)}</span>
                      ${item.discountPrice ? `<small class="text-muted text-decoration-line-through ms-2">₱${item.price.toFixed(2)}</small>` : ''}
                  </p>
              </div>
              <div class="card-footer p-2 border-0 bg-transparent">
                  <button class="btn btn-success w-100" onclick="window.addToCart('${item.id}')" ${item.stock <= 0 ? "disabled" : ""}>
                      <i class="bi bi-cart-plus"></i> ${item.stock <= 0 ? "已售罄" : "加入购物车"}
                  </button>
              </div>
          </div>
      </div>`).join('') : `<div class="col-12 text-center py-5"><p class="text-muted">没有找到与 "${keyword}" 相关的产品。</p></div>`;
  };
  render(filtered, productGrid);
};

window.toggleSidebar = () => {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.toggle('active');
};

window.logout = () => {
  localStorage.removeItem("currentUser");
  window.location.reload();
};

window.showCart = () => {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const allProducts = JSON.parse(localStorage.getItem("products") || "[]");
  const modalBody = document.getElementById("cartModalBody");
  const totalPriceEl = document.getElementById("cartTotalPrice");
  const checkoutBtn = document.querySelector('#cartModal button[onclick="checkout()"]');
  
  if (cart.length === 0) {
      modalBody.innerHTML = `<div class="text-center py-4"><p>您的购物车是空的</p></div>`;
      totalPriceEl.textContent = "0.00";
      if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
      modalBody.innerHTML = cart.map(item => {
          const product = allProducts.find(p => p.id === item.id);
          return `
          <div class="cart-item d-flex align-items-center justify-content-between mb-2">
              <img src="${product?.images[0] || 'new.png'}" width="50" class="me-3">
              <div class="flex-grow-1">
                  <div>${item.name}</div>
                  <small class="text-muted">₱${item.price.toFixed(2)}</small>
              </div>
              <div class="d-flex align-items-center">
                  <button class="btn btn-sm btn-outline-secondary" onclick="updateCartItemQuantity('${item.id}', -1)">-</button>
                  <span class="mx-2">${item.quantity}</span>
                  <button class="btn btn-sm btn-outline-secondary" onclick="updateCartItemQuantity('${item.id}', 1)" ${item.quantity >= product.stock ? 'disabled' : ''}>+</button>
                  <button class="btn btn-sm btn-outline-danger ms-3" onclick="removeCartItem('${item.id}')"><i class="bi bi-trash"></i></button>
              </div>
          </div>`;
      }).join('');
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      totalPriceEl.textContent = total.toFixed(2);
      if (checkoutBtn) checkoutBtn.disabled = false;
  }
  bootstrap.Modal.getOrCreateInstance(document.getElementById('cartModal')).show();
};

window.updateCartItemQuantity = (productId, change) => {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const allProducts = JSON.parse(localStorage.getItem("products") || "[]");
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex > -1) {
      const product = allProducts.find(p => p.id === productId);
      const newQuantity = cart[itemIndex].quantity + change;
      if (newQuantity > 0 && newQuantity <= product.stock) {
          cart[itemIndex].quantity = newQuantity;
      } else if (newQuantity <= 0) {
          cart.splice(itemIndex, 1);
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      window.showCart(); // Re-render the cart
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      document.querySelectorAll("#cartCount, #cartCountLoggedIn").forEach(el => el.textContent = totalItems);
  }
};

window.removeCartItem = (productId) => {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));
  window.showCart(); // Re-render the cart
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cartCount, #cartCountLoggedIn").forEach(el => el.textContent = totalItems);
};

window.checkout = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!currentUser) {
      window.showMainToast("请先登录再进行结算", "warning");
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
  }
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (cart.length === 0) {
      window.showMainToast("您的购物车是空的", "warning");
      return;
  }

  bootstrap.Modal.getInstance(document.getElementById('cartModal'))?.hide();
  
  const checkoutModalBody = document.getElementById('checkoutModalBody');
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  checkoutModalBody.innerHTML = `
      <h5>订单摘要</h5>
      <ul class="list-group mb-3">
          ${cart.map(item => `<li class="list-group-item d-flex justify-content-between"><span>${item.name} x${item.quantity}</span> <span>₱${(item.price * item.quantity).toFixed(2)}</span></li>`).join('')}
          <li class="list-group-item d-flex justify-content-between fw-bold"><span>总计</span> <span>₱${total.toFixed(2)}</span></li>
      </ul>
      <h5>收货信息</h5>
      <form id="shippingInfoForm">
          <div class="mb-2"><label>姓名</label><input type="text" class="form-control" id="checkoutName" value="${currentUser.name || ''}" required></div>
          <div class="mb-2"><label>电话</label><input type="text" class="form-control" id="checkoutPhone" value="${currentUser.phone || ''}" required></div>
          <div class="mb-2"><label>地址</label><input type="text" class="form-control" id="checkoutAddress" value="${currentUser.address || ''}" required></div>
      </form>`;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('checkoutModal')).show();
};

if (!window.mainJsFunctions) window.mainJsFunctions = {};
window.mainJsFunctions.submitOrder = () => {
  const form = document.getElementById('shippingInfoForm');
  if (!form.checkValidity()) {
      form.reportValidity();
      return;
  }

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const newOrder = {
      id: 'order_' + Date.now().toString(36),
      userId: currentUser.id,
      userEmail: currentUser.email,
      date: new Date().toISOString(),
      items: cart,
      totalAmount: total,
      status: 'pending',
      shippingInfo: {
          name: document.getElementById('checkoutName').value,
          phone: document.getElementById('checkoutPhone').value,
          address: document.getElementById('checkoutAddress').value,
      }
  };

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("cart", "[]");

  // Update UI
  document.querySelectorAll("#cartCount, #cartCountLoggedIn").forEach(el => el.textContent = 0);
  bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
  window.showMainToast("下单成功！感谢您的购买！", "success");
};
