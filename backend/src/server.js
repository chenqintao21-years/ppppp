const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../api/routes');
const { testConnection, initDatabase } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 提供上传的图片
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api', apiRoutes);

// 根路径 - API信息页面
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'TripAdvisor API Server',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api',
            documentation: {
                hotels: '/api/hotels',
                attractions: '/api/attractions',
                restaurants: '/api/restaurants',
                auth: '/api/auth',
                reviews: '/api/reviews'
            }
        },
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 启动服务器
async function startServer() {
    // 测试数据库连接
    const dbConnected = await testConnection();

    if (dbConnected) {
        // 初始化数据库表
        await initDatabase();
    } else {
        console.warn('⚠️  数据库未连接，部分功能可能不可用');
    }

    app.listen(PORT, () => {
        console.log(`✅ 后端服务器运行在 http://localhost:${PORT}`);
        console.log(`📚 API文档: http://localhost:${PORT}/api`);
        console.log(`🌐 前端开发服务器: http://localhost:5173`);
    });
}

startServer();

module.exports = app;
