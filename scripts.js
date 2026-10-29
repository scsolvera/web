// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const COMPANY_WHATSAPP = "6285659766900"; 
const DEFAULT_VARIANTS = ["Biru", "Abu-abu", "Merah", "Kuning", "Hitam"];

// Baca keranjang dengan aman: buang item rusak (harga null/NaN, tanpa nama)
function loadCart() {
    try {
        const raw = JSON.parse(localStorage.getItem("solveraCart")) || [];
        if (!Array.isArray(raw)) return [];
        return raw
            .map(item => ({
                ...item,
                price: Number(item.price),
                quantity: Number(item.quantity ?? item.qty) || 1
            }))
            .filter(item => item && item.name && Number.isFinite(item.price) && item.price > 0);
    } catch (err) {
        return [];
    }
}

let cart = loadCart();
localStorage.setItem("solveraCart", JSON.stringify(cart));

// ==========================================
// DOM ELEMENTS SELECTION & LOGIC
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. NAVBAR, HAMBURGER & DYNAMIC SMART HEADER SCROLL ---
    const navbar = document.getElementById("navbar");
    const hambarBtn = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".nav-menu");
    const grafikSection = document.getElementById("grafik-penjualan");
    const logoImg = document.getElementById("logoImg");

    // Elemen keranjang (header + drawer)
    const cartBtn = document.getElementById("cartBtn");
    const cartModal = document.getElementById("cartModal");
    const closeCartBtn = document.getElementById("closeCart");
    const checkoutBtn = document.getElementById("checkoutBtn");

    function updateHamburgerColorOnScroll() {
        const isScrolled = navbar.classList.contains("scrolled");
        const isDarkSection = navbar.classList.contains("dark-section");
        const isMenuOpen = navMenu && navMenu.classList.contains("active");

        if (isMenuOpen) {
            document.querySelectorAll(".menu-toggle .hambar, .menu-toggle .hambar-line").forEach(line => {
                line.style.backgroundColor = "#ffffff";
            });
            return;
        }

        document.querySelectorAll(".menu-toggle .hambar, .menu-toggle .hambar-line").forEach(line => {
            if (!isScrolled || isDarkSection) {
                line.style.backgroundColor = "#ffffff";
            } else {
                line.style.backgroundColor = "var(--bg-header)";
            }
        });
    }

    if (hambarBtn && navMenu) {
        hambarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            hambarBtn.classList.toggle("active");
            navMenu.classList.toggle("active");
            
            if (navbar) {
                navbar.classList.toggle("menu-open", navMenu.classList.contains("active"));
            }

            updateHamburgerColorOnScroll();
        });
    }

    document.querySelectorAll(".nav-menu a").forEach(link => {
        link.addEventListener("click", () => {
            if (hambarBtn && navMenu) {
                hambarBtn.classList.remove("active");
                navMenu.classList.remove("active");
                if (navbar) navbar.classList.remove("menu-open");
                updateHamburgerColorOnScroll();
            }
        });
    });

    window.addEventListener("click", (e) => {
        if (navMenu && navMenu.classList.contains("active")) {
            if (!navMenu.contains(e.target) && !hambarBtn.contains(e.target)) {
                hambarBtn.classList.remove("active");
                navMenu.classList.remove("active");
                if (navbar) navbar.classList.remove("menu-open");
                updateHamburgerColorOnScroll();
            }
        }
    });

    // Smart Header Scroll
    window.addEventListener("scroll", () => {

        if (document.body.dataset.header === "fixed") return;


        const scrollPos = window.scrollY;
    
        if (scrollPos <= 50) {
            navbar.classList.remove("scrolled", "dark-section");
            if (logoImg) logoImg.src = "image/solvera.png";
            
            if (navMenu && !navMenu.classList.contains("active")) {
                updateHamburgerColorOnScroll();
            }
            return;
        }

        let isInsideGrafik = false;
        if (grafikSection) {
            const grafikTop = grafikSection.offsetTop - 70;
            const grafikBottom = grafikTop + grafikSection.offsetHeight;
            
            if (scrollPos >= grafikTop && scrollPos <= grafikBottom) {
                isInsideGrafik = true;
            }
        }

        navbar.classList.add("scrolled");

        if (isInsideGrafik) {
            navbar.classList.add("dark-section");
            if (logoImg) logoImg.src = "image/solvera.png";
        } else {
            navbar.classList.remove("dark-section");
            if (logoImg) logoImg.src = "image/solvera-dark.png";
        }

        if (navMenu && !navMenu.classList.contains("active")) {
            updateHamburgerColorOnScroll();
        }
    });

    // --- 2. INTERAKSI GRAFIK PENJUALAN HOLOGRAM ---
    const chartBarsHolo = document.querySelectorAll(".chart-bars-container-holo .bar-holo");
