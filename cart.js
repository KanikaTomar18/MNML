/* ============================================================
   MNML — Cart, Search & Filter logic
   Cart persists in localStorage so it carries across pages.
   ============================================================ */
(function () {
    "use strict";

    const CART_KEY = "mnml_cart";

    // ---------- Cart data helpers ----------
    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartCount();
        renderCartDrawer();
    }

    function updateCartCount() {
        const cart = getCart();
        const count = cart.reduce((sum, item) => sum + item.qty, 0);
        document.querySelectorAll("#cartCount").forEach((el) => {
            el.textContent = count;
        });
    }

    function parsePrice(text) {
        // "₹2,200" -> 2200
        const num = (text || "").replace(/[^\d.]/g, "");
        return parseFloat(num) || 0;
    }

    function formatPrice(n) {
        return "₹" + Math.round(n).toLocaleString("en-IN");
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str == null ? "" : String(str);
        return div.innerHTML;
    }

    // ---------- Toast feedback (used by contact / newsletter / checkout) ----------
    function showToast(message) {
        let wrap = document.querySelector(".toast-wrap");
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.className = "toast-wrap";
            document.body.appendChild(wrap);
        }
        const toast = document.createElement("div");
        toast.className = "toast-msg";
        toast.textContent = message;
        wrap.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add("show"));
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // ---------- Add to cart (event delegation) ----------
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".add-btn");
        if (!btn) return;
        const card = btn.closest(".product-card, .drop-card");
        if (!card) return;

        const name = card.querySelector(".product-name")?.textContent.trim() || "Item";
        const priceWrap = card.querySelector(".product-price");
        let priceText = "0";
        if (priceWrap) {
            // ignore the struck-through old price, use the remaining text node(s)
            const clone = priceWrap.cloneNode(true);
            clone.querySelectorAll(".old-price").forEach((el) => el.remove());
            priceText = clone.textContent.trim();
        }
        const price = parsePrice(priceText);
        if (!price) return; // e.g. "Notify Me" cards aren't purchasable

        const cart = getCart();
        const existing = cart.find((i) => i.name === name);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ name, price, qty: 1 });
        }
        saveCart(cart);

        // quick visual feedback
        const icon = btn.querySelector("i");
        if (icon) {
            const original = icon.className;
            icon.className = "bi bi-check2";
            setTimeout(() => (icon.className = original), 700);
        }
    });

    // ---------- Newsletter signup (event delegation, footer on every page) ----------
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".newsletter-submit");
        if (!btn) return;
        e.preventDefault();

        const wrap = btn.closest(".d-flex") || document;
        const input = wrap.querySelector(".newsletter-input");
        const email = (input?.value || "").trim();
        if (!email) {
            showToast("Please enter an email address.");
            return;
        }

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "…";

        fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                showToast(data.message || (ok ? "You're on the list." : "Something went wrong."));
                if (ok && input) input.value = "";
            })
            .catch(() => showToast("Couldn't subscribe right now — please try again."))
            .finally(() => {
                btn.disabled = false;
                btn.textContent = originalText;
            });
    });

    // ---------- Contact form ----------
    window.submitContactForm = async function (btn) {
        const get = (id) => document.getElementById(id);
        const payload = {
            firstName: (get("contactFirstName")?.value || "").trim(),
            lastName: (get("contactLastName")?.value || "").trim(),
            email: (get("contactEmail")?.value || "").trim(),
            orderNumber: (get("contactOrderNumber")?.value || "").trim(),
            topic: get("contactTopic")?.value || "",
            message: (get("contactMessage")?.value || "").trim(),
        };

        if (!payload.email || !payload.message) {
            showToast("Please add your email and a message before sending.");
            return;
        }

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Sending…";

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong.");

            btn.textContent = "Message Sent ✓";
            btn.style.background = "var(--warm-mid)";
            const msgField = get("contactMessage");
            if (msgField) msgField.value = "";
        } catch (err) {
            btn.disabled = false;
            btn.textContent = originalText;
            showToast(err.message || "Couldn't send your message — please try again.");
        }
    };

    // ---------- Cart drawer ----------
    function ensureDrawer() {
        if (document.getElementById("cartDrawer")) return;
        const wrap = document.createElement("div");
        wrap.innerHTML = `
            <div id="cartOverlay" class="cart-overlay" onclick="closeCart()"></div>
            <aside id="cartDrawer" class="cart-drawer">
                <div class="cart-drawer-head">
                    <h5>Your Bag</h5>
                    <button class="cart-close" onclick="closeCart()"><i class="bi bi-x-lg"></i></button>
                </div>
                <div id="cartItems" class="cart-items"></div>
                <div class="cart-drawer-foot">
                    <div class="cart-subtotal">
                        <span>Subtotal</span>
                        <span id="cartSubtotal">₹0</span>
                    </div>
                    <button class="btn-dark-custom cart-checkout" style="width:100%;text-align:center;" onclick="checkoutDemo()">Checkout</button>
                </div>
            </aside>`;
        document.body.appendChild(wrap);
    }

    function renderCartDrawer() {
        ensureDrawer();
        const cart = getCart();
        const itemsEl = document.getElementById("cartItems");
        const subtotalEl = document.getElementById("cartSubtotal");
        if (!itemsEl) return;

        if (cart.length === 0) {
            itemsEl.innerHTML = `<p class="cart-empty">Your bag is empty.</p>`;
        } else {
            itemsEl.innerHTML = cart
                .map(
                    (item, idx) => `
                <div class="cart-line">
                    <div class="cart-line-info">
                        <p class="cart-line-name">${item.name}</p>
                        <p class="cart-line-price">${formatPrice(item.price)}</p>
                    </div>
                    <div class="cart-line-qty">
                        <button onclick="changeQty(${idx}, -1)">−</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${idx}, 1)">+</button>
                    </div>
                    <button class="cart-line-remove" onclick="removeItem(${idx})"><i class="bi bi-trash"></i></button>
                </div>`
                )
                .join("");
        }
        const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    }

    window.changeQty = function (idx, delta) {
        const cart = getCart();
        if (!cart[idx]) return;
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
        saveCart(cart);
    };

    window.removeItem = function (idx) {
        const cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
    };

    window.checkoutDemo = async function () {
        const cart = getCart();
        if (cart.length === 0) {
            showToast("Your bag is empty.");
            return;
        }

        const checkoutBtn = document.querySelector(".cart-checkout");
        const originalText = checkoutBtn?.textContent;
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = "Placing Order…";
        }

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: cart }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Checkout failed.");

            localStorage.removeItem(CART_KEY);
            updateCartCount();
            renderCartDrawer();
            closeCart();
            showToast(
                `Order #${data.order_id} placed — ${formatPrice(data.subtotal)} 🛍️ (demo only, no real payment taken)`
            );
        } catch (err) {
            showToast(err.message || "Checkout failed — please try again.");
        } finally {
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = originalText;
            }
        }
    };

    window.openCart = function () {
        ensureDrawer();
        renderCartDrawer();
        document.getElementById("cartDrawer").classList.add("open");
        document.getElementById("cartOverlay").classList.add("open");
    };

    window.closeCart = function () {
        const drawer = document.getElementById("cartDrawer");
        const overlay = document.getElementById("cartOverlay");
        if (drawer) drawer.classList.remove("open");
        if (overlay) overlay.classList.remove("open");
    };

    // ---------- Search ----------
    let searchDebounceTimer = null;

    function getSearchDropdown(input) {
        const wrap = input.closest(".search-wrap");
        if (!wrap) return null;
        let dropdown = wrap.querySelector(".search-dropdown");
        if (!dropdown) {
            dropdown = document.createElement("div");
            dropdown.className = "search-dropdown";
            wrap.appendChild(dropdown);
        }
        return dropdown;
    }

    function hideSearchDropdown(input) {
        const dropdown = input?.closest(".search-wrap")?.querySelector(".search-dropdown");
        if (dropdown) dropdown.classList.remove("open");
    }

    function renderSearchDropdown(input, products, query) {
        const dropdown = getSearchDropdown(input);
        if (!dropdown) return;

        if (products.length === 0) {
            dropdown.innerHTML = `<div class="search-dropdown-empty">No objects match “${escapeHtml(query)}”.</div>`;
        } else {
            dropdown.innerHTML = products
                .map((p) => {
                    const priceHtml = p.in_stock && p.price ? formatPrice(p.price) : "Coming Soon";
                    return `
                    <a class="search-dropdown-item" href="${escapeHtml(p.page)}">
                        <span class="search-dropdown-emoji">${p.emoji || "•"}</span>
                        <span class="search-dropdown-info">
                            <span class="search-dropdown-name">${escapeHtml(p.name)}</span>
                            <span class="search-dropdown-category">${escapeHtml(p.category)}</span>
                        </span>
                        <span class="search-dropdown-price">${priceHtml}</span>
                    </a>`;
                })
                .join("");
        }
        dropdown.classList.add("open");
    }

    async function fetchSearchResults(input, query) {
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error("search failed");
            const data = await res.json();
            renderSearchDropdown(input, data.products || [], query);
        } catch (e) {
            hideSearchDropdown(input);
        }
    }

    window.filterProducts = function () {
        const input = document.getElementById("searchInput");
        if (!input) return;
        const rawQuery = input.value.trim();
        const query = rawQuery.toLowerCase();

        // Instant local filtering of whatever product cards live on this page.
        document.querySelectorAll(".product-card").forEach((card) => {
            const haystack = card.textContent.toLowerCase();
            const col = card.closest("[class*='col-']") || card;
            col.style.display = !query || haystack.includes(query) ? "" : "none";
        });

        // Sitewide results (other pages too), debounced so we're not hammering the API.
        clearTimeout(searchDebounceTimer);
        if (!rawQuery) {
            hideSearchDropdown(input);
            return;
        }
        searchDebounceTimer = setTimeout(() => fetchSearchResults(input, rawQuery), 250);
    };

    // Close the dropdown when clicking anywhere outside the search box.
    document.addEventListener("click", function (e) {
        if (e.target.closest(".search-wrap")) return;
        document.querySelectorAll(".search-dropdown.open").forEach((d) => d.classList.remove("open"));
    });

    // ---------- Category / Year filter pills ----------
    window.filterPill = function (btn) {
        const group = btn.closest("[data-filter-type]") || btn.closest(".d-flex");
        if (!group) return;

        group.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");

        const type = group.dataset.filterType || "category";
        const value = btn.textContent.trim();

        if (type === "year") {
            const page = group.closest(".page") || document;
            page.querySelectorAll("[data-year]").forEach((block) => {
                block.style.display =
                    value === "All Years" || block.dataset.year === value ? "" : "none";
            });
            return;
        }

        // category filtering: scope to the section this pill-group lives in
        const section = group.closest("section") || document;
        section.querySelectorAll(".product-card").forEach((card) => {
            const cat = card.querySelector(".product-category")?.textContent.trim() || "";
            const col = card.closest("[class*='col-']") || card;
            const isAll = /^all/i.test(value);
            col.style.display = isAll || cat.toLowerCase() === value.toLowerCase() ? "" : "none";
        });
    };

    // ---------- FAQ (unchanged behaviour, kept here for one shared file) ----------
    window.toggleFAQ = function (btn) {
        const item = btn.closest(".faq-item");
        const answer = item.querySelector(".faq-answer");
        const isOpen = item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach((i) => {
            i.classList.remove("open");
            i.querySelector(".faq-answer").style.maxHeight = "0";
        });
        if (!isOpen) {
            item.classList.add("open");
            answer.style.maxHeight = answer.scrollHeight + "px";
        }
    };

    window.filterFAQ = function (cat, btn) {
        document.querySelectorAll(".faq-tab").forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".faq-item").forEach((item) => {
            item.style.display = cat === "all" || item.dataset.cat === cat ? "" : "none";
        });
    };

    // ---------- Init ----------
    document.addEventListener("DOMContentLoaded", function () {
        updateCartCount();
        ensureDrawer();
        renderCartDrawer();
    });
})();
