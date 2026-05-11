const { pool, initDatabase } = require('./config/database');
const { execSync } = require('child_process');

async function seedAll() {
    console.log('🚀 开始数据库初始化和数据填充...\n');

    try {
        // 1. 初始化数据库表
        console.log('📋 步骤 1/6: 初始化数据库表...');
        await initDatabase();
        console.log('✅ 数据库表初始化完成\n');

        // 2. 应用数据库优化（添加索引）
        console.log('⚡ 步骤 2/6: 应用数据库优化（添加索引）...');
        const connection = await pool.getConnection();

        // 读取并执行优化SQL
        const fs = require('fs');
        const path = require('path');
        const sqlFile = path.join(__dirname, 'optimize-database.sql');

        if (fs.existsSync(sqlFile)) {
            const sqlContent = fs.readFileSync(sqlFile, 'utf8');
            // 分割SQL语句并执行
            const statements = sqlContent
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));

            for (const statement of statements) {
                try {
                    await connection.query(statement);
                } catch (error) {
                    // 忽略索引已存在的错误
                    if (!error.message.includes('Duplicate key name')) {
                        console.warn(`⚠️  警告: ${error.message}`);
                    }
                }
            }
            console.log('✅ 数据库索引优化完成\n');
        } else {
            console.log('⚠️  未找到优化SQL文件，跳过此步骤\n');
        }

        connection.release();

        // 3. 填充景点数据
        console.log('🏛️  步骤 3/6: 填充景点数据...');
        try {
            execSync('node seed-attractions.js', {
                cwd: __dirname,
                stdio: 'inherit'
            });
        } catch (error) {
            console.log('景点数据填充完成或已存在\n');
        }

        // 4. 填充餐厅数据
        console.log('🍽️  步骤 4/6: 填充餐厅数据...');
        try {
            execSync('node seed-restaurants.js', {
                cwd: __dirname,
                stdio: 'inherit'
            });
        } catch (error) {
            console.log('餐厅数据填充完成或已存在\n');
        }

        // 5. 填充酒店数据
        console.log('🏨 步骤 5/6: 填充酒店数据...');
        try {
            execSync('node seed-hotels.js', {
                cwd: __dirname,
                stdio: 'inherit'
            });
        } catch (error) {
            console.log('酒店数据填充完成或已存在\n');
        }

        // 6. 填充点评数据
        console.log('💬 步骤 6/6: 填充点评数据...');
        try {
            execSync('node seed-reviews.js', {
                cwd: __dirname,
                stdio: 'inherit'
            });
        } catch (error) {
            console.log('点评数据填充完成或已存在\n');
        }

        // 显示最终统计
        console.log('\n📊 数据统计：');
        const [attractionCount] = await pool.query('SELECT COUNT(*) as count FROM attractions');
        const [restaurantCount] = await pool.query('SELECT COUNT(*) as count FROM restaurants');
        const [hotelCount] = await pool.query('SELECT COUNT(*) as count FROM hotels');
        const [reviewCount] = await pool.query('SELECT COUNT(*) as count FROM reviews');
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');

        console.log(`  👥 用户: ${userCount[0].count}`);
        console.log(`  🏛️  景点: ${attractionCount[0].count}`);
        console.log(`  🍽️  餐厅: ${restaurantCount[0].count}`);
        console.log(`  🏨 酒店: ${hotelCount[0].count}`);
        console.log(`  💬 点评: ${reviewCount[0].count}`);

        console.log('\n✅ 所有数据填充完成！');
        console.log('\n💡 提示：');
        console.log('  - 运行 "node seed-attractions.js" 单独填充景点数据');
        console.log('  - 运行 "node seed-restaurants.js" 单独填充餐厅数据');
        console.log('  - 运行 "node seed-hotels.js" 单独填充酒店数据');
        console.log('  - 运行 "node seed-reviews.js" 单独填充点评数据');

    } catch (error) {
        console.error('❌ 数据填充失败:', error.message);
    } finally {
        process.exit();
    }
}

seedAll();
