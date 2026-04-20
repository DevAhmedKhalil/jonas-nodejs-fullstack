const API_BASE = `${window.location.origin}/api/v1`;

const state = {
  categories: [],
  products: [],
  token: localStorage.getItem("ecommerceToken") || "",
  userEmail: localStorage.getItem("ecommerceUserEmail") || "",
};

const elements = {
  categoriesGrid: document.getElementById("categoriesGrid"),
  productsGrid: document.getElementById("productsGrid"),
  categoriesMetric: document.getElementById("categoriesMetric"),
  productsMetric: document.getElementById("productsMetric"),
  sessionMetric: document.getElementById("sessionMetric"),
  categoriesSummary: document.getElementById("categoriesSummary"),
  productsSummary: document.getElementById("productsSummary"),
  categoryFilter: document.getElementById("categoryFilter"),
  productCategorySelect: document.getElementById("productCategorySelect"),
  keywordInput: document.getElementById("keywordInput"),
  refreshDataButton: document.getElementById("refreshDataButton"),
  loginForm: document.getElementById("loginForm"),
  signupForm: document.getElementById("signupForm"),
  categoryForm: document.getElementById("categoryForm"),
  productForm: document.getElementById("productForm"),
  messageBox: document.getElementById("messageBox"),
  sessionStatus: document.getElementById("sessionStatus"),
  logoutButton: document.getElementById("logoutButton"),
  apiBaseLabel: document.getElementById("apiBaseLabel"),
};

const categoryTemplate = document.getElementById("categoryCardTemplate");
const productTemplate = document.getElementById("productCardTemplate");

const setMessage = (message, type = "info") => {
  const prefix =
    type === "error" ? "Error" : type === "success" ? "Success" : "Info";
  elements.messageBox.textContent = `${prefix}: ${message}`;
};

const authHeaders = () =>
  state.token
    ? {
        Authorization: `Bearer ${state.token}`,
      }
    : {};

const updateSessionUi = () => {
  const isLoggedIn = Boolean(state.token);
  elements.sessionMetric.textContent = isLoggedIn ? "Signed in" : "Guest";
  elements.sessionStatus.textContent = isLoggedIn
    ? `Signed in as ${state.userEmail || "authenticated user"}.`
    : "You are browsing as a guest.";
  elements.logoutButton.classList.toggle("hidden", !isLoggedIn);
};

const saveSession = (token, email) => {
  state.token = token;
  state.userEmail = email || "";
  localStorage.setItem("ecommerceToken", token);
  localStorage.setItem("ecommerceUserEmail", email || "");
  updateSessionUi();
};

const clearSession = () => {
  state.token = "";
  state.userEmail = "";
  localStorage.removeItem("ecommerceToken");
  localStorage.removeItem("ecommerceUserEmail");
  updateSessionUi();
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (typeof payload === "object" && payload !== null) {
      throw new Error(payload.message || JSON.stringify(payload));
    }
    throw new Error(payload || "Request failed.");
  }

  return payload;
};

const createEmptyState = (text) => {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.textContent = text;
  return div;
};

