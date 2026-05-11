-- 数据库优化脚本
-- 为常用查询字段添加索引以提升性能

-- ==================== 景点表索引 ====================
-- 评分索引（用于按评分排序）
CREATE INDEX IF NOT EXISTS idx_attractions_rating ON attractions(rating DESC);

-- 位置索引（用于按城市/国家筛选）
CREATE INDEX IF NOT EXISTS idx_attractions_location ON attractions(location_city, location_country);

-- 价格索引（用于价格范围筛选）
CREATE INDEX IF NOT EXISTS idx_attractions_price ON attractions(price);

-- 评论数索引（用于热门景点排序）
CREATE INDEX IF NOT EXISTS idx_attractions_review_count ON attractions(review_count DESC);

-- 地理位置索引（用于附近景点查询）
CREATE INDEX IF NOT EXISTS idx_attractions_coordinates ON attractions(latitude, longitude);

-- 创建时间索引（用于最新景点查询）
CREATE INDEX IF NOT EXISTS idx_attractions_created ON attractions(created_at DESC);


-- ==================== 餐厅表索引 ====================
-- 评分索引
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating DESC);

-- 价格范围索引
CREATE INDEX IF NOT EXISTS idx_restaurants_price_range ON restaurants(price_range);

-- 评论数索引
CREATE INDEX IF NOT EXISTS idx_restaurants_review_count ON restaurants(review_count DESC);

-- 地理位置索引
CREATE INDEX IF NOT EXISTS idx_restaurants_coordinates ON restaurants(latitude, longitude);


-- ==================== 酒店表索引 ====================
-- 评分索引
CREATE INDEX IF NOT EXISTS idx_hotels_rating ON hotels(rating DESC);

-- 位置索引
CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels(location);

-- 评论数索引
CREATE INDEX IF NOT EXISTS idx_hotels_review_count ON hotels(review_count DESC);

-- 地理位置索引
CREATE INDEX IF NOT EXISTS idx_hotels_coordinates ON hotels(latitude, longitude);


-- ==================== 点评表索引 ====================
-- 用户ID索引（查询用户的所有点评）
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- 实体类型和ID复合索引（查询特定景点/酒店/餐厅的所有点评）
CREATE INDEX IF NOT EXISTS idx_reviews_entity ON reviews(entity_type, entity_id);

-- 评分索引（筛选高分/低分点评）
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- 创建时间索引（最新点评排序）
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- 有用数索引（最有用点评排序）
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON reviews(helpful_count DESC);


-- ==================== 预订表索引 ====================
-- 用户ID索引（查询用户的所有预订）
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- 预订ID索引（快速查找特定预订）
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);

-- 实体类型和ID复合索引
CREATE INDEX IF NOT EXISTS idx_bookings_entity ON bookings(entity_type, entity_id);

-- 预订日期索引（按日期查询预订）
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- 状态索引（筛选待确认/已确认/已取消的预订）
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 创建时间索引
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);


-- ==================== 收藏表索引 ====================
-- 用户ID索引（查询用户的所有收藏）
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- 实体类型和ID复合索引
CREATE INDEX IF NOT EXISTS idx_favorites_entity ON favorites(entity_type, entity_id);

-- 创建时间索引
CREATE INDEX IF NOT EXISTS idx_favorites_created ON favorites(created_at DESC);


-- ==================== 用户表索引 ====================
-- 邮箱索引（登录查询）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 用户名索引（用户名查询）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);


-- 查看所有索引
SELECT
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM
    INFORMATION_SCHEMA.STATISTICS
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('attractions', 'restaurants', 'hotels', 'reviews', 'bookings', 'favorites', 'users')
GROUP BY
    TABLE_NAME, INDEX_NAME
ORDER BY
    TABLE_NAME, INDEX_NAME;
