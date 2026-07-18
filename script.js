/**
 * script.js — Core Library Page Logic
 * ============================================================
 * Handles:
 *   1. Page entrance animation (shutter reveal + staggered items)
 *   2. Loading books from the API
 *   3. Search & genre filtering
 *   4. Pagination
 *   5. Book info modal
 *   6. Reservation flow (reserve / remove)
 *   7. Cart (offcanvas reservations panel)
 *   8. Profile card (user info display)
 * ============================================================
 */

(function () {
    "use strict";

    // ─── STATE ──────────────────────────────────────────────────
    let allBooks = [];
    let filteredBooks = [];
    let currentPage = 1;
    const booksPerPage = 6;
    let currentReservations = [];

    // User session from localStorage
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userId = localStorage.getItem("userId");
    const userIdNo = localStorage.getItem("userIdNo");
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");

    // ─── DOM REFERENCES ─────────────────────────────────────────
    const bookContainer = document.getElementById("bookContainer");
    const genreSelect = document.getElementById("genreSelect");
    const searchInput = document.getElementById("searchInput");
    const suggestions = document.getElementById("suggestions");
    const pagination = document.getElementById("pagination");
    const totalBooksEl = document.getElementById("totalBooks");
    const reservedCountEl = document.getElementById("reservedCount");
    const cartBtn = document.getElementById("cartBtn");
    const cartCount = document.getElementById("cartCount");
    const cartList = document.getElementById("cartList");
    const pfpText = document.getElementById("pfpText");
    const pfpContainer = document.getElementById("pfpContainer");
    const profileCard = document.getElementById("profileCard");
    const pageBlur = document.getElementById("pageBlur");

    // ─── 1. PAGE ENTRANCE ANIMATION ────────────────────────────
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            document.body.classList.add("is-ready");
        }, 100);

        // Staggered reveal items
        setTimeout(() => {
            document.querySelectorAll(".reveal-item").forEach((el) => {
                el.classList.add("is-visible");
            });
        }, 400);

        // Setup profile
        setupProfile();

        // Load data
        loadBooks();
        if (isLoggedIn && userId) {
            loadReservations();
        }
    });

    // ─── 2. LOAD BOOKS FROM API ─────────────────────────────────
    async function loadBooks() {
        try {
            const response = await fetch("api.php?action=load");
            const result = await response.json();

            if (result.success && result.books) {
                allBooks = result.books;
                filteredBooks = [...allBooks];
                if (totalBooksEl) {
                    totalBooksEl.textContent = `📚 ${allBooks.length} Tomes in Archive`;
                }
                renderBooks();
            } else {
                if (bookContainer) {
                    bookContainer.innerHTML = '<div class="col-12 text-center"><p>Could not load books. Is the server running?</p></div>';
                }
            }
        } catch (err) {
            console.error("Failed to load books:", err);
            if (bookContainer) {
                bookContainer.innerHTML = '<div class="col-12 text-center"><p>Server connection failed. Make sure XAMPP is running.</p></div>';
            }
        }
    }

    // ─── 3. RENDER BOOKS ────────────────────────────────────────
    function renderBooks() {
        if (!bookContainer) return;
        bookContainer.innerHTML = "";

        const start = (currentPage - 1) * booksPerPage;
        const end = start + booksPerPage;
        const paginated = filteredBooks.slice(start, end);

        if (paginated.length === 0) {
            bookContainer.innerHTML = '<div class="col-12 text-center"><p style="color: var(--text-secondary);">No tomes match your query.</p></div>';
            renderPagination();
            return;
        }

        paginated.forEach((book) => {
            const col = document.createElement("div");
            col.className = "col";

            const stockClass = book.stock > 0 ? "text-success" : "text-danger";
            const stockText = book.stock > 0 ? `${book.stock} available` : "Out of stock";
            const reserveDisabled = !isLoggedIn || book.stock <= 0 ? "disabled" : "";
            const reserveTitle = !isLoggedIn ? "Login to reserve" : book.stock <= 0 ? "Out of stock" : "Reserve this book";

            col.innerHTML = `
                <div class="card h-100" style="background: var(--bg-paper); border: var(--border-ornate); border-radius: 12px; overflow: hidden; cursor: pointer;">
                    <img src="${book.image || 'images/IMG-20260316-WA0045.jpg'}" 
                         class="card-img-top" alt="${book.title}"
                         style="height: 220px; object-fit: cover; filter: sepia(0.2) contrast(1.05);"
                         onclick="window._showBookInfo(${book.id})"
                         onerror="this.src='images/IMG-20260316-WA0045.jpg'">
                    <div class="card-body d-flex flex-column" style="padding: 1rem;">
                        <h5 class="card-title" style="font-family: var(--font-heading); color: var(--accent-gold); font-size: 1rem; letter-spacing: 1px;">
                            ${book.title}
                        </h5>
                        <p class="card-text" style="color: var(--text-secondary); font-family: var(--font-body); font-size: 0.95rem; flex-grow: 1;">
                            by ${book.author}
                        </p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="badge" style="background: rgba(197,160,89,0.15); color: var(--accent-gold); font-family: var(--font-mono); font-size: 0.75rem;">
                                ${book.genre}
                            </span>
                            <small class="${stockClass}" style="font-family: var(--font-mono); font-size: 0.75rem;">
                                ${stockText}
                            </small>
                        </div>
                        <button class="btn btn-sm mt-2 w-100" 
                                style="background: var(--accent-gold); color: var(--bg-dark); font-family: var(--font-heading); letter-spacing: 1px; font-size: 0.8rem; border: none; border-radius: 6px; padding: 0.5rem;"
                                onclick="window._reserveBook(${book.id}, '${book.title.replace(/'/g, "\\'")}')"
                                ${reserveDisabled}
                                title="${reserveTitle}">
                            Reserve
                        </button>
                    </div>
                </div>
            `;
            bookContainer.appendChild(col);
        });

        renderPagination();
    }

    // ─── 4. PAGINATION ──────────────────────────────────────────
    function renderPagination() {
        if (!pagination) return;
        const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
        if (totalPages <= 1) {
            pagination.innerHTML = "";
            return;
        }

        let html = '<ul class="pagination justify-content-center">';
        for (let i = 1; i <= totalPages; i++) {
            const active = i === currentPage ? "active" : "";
            html += `<li class="page-item ${active}">
                        <a class="page-link" href="#" onclick="window._goToPage(${i}); return false;" 
                           style="background: ${i === currentPage ? 'var(--accent-gold)' : 'var(--bg-paper)'}; 
                                  color: ${i === currentPage ? 'var(--bg-dark)' : 'var(--text-primary)'}; 
                                  border-color: rgba(197,160,89,0.3); font-family: var(--font-mono);">
                            ${i}
                        </a>
                    </li>`;
        }
        html += "</ul>";
        pagination.innerHTML = html;
    }

    window._goToPage = function (page) {
        currentPage = page;
        renderBooks();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ─── 5. SEARCH & FILTER ─────────────────────────────────────
    if (genreSelect) {
        genreSelect.addEventListener("change", applyFilters);
    }
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            applyFilters();
            showSuggestions(this.value);
        });
    }

    function applyFilters() {
        const genre = genreSelect ? genreSelect.value : "All";
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        filteredBooks = allBooks.filter((book) => {
            const matchGenre = genre === "All" || book.genre === genre;
            const matchSearch =
                !query ||
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query);
            return matchGenre && matchSearch;
        });

        currentPage = 1;
        renderBooks();
    }

    function showSuggestions(query) {
        if (!suggestions) return;
        if (!query || query.length < 2) {
            suggestions.hidden = true;
            suggestions.setAttribute("aria-hidden", "true");
            return;
        }

        const matches = allBooks
            .filter(
                (b) =>
                    b.title.toLowerCase().includes(query.toLowerCase()) ||
                    b.author.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5);

        if (matches.length === 0) {
            suggestions.hidden = true;
            suggestions.setAttribute("aria-hidden", "true");
            return;
        }

        suggestions.innerHTML = matches
            .map(
                (b) =>
                    `<li class="suggestion-item" role="option" style="padding: 0.6rem 1rem; cursor: pointer; color: var(--text-primary); font-family: var(--font-body); border-bottom: 1px solid rgba(197,160,89,0.1);" 
                         onmouseover="this.style.background='rgba(197,160,89,0.1)'" 
                         onmouseout="this.style.background=''" 
                         onclick="document.getElementById('searchInput').value='${b.title.replace(/'/g, "\\'")}'; document.getElementById('suggestions').hidden=true; window._applyFiltersExternal();">
                        <strong>${b.title}</strong> <small style="color: var(--text-secondary);">— ${b.author}</small>
                    </li>`
            )
            .join("");

        suggestions.hidden = false;
        suggestions.setAttribute("aria-hidden", "false");
        suggestions.style.cssText =
            "position:absolute; z-index:1000; background: var(--bg-paper); border: var(--border-ornate); border-radius: 8px; list-style: none; padding: 0; margin: 0; width: 100%; box-shadow: var(--shadow-deep);";
    }

    window._applyFiltersExternal = applyFilters;

    // Close suggestions on click outside
    document.addEventListener("click", (e) => {
        if (suggestions && !suggestions.contains(e.target) && e.target !== searchInput) {
            suggestions.hidden = true;
        }
    });

    // ─── 6. BOOK INFO MODAL ─────────────────────────────────────
    window._showBookInfo = function (bookId) {
        const book = allBooks.find((b) => b.id == bookId);
        if (!book) return;

        document.getElementById("infoBookTitle").textContent = book.title;
        document.getElementById("infoBookAuthor").textContent = book.author;
        document.getElementById("infoBookGenre").textContent = book.genre;
        document.getElementById("infoBookSummary").textContent = book.summary;
        const img = document.getElementById("infoBookImg");
        img.src = book.image || "images/IMG-20260316-WA0045.jpg";
        img.alt = book.title;
        img.onerror = function () {
            this.src = "images/IMG-20260316-WA0045.jpg";
        };

        const modal = new bootstrap.Modal(document.getElementById("bookInfoModal"));
        modal.show();
    };

    // ─── 7. RESERVATION FLOW ────────────────────────────────────
    window._reserveBook = function (bookId, bookTitle) {
        if (!isLoggedIn) {
            alert("Please login to reserve books.");
            window.location.href = "login.html";
            return;
        }

        // Populate days selector
        const daysSelect = document.getElementById("reserveDays");
        daysSelect.innerHTML = "";
        for (let i = 1; i <= 15; i++) {
            daysSelect.innerHTML += `<option value="${i}">${i} day${i > 1 ? "s" : ""}</option>`;
        }
        daysSelect.value = "7";

        document.getElementById("reserveBookName").textContent = `Reserve "${bookTitle}" — select duration:`;

        const modal = new bootstrap.Modal(document.getElementById("reserveModal"));
        modal.show();

        // Confirm button
        const confirmBtn = document.getElementById("confirmReserve");
        const newBtn = confirmBtn.cloneNode(true); // Remove old listeners
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        newBtn.addEventListener("click", async () => {
            const days = daysSelect.value;
            try {
                const response = await fetch("api.php?action=reserve", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `userId=${userId}&bookId=${bookId}&bookTitle=${encodeURIComponent(bookTitle)}&days=${days}`,
                });
                const result = await response.json();
                if (result.success) {
                    modal.hide();
                    showToast("✅ " + result.message);
                    loadBooks();
                    loadReservations();
                } else {
                    showToast("❌ " + (result.error || result.message), true);
                }
            } catch (err) {
                showToast("❌ Connection error", true);
            }
        });
    };

    // ─── 8. LOAD RESERVATIONS ───────────────────────────────────
    async function loadReservations() {
        if (!isLoggedIn || !userId) {
            updateCartBadge(0);
            return;
        }
        try {
            const response = await fetch(`api.php?action=get_reservations&userId=${userId}`);
            const result = await response.json();
            if (result.success) {
                currentReservations = result.reservations || [];
                updateCartBadge(currentReservations.length);
                if (reservedCountEl) {
                    reservedCountEl.textContent = `📖 ${currentReservations.length} Active Reservation${currentReservations.length !== 1 ? "s" : ""}`;
                }
            }
        } catch (err) {
            console.error("Failed to load reservations:", err);
        }
    }

    function updateCartBadge(count) {
        if (cartCount) cartCount.textContent = count;
    }

    // ─── 9. CART / OFFCANVAS ────────────────────────────────────
    if (cartBtn) {
        cartBtn.addEventListener("click", () => {
            renderCart();
            const offcanvas = new bootstrap.Offcanvas(document.getElementById("cartPanel"));
            offcanvas.show();
        });
    }

    function renderCart() {
        if (!cartList) return;
        if (currentReservations.length === 0) {
            cartList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No active reservations.</p>';
            return;
        }

        cartList.innerHTML = currentReservations
            .map(
                (r) => `
                <div style="padding: 0.8rem; border-bottom: 1px solid rgba(197,160,89,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: var(--accent-gold); font-family: var(--font-heading); font-size: 0.9rem;">
                            ${r.title || r.book_title || "Book #" + r.book_id}
                        </strong>
                        <br><small style="color: var(--text-secondary);">Due: ${r.due_date}</small>
                    </div>
                    <button onclick="window._removeReservation(${r.id})" 
                            style="background: var(--accent-crimson); color: white; border: none; border-radius: 4px; padding: 0.3rem 0.8rem; cursor: pointer; font-size: 0.75rem;">
                        Return
                    </button>
                </div>
            `
            )
            .join("");
    }

    window._removeReservation = async function (resId) {
        if (!confirm("Return this book?")) return;
        try {
            const response = await fetch("api.php?action=remove_reservation", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `resId=${resId}&userId=${userId}`,
            });
            const result = await response.json();
            if (result.success) {
                showToast("📚 Book returned successfully!");
                loadBooks();
                loadReservations();
                renderCart();
            } else {
                showToast("❌ " + (result.error || result.message), true);
            }
        } catch (err) {
            showToast("❌ Connection error", true);
        }
    };

    // ─── 10. PROFILE CARD ───────────────────────────────────────
    function setupProfile() {
        if (pfpText) {
            pfpText.textContent = isLoggedIn ? (userIdNo || "U").substring(0, 4).toUpperCase() : "GUEST";
        }

        if (pfpContainer) {
            pfpContainer.addEventListener("click", () => {
                if (profileCard) {
                    profileCard.classList.toggle("is-visible");
                    if (pageBlur) pageBlur.classList.toggle("is-visible");
                }
            });
        }

        // Profile card content
        const profileIdDisplay = document.getElementById("profileIdDisplay");
        const profileRoleDisplay = document.getElementById("profileRoleDisplay");
        const avatarText = document.getElementById("avatarText");
        const logoutBtn = document.getElementById("logoutBtn");

        if (profileIdDisplay) {
            profileIdDisplay.textContent = isLoggedIn ? `Member #${userIdNo || "?"}` : "Guest Visitor";
        }
        if (profileRoleDisplay) {
            profileRoleDisplay.textContent = isLoggedIn ? (userRole === "admin" ? "Archive Administrator" : "Curator of Knowledge") : "Browsing as Guest";
        }
        if (avatarText) {
            avatarText.textContent = isLoggedIn ? (userName || "U").charAt(0).toUpperCase() : "G";
        }

        if (logoutBtn) {
            if (isLoggedIn) {
                logoutBtn.textContent = "Exit the Archive";
                logoutBtn.addEventListener("click", () => {
                    localStorage.clear();
                    window.location.href = "login.html";
                });
            } else {
                logoutBtn.textContent = "Scholar Login";
                logoutBtn.addEventListener("click", () => {
                    window.location.href = "login.html";
                });
            }
        }

        // Close profile card
        const closeProfile = document.getElementById("closeProfile");
        if (closeProfile) {
            closeProfile.addEventListener("click", () => {
                if (profileCard) profileCard.classList.remove("is-visible");
                if (pageBlur) pageBlur.classList.remove("is-visible");
            });
        }
        if (pageBlur) {
            pageBlur.addEventListener("click", () => {
                if (profileCard) profileCard.classList.remove("is-visible");
                pageBlur.classList.remove("is-visible");
            });
        }
    }

    // ─── 11. TOAST NOTIFICATIONS ────────────────────────────────
    function showToast(message, isError = false) {
        const container = document.getElementById("toastContainer");
        if (!container) {
            alert(message);
            return;
        }

        const toast = document.createElement("div");
        toast.style.cssText = `
            background: ${isError ? "var(--accent-crimson)" : "rgba(42, 36, 31, 0.95)"};
            color: var(--text-primary);
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            border: var(--border-ornate);
            font-family: var(--font-body);
            font-size: 0.95rem;
            margin-bottom: 0.5rem;
            box-shadow: var(--shadow-deep);
            animation: fadeInToast 0.3s ease;
            max-width: 400px;
        `;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
})();
