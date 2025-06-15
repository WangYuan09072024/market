// js/main.js - V3.3: Definitive, Full Version, Global Functions Aligned with User's HTML (from response #62)

document.addEventListener("DOMContentLoaded", () => {
  // --- Application State ---
  let allProducts = [];
  let cart = [];
  let currentUser = null;

  // --- DOM Element Cache ---
  const elements = {
    productGrid: document.getElementById("productGrid"),
    bestSellerGrid: document.getElementById("bestSellerGrid"),
    specialOfferGrid: document.getElementById("specialOfferGrid"),
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
    searchForm: document.querySelector(".search-form"),
    sidebar: document.getElementById("sidebar"),
    loadingOverlay: document.getElementById("loadingOverlay"),
    liveToastEl: document.getElementById("liveToast"),
  };
  const toastInstance = elements.liveToastEl
    ? bootstrap.Toast.getOrCreateInstance(elements.liveToastEl)
    : null;
  const cartModalInstance = elements.cartModalEl
    ? bootstrap.Modal.getOrCreateInstance(elements.cartModalEl)
    : null;
  const checkoutModalInstance = elements.checkoutModalEl
    ? bootstrap.Modal.getOrCreateInstance(elements.checkoutModalEl)
    : null;

  // --- Utility Functions ---
  window.showMainToast = (message, type = "info") => {
    console.log(`Main.js - Toast: [${type}] ${message}`);
    if (
      !elements.liveToastEl ||
      !toastInstance ||
      !elements.liveToastEl.querySelector(".toast-body")
    ) {
      console.warn(
        "Main.js: Toast elements not fully available. Alerting instead for:",
        message
      );
      alert(`${type.toUpperCase()}: ${message}`);
      return;
    }
    const toastBody = elements.liveToastEl.querySelector(".toast-body");
    toastBody.textContent = message;
    elements.liveToastEl.className = "toast align-items-center border-0";
    if (type) elements.liveToastEl.classList.add(`text-bg-${type}`);
    else elements.liveToastEl.classList.add("text-bg-secondary");
    toastInstance.show();
  };

  const showLoading = (show) => {
    if (elements.loadingOverlay)
      elements.loadingOverlay.style.display = show ? "flex" : "none";
  };

  const loadCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      console.log(
        "Main.js: LOG 0 - Raw 'currentUser' from localStorage on page load:",
        storedUser
      );
      if (storedUser && storedUser !== "null" && storedUser !== "undefined") {
        currentUser = JSON.parse(storedUser);
        console.log(
          "Main.js: LOG 1 - Parsed 'currentUser' on page load:",
          currentUser
        );
      } else {
        console.log(
          "Main.js: LOG 1.1 - 'currentUser' not found or is 'null'/'undefined' string. currentUser remains null."
        );
        currentUser = null;
      }
    } catch (e) {
      console.error(
        "Main.js: LOG 1.2 - Error parsing 'currentUser' from localStorage:",
        e
      );
      currentUser = null;
    }
  };

  const updateHeader = () => {
    console.log(
      "Main.js: LOG 2 - updateHeader() CALLED. Value of currentUser:",
      currentUser
    );
    if (!elements.authSection || !elements.welcomeSection) {
      console.error("Main.js: LOG 2.1 - Header elements NOT FOUND.");
      return;
    }

    document.getElementById("myAccountLinkOnHeader")?.remove();

    if (currentUser && typeof currentUser === "object" && currentUser.id) {
      console.log("Main.js: LOG 3 - User IS LOGGED IN.");
      elements.authSection.classList.add("d-none");
      elements.welcomeSection.classList.remove("d-none");
      elements.welcomeSection.style.display = "flex";
      if (elements.welcomeName)
        elements.welcomeName.textContent =
          currentUser.name || currentUser.email || "User";

      const accountLink = document.createElement("a");
      accountLink.id = "myAccountLinkOnHeader";
      accountLink.href = "account.html";
      accountLink.className = "btn btn-sm btn-outline-info me-2 ms-2";
      accountLink.innerHTML =
        '<i class="bi bi-person-lines-fill"></i> 我的账户';
      const firstButtonInWelcome =
        elements.welcomeSection.querySelector("button.btn-success");
      if (firstButtonInWelcome)
        elements.welcomeSection.insertBefore(accountLink, firstButtonInWelcome);
      else {
        const welcomeTextSpanContainer =
          elements.welcomeSection.querySelector(".welcome-text");
        if (welcomeTextSpanContainer)
          welcomeTextSpanContainer.insertAdjacentElement(
            "afterend",
            accountLink
          );
        else elements.welcomeSection.appendChild(accountLink);
      }
      console.log("Main.js: LOG 4 - 'My Account' link added.");
    } else {
      console.log("Main.js: LOG 5 - User IS NOT LOGGED IN.");
      elements.authSection.classList.remove("d-none");
      elements.authSection.style.display = "flex";
      elements.welcomeSection.classList.add("d-none");
      elements.welcomeSection.style.display = "none";
    }
  };

  const loadProducts = async () => {
    showLoading(true);
    try {
      const storedProducts = localStorage.getItem("products");
      if (storedProducts && JSON.parse(storedProducts).length > 0) {
        allProducts = JSON.parse(storedProducts);
      } else {
        allProducts = [
          {
            id: "mock1",
            name: "经典可乐 (330ml)",
            price: 20,
            images: ["img/new.png"],
            category: "饮料 / 啤酒",
            stock: 100,
            status: "active",
            description: "清爽提神，经典口味",
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            isBestSeller: false,
            discountPrice: null,
          },
          {
            id: "mock2",
            name: "香辣牛肉味方便面 (袋装)",
            price: 15,
            discountPrice: 12,
            images: ["img/discount.png"],
            category: "方便面 / 粥 / 米粉 / 粉丝",
            stock: 50,
            status: "active",
            isBestSeller: true,
            description: "浓郁汤底，劲道面条",
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
          {
            id: "mock3",
            name: "巧克力夹心饼干 (家庭装)",
            price: 30,
            images: ["img/free.png"],
            category: "零食 / 小吃",
            stock: 75,
            status: "active",
            description: "香甜酥脆，美味分享",
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            isBestSeller: true,
            discountPrice: 25,
          },
          {
            id: "mock4",
            name: "纯牛奶 (1L装)",
            price: 40,
            images: ["img/new.png"],
            category: "牛奶",
            stock: 30,
            status: "active",
            description: "营养丰富，天然健康",
            createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            isBestSeller: false,
            discountPrice: 35,
          },
        ];
        localStorage.setItem("products", JSON.stringify(allProducts));
      }
      allProducts.forEach((product) => {
        product.isOnSale = !!product.discountPrice;
        product.searchName = product.name?.toLowerCase() || "";
        product.searchCategory = product.category?.toLowerCase() || "";
      });
      console.log(
        "Main.js: Products loaded/processed. Total:",
        allProducts.length
      );
    } catch (e) {
      console.error("Main.js: Error loading products:", e);
      window.showMainToast("加载产品时出错", "danger");
    } finally {
      showLoading(false);
    }
  };

  const _renderProductsInternal = (productsToRender, containerElement) => {
    if (!containerElement) {
      console.warn(
        "Main.js - _renderProductsInternal: Target container not found."
      );
      return;
    }
    const activeProducts = productsToRender.filter(
      (p) => p.status === "active"
    );
    console.log(
      "Main.js: Rendering",
      activeProducts.length,
      "active products into #" + containerElement.id
    );

    if (activeProducts.length === 0) {
      containerElement.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted">没有找到符合条件的产品。</p></div>`;
      return;
    }
    containerElement.innerHTML = activeProducts
      .map(
        (product) => `
            <div class="col-6 col-md-4 col-lg-3 mb-4">
                <div class="card product-card h-100 shadow-sm">
                     <div class="product-image-wrapper position-relative">
                        <img src="${
                          product.images && product.images[0]
                            ? product.images[0]
                            : "img/new.png"
                        }" 
                             class="card-img-top product-card-img" alt="${
                               product.name
                             }" 
                             onerror="this.onerror=null; this.src='img/new.png';">
                        ${
                          product.discountPrice
                            ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2 product-badge">- ${Math.round(
                                (1 - product.discountPrice / product.price) *
                                  100
                              )}%</span>`
                            : ""
                        }
                        ${
                          product.isBestSeller
                            ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2 product-badge"><i class="bi bi-star-fill"></i> 热销</span>`
                            : ""
                        }
                    </div>
                    <div class="card-body d-flex flex-column p-2 pt-1">
                        <h5 class="card-title product-title flex-grow-1 mb-1" title="${
                          product.name
                        }">${product.name}</h5>
                        <p class="card-text mb-1 product-price">
                            <span class="text-danger fs-6 fw-bold">₱${(
                              product.discountPrice || product.price
                            ).toFixed(2)}</span>
                            ${
                              product.discountPrice
                                ? `<small class="text-muted text-decoration-line-through ms-1 product-original-price">₱${product.price.toFixed(
                                    2
                                  )}</small>`
                                : ""
                            }
                        </p>
                         <p class="card-text text-muted mb-2 product-stock">库存: ${
                           product.stock > 0 ? product.stock : "售罄"
                         }</p>
                    </div>
                    <div class="card-footer bg-transparent border-top-0 text-center p-2 pb-3">
                        <button class="btn btn-success w-100 btn-sm add-to-cart-btn" onclick="window.addToCart('${
                          product.id
                        }')" ${product.stock <= 0 ? "disabled" : ""}>
                            <i class="bi bi-cart-plus"></i> ${
                              product.stock <= 0 ? "已售罄" : "加入购物车"
                            }
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  };
  if (typeof document.defaultView.renderProductsMain === "undefined") {
    document.defaultView.renderProductsMain = _renderProductsInternal;
  }

  const renderHomePageContent = () => {
    if (!elements.bestSellerGrid && !elements.specialOfferGrid) return;
    const bestSellers = allProducts.filter(
      (p) => p.isBestSeller && p.status === "active"
    );
    const specialOffers = allProducts.filter(
      (p) => p.isOnSale && p.status === "active"
    );
    if (document.defaultView.renderProductsMain) {
      document.defaultView.renderProductsMain(
        bestSellers.slice(0, 4),
        elements.bestSellerGrid
      );
      document.defaultView.renderProductsMain(
        specialOffers.slice(0, 4),
        elements.specialOfferGrid
      );
    }
  };

  const loadCartFromLocalStorage = () => {
    try {
      cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!Array.isArray(cart)) cart = [];
    } catch (e) {
      cart = [];
      console.error("Error loading cart:", e);
    }
  };
  const saveCartToLocalStorage = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCountUI();
  };
  const updateCartCountUI = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (elements.cartCountNodes)
      elements.cartCountNodes.forEach((el) => {
        if (el) el.textContent = totalItems;
      });
  };

  const initEventListeners = () => {
    elements.searchForm?.addEventListener("submit", window.handleSearch);
    document.querySelectorAll(".category-list a").forEach((link) => {
      if (link.getAttribute("onclick")?.includes("filterByCategory")) return;
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const categoryValue =
          this.dataset.category !== undefined
            ? this.dataset.category
            : this.textContent.trim();
        window.filterByCategory(
          categoryValue === "全部产品" ? "" : categoryValue
        );
      });
    });
    document
      .querySelectorAll(".category-card[data-category]")
      .forEach((card) => {
        card.addEventListener("click", function () {
          window.filterByCategory(this.dataset.category);
        });
      });
    // For menu-toggle and close-sidebar, HTML directly calls window.toggleSidebar()
  };

  const checkUrlParamsAndFilter = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category");
    const search = urlParams.get("search");
    if (elements.productGrid) {
      if (category) window.filterByCategory(decodeURIComponent(category));
      else if (search) {
        if (elements.searchInput)
          elements.searchInput.value = decodeURIComponent(search);
        window.handleSearch({ preventDefault: () => {} });
      } else if (document.defaultView.renderProductsMain) {
        document.defaultView.renderProductsMain(
          allProducts,
          elements.productGrid
        );
      }
    }
  };

  const initializeApp = async () => {
    console.log("Main.js V3.3: Initializing App...");
    showLoading(true);
    loadCurrentUser();
    window.addEventListener("online", () =>
      window.showMainToast("网络已连接", "success")
    );
    window.addEventListener("offline", () =>
      window.showMainToast("网络已断开", "warning")
    );
    await loadProducts();
    loadCartFromLocalStorage();
    updateHeader();
    updateCartCountUI();
    if (elements.productGrid) checkUrlParamsAndFilter();
    if (elements.bestSellerGrid || elements.specialOfferGrid)
      renderHomePageContent();
    initEventListeners();
    showLoading(false);
    console.log("Main.js V3.3: App Initialized.");
  };
  initializeApp();
}); // End of DOMContentLoaded

