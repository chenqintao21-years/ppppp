const { pool } = require('./src/config/database');

/**
 * 清空数据库所有表的数据（保留表结构）
 * 按照外键依赖关系的正确顺序删除数据
 */
async function clearAllData() {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log('🚨 警告：即将删除数据库中的所有数据！');
        console.log('⏳ 开始清空数据...\n');

        // 临时禁用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 按照依赖关系顺序删除数据
        // 1. 先删除依赖其他表的表
        const tables = [
            'review_reports',      // 依赖 reviews 和 users
            'review_replies',      // 依赖 reviews 和 users
            'review_helpful',      // 依赖 reviews 和 users
            'reviews',             // 依赖 users
            'bookings',            // 依赖 users
            'favorites',           // 依赖 users
            'attractions',         // 独立表
            'hotels',              // 独立表
            'restaurants',         // 独立表
            'destinations',        // 独立表
            'users'                // 被其他表依赖
        ];

        let totalDeleted = 0;

        for (const table of tables) {
            try {
                // 获取删除前的记录数
                const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
                const count = countResult[0].count;

                // 删除表中所有数据
                await connection.query(`DELETE FROM ${table}`);

                // 重置自增ID
                await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);

                console.log(`✅ ${table}: 删除了 ${count} 条记录`);
                totalDeleted += count;
            } catch (error) {
                console.error(`❌ 清空表 ${table} 失败:`, error.message);
            }
        }

        // 重新启用外键检查
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n' + '='.repeat(50));
        console.log(`✅ 数据清空完成！共删除 ${totalDeleted} 条记录`);
        console.log('📊 所有表结构已保留，自增ID已重置');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ 清空数据失败:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
    }
}

// 执行清空操作
clearAllData();
