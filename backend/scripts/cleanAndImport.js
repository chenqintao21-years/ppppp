/**
 * 清理并重新导入数据脚本
 * 使用方法: node scripts/cleanAndImport.js
 */

const { pool } = require('../src/config/database');
const { AmapService } = require('../services/mapService');
const readline = require('readline');

const amapService = new AmapService();

// 热门城市列表
const POPULAR_CITIES = [
    { name: '北京', name_en: 'Beijing', country: '中国', region: '华北' },
    { name: '上海', name_en: 'Shanghai', country: '中国', region: '华东' },
    { name: '广州', name_en: 'Guangzhou', country: '中国', region: '华南' },
    { name: '深圳', name_en: 'Shenzhen', country: '中国', region: '华南' },
    { name: '杭州', name_en: 'Hangzhou', country: '中国', region: '华东' },
    { name: '成都', name_en: 'Chengdu', country: '中国', region: '西南' },
    { name: '西安', name_en: 'Xi\'an', country: '中国', region: '西北' },
    { name: '重庆', name_en: 'Chongqing', country: '中国', region: '西南' },
    { name: '南京', name_en: 'Nanjing', country: '中国', region: '华东' },
    { name: '武汉', name_en: 'Wuhan', country: '中国', region: '华中' },
    { name: '厦门', name_en: 'Xiamen', country: '中国', region: '华南' },
    { name: '苏州', name_en: 'Suzhou', country: '中国', region: '华东' }
];

const CITY_IMAGES = {
    '北京': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
    '上海': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800',
    '广州': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
    '深圳': 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=800',
    '杭州': 'https://images.unsplash.com/photo-1559564484-e48bf5f6c69b?w=800',
    '成都': 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800',
    '西安': 'https://images.unsplash.com/photo-1580837119756-563d608dd119?w=800',
    '重庆': 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800',
    '南京': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
    '武汉': 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800',
    '厦门': 'https://images.unsplash.com/photo-1598947660946-103a4eb2de0b?w=800',
    '苏州': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800'
};