// --- Global Functions for HTML onclick attributes ---
window.logout = () => {
  console.log("Main.js - Global: window.logout() CALLED.");
  localStorage.removeItem("currentUser");
  document.getElementById("myAccountLinkOnHeader")?.remove();
  window.location.reload();
};

window.showCart = () => {
  const cartFromStorage = JSON.parse(localStorage.getItem("cart") || "[]");
  const productsFromStorage = JSON.parse(
    localStorage.getItem("products") || "[]"
  );
  const cartModalBody = document.getElementById("cartModalBody");
  const cartTotalPrice = document.getElementById("cartTotalPrice");
  const cartModalEl = document.getElementById("cartModal");
  const cMI = cartModalEl
    ? bootstrap.Modal.getOrCreateInstance(cartModalEl)
    : null;

  if (!cartModalBody || !cartTotalPrice || !cMI) {
    console.error("Cart modal elements missing.");
    return;
  }
  const checkoutBtnInCart = document.querySelector(
    '#cartModal button[onclick="window.checkout()"]'
  ); // More specific
  if (cartFromStorage.length === 0) {
    cartModalBody.innerHTML = `<div class="text-center py-4"><i class="bi bi-cart-x fs-1 text-muted"></i><p class="mt-2">您的购物车是空的</p></div>`;
    cartTotalPrice.textContent = "0.00";
    if (checkoutBtnInCart) checkoutBtnInCart.disabled = true;
  } else {
    cartModalBody.innerHTML = cartFromStorage
      .map((item) => {
        const pD = productsFromStorage.find((p) => p.id === item.id);
        const img = pD?.images?.[0] || "img/new.png";
        const name = pD?.name || item.name || "?";
        const price = item.price;
        const stock = pD?.stock ?? Infinity;
        return `
            <div class="cart-item d-flex justify-content-between align-items-center mb-3 p-2 border-bottom">
                <div class="d-flex align-items-center"><img src="${img}" alt="${name}" width="60" height="60" class="me-3 rounded shadow-sm object-fit-cover" onerror="this.src='img/new.png';"><div><h6 class="mb-0 text-truncate" style="max-width:180px;" title="${name}">${name}</h6><small class="text-muted">₱${price.toFixed(
          2
        )} x ${item.quantity}</small></div></div>
                <div class="text-end"><h6 class="mb-1 fw-bold">₱${(
                  price * item.quantity
                ).toFixed(
                  2
                )}</h6><div class="btn-group btn-group-sm mt-1"><button class="btn btn-outline-secondary px-2" onclick="window.updateCartItemQuantity('${
          item.id
        }',-1)"><i class="bi bi-dash-lg"></i></button><button class="btn btn-light disabled px-2">${
          item.quantity
        }</button><button class="btn btn-outline-secondary px-2" onclick="window.updateCartItemQuantity('${
          item.id
        }',1)" ${
          item.quantity >= stock ? "disabled" : ""
        }><i class="bi bi-plus-lg"></i></button><button class="btn btn-outline-danger ms-2 px-2" onclick="window.removeCartItem('${
          item.id
        }')"><i class="bi bi-trash"></i></button></div></div>
            </div>`;
      })
      .join("");
    const total = cartFromStorage.reduce((s, i) => {
      const pds = JSON.parse(localStorage.getItem("products") || "[]"); // Re-fetch for accurate price
      const pD = pds.find((p) => p.id === i.id);
      const price = pD?.discountPrice || pD?.price || i.price || 0; // Use product list price
      return s + price * i.quantity;
    }, 0);
    cartTotalPrice.textContent = total.toFixed(2);
    if (checkoutBtnInCart) checkoutBtnInCart.disabled = false;
  }
  cMI.show();
};

