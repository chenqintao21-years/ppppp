const { pool } = require('../src/config/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif)'));
        }
    }
});

// ============ 用户资料管理 ============

/**
 * 获取用户资料
 * GET /api/users/profile
 */
async function getUserProfile(req, res) {
    try {
        const userId = req.user.id;

        const [users] = await pool.query(
            `SELECT id, username, email, avatar, created_at, updated_at
             FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 获取统计信息
        const [bookingCount] = await pool.query(
            'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?',
            [userId]
        );

        const [favoriteCount] = await pool.query(
            'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
            [userId]
        );

        const [reviewCount] = await pool.query(
            'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?',
            [userId]
        );

        const user = users[0];
        user.stats = {
            bookings: bookingCount[0].count,
            favorites: favoriteCount[0].count,
            reviews: reviewCount[0].count
        };

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('获取用户资料失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户资料失败'
        });
    }
}

/**
 * 更新用户资料
 * PUT /api/users/profile
 */
async function updateUserProfile(req, res) {
    try {
        const userId = req.user.id;
        const { username, email } = req.body;

        const updates = [];
        const params = [];

        if (username) {
            updates.push('username = ?');
            params.push(username);
        }

        if (email) {
            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱格式不正确'
                });
            }

            // 检查邮箱是否已被使用
            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '该邮箱已被使用'
                });
            }

            updates.push('email = ?');
            params.push(email);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有要更新的字段'
            });
        }

        params.push(userId);

        await pool.query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params
        );

        const [users] = await pool.query(
            'SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: '资料更新成功',
            data: users[0]
        });
    } catch (error) {
        console.error('更新用户资料失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户资料失败'
        });
    }
}

/**
 * 修改密码
 * PUT /api/users/password
 */
async function changePassword(req, res) {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码和新密码不能为空'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: '新密码至少需要8位'
            });
        }

        // 获取当前密码哈希
        const [users] = await pool.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证当前密码
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码不正确'
            });
        }

        // 加密新密码
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // 更新密码
        await pool.query(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, userId]
        );

        res.json({
            success: true,
            message: '密码修改成功'
        });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败'
        });
    }
}

/**
 * 上传头像
 * POST /api/users/avatar
 */
async function uploadAvatar(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片'
            });
        }

        const userId = req.user.id;
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // 删除旧头像
        const [users] = await pool.query(
            'SELECT avatar FROM users WHERE id = ?',
            [userId]
        );

        if (users.length > 0 && users[0].avatar) {
            const oldAvatarPath = path.join(__dirname, '..', users[0].avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // 更新头像URL
        await pool.query(
            'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [avatarUrl, userId]
        );

        res.json({
            success: true,
            message: '头像上传成功',
            data: {
                avatar: avatarUrl
            }
        });
    } catch (error) {
        console.error('上传头像失败:', error);
        res.status(500).json({
            success: false,
            message: '上传头像失败'
        });
    }
}

// ============ 预订管理 ============

/**
 * 获取用户的所有预订
 * GET /api/users/bookings
 */
async function getUserBookings(req, res) {
    try {
        const userId = req.user.id;
        const { status, type } = req.query;

        let query = `
            SELECT b.*,
                   CASE
                       WHEN b.entity_type = 'attraction' THEN a.name
                       WHEN b.entity_type = 'hotel' THEN h.name
                       WHEN b.entity_type = 'restaurant' THEN r.name
                   END as entity_name,
                   CASE
                       WHEN b.entity_type = 'attraction' THEN a.image
                       WHEN b.entity_type = 'hotel' THEN h.image
                       WHEN b.entity_type = 'restaurant' THEN r.image
                   END as entity_image,
                   CASE
                       WHEN b.entity_type = 'attraction' THEN a.location_city
                       WHEN b.entity_type = 'hotel' THEN h.location
                       WHEN b.entity_type = 'restaurant' THEN r.address
                   END as entity_location
            FROM bookings b
            LEFT JOIN attractions a ON b.entity_type = 'attraction' AND b.entity_id = a.id
            LEFT JOIN hotels h ON b.entity_type = 'hotel' AND b.entity_id = h.id
            LEFT JOIN restaurants r ON b.entity_type = 'restaurant' AND b.entity_id = r.id
            WHERE b.user_id = ?
        `;

        const params = [userId];

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        if (type) {
            query += ' AND b.entity_type = ?';
            params.push(type);
        }

        query += ' ORDER BY b.created_at DESC';

        const [bookings] = await pool.query(query, params);

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('获取预订列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取预订列表失败'
        });
    }
}

/**
 * 获取预订详情
 * GET /api/bookings/:id
 */
async function getBookingDetail(req, res) {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;

        const [bookings] = await pool.query(
            `SELECT b.*,
                    CASE
                        WHEN b.entity_type = 'attraction' THEN a.name
                        WHEN b.entity_type = 'hotel' THEN h.name
                        WHEN b.entity_type = 'restaurant' THEN r.name
                    END as entity_name,
                    CASE
                        WHEN b.entity_type = 'attraction' THEN a.image
                        WHEN b.entity_type = 'hotel' THEN h.image
                        WHEN b.entity_type = 'restaurant' THEN r.image
                    END as entity_image,
                    CASE
                        WHEN b.entity_type = 'attraction' THEN a.description
                        WHEN b.entity_type = 'hotel' THEN h.description
                        WHEN b.entity_type = 'restaurant' THEN r.description
                    END as entity_description
             FROM bookings b
             LEFT JOIN attractions a ON b.entity_type = 'attraction' AND b.entity_id = a.id
             LEFT JOIN hotels h ON b.entity_type = 'hotel' AND b.entity_id = h.id
             LEFT JOIN restaurants r ON b.entity_type = 'restaurant' AND b.entity_id = r.id
             WHERE b.id = ? AND b.user_id = ?`,
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: '预订不存在'
            });
        }

        res.json({
            success: true,
            data: bookings[0]
        });
    } catch (error) {
        console.error('获取预订详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取预订详情失败'
        });
    }
}

/**
 * 取消预订
 * DELETE /api/bookings/:id
 */
async function cancelBooking(req, res) {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;

        // 检查预订是否存在且属于当前用户
        const [bookings] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: '预订不存在'
            });
        }

        const booking = bookings[0];

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: '预订已取消'
            });
        }

        // 更新预订状态为已取消
        await pool.query(
            'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['cancelled', bookingId]
        );

        res.json({
            success: true,
            message: '预订已取消'
        });
    } catch (error) {
        console.error('取消预订失败:', error);
        res.status(500).json({
            success: false,
            message: '取消预订失败'
        });
    }
}

// ============ 收藏管理 ============

/**
 * 获取用户的所有收藏
 * GET /api/users/favorites
 */
async function getUserFavorites(req, res) {
    try {
        const userId = req.user.id;
        const { type } = req.query;

        let query = `
            SELECT f.*,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.name
                       WHEN f.entity_type = 'hotel' THEN h.name
                       WHEN f.entity_type = 'restaurant' THEN r.name
                   END as entity_name,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.image
                       WHEN f.entity_type = 'hotel' THEN h.image
                       WHEN f.entity_type = 'restaurant' THEN r.image
                   END as entity_image,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.rating
                       WHEN f.entity_type = 'hotel' THEN h.rating
                       WHEN f.entity_type = 'restaurant' THEN r.rating
                   END as entity_rating,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.review_count
                       WHEN f.entity_type = 'hotel' THEN h.review_count
                       WHEN f.entity_type = 'restaurant' THEN r.review_count
                   END as entity_review_count,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.location_city
                       WHEN f.entity_type = 'hotel' THEN h.location
                       WHEN f.entity_type = 'restaurant' THEN r.address
                   END as entity_location,
                   CASE
                       WHEN f.entity_type = 'attraction' THEN a.price
                       WHEN f.entity_type = 'restaurant' THEN r.price_range
                       ELSE NULL
                   END as entity_price
            FROM favorites f
            LEFT JOIN attractions a ON f.entity_type = 'attraction' AND f.entity_id = a.id
            LEFT JOIN hotels h ON f.entity_type = 'hotel' AND f.entity_id = h.id
            LEFT JOIN restaurants r ON f.entity_type = 'restaurant' AND f.entity_id = r.id
            WHERE f.user_id = ?
        `;

        const params = [userId];

        if (type) {
            query += ' AND f.entity_type = ?';
            params.push(type);
        }

        query += ' ORDER BY f.created_at DESC';

        const [favorites] = await pool.query(query, params);

        res.json({
            success: true,
            data: favorites
        });
    } catch (error) {
        console.error('获取收藏列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取收藏列表失败'
        });
    }
}

/**
 * 添加收藏
 * POST /api/favorites
 */
async function addFavorite(req, res) {
    try {
        const userId = req.user.id;
        const { entity_type, entity_id } = req.body;

        if (!entity_type || !entity_id) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        // 验证实体类型
        const validTypes = ['attraction', 'hotel', 'restaurant'];
        if (!validTypes.includes(entity_type)) {
            return res.status(400).json({
                success: false,
                message: '无效的实体类型'
            });
        }

        // 检查是否已收藏
        const [existing] = await pool.query(
            'SELECT id FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?',
            [userId, entity_type, entity_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '已经收藏过了'
            });
        }

        // 添加收藏
        await pool.query(
            'INSERT INTO favorites (user_id, entity_type, entity_id) VALUES (?, ?, ?)',
            [userId, entity_type, entity_id]
        );

        res.json({
            success: true,
            message: '收藏成功'
        });
    } catch (error) {
        console.error('添加收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '添加收藏失败'
        });
    }
}

/**
 * 取消收藏
 * DELETE /api/favorites/:id
 */
async function removeFavorite(req, res) {
    try {
        const favoriteId = req.params.id;
        const userId = req.user.id;

        // 检查收藏是否存在且属于当前用户
        const [favorites] = await pool.query(
            'SELECT * FROM favorites WHERE id = ? AND user_id = ?',
            [favoriteId, userId]
        );

        if (favorites.length === 0) {
            return res.status(404).json({
                success: false,
                message: '收藏不存在'
            });
        }

        // 删除收藏
        await pool.query(
            'DELETE FROM favorites WHERE id = ?',
            [favoriteId]
        );

        res.json({
            success: true,
            message: '已取消收藏'
        });
    } catch (error) {
        console.error('取消收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '取消收藏失败'
        });
    }
}

/**
 * 通过实体信息取消收藏
 * DELETE /api/favorites/entity
 */
async function removeFavoriteByEntity(req, res) {
    try {
        const userId = req.user.id;
        const { entity_type, entity_id } = req.body;

        if (!entity_type || !entity_id) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }

        const [result] = await pool.query(
            'DELETE FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?',
            [userId, entity_type, entity_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '收藏不存在'
            });
        }

        res.json({
            success: true,
            message: '已取消收藏'
        });
    } catch (error) {
        console.error('取消收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '取消收藏失败'
        });
    }
}

// ============ 点评管理 ============

/**
 * 获取用户的所有点评
 * GET /api/users/reviews
 */
async function getUserReviews(req, res) {
    try {
        const userId = req.user.id;
        const { type } = req.query;

        let query = `
            SELECT r.*,
                   CASE
                       WHEN r.entity_type = 'attraction' THEN a.name
                       WHEN r.entity_type = 'hotel' THEN h.name
                       WHEN r.entity_type = 'restaurant' THEN res.name
                   END as entity_name,
                   CASE
                       WHEN r.entity_type = 'attraction' THEN a.image
                       WHEN r.entity_type = 'hotel' THEN h.image
                       WHEN r.entity_type = 'restaurant' THEN res.image
                   END as entity_image
            FROM reviews r
            LEFT JOIN attractions a ON r.entity_type = 'attraction' AND r.entity_id = a.id
            LEFT JOIN hotels h ON r.entity_type = 'hotel' AND r.entity_id = h.id
            LEFT JOIN restaurants res ON r.entity_type = 'restaurant' AND r.entity_id = res.id
            WHERE r.user_id = ?
        `;

        const params = [userId];

        if (type) {
            query += ' AND r.entity_type = ?';
            params.push(type);
        }

        query += ' ORDER BY r.created_at DESC';

        const [reviews] = await pool.query(query, params);

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('获取点评列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取点评列表失败'
        });
    }
}

/**
 * 更新点评
 * PUT /api/reviews/:id
 */
async function updateReview(req, res) {
    try {
        const reviewId = req.params.id;
        const userId = req.user.id;
        const { rating, title, content } = req.body;

        // 检查点评是否存在且属于当前用户
        const [reviews] = await pool.query(
            'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
            [reviewId, userId]
        );

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: '点评不存在'
            });
        }

        const updates = [];
        const params = [];

        if (rating !== undefined) {
            if (rating < 0 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: '评分必须在0-5之间'
                });
            }
            updates.push('rating = ?');
            params.push(rating);
        }

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }

        if (content !== undefined) {
            updates.push('content = ?');
            params.push(content);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有要更新的字段'
            });
        }

        params.push(reviewId);

        await pool.query(
            `UPDATE reviews SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params
        );

        const [updatedReviews] = await pool.query(
            'SELECT * FROM reviews WHERE id = ?',
            [reviewId]
        );

        res.json({
            success: true,
            message: '点评更新成功',
            data: updatedReviews[0]
        });
    } catch (error) {
        console.error('更新点评失败:', error);
        res.status(500).json({
            success: false,
            message: '更新点评失败'
        });
    }
}

/**
 * 删除点评
 * DELETE /api/reviews/:id
 */
async function deleteReview(req, res) {
    try {
        const reviewId = req.params.id;
        const userId = req.user.id;

        // 检查点评是否存在且属于当前用户
        const [reviews] = await pool.query(
            'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
            [reviewId, userId]
        );

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: '点评不存在'
            });
        }

        // 删除点评
        await pool.query(
            'DELETE FROM reviews WHERE id = ?',
            [reviewId]
        );

        res.json({
            success: true,
            message: '点评已删除'
        });
    } catch (error) {
        console.error('删除点评失败:', error);
        res.status(500).json({
            success: false,
            message: '删除点评失败'
        });
    }
}

module.exports = {
    // 用户资料
    getUserProfile,
    updateUserProfile,
    changePassword,
    uploadAvatar,
    upload,

    // 预订管理
    getUserBookings,
    getBookingDetail,
    cancelBooking,

    // 收藏管理
    getUserFavorites,
    addFavorite,
    removeFavorite,
    removeFavoriteByEntity,

    // 点评管理
    getUserReviews,
    updateReview,
    deleteReview
};