const chartSection = document.getElementById("grafik-penjualan");
const chartWrapper = document.querySelector(".chart-wrapper");
const chartInfo = document.getElementById("chartInfo");

function showChartInfo(bar) {
    if (!chartInfo || !chartWrapper) return;
    chartInfo.querySelector(".ci-month").textContent = bar.dataset.month;
    chartInfo.querySelector(".ci-value").textContent = bar.dataset.value;
    chartInfo.querySelector(".ci-unit").textContent = (bar.dataset.unit || "-") + " unit terjual";

    const w = chartWrapper.getBoundingClientRect();
    const b = bar.getBoundingClientRect();
    const half = chartInfo.offsetWidth / 2;
    const barCenter = b.left - w.left + b.width / 2;

    // Kartu tidak boleh keluar dari area grafik
    const x = Math.max(half + 4, Math.min(w.width - half - 4, barCenter));
    chartInfo.style.left = x + "px";
    // Panah tetap menunjuk tepat ke batang
    chartInfo.style.setProperty("--arrow-x", (barCenter - (x - half)) + "px");
    chartInfo.classList.add("show");
}

function hideChartInfo() {
    if (chartInfo) chartInfo.classList.remove("show");
}

chartBarsHolo.forEach(bar => {
    bar.addEventListener("click", function (e) {
        e.stopPropagation();
        const wasActive = this.classList.contains("active");
        chartBarsHolo.forEach(b => b.classList.remove("active"));
        if (wasActive) {          // ketuk batang yang sama = tutup
            hideChartInfo();
            return;
        }
        this.classList.add("active");
        showChartInfo(this);
    });
});

if (chartSection) {
    chartSection.addEventListener("click", () => {
        chartBarsHolo.forEach(b => b.classList.remove("active"));
        hideChartInfo();
    });
}