window.updateCartItemQuantity = (productId, change) => {
  let cCart = JSON.parse(localStorage.getItem("cart") || "[]");
  const itemIdx = cCart.findIndex((i) => i.id === productId);
  if (itemIdx > -1) {
    const prods = JSON.parse(localStorage.getItem("products") || "[]");
    const pDetail = prods.find((p) => p.id === productId);
    const stock = pDetail ? pDetail.stock : 0;
    cCart[itemIdx].quantity += change;
    if (cCart[itemIdx].quantity > stock) cCart[itemIdx].quantity = stock;
    if (cCart[itemIdx].quantity <= 0) cCart.splice(itemIdx, 1);
    localStorage.setItem("cart", JSON.stringify(cCart));
    const totalItems = cCart.reduce((s, i) => s + i.quantity, 0);
    document
      .querySelectorAll("#cartCount, #cartCountLoggedIn")
      .forEach((el) => {
        if (el) el.textContent = totalItems;
      });
    window.showCart();
  }
};

window.removeCartItem = (productId) => {
  let cCart = JSON.parse(localStorage.getItem("cart") || "[]");
  cCart = cCart.filter((i) => i.id !== productId);
  localStorage.setItem("cart", JSON.stringify(cCart));
  const totalItems = cCart.reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll("#cartCount, #cartCountLoggedIn").forEach((el) => {
    if (el) el.textContent = totalItems;
  });
  window.showCart();
};

