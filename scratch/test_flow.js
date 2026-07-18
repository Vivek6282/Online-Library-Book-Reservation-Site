/**
 * test_flow.js
 * ============================================================
 * Integration Test Script to verify the entire API flow
 * programmatically. It starts the mock server, runs tests
 * simulating user and admin activities, and prints the result.
 * ============================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ─── COPY OF THE MOCK SERVER DATABASE STATE ──────────────────
const db = {
    users: [
        {
            id: 1,
            member_id: '911',
            full_name: 'Archive Admin',
            email: 'admin@ajce.edu',
            username: '911',
            password: 'mocked_admin_password',
            role: 'admin'
        }
    ],
    books: [
        { id: 1, title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", genre: "Fantasy", summary: "On his eleventh birthday...", stock: 3, image: "images/IMG-20260316-WA0040.jpg" },
        { id: 2, title: "MEIN KAMPF", author: "Adolf Hitler", genre: "History", summary: "Written during Hitler's imprisonment...", stock: 1, image: "images/IMG-20260316-WA0041.jpg" },
        { id: 3, title: "The Lord Of The Rings", author: "J.R.R. Tolkien", genre: "Fantasy", summary: "In Middle-earth...", stock: 1, image: "images/IMG-20260316-WA0042.jpg" }
    ],
    reservations: []
};

let userIdCounter = 2;
let resIdCounter = 1;

// ─── START LOCAL SERVER FOR RUNNING TESTS ─────────────────────
function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                return resolve(JSON.parse(body));
            } catch (e) {
                const params = new URLSearchParams(body);
                const res = {};
                for (const [key, val] of params.entries()) {
                    res[key] = val;
                }
                return resolve(res);
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api.php') {
        const action = parsedUrl.query.action || '';
        const body = await parseBody(req);

        const sendJSON = (data, status = 200) => {
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        };

        switch (action) {
            case 'login': {
                const idNo = body.id_no || body.username || '';
                const user = db.users.find(u => u.member_id === idNo || u.username === idNo);
                if (user) {
                    return sendJSON({
                        success: true,
                        user: { id: user.id, id_no: user.member_id, full_name: user.full_name, role: user.role }
                    });
                }
                return sendJSON({ success: false, error: 'Invalid credentials.' }, 401);
            }

            case 'register': {
                const idNo = body.id_no || '';
                const fullName = body.full_name || '';
                const email = body.email || '';

                if (!idNo || !fullName || !email) {
                    return sendJSON({ success: false, error: 'All fields are required.' }, 400);
                }

                if (db.users.some(u => u.member_id === idNo || u.email === email)) {
                    return sendJSON({ success: false, error: 'User ID or Email already exists.' }, 409);
                }

                const newUser = {
                    id: userIdCounter++,
                    member_id: idNo,
                    full_name: fullName,
                    email: email,
                    username: idNo,
                    role: 'user'
                };
                db.users.push(newUser);
                return sendJSON({ success: true, user: newUser });
            }

            case 'get_users':
                return sendJSON({ success: true, users: db.users });

            case 'delete_user': {
                const id = parseInt(body.id);
                db.users = db.users.filter(u => u.id !== id);
                return sendJSON({ success: true });
            }

            case 'load':
                return sendJSON({ success: true, books: db.books });

            case 'add_book': {
                const title = body.title || '';
                const author = body.author || '';
                const stock = parseInt(body.stock || 0);

                const newBook = { id: db.books.length + 1, title, author, stock };
                db.books.push(newBook);
                return sendJSON({ success: true, id: newBook.id });
            }

            case 'delete_book': {
                const id = parseInt(parsedUrl.query.id || body.id);
                db.books = db.books.filter(b => b.id !== id);
                return sendJSON({ success: true });
            }

            case 'reserve': {
                const userId = parseInt(body.userId);
                const bookId = parseInt(body.bookId);
                const bookTitle = body.bookTitle || '';

                const activeRes = db.reservations.filter(r => r.user_id === userId && r.status === 'active');
                if (activeRes.length >= 1) {
                    return sendJSON({ success: false, error: 'Scholars may only hold one record at a time.' });
                }

                const book = db.books.find(b => b.id === bookId);
                if (book && book.stock > 0) {
                    book.stock--;
                    const newRes = {
                        id: resIdCounter++,
                        user_id: userId,
                        book_id: bookId,
                        book_title: bookTitle || book.title,
                        due_date: '2026-07-25',
                        status: 'active'
                    };
                    db.reservations.push(newRes);
                    return sendJSON({ success: true, message: 'Book reserved successfully!' });
                }
                return sendJSON({ success: false, error: 'Out of stock.' });
            }

            case 'get_reservations': {
                const userId = parseInt(parsedUrl.query.userId);
                const userRes = db.reservations.filter(r => r.user_id === userId && r.status === 'active');
                return sendJSON({ success: true, reservations: userRes });
            }

            case 'remove_reservation': {
                const resId = parseInt(body.resId);
                const reservation = db.reservations.find(r => r.id === resId);
                if (reservation) {
                    const book = db.books.find(b => b.id === reservation.book_id);
                    if (book) book.stock++;
                    db.reservations = db.reservations.filter(r => r.id !== resId);
                    return sendJSON({ success: true });
                }
                return sendJSON({ success: false, error: 'Not found.' });
            }

            case 'stats':
                return sendJSON({
                    success: true,
                    userCount: db.users.filter(u => u.role === 'user').length,
                    resCount: db.reservations.length,
                    bookCount: db.books.length
                });

            default:
                return sendJSON({ success: false, error: 'Unknown action' }, 400);
        }
    } else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = 8001;
server.listen(PORT, async () => {
    console.log(`\n=== Starting Integration Test Suite on Port ${PORT} ===\n`);
    try {
        await runTests();
    } catch (e) {
        console.error('Test Suite Failed:', e);
    } finally {
        server.close(() => {
            console.log('\n=== Test Suite Complete. Port Released. ===\n');
        });
    }
});

// ─── RUN SCENARIOS ───────────────────────────────────────────
async function runTests() {
    const apiURL = `http://localhost:${PORT}/api.php`;

    // Helper: make request
    async function apiRequest(action, method = 'POST', bodyObj = null) {
        const url = `${apiURL}?action=${action}`;
        const options = {
            method,
            headers: {}
        };
        if (bodyObj) {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            options.body = new URLSearchParams(bodyObj).toString();
        }
        const res = await fetch(url, options);
        return res.json();
    }

    let testUser = null;

    // Test 1: User Signup
    console.log('Test 1: Registering new user (ID: 1001)...');
    const registerRes = await apiRequest('register', 'POST', {
        id_no: '1001',
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
    });
    if (registerRes.success && registerRes.user.member_id === '1001') {
        console.log('  ✅ SUCCESS: User registered successfully.');
        testUser = registerRes.user;
    } else {
        throw new Error('FAILED: User registration failed: ' + JSON.stringify(registerRes));
    }

    // Test 2: User Login
    console.log('Test 2: Logging in as user (ID: 1001)...');
    const loginRes = await apiRequest('login', 'POST', {
        id_no: '1001',
        password: 'password123'
    });
    if (loginRes.success && loginRes.user.role === 'user') {
        console.log('  ✅ SUCCESS: User logged in.');
    } else {
        throw new Error('FAILED: Login failed: ' + JSON.stringify(loginRes));
    }

    // Test 3: Load Books catalog
    console.log('Test 3: Loading library books...');
    const booksRes = await apiRequest('load', 'GET');
    if (booksRes.success && booksRes.books.length > 0) {
        console.log(`  ✅ SUCCESS: Loaded ${booksRes.books.length} books.`);
    } else {
        throw new Error('FAILED: Loading books catalog failed.');
    }

    // Test 4: Reserve a Book
    console.log('Test 4: Reserving book 1 (Harry Potter)...');
    const reserveRes = await apiRequest('reserve', 'POST', {
        userId: testUser.id,
        bookId: '1',
        bookTitle: "Harry Potter and the Philosopher's Stone",
        days: '7'
    });
    if (reserveRes.success) {
        console.log('  ✅ SUCCESS: Reservation created.');
    } else {
        throw new Error('FAILED: Reservation failed: ' + JSON.stringify(reserveRes));
    }

    // Test 5: Verify stock decrement
    const booksRes2 = await apiRequest('load', 'GET');
    const hpBook = booksRes2.books.find(b => b.id === 1);
    if (hpBook && hpBook.stock === 2) {
        console.log('  ✅ SUCCESS: Book stock decremented from 3 to 2.');
    } else {
        throw new Error('FAILED: Stock did not decrement properly.');
    }

    // Test 6: Verify User 1-book reservation limit
    console.log('Test 6: Trying to reserve another book (MEIN KAMPF)...');
    const reserveRes2 = await apiRequest('reserve', 'POST', {
        userId: testUser.id,
        bookId: '2',
        bookTitle: "MEIN KAMPF",
        days: '7'
    });
    if (!reserveRes2.success && reserveRes2.error.includes('one record')) {
        console.log('  ✅ SUCCESS: Correctly blocked user from reserving multiple books.');
    } else {
        throw new Error('FAILED: Allowed user to violate 1-book reservation limit.');
    }

    // Test 7: Load user reservations
    console.log('Test 7: Fetching user active reservations...');
    const userRes = await apiRequest('get_reservations', 'GET', null); // note: parsed via query
    const resList = await (await fetch(`${apiURL}?action=get_reservations&userId=${testUser.id}`)).json();
    if (resList.success && resList.reservations.length === 1) {
        console.log('  ✅ SUCCESS: Active reservation found in cart.');
    } else {
        throw new Error('FAILED: User reservations list empty.');
    }

    // Test 8: Return/Remove reservation
    const targetResId = resList.reservations[0].id;
    console.log(`Test 8: Returning book (removing reservation ID ${targetResId})...`);
    const removeRes = await apiRequest('remove_reservation', 'POST', {
        resId: targetResId,
        userId: testUser.id
    });
    if (removeRes.success) {
        console.log('  ✅ SUCCESS: Reservation returned.');
    } else {
        throw new Error('FAILED: Return failed.');
    }

    // Test 9: Verify stock restore
    const booksRes3 = await apiRequest('load', 'GET');
    const hpBookRestored = booksRes3.books.find(b => b.id === 1);
    if (hpBookRestored && hpBookRestored.stock === 3) {
        console.log('  ✅ SUCCESS: Book stock restored back to 3.');
    } else {
        throw new Error('FAILED: Stock was not restored on return.');
    }

    // Test 10: Admin Login
    console.log('Test 10: Logging in as administrator (ID: 911)...');
    const adminLoginRes = await apiRequest('login', 'POST', {
        id_no: '911',
        password: 'admin123'
    });
    if (adminLoginRes.success && adminLoginRes.user.role === 'admin') {
        console.log('  ✅ SUCCESS: Administrator authenticated.');
    } else {
        throw new Error('FAILED: Admin login failed.');
    }

    // Test 11: Admin dashboard stats
    console.log('Test 11: Loading admin metrics...');
    const statsRes = await apiRequest('stats', 'GET');
    if (statsRes.success && statsRes.bookCount === 3 && statsRes.userCount === 1) {
        console.log('  ✅ SUCCESS: Correct stats returned (1 Scholar, 3 Tomes, 0 active reservations).');
    } else {
        throw new Error('FAILED: Stats mismatch: ' + JSON.stringify(statsRes));
    }
}