const renderCategories = () => {
  elements.categoriesGrid.innerHTML = "";
  elements.categoryFilter.innerHTML =
    '<option value="">All categories</option>';
  elements.productCategorySelect.innerHTML =
    '<option value="">Select a category</option>';

  state.categories.forEach((category) => {
    const node = categoryTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector("h3").textContent = category.name;
    node.querySelector("p").textContent = category.slug
      ? `Slug: ${category.slug}`
      : "Ready for products";

    const media = node.querySelector(".category-card__media");
    if (category.image) {
      media.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.16)), url('${category.image}')`;
      media.style.backgroundSize = "cover";
      media.style.backgroundPosition = "center";
    }

    elements.categoriesGrid.appendChild(node);

    const option = document.createElement("option");
    option.value = category._id;
    option.textContent = category.name;
    elements.categoryFilter.appendChild(option);
    elements.productCategorySelect.appendChild(option.cloneNode(true));
  });

  if (!state.categories.length) {
    elements.categoriesGrid.appendChild(
      createEmptyState("No categories yet. Create one from the admin desk.")
    );
  }

  elements.categoriesMetric.textContent = state.categories.length;
  elements.categoriesSummary.textContent = `${state.categories.length} categories loaded`;
};

const productMatchesFilter = (product) => {
  const selectedCategory = elements.categoryFilter.value;
  const keyword = elements.keywordInput.value.trim().toLowerCase();
  const categoryId =
    typeof product.category === "object" ? product.category._id : product.category;

  const matchesCategory = !selectedCategory || categoryId === selectedCategory;
  const matchesKeyword =
    !keyword ||
    product.title.toLowerCase().includes(keyword) ||
    product.description.toLowerCase().includes(keyword);

  return matchesCategory && matchesKeyword;
};

const renderProducts = () => {
  elements.productsGrid.innerHTML = "";
  const filteredProducts = state.products.filter(productMatchesFilter);

  filteredProducts.forEach((product) => {
    const node = productTemplate.content.firstElementChild.cloneNode(true);
    const image = node.querySelector("img");

    image.src =
      product.imageCover ||
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80";
    image.alt = product.title;

    node.querySelector("h3").textContent = product.title;
    node.querySelector(".price-pill").textContent = `$${Number(
      product.price || 0
    ).toFixed(2)}`;
    node.querySelector(".product-card__category").textContent =
      typeof product.category === "object" && product.category?.name
        ? product.category.name
        : "Uncategorized";
    node.querySelector(".product-card__description").textContent =
      product.description;
    node.querySelector(".quantity-chip").textContent = `Qty: ${product.quantity}`;
    node.querySelector(".sold-chip").textContent = `Sold: ${product.sold || 0}`;

    elements.productsGrid.appendChild(node);
  });

  if (!filteredProducts.length) {
    elements.productsGrid.appendChild(
      createEmptyState(
        state.products.length
          ? "No products match this filter."
          : "No products yet. Add one from the admin desk."
      )
    );
  }

  elements.productsMetric.textContent = state.products.length;
  elements.productsSummary.textContent = `${filteredProducts.length} visible products`;
};

const loadCategories = async () => {
  const payload = await fetchJson(`${API_BASE}/categories`);
  state.categories = payload.data || [];
  renderCategories();
};

const loadProducts = async () => {
  const payload = await fetchJson(`${API_BASE}/products?limit=50`);
  state.products = payload.data || [];
  renderProducts();
};

const loadDashboard = async () => {
  setMessage("Loading categories and products...");
  try {
    await Promise.all([loadCategories(), loadProducts()]);
    setMessage("Catalog synced with the backend.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
};

const onLogin = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const body = Object.fromEntries(formData.entries());

  try {
    const payload = await fetchJson(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    saveSession(payload.token, payload.data?.user?.email || body.email);
    setMessage("Logged in successfully. Admin forms are now ready.", "success");
    event.currentTarget.reset();
  } catch (error) {
    setMessage(error.message, "error");
  }
};

const onSignup = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const body = Object.fromEntries(formData.entries());

  try {
    const payload = await fetchJson(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    saveSession(payload.token, payload.data?.user?.email || body.email);
    setMessage(
      "Account created successfully. If this user should manage data, set its role to admin or manager.",
      "success"
    );
    event.currentTarget.reset();
  } catch (error) {
    setMessage(error.message, "error");
  }
};

const onCreateCategory = async (event) => {
  event.preventDefault();

  if (!state.token) {
    setMessage("Login first with an admin or manager account.", "error");
    return;
  }

  const formData = new FormData(event.currentTarget);

  try {
    await fetchJson(`${API_BASE}/categories`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    setMessage("Category created successfully.", "success");
    event.currentTarget.reset();
    await loadCategories();
  } catch (error) {
    setMessage(error.message, "error");
  }
};

const onCreateProduct = async (event) => {
  event.preventDefault();

  if (!state.token) {
    setMessage("Login first with an admin or manager account.", "error");
    return;
  }

  const form = event.currentTarget;
  const formData = new FormData(form);

  const galleryInput = form.querySelector('input[name="images"]');
  if (galleryInput?.files?.length) {
    Array.from(galleryInput.files).forEach((file) => {
      formData.append("images", file);
    });
  } else {
    formData.delete("images");
  }

  try {
    await fetchJson(`${API_BASE}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    setMessage("Product created successfully.", "success");
    form.reset();
    await loadProducts();
  } catch (error) {
    setMessage(error.message, "error");
  }
};

const bindEvents = () => {
  elements.refreshDataButton.addEventListener("click", loadDashboard);
  elements.keywordInput.addEventListener("input", renderProducts);
  elements.categoryFilter.addEventListener("change", renderProducts);
  elements.loginForm.addEventListener("submit", onLogin);
  elements.signupForm.addEventListener("submit", onSignup);
  elements.categoryForm.addEventListener("submit", onCreateCategory);
  elements.productForm.addEventListener("submit", onCreateProduct);
  elements.logoutButton.addEventListener("click", () => {
    clearSession();
    setMessage("Session cleared from the browser.");
  });

  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scrollTarget);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
};

const init = () => {
  elements.apiBaseLabel.textContent = API_BASE;
  updateSessionUi();
  bindEvents();
  loadDashboard();
};

init();