window.addToCart = (productId) => {
  console.log(
    "Main.js - Global window.addToCart CALLED with productId:",
    productId
  );
  if (!productId) {
    console.error("Main.js - addToCart: productId is undefined.");
    window.showMainToast("ID sản phẩm không hợp lệ.", "danger");
    return;
  }

  const productsFromStorageString = localStorage.getItem("products");
  if (!productsFromStorageString) {
    console.error("Main.js - addToCart: 'products' not found.");
    window.showMainToast("Dữ liệu sản phẩm chưa tải.", "danger");
    return;
  }
  let productsFromStorage;
  try {
    productsFromStorage = JSON.parse(productsFromStorageString);
    if (!Array.isArray(productsFromStorage))
      throw new Error("Products not array.");
  } catch (e) {
    console.error("Main.js - addToCart: Error parsing 'products':", e);
    window.showMainToast("Lỗi dữ liệu sản phẩm.", "danger");
    return;
  }

  const product = productsFromStorage.find((p) => p.id === productId);
  console.log("Main.js - addToCart: Found product:", product);

  if (!product) {
    console.error("Main.js - addToCart: Product ID", productId, "not found.");
    window.showMainToast(`Không tìm thấy sản phẩm ID: ${productId}`, "danger");
    return;
  }
  if (product.stock <= 0) {
    window.showMainToast(`${product.name} 已售罄!`, "warning");
    return;
  }

  let currentCart = [];
  const cartString = localStorage.getItem("cart");
  if (cartString) {
    try {
      currentCart = JSON.parse(cartString);
      if (!Array.isArray(currentCart)) currentCart = [];
    } catch (e) {
      console.error("Main.js - addToCart: Error parsing 'cart'. Resetting.", e);
      currentCart = [];
    }
  }
  // console.log("Main.js - addToCart: Current cart BEFORE:", JSON.parse(JSON.stringify(currentCart)));

  const existingItem = currentCart.find((item) => item.id === productId);
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++;
    } else {
      window.showMainToast(
        `购物车中 ${product.name} 的数量已达到库存上限!`,
        "warning"
      );
      return;
    }
  } else {
    currentCart.push({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      quantity: 1,
    });
  }
  try {
    localStorage.setItem("cart", JSON.stringify(currentCart));
  } catch (e) {
    console.error("Main.js - addToCart: Error saving cart:", e);
    window.showMainToast("Lưu giỏ hàng thất bại.", "danger");
    return;
  }

  const totalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cartCount, #cartCountLoggedIn").forEach((el) => {
    if (el) el.textContent = totalItems;
  });
  window.showMainToast(`${product.name} 已添加到购物车`, "success");
};

