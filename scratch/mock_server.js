/**
 * mock_server.js
 * ============================================================
 * Standalone Node.js server that simulates both Apache (static
 * file serving) and PHP backend (api.php) using in-memory state.
 * Requires ZERO npm packages (uses built-in http, fs, path, and url modules).
 * ============================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// ─── IN-MEMORY DATABASE STATE ────────────────────────────────
const db = {
    users: [
        {
            id: 1,
            member_id: '911',
            full_name: 'Archive Admin',
            email: 'admin@ajce.edu',
            username: '911',
            password: 'pbkdf2_or_bcrypt_mock', // we'll mock verify
            role: 'admin'
        }
    ],
    books: [
        { id: 1, title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", genre: "Fantasy", summary: "On his eleventh birthday, orphan Harry Potter discovers he is a wizard...", stock: 3, image: "images/IMG-20260316-WA0040.jpg" },
        { id: 2, title: "MEIN KAMPF", author: "Adolf Hitler", genre: "History", summary: "Written during Hitler's imprisonment in 1924...", stock: 1, image: "images/IMG-20260316-WA0041.jpg" },
        { id: 3, title: "The Lord Of The Rings", author: "J.R.R. Tolkien", genre: "Fantasy", summary: "In the ancient land of Middle-earth, a modest hobbit named Frodo Baggins inherits the One Ring...", stock: 1, image: "images/IMG-20260316-WA0042.jpg" },
        { id: 4, title: "Babylon", author: "Paul Kriwaczek", genre: "History", summary: "Long before Rome or Athens, Babylon rose from the sands of Mesopotamia...", stock: 5, image: "images/IMG-20260316-WA0043.jpg" },
        { id: 5, title: "The Tesla Coil", author: "Nikola Tesla", genre: "Non-fiction", summary: "A rare compendium of Nikola Tesla's own writings...", stock: 5, image: "images/IMG-20260316-WA0044.jpg" },
        { id: 6, title: "The Diary of a Young Girl", author: "Anne Frank", genre: "Biography", summary: "A hauntingly intimate window into the life of a young girl hiding from the horrors of the Holocaust...", stock: 3, image: "images/IMG-20260316-WA0045.jpg" },
        { id: 7, title: "Jungle", author: "Yossi Ghinsberg", genre: "Survival fiction", summary: "The terrifying true account of a young traveler's fight for life in the Amazon...", stock: 2, image: "images/IMG-20260316-WA0046.jpg" }
    ],
    reservations: []
};

let userIdCounter = 2;
let resIdCounter = 1;

// Helper: parse POST body (x-www-form-urlencoded or JSON)
function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                // try JSON
                return resolve(JSON.parse(body));
            } catch (e) {
                // parse query string
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

// Helper: send JSON response
function sendJSON(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// HTTP Request Handler
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // ──────────────────────────────────────────────────────────
    // API ROUTER (api.php)
    // ──────────────────────────────────────────────────────────
    if (pathname === '/api.php') {
        const action = parsedUrl.query.action || '';
        const body = await parseBody(req);

        console.log(`[API Request] Action: ${action}`, { query: parsedUrl.query, body });

        switch (action) {
            case 'login': {
                const idNo = body.id_no || body.username || '';
                const password = body.password || '';

                const user = db.users.find(u => u.member_id === idNo || u.username === idNo);
                if (user) {
                    // Password mock validation (allow any password for newly registered/seeded accounts for ease of testing)
                    return sendJSON(res, {
                        success: true,
                        user: {
                            id: user.id,
                            id_no: user.member_id,
                            full_name: user.full_name,
                            username: user.username,
                            role: user.role
                        }
                    });
                }
                return sendJSON(res, { success: false, error: 'Invalid ID or Password.' }, 401);
            }

            case 'register': {
                const idNo = body.id_no || '';
                const fullName = body.full_name || body.fullName || '';
                const email = body.email || '';
                const password = body.password || '';

                if (!idNo || !fullName || !email) {
                    return sendJSON(res, { success: false, error: 'All fields are required.' }, 400);
                }

                if (db.users.some(u => u.member_id === idNo || u.email === email)) {
                    return sendJSON(res, { success: false, error: 'User ID or Email already exists.' }, 409);
                }

                const newUser = {
                    id: userIdCounter++,
                    member_id: idNo,
                    full_name: fullName,
                    email: email,
                    username: idNo,
                    password: password,
                    role: 'user'
                };
                db.users.push(newUser);
                return sendJSON(res, {
                    success: true,
                    message: 'Scholar account created.',
                    user: {
                        id: newUser.id,
                        id_no: newUser.member_id,
                        full_name: newUser.full_name,
                        role: 'user'
                    }
                });
            }

            case 'get_users':
                return sendJSON(res, { success: true, users: db.users });

            case 'delete_user': {
                const id = parseInt(body.id);
                db.users = db.users.filter(u => u.id !== id);
                return sendJSON(res, { success: true, message: 'User removed.' });
            }

            case 'load':
                return sendJSON(res, { success: true, books: db.books });

            case 'add_book': {
                const title = body.title || '';
                const author = body.author || '';
                const genre = body.genre || '';
                const stock = parseInt(body.stock || 0);
                const image = body.image || 'images/IMG-20260316-WA0045.jpg';
                const summary = body.summary || '';

                if (!title || !author) {
                    return sendJSON(res, { success: false, error: 'Title and Author are required.' });
                }

                const newBook = {
                    id: db.books.length + 1,
                    title,
                    author,
                    genre,
                    stock,
                    image,
                    summary
                };
                db.books.push(newBook);
                return sendJSON(res, { success: true, message: 'Book added.', id: newBook.id });
            }

            case 'delete_book': {
                const id = parseInt(parsedUrl.query.id || body.id);
                db.books = db.books.filter(b => b.id !== id);
                return sendJSON(res, { success: true, message: 'Book deleted.' });
            }

            case 'reserve': {
                const userId = parseInt(body.userId);
                const bookId = parseInt(body.bookId);
                const bookTitle = body.bookTitle || '';
                const days = parseInt(body.days || 7);

                // limit check
                const activeRes = db.reservations.filter(r => r.user_id === userId && r.status === 'active');
                if (activeRes.length >= 1) {
                    return sendJSON(res, { success: false, error: 'Scholars may only hold one record at a time.' });
                }

                const book = db.books.find(b => b.id === bookId);
                if (book && book.stock > 0) {
                    book.stock--;
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + days);
                    const newRes = {
                        id: resIdCounter++,
                        user_id: userId,
                        book_id: bookId,
                        book_title: bookTitle || book.title,
                        due_date: dueDate.toISOString().split('T')[0],
                        status: 'active'
                    };
                    db.reservations.push(newRes);
                    return sendJSON(res, { success: true, message: 'Book reserved successfully!' });
                }
                return sendJSON(res, { success: false, error: 'Book is out of stock.' });
            }

            case 'get_reservations': {
                const userId = parseInt(parsedUrl.query.userId || body.userId);
                const userRes = db.reservations.filter(r => r.user_id === userId && r.status === 'active');
                return sendJSON(res, { success: true, reservations: userRes });
            }

            case 'remove_reservation': {
                const resId = parseInt(body.resId);
                const reservation = db.reservations.find(r => r.id === resId);
                if (reservation) {
                    const book = db.books.find(b => b.id === reservation.book_id);
                    if (book) book.stock++;
                    db.reservations = db.reservations.filter(r => r.id !== resId);
                    return sendJSON(res, { success: true, message: 'Reservation removed.' });
                }
                return sendJSON(res, { success: false, error: 'Reservation not found.' });
            }

            case 'stats':
                return sendJSON(res, {
                    success: true,
                    userCount: db.users.filter(u => u.role === 'user').length,
                    resCount: db.reservations.filter(r => r.status === 'active').length,
                    bookCount: db.books.length
                });

            default:
                return sendJSON(res, { success: false, error: 'Unknown action: ' + action }, 400);
        }
    }

    // ──────────────────────────────────────────────────────────
    // STATIC FILE SERVER
    // ──────────────────────────────────────────────────────────
    // Map URL path to local folder (root workspace folder)
    let filePath = path.join(__dirname, '..', pathname === '/' ? 'index.html' : pathname);

    // Decode URL formatting (for spaces e.g. %20)
    filePath = decodeURIComponent(filePath);

    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                console.log(`[404] File not found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 File Not Found</h1>', 'utf-8');
            } else {
                console.log(`[500] Server error: ${error.code}`);
                res.writeHead(500);
                res.end(`Server Error: ${error.code} ..\n`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`[Mock Server] Server running at http://localhost:${PORT}/`);
});