// 创建命令行交互接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 询问用户确认
function askConfirmation(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

// 延迟函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 清理旧数据
async function cleanOldData() {
    console.log('\n========== 清理旧数据 ==========\n');

    const connection = await pool.getConnection();

    try {
        // 查询现有数据量
        const [destCount] = await connection.query('SELECT COUNT(*) as count FROM destinations');
        const [attrCount] = await connection.query('SELECT COUNT(*) as count FROM attractions');

        console.log(`当前数据库中有：`);
        console.log(`  - 目的地: ${destCount[0].count} 条`);
        console.log(`  - 景点: ${attrCount[0].count} 条\n`);

        if (destCount[0].count === 0 && attrCount[0].count === 0) {
            console.log('✓ 数据库为空，无需清理\n');
            return;
        }

        // 删除景点数据
        console.log('正在删除景点数据...');
        await connection.query('DELETE FROM attractions');
        console.log('✓ 景点数据已清理');

        // 删除目的地数据
        console.log('正在删除目的地数据...');
        await connection.query('DELETE FROM destinations');
        console.log('✓ 目的地数据已清理');

        // 重置自增ID
        await connection.query('ALTER TABLE attractions AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE destinations AUTO_INCREMENT = 1');
        console.log('✓ 自增ID已重置\n');

    } catch (error) {
        console.error('✗ 清理数据失败:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}

// 导入目的地
async function importDestinations() {
    console.log('========== 导入热门目的地 ==========\n');

    const connection = await pool.getConnection();
    let successCount = 0;
    let errorCount = 0;

    try {
        for (const city of POPULAR_CITIES) {
            try {
                console.log(`正在导入城市: ${city.name}...`);

                const coverImage = CITY_IMAGES[city.name] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
                const slug = city.name_en.toLowerCase().replace(/'/g, '');

                await connection.query(
                    `INSERT INTO destinations (name, name_en, country, region, cover_image, slug, status, rating, view_count)
                     VALUES (?, ?, ?, ?, ?, ?, 'active', 4.5, ?)`,
                    [city.name, city.name_en, city.country, city.region, coverImage, slug, Math.floor(Math.random() * 10000) + 1000]
                );

                console.log(`  ✓ 导入成功: ${city.name}`);
                successCount++;
            } catch (error) {
                console.error(`  ✗ 导入失败 ${city.name}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n目的地导入完成: 成功 ${successCount}, 失败 ${errorCount}\n`);
    } finally {
        connection.release();
    }
}

// 导入景点
async function importAttractions() {
    console.log('========== 从高德地图导入景点 ==========\n');

    const connection = await pool.getConnection();
    let totalSuccess = 0;
    let totalError = 0;

    try {
        for (const city of POPULAR_CITIES) {
            console.log(`\n正在搜索 ${city.name} 的景点...`);

            try {
                // 搜索该城市的景点
                const result = await amapService.searchAttractions('景点|旅游景点|风景区', city.name, 20, 1);
                const pois = result.pois || [];

                console.log(`  找到 ${pois.length} 个景点`);

                for (const poi of pois) {
                    try {
                        // 解析经纬度
                        const location = poi.location ? poi.location.split(',') : [null, null];
                        const longitude = location[0] ? parseFloat(location[0]) : null;
                        const latitude = location[1] ? parseFloat(location[1]) : null;

                        // 生成随机评分和评论数
                        const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
                        const reviewCount = Math.floor(Math.random() * 5000) + 100;

                        // 生成随机价格
                        const hasPrice = Math.random() > 0.3;
                        const price = hasPrice ? (Math.random() * 150 + 20).toFixed(2) : null;

                        // 获取描述
                        const description = poi.address || `${city.name}热门景点`;

                        // 使用占位图片
                        const image = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000000)}?w=800&h=600&fit=crop`;

                        // 插入数据库
                        await connection.query(
                            `INSERT INTO attractions
                             (name, description, rating, review_count, price, currency,
                              location_city, location_country, latitude, longitude,
                              duration, cancellation_policy, image)
                             VALUES (?, ?, ?, ?, ?, 'CNY', ?, ?, ?, ?, '2-3小时', '提前24小时免费取消', ?)`,
                            [poi.name, description, rating, reviewCount, price, city.name, city.country, latitude, longitude, image]
                        );

                        console.log(`    ✓ ${poi.name}`);
                        totalSuccess++;
                    } catch (error) {
                        console.error(`    ✗ 导入失败 ${poi.name}:`, error.message);
                        totalError++;
                    }

                    // 避免请求过快
                    await sleep(100);
                }

                // 每个城市之间暂停
                await sleep(500);

            } catch (error) {
                console.error(`  ✗ 搜索城市景点失败 ${city.name}:`, error.message);
            }
        }

        console.log(`\n景点导入完成: 成功 ${totalSuccess}, 失败 ${totalError}\n`);
    } finally {
        connection.release();
    }
}

// 显示统计信息
async function showStatistics() {
    console.log('========== 数据统计 ==========\n');

    const connection = await pool.getConnection();

    try {
        const [destCount] = await connection.query('SELECT COUNT(*) as count FROM destinations WHERE status = "active"');
        const [attrCount] = await connection.query('SELECT COUNT(*) as count FROM attractions');
        const [cityList] = await connection.query('SELECT name, name_en FROM destinations ORDER BY id LIMIT 12');

        console.log('╔════════════════════════════════════════════════╗');
        console.log('║              导入完成！                        ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log(`║  目的地数量: ${destCount[0].count.toString().padEnd(32)} ║`);
        console.log(`║  景点数量:   ${attrCount[0].count.toString().padEnd(32)} ║`);
        console.log('╚════════════════════════════════════════════════╝\n');

        console.log('导入的城市列表:');
        cityList.forEach((city, index) => {
            console.log(`  ${(index + 1).toString().padStart(2)}. ${city.name} (${city.name_en})`);
        });

        console.log('\n下一步:');
        console.log('  1. 启动后端服务: npm run dev');
        console.log('  2. 启动前端服务: cd ../frontend && npm run dev');
        console.log('  3. 访问首页: http://localhost:5173/views/index.html\n');

    } finally {
        connection.release();
    }
}

// 主函数
async function main() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║      清理并重新导入高德地图数据                ║');
    console.log('╚════════════════════════════════════════════════╝');

    try {
        // 询问用户确认
        console.log('\n⚠️  警告: 此操作将删除数据库中所有现有的目的地和景点数据！\n');
        const confirmed = await askConfirmation('确定要继续吗? (y/n): ');

        if (!confirmed) {
            console.log('\n操作已取消。\n');
            rl.close();
            process.exit(0);
        }

        console.log('');

        // 1. 清理旧数据
        await cleanOldData();

        // 2. 导入目的地
        await importDestinations();

        // 3. 导入景点
        await importAttractions();

        // 4. 显示统计信息
        await showStatistics();

        rl.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ 导入过程出错:', error);
        rl.close();
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { cleanOldData, importDestinations, importAttractions };