window.filterByCategory = (category) => {
  console.log("Main.js - Global filterByCategory called with:", category);
  const productGrid = document.getElementById("productGrid");
  const currentPath = window.location.pathname;
  const onHomePage = currentPath.endsWith("home.html");

  if (!productGrid && !onHomePage) {
    window.location.href = `home.html?category=${encodeURIComponent(category)}`;
    return;
  }
  if (!productGrid && onHomePage) {
    // Should not happen if home.html has productGrid
    console.warn("filterByCategory: productGrid not found on home.html!");
    return;
  }
  if (!productGrid && !onHomePage) {
    // e.g. on index.html
    window.location.href = `home.html?category=${encodeURIComponent(category)}`;
    return;
  }

  const productsFromStorage = JSON.parse(
    localStorage.getItem("products") || "[]"
  );
  const filtered = category
    ? productsFromStorage.filter(
        (p) => p.category === category && p.status === "active"
      )
    : productsFromStorage.filter((p) => p.status === "active");

  if (document.defaultView.renderProductsMain)
    document.defaultView.renderProductsMain(filtered, productGrid);
  else
    console.error(
      "renderProductsMain is not globally available for filterByCategory"
    );

  document.querySelectorAll(".category-list a").forEach((a) => {
    const linkCategoryOnClick = a
      .getAttribute("onclick")
      ?.match(/filterByCategory\(['"](.*?)['"]\)/)?.[1];
    const linkCategoryData = a.dataset.category;
    const linkCategoryText = a.textContent.trim();
    const effectiveLinkCategory =
      linkCategoryData !== undefined
        ? linkCategoryData
        : linkCategoryOnClick !== undefined
        ? linkCategoryOnClick
        : linkCategoryText;

    if (
      effectiveLinkCategory === category ||
      (category === "" &&
        (effectiveLinkCategory === "全部产品" || effectiveLinkCategory === ""))
    ) {
      a.classList.add("active-category", "fw-bold", "text-success");
    } else {
      a.classList.remove("active-category", "fw-bold", "text-success");
    }
  });
  const sidebar = document.getElementById("sidebar");
  if (sidebar?.classList.contains("active")) window.toggleSidebar();
};

window.handleSearch = (event) => {
  if (event && typeof event.preventDefault === "function")
    event.preventDefault();
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  const keyword = searchInput.value.trim().toLowerCase();
  console.log("Main.js - Global handleSearch called with keyword:", keyword);

  if (!window.location.pathname.includes("home.html")) {
    window.location.href = `home.html?search=${encodeURIComponent(keyword)}`;
    return;
  }

  const productsFromStorage = JSON.parse(
    localStorage.getItem("products") || "[]"
  );
  const productGrid = document.getElementById("productGrid");
  if (!productGrid) {
    console.error("Product grid not found for search on home.html");
    return;
  }

  const filtered = productsFromStorage.filter(
    (p) =>
      p.status === "active" &&
      (p.name.toLowerCase().includes(keyword) ||
        (p.description && p.description.toLowerCase().includes(keyword)) ||
        p.category.toLowerCase().includes(keyword))
  );

  if (document.defaultView.renderProductsMain)
    document.defaultView.renderProductsMain(filtered, productGrid);
  else
    console.error(
      "renderProductsMain is not globally available for handleSearch"
    );

  if (filtered.length === 0) {
    productGrid.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted">没有找到与 "${searchInput.value}" 相关的产品。</p></div>`;
  }
};

window.toggleSidebar = () => {
  console.log("Main.js - Global toggleSidebar CALLED");
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    console.error("Sidebar element with ID 'sidebar' not found!");
    return;
  }
  const overlayId = "sidebar-overlay-dynamic";
  let overlay = document.getElementById(overlayId);

  const isActive = sidebar.classList.contains("active");

  if (isActive) {
    // Nếu đang mở -> thì đóng lại
    sidebar.classList.remove("active");
    if (overlay) {
      overlay.classList.remove("active");
      // Xóa overlay sau khi transition kết thúc để tránh tích tụ
      setTimeout(() => {
        overlay.remove();
        console.log("Sidebar overlay removed.");
      }, 300); // Thời gian phải khớp với transition của CSS (0.3s)
    }
    console.log("Sidebar is now inactive.");
  } else {
    // Nếu đang đóng -> thì mở ra
    if (!overlay) {
      // Nếu overlay chưa có, tạo mới
      overlay = document.createElement("div");
      overlay.id = overlayId;
      overlay.className = "sidebar-overlay"; // CSS sẽ style dựa trên class này
      overlay.onclick = window.toggleSidebar; // Nhấn vào overlay cũng đóng sidebar
      document.body.appendChild(overlay);
      console.log("Sidebar overlay created.");
    }
    sidebar.classList.add("active");
    // Dùng setTimeout nhỏ để đảm bảo overlay đã được thêm vào DOM trước khi thêm class active
    setTimeout(() => {
      if (overlay) overlay.classList.add("active");
    }, 10);
    console.log("Sidebar is now active.");
  }
};

window.checkout = () => {
  console.log("Main.js - Global window.checkout CALLED (shows checkout modal)");
  const localCUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const localC = JSON.parse(localStorage.getItem("cart") || "[]");
  const checkoutMB = document.getElementById("checkoutModalBody");
  const checkoutME = document.getElementById("checkoutModal");
  const cMI = checkoutME
    ? bootstrap.Modal.getOrCreateInstance(checkoutME)
    : null;

  if (!localCUser) {
    window.showMainToast("请先登录再进行结算", "warning");
    setTimeout(() => (window.location.href = "login.html"), 1500);
    return;
  }
  if (localC.length === 0) {
    window.showMainToast("您的购物车是空的", "warning");
    return;
  }

  const cartME = document.getElementById("cartModal");
  if (cartME) bootstrap.Modal.getInstance(cartME)?.hide();

  if (!checkoutMB || !cMI) {
    window.showMainToast("无法加载结算信息", "danger");
    return;
  }

  const prodsFS = JSON.parse(localStorage.getItem("products") || "[]");
  let summaryHtml = '<h5 class="mb-3 border-bottom pb-2">您的订单摘要:</h5>';
  let currentTotal = 0;
  localC.forEach((item) => {
    const pD = prodsFS.find((p) => p.id === item.id);
    const price = item.price;
    summaryHtml += `<div class="d-flex justify-content-between small mb-1"><span>${
      pD?.name || item.name
    } x ${item.quantity}</span><span>₱${(price * item.quantity).toFixed(
      2
    )}</span></div>`;
    currentTotal += price * item.quantity;
  });
  summaryHtml += `<hr class="my-2"><div class="d-flex justify-content-between fw-bold fs-5"><span>总计:</span><span>₱${currentTotal.toFixed(
    2
  )}</span></div><hr class="mt-2 mb-3">`;

  checkoutMB.innerHTML = `
        ${summaryHtml}
        <h5 class="mb-3 mt-4">收货信息:</h5>
        <form id="shippingInfoFormInModal" class="needs-validation" novalidate>
            <div class="mb-3"><label for="checkoutName" class="form-label">姓名 <span class="text-danger">*</span></label><input type="text" class="form-control form-control-sm" id="checkoutName" value="${
              localCUser.name || ""
            }" required></div>
            <div class="mb-3"><label for="checkoutAddress" class="form-label">地址 <span class="text-danger">*</span></label><input type="text" class="form-control form-control-sm" id="checkoutAddress" placeholder="详细地址..." value="${
              localCUser.address || ""
            }" required></div>
            <div class="mb-3"><label for="checkoutPhone" class="form-label">电话号码 <span class="text-danger">*</span></label><input type="tel" class="form-control form-control-sm" id="checkoutPhone" value="${
              localCUser.phone || ""
            }" required pattern="[0-9]{9,15}"></div>
            <div class="mb-3"><label for="checkoutEmail" class="form-label">电子邮箱 <span class="text-danger">*</span></label><input type="email" class="form-control form-control-sm" id="checkoutEmail" value="${
              localCUser.email || ""
            }" readonly required></div>
            <div class="mb-3"><label for="checkoutPaymentMethod" class="form-label">付款方式</label><select class="form-select form-select-sm" id="checkoutPaymentMethod"><option value="COD" selected>货到付款</option></select></div>
            <div class="mb-3"><label for="checkoutNotes" class="form-label">订单备注</label><textarea class="form-control form-control-sm" id="checkoutNotes" rows="2" placeholder="例如：具体送货时间..."></textarea></div>
        </form>
        
        `;
  cMI.show();
};

// This function is called by the button with id "confirmOrderBtnInModal" in the checkout modal
// Ensure your HTML for checkoutModal has: onclick="window.mainJsFunctions.submitOrder()"
// OR if it's onclick="window.submitOrder()", then this should be window.submitOrder
// Based on user's index.html from prompt #66, the button is:
// onclick="window.mainJsFunctions.submitOrder()"
// So, this needs to be in window.mainJsFunctions
if (!window.mainJsFunctions) window.mainJsFunctions = {};
window.mainJsFunctions.submitOrder = () => {
  console.log("Main.js - window.mainJsFunctions.submitOrder CALLED");
  const localCUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const localC = JSON.parse(localStorage.getItem("cart") || "[]");
  const checkoutME = document.getElementById("checkoutModal");
  const cMI_checkout = checkoutME
    ? bootstrap.Modal.getInstance(checkoutME)
    : null;

  if (!localCUser || localC.length === 0) {
    window.showMainToast("订单处理失败", "danger");
    return;
  }

  const form = document.getElementById("shippingInfoFormInModal");
  if (!form) {
    window.showMainToast("无法找到订单表单。", "danger");
    return;
  }

  let formIsValid = true;
  const requiredInputs = form.querySelectorAll("input[required]");
  requiredInputs.forEach((input) => {
    if (!input.value.trim()) {
      input.classList.add("is-invalid");
      formIsValid = false;
    } else {
      input.classList.remove("is-invalid");
    }
  });
  // Also trigger Bootstrap's native validation report
  if (!form.checkValidity()) {
    // This checks patterns, etc.
    formIsValid = false;
  }

  if (!formIsValid) {
    form.classList.add("was-validated");
    window.showMainToast("请填写所有必填的收货信息 (*)", "warning");
    return;
  }

  const newOrder = {
    id:
      "order_" +
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 5),
    userId: localCUser.id,
    date: new Date().toISOString(),
    items: [...localC],
    totalAmount: localC.reduce((sum, item) => {
      const pds = JSON.parse(localStorage.getItem("products") || "[]");
      const pD = pds.find((p) => p.id === item.id);
      const price = pD?.discountPrice || pD?.price || item.price || 0;
      return sum + price * item.quantity;
    }, 0),
    status: "Pending",
    shippingInfo: {
      name: document.getElementById("checkoutName").value.trim(),
      address: document.getElementById("checkoutAddress").value.trim(),
      phone: document.getElementById("checkoutPhone").value.trim(),
      email: document.getElementById("checkoutEmail").value.trim(),
    },
    paymentMethod: document.getElementById("checkoutPaymentMethod").value,
    notes: document.getElementById("checkoutNotes").value.trim(),
  };
  let orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("cart", "[]");

  document.querySelectorAll("#cartCount, #cartCountLoggedIn").forEach((el) => {
    if (el) el.textContent = 0;
  });

  cMI_checkout?.hide();
  window.showMainToast(
    `下单成功！订单ID: ${newOrder.id.slice(-6)}. 感谢您的购买！`,
    "success"
  );
};
