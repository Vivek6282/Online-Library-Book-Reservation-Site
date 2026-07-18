CREATE DATABASE IF NOT EXISTS ajce_archive;
USE ajce_archive;


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(50) UNIQUE NOT NULL, -- Custom ID entered during signup
    full_name VARCHAR(100) DEFAULT '',     -- Scholar's full name
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,  -- We'll use this as a secondary login or auto-generated
    password VARCHAR(255) NOT NULL,        -- Hashed passwords
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    stock INT DEFAULT 0,
    image VARCHAR(255) DEFAULT 'images/IMG-20260316-WA0045.jpg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations table: Tracks which scholar holds which record
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    book_title VARCHAR(255) DEFAULT '',    -- Denormalized title for quick display
    due_date DATE NOT NULL,
    status ENUM('active', 'returned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Seed the archive with original tomes
INSERT IGNORE INTO books (id, title, author, genre, summary, stock, image) VALUES
(1, 'Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 'Fantasy', 'On his eleventh birthday, orphan Harry Potter discovers he is a wizard...', 3, 'images/IMG-20260316-WA0040.jpg'),
(2, 'MEIN KAMPF', 'Adolf Hitler', 'History', 'Written during Hitler''s imprisonment in 1924...', 1, 'images/IMG-20260316-WA0041.jpg'),
(3, 'The Lord Of The Rings', 'J.R.R. Tolkien', 'Fantasy', 'In the ancient land of Middle-earth, a modest hobbit named Frodo Baggins inherits the One Ring...', 1, 'images/IMG-20260316-WA0042.jpg'),
(4, 'Babylon', 'Paul Kriwaczek', 'History', 'Long before Rome or Athens, Babylon rose from the sands of Mesopotamia...', 5, 'images/IMG-20260316-WA0043.jpg'),
(5, 'The Tesla Coil', 'Nikola Tesla', 'Non-fiction', 'A rare compendium of Nikola Tesla''s own writings...', 5, 'images/IMG-20260316-WA0044.jpg'),
(6, 'The Diary of a Young Girl', 'Anne Frank', 'Biography', 'A hauntingly intimate window into the life of a young girl hiding from the horrors of the Holocaust in German-occupied Amsterdam. Anne''s words transcend time, offering a resilient and poetic exploration of human nature, hope, and the tragic cost of hatred.', 3, 'images/IMG-20260316-WA0045.jpg'),
(7, 'Jungle', 'Yossi Ghinsberg', 'Survival fiction', 'The terrifying true account of a young traveler''s fight for life in the unforgiving heart of the Amazon rainforest. Lost and alone, Ghinsberg faces predators, hunger, and mental breakdown in a primal struggle against nature.', 2, 'images/IMG-20260316-WA0046.jpg');

-- Seed an admin account
-- Credentials: username = 911, password = admin123
-- The hash below is bcrypt of 'admin123'
INSERT INTO users (member_id, full_name, email, username, password, role) 
VALUES ('911', 'Archive Admin', 'admin@ajce.edu', '911', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE 
    email = VALUES(email), 
    username = VALUES(username), 
    password = VALUES(password), 
    role = VALUES(role);