const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../src/config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 注册
async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        // 验证必填字段
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名、邮箱和密码不能为空'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '邮箱格式不正确'
            });
        }

        // 验证密码强度（至少8位，包含字母和数字）
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: '密码至少需要8位'
            });
        }

        // 检查邮箱是否已存在
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该邮箱已被注册'
            });
        }

        // 加密密码
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 插入用户
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        // 生成 JWT
        const token = jwt.sign(
            { id: result.insertId, email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: result.insertId,
                    username,
                    email
                }
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
}

// 登录
async function login(req, res) {
    try {
        const { email, password, rememberMe } = req.body;

        // 验证必填字段
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '邮箱和密码不能为空'
            });
        }

        // 查询用户
        const [users] = await pool.query(
            'SELECT id, username, email, password_hash, avatar FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        const user = users[0];

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 生成 JWT
        const expiresIn = rememberMe ? '7d' : JWT_EXPIRES_IN;
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
}

// 验证令牌
async function verifyToken(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // 查询用户信息
        const [users] = await pool.query(
            'SELECT id, username, email, avatar FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: {
                valid: true,
                user: users[0]
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '令牌无效'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '令牌已过期'
            });
        }

        console.error('验证令牌错误:', error);
        res.status(500).json({
            success: false,
            message: '验证失败'
        });
    }
}

// 退出登录
async function logout(req, res) {
    // JWT 是无状态的，客户端删除令牌即可
    // 这里可以添加黑名单逻辑（可选）
    res.json({
        success: true,
        message: '退出成功'
    });
}

// 认证中间件
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '令牌无效或已过期'
            });
        }
        req.user = user;
        next();
    });
}

// 获取用户信息
async function getUserProfile(req, res) {
    try {
        const userId = req.user.id;

        const [users] = await pool.query(
            'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败'
        });
    }
}

// 更新用户信息
async function updateUserProfile(req, res) {
    try {
        const userId = req.user.id;
        const { username, avatar } = req.body;

        const updates = [];
        const params = [];

        if (username) {
            updates.push('username = ?');
            params.push(username);
        }

        if (avatar) {
            updates.push('avatar = ?');
            params.push(avatar);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有要更新的字段'
            });
        }

        params.push(userId);

        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const [users] = await pool.query(
            'SELECT id, username, email, avatar FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: '更新成功',
            data: users[0]
        });
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户信息失败'
        });
    }
}

module.exports = {
    register,
    login,
    verifyToken,
    logout,
    authenticateToken,
    getUserProfile,
    updateUserProfile
};
