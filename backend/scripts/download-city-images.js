const https = require('https');
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

// 中国主要城市的真实图片URL（来自免费图片源）
const cityImages = {
    '北京': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&h=600&fit=crop&q=80', // 故宫
    '上海': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800&h=600&fit=crop&q=80', // 东方明珠
    '广州': 'https://images.unsplash.com/photo-1601364920737-a1dd6f9c4e8f?w=800&h=600&fit=crop&q=80', // 广州塔
    '深圳': 'https://images.unsplash.com/photo-1543716091-a840c05249ec?w=800&h=600&fit=crop&q=80', // 深圳天际线
    '杭州': 'https://images.unsplash.com/photo-1559564484-e48bf5f6c69b?w=800&h=600&fit=crop&q=80', // 西湖
    '成都': 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&h=600&fit=crop&q=80', // 成都
    '西安': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=600&fit=crop&q=80', // 兵马俑
    '重庆': 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=800&h=600&fit=crop&q=80', // 重庆夜景
    '南京': 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=800&h=600&fit=crop&q=80', // 南京
    '苏州': 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&h=600&fit=crop&q=80', // 苏州园林
    '武汉': 'https://images.unsplash.com/photo-1580837119756-563d608dd119?w=800&h=600&fit=crop&q=80', // 武汉
    '厦门': 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=800&h=600&fit=crop&q=80', // 厦门
    '青岛': 'https://images.unsplash.com/photo-1598948485421-33a1655d3c18?w=800&h=600&fit=crop&q=80', // 青岛
    '大连': 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=800&h=600&fit=crop&q=80', // 大连
    '桂林': 'https://images.unsplash.com/photo-1599498408506-60c1e55944e5?w=800&h=600&fit=crop&q=80', // 桂林山水
    '长沙': 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=800&h=600&fit=crop&q=80'  // 长沙
};

// 下载图片函数
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);

        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // 处理重定向
                file.close();
                fs.unlinkSync(filepath);
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
            } else {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`下载失败: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            file.close();
            fs.unlinkSync(filepath);
            reject(err);
        });
    });
}

async function main() {
    try {
        console.log('开始下载城市图片...\n');

        // 确保目录存在
        const imagesDir = path.join(__dirname, '../../frontend/public/images/cities');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // 获取所有城市
        const [cities] = await pool.query('SELECT id, name FROM destinations');

        for (const city of cities) {
            const imageUrl = cityImages[city.name];

            if (imageUrl) {
                const filename = `${city.name}.jpg`;
                const filepath = path.join(imagesDir, filename);

                console.log(`正在下载: ${city.name}...`);

                try {
                    await downloadImage(imageUrl, filepath);

                    // 更新数据库，使用相对路径
                    const dbPath = `/images/cities/${filename}`;
                    await pool.query('UPDATE destinations SET cover_image = ? WHERE id = ?', [dbPath, city.id]);

                    console.log(`✓ ${city.name} 下载成功`);
                } catch (err) {
                    console.error(`✗ ${city.name} 下载失败:`, err.message);
                }
            } else {
                console.log(`⊘ ${city.name} 没有配置图片URL`);
            }
        }

        console.log('\n所有城市图片处理完成！');
        await pool.end();

    } catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}

main();
