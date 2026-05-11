const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tripadvisor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
});

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

// 初始化数据库表
async function initDatabase() {
    try {
        const connection = await pool.getConnection();

        // 创建用户表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                avatar VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 创建景点表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS attractions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                rating DECIMAL(2,1) DEFAULT 0,
                review_count INT DEFAULT 0,
                price DECIMAL(10,2),
                currency VARCHAR(3) DEFAULT 'USD',
                location_city VARCHAR(100),
                location_country VARCHAR(100),
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                duration VARCHAR(50),
                cancellation_policy TEXT,
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 创建酒店表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS hotels (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                rating DECIMAL(2,1) DEFAULT 0,
                review_count INT DEFAULT 0,
                location VARCHAR(255),
                address TEXT,
                phone VARCHAR(20),
                check_in_time TIME,
                check_out_time TIME,
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 创建餐厅表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS restaurants (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                rating DECIMAL(2,1) DEFAULT 0,
                review_count INT DEFAULT 0,
                price_range VARCHAR(20),
                address TEXT,
                phone VARCHAR(20),
                hours VARCHAR(100),
                latitude DECIMAL(10,8),
                longitude DECIMAL(11,8),
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 创建点评表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                entity_type ENUM('attraction', 'hotel', 'restaurant') NOT NULL,
                entity_id INT NOT NULL,
                rating DECIMAL(2,1) NOT NULL,
                title VARCHAR(255),
                content TEXT,
                photos TEXT,
                helpful_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_entity (entity_type, entity_id),
                INDEX idx_user (user_id),
                INDEX idx_rating (rating),
                INDEX idx_helpful (helpful_count)
            )
        `);

        // 创建点评点赞表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS review_helpful (
                id INT PRIMARY KEY AUTO_INCREMENT,
                review_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_helpful (review_id, user_id)
            )
        `);

        // 创建点评回复表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS review_replies (
                id INT PRIMARY KEY AUTO_INCREMENT,
                review_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                is_owner BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 创建点评举报表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS review_reports (
                id INT PRIMARY KEY AUTO_INCREMENT,
                review_id INT NOT NULL,
                user_id INT NOT NULL,
                reason ENUM('spam', 'offensive', 'fake', 'other') NOT NULL,
                description TEXT,
                status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 创建预订表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id VARCHAR(50) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                entity_type ENUM('attraction', 'hotel', 'restaurant') NOT NULL,
                entity_id INT NOT NULL,
                booking_date DATE NOT NULL,
                guests INT DEFAULT 1,
                total_price DECIMAL(10,2),
                status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
                guest_name VARCHAR(100),
                guest_email VARCHAR(100),
                guest_phone VARCHAR(20),
                special_requests TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 创建收藏表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                entity_type ENUM('attraction', 'hotel', 'restaurant') NOT NULL,
                entity_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_favorite (user_id, entity_type, entity_id)
            )
        `);

        // 创建目的地/城市表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS destinations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                name_en VARCHAR(100),
                slug VARCHAR(100) UNIQUE,
                country VARCHAR(50),
                country_code CHAR(2),
                region VARCHAR(50),
                description TEXT,
                cover_image VARCHAR(255),
                rating DECIMAL(3,2) DEFAULT 0,
                view_count INT DEFAULT 0,
                status ENUM('active', 'draft') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_country (country),
                INDEX idx_region (region),
                INDEX idx_status (status),
                INDEX idx_view_count (view_count)
            )
        `);

        connection.release();
        console.log('✅ 数据库表初始化成功');
        return true;
    } catch (error) {
        console.error('❌ 数据库表初始化失败:', error.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection,
    initDatabase
};
