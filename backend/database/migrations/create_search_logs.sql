-- 创建搜索日志表
CREATE TABLE IF NOT EXISTS search_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    keyword VARCHAR(255) NOT NULL,
    search_type VARCHAR(50) DEFAULT 'all' COMMENT '搜索类型: all, restaurants, attractions, hotels',
    result_count INT DEFAULT 0 COMMENT '搜索结果数量',
    user_id INT DEFAULT NULL COMMENT '用户ID（可选，未登录用户为NULL）',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT '用户IP地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_keyword (keyword),
    INDEX idx_search_type (search_type),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索日志表';

-- 创建热门搜索统计视图（可选，用于快速查询）
CREATE OR REPLACE VIEW trending_searches AS
SELECT
    keyword,
    search_type,
    COUNT(*) as search_count,
    MAX(created_at) as last_searched
FROM search_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY keyword, search_type
ORDER BY search_count DESC, last_searched DESC
LIMIT 20;