window.addEventListener("resize", () => {
    chartBarsHolo.forEach(b => b.classList.remove("active"));
    hideChartInfo();
});

  // --- 3. TOMBOL KERANJANG VS TOMBOL BELI DI KARTU PRODUK ---
    
    // Tombol Keranjang: Hanya masuk ke data & update badge, TIDAK membuka drawer
    document.querySelectorAll(".btn-add-only").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const card = e.target.closest(".product-card-vertical");
            if (!card) return;

            processAddToCart(card);

            // Feedback visual sukses pada tombol
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check text-sm"></i> Masuk!`;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 1200);
        });
    });

    // Tombol Beli: Masuk ke data, update badge, DAN langsung membuka drawer keranjang
    document.querySelectorAll(".btn-buy-now").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const card = e.target.closest(".product-card-vertical");
            if (!card) return;

            processAddToCart(card);

            openCart();
        });
    });

    function processAddToCart(card) {
        const id = card.dataset.id || "p1";
        const name = card.dataset.name || card.querySelector(".product-title-vertical")?.innerText || "Produk Solvéra";
        const priceStr = card.dataset.price || "0";
        const price = parseInt(priceStr, 10);
        const img = card.dataset.img || card.querySelector("img")?.src || "image/produk1.jpg";

        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: id,
                name: name,
                price: price,
                image: img,
                quantity: 1
            });
        }

        saveAndRefreshCart();
    }

    // --- 4. RENDER TAMPILAN ISI KERANJANG (TANPA TEKS VARIAN) ---
    function updateCartUI() {
        const cartItemsContainer = document.getElementById("cartItems");
        const cartCountBadge = document.getElementById("cartCount");
        const cartTotalPriceEl = document.getElementById("cartTotalPrice");

        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = "";
        let total = 0;
        let totalCount = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty-box flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-16">
                    <i class="fa-solid fa-basket-shopping text-4xl text-gray-300"></i>
                    <p class="text-xs sm:text-sm font-medium">Keranjang Anda masih kosong</p>
                </div>
            `;
            if (cartCountBadge) {
                cartCountBadge.textContent = "";
                cartCountBadge.classList.remove("badge-animated");
            }
        } else {
            cart.forEach((item, index) => {
                const subtotal = item.price * item.quantity;
                total += subtotal;
                totalCount += item.quantity;

                const itemRow = document.createElement("div");
                itemRow.className = "cart-drawer-item flex items-center justify-between py-3 border-b border-gray-100";
                // Langsung Nama Produk ke Harga (Tanpa teks varian/minimalist cream)[cite: 11]
                itemRow.innerHTML = `
                    <div class="cart-drawer-item-left flex items-center gap-3">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb w-12 h-12 rounded-lg object-cover">
                        <div class="cart-item-details flex flex-col">
                            <h4 class="cart-item-name text-xs sm:text-sm font-bold text-gray-800">${item.name}</h4>
                            <span class="cart-item-price-qty text-xs text-gray-500">Rp ${item.price.toLocaleString("id-ID")} × ${item.quantity}</span>
                        </div>
                    </div>
                    <div class="cart-drawer-item-right flex items-center gap-2">
                        <div class="cart-qty-box flex items-center bg-gray-100 border rounded-lg px-1.5 py-0.5">
                            <button class="btn-drawer-qty btn-minus text-xs font-bold px-1.5 py-0.5 text-gray-600 hover:text-black" data-index="${index}">-</button>
                            <span class="drawer-qty-num text-xs font-bold px-1.5">${item.quantity}</span>
                            <button class="btn-drawer-qty btn-plus text-xs font-bold px-1.5 py-0.5 text-gray-600 hover:text-black" data-index="${index}">+</button>
                        </div>
                        <button class="btn-drawer-remove text-gray-400 hover:text-red-500 text-sm ml-1 p-1" data-index="${index}" title="Hapus Barang">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemRow);
            });

            if (cartCountBadge) {
                cartCountBadge.textContent = totalCount;
                cartCountBadge.classList.add("badge-animated");
            }
        }

        if (cartTotalPriceEl) {
            cartTotalPriceEl.textContent = `Rp ${total.toLocaleString("id-ID")}`;
        }

        bindCartItemButtons();
    }

    function bindCartItemButtons() {
        document.querySelectorAll(".btn-plus").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = e.target.closest("button").dataset.index;
                if (cart[idx]) {
                    cart[idx].quantity += 1;
                    saveAndRefreshCart();
                }
            });
        });

        document.querySelectorAll(".btn-minus").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = e.target.closest("button").dataset.index;
                if (cart[idx]) {
                    cart[idx].quantity -= 1;
                    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
                    saveAndRefreshCart();
                }
            });
        });

        document.querySelectorAll(".btn-drawer-remove").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = e.target.closest("button").dataset.index;
                if (cart[idx]) {
                    cart.splice(idx, 1);
                    saveAndRefreshCart();
                }
            });
        });
    }

    function saveAndRefreshCart() {
        localStorage.setItem("solveraCart", JSON.stringify(cart));
        updateCartUI();
    }

    // --- 5. BUKA / TUTUP DRAWER & TOMBOL CHECKOUT ---
    function openCart() {
        if (cartModal) cartModal.classList.add("active");
    }

    function closeCart() {
        if (cartModal) cartModal.classList.remove("active");
    }

    if (cartBtn) {
        cartBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openCart();
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener("click", closeCart);
    }

    // Klik area gelap di luar drawer = tutup
    if (cartModal) {
        cartModal.addEventListener("click", (e) => {
            if (e.target === cartModal) closeCart();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeCart();
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            if (cart.length === 0) {
                alert("Keranjang masih kosong, pilih produk dulu ya!");
                return;
            }
            window.location.href = "checkout.html";
        });
    }

    // Render awal agar badge & isi keranjang tampil setelah refresh
    updateCartUI();
});