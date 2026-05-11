const { pool } = require('./config/database');

async function seedReviews() {
    try {
        const connection = await pool.getConnection();

        // 检查是否已有数据
        const [existing] = await connection.query('SELECT COUNT(*) as count FROM reviews');
        console.log(`当前点评数量: ${existing[0].count}`);

        if (existing[0].count > 0) {
            console.log('⚠️  点评表已有数据');
            const [result] = await pool.query('SELECT COUNT(*) as count, entity_type FROM reviews GROUP BY entity_type');
            console.log('\n💬 现有点评统计：');
            result.forEach(stat => {
                console.log(`  ${stat.entity_type}: ${stat.count} 条点评`);
            });
            connection.release();
            process.exit();
            return;
        }

        // 首先检查是否有用户数据
        const [users] = await connection.query('SELECT id FROM users LIMIT 10');
        if (users.length === 0) {
            console.log('⚠️  请先创建用户数据');
            connection.release();
            process.exit();
            return;
        }

        // 获取景点、餐厅、酒店的ID
        const [attractions] = await connection.query('SELECT id FROM attractions LIMIT 20');
        const [restaurants] = await connection.query('SELECT id FROM restaurants LIMIT 20');
        const [hotels] = await connection.query('SELECT id FROM hotels LIMIT 20');

        console.log(`找到 ${users.length} 个用户, ${attractions.length} 个景点, ${restaurants.length} 个餐厅, ${hotels.length} 个酒店`);

        // 点评模板
        const reviewTemplates = {
            attraction: [
                { rating: 5.0, title: '绝对值得一去！', content: '这个景点真的太棒了！风景优美，历史悠久，导游讲解也很专业。强烈推荐给所有来这里旅游的朋友。' },
                { rating: 4.5, title: '很不错的体验', content: '整体体验很好，景色迷人，就是人有点多。建议早点去或者避开节假日。' },
                { rating: 4.0, title: '值得参观', content: '景点本身很有特色，但是排队时间比较长。如果提前预订门票会好很多。' },
                { rating: 5.0, title: '超出预期', content: '原本没抱太大期望，但实际参观后完全被震撼到了。无论是建筑还是文化底蕴都令人印象深刻。' },
                { rating: 3.5, title: '还可以', content: '景点不错，但是配套设施有待改善。希望能增加更多的休息区和洗手间。' },
                { rating: 4.5, title: '家庭出游的好选择', content: '带着孩子来的，孩子们玩得很开心。景点很适合家庭游，有很多互动项目。' },
                { rating: 5.0, title: '摄影爱好者的天堂', content: '作为摄影爱好者，这里简直是完美的拍摄地点。每个角度都能拍出大片。' },
                { rating: 4.0, title: '历史文化深厚', content: '对历史感兴趣的朋友一定要来。这里的每一处都有故事，建议请个导游讲解。' }
            ],
            restaurant: [
                { rating: 5.0, title: '美食天堂', content: '食物非常美味，摆盘精致，服务也很周到。虽然价格不便宜，但物有所值。' },
                { rating: 4.5, title: '值得推荐', content: '菜品口味很好，环境优雅，适合商务宴请或者约会。就是上菜速度有点慢。' },
                { rating: 4.0, title: '不错的餐厅', content: '整体体验不错，菜品新鲜，味道正宗。性价比还可以，会再来的。' },
                { rating: 5.0, title: '惊艳的味觉体验', content: '每道菜都让人惊喜，厨师的创意和技艺都很出色。强烈推荐招牌菜！' },
                { rating: 3.5, title: '一般般', content: '味道还行，但是性价比不高。环境倒是不错，适合拍照。' },
                { rating: 4.5, title: '地道的美食', content: '非常地道的本地菜，食材新鲜，烹饪手法传统。想体验当地美食的一定要来。' },
                { rating: 5.0, title: '完美的用餐体验', content: '从预订到用餐，每个环节都很完美。服务员专业热情，菜品精致美味。' },
                { rating: 4.0, title: '适合聚餐', content: '菜品分量足，适合多人聚餐。环境热闹，氛围很好。' }
            ],
            hotel: [
                { rating: 5.0, title: '完美的住宿体验', content: '房间宽敞舒适，设施齐全，服务人员态度很好。位置也很方便，周边交通便利。' },
                { rating: 4.5, title: '很满意', content: '酒店整体不错，早餐丰富，房间干净。唯一的小缺点是隔音稍微差了点。' },
                { rating: 4.0, title: '性价比高', content: '价格合理，房间虽然不大但很温馨。前台服务很热情，会推荐周边景点。' },
                { rating: 5.0, title: '奢华享受', content: '从进门那刻起就感受到了五星级的服务。房间装修豪华，床品舒适，早餐精致。' },
                { rating: 3.5, title: '中规中矩', content: '酒店设施有些老旧了，但是卫生还可以。前台服务态度一般。' },
                { rating: 4.5, title: '商务出差首选', content: '位置在市中心，交通方便。房间有办公桌，网络速度快，很适合商务人士。' },
                { rating: 5.0, title: '度假的好地方', content: '酒店环境优美，设施完善。泳池、健身房、SPA都很棒。适合度假放松。' },
                { rating: 4.0, title: '家庭出游推荐', content: '有家庭房，空间大。酒店还提供儿童游乐设施，孩子们很喜欢。' }
            ]
        };

        const reviews = [];

        // 为景点生成点评
        attractions.forEach(attraction => {
            const numReviews = Math.floor(Math.random() * 3) + 2; // 每个景点2-4条点评
            for (let i = 0; i < numReviews; i++) {
                const user = users[Math.floor(Math.random() * users.length)];
                const template = reviewTemplates.attraction[Math.floor(Math.random() * reviewTemplates.attraction.length)];
                reviews.push({
                    user_id: user.id,
                    entity_type: 'attraction',
                    entity_id: attraction.id,
                    rating: template.rating,
                    title: template.title,
                    content: template.content,
                    helpful_count: Math.floor(Math.random() * 50)
                });
            }
        });

        // 为餐厅生成点评
        restaurants.forEach(restaurant => {
            const numReviews = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < numReviews; i++) {
                const user = users[Math.floor(Math.random() * users.length)];
                const template = reviewTemplates.restaurant[Math.floor(Math.random() * reviewTemplates.restaurant.length)];
                reviews.push({
                    user_id: user.id,
                    entity_type: 'restaurant',
                    entity_id: restaurant.id,
                    rating: template.rating,
                    title: template.title,
                    content: template.content,
                    helpful_count: Math.floor(Math.random() * 50)
                });
            }
        });

        // 为酒店生成点评
        hotels.forEach(hotel => {
            const numReviews = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < numReviews; i++) {
                const user = users[Math.floor(Math.random() * users.length)];
                const template = reviewTemplates.hotel[Math.floor(Math.random() * reviewTemplates.hotel.length)];
                reviews.push({
                    user_id: user.id,
                    entity_type: 'hotel',
                    entity_id: hotel.id,
                    rating: template.rating,
                    title: template.title,
                    content: template.content,
                    helpful_count: Math.floor(Math.random() * 50)
                });
            }
        });

        // 批量插入
        const sql = `
            INSERT INTO reviews
            (user_id, entity_type, entity_id, rating, title, content, helpful_count)
            VALUES ?
        `;

        const values = reviews.map(review => [
            review.user_id,
            review.entity_type,
            review.entity_id,
            review.rating,
            review.title,
            review.content,
            review.helpful_count
        ]);

        await connection.query(sql, [values]);

        console.log(`✅ 成功插入 ${reviews.length} 条点评数据`);
        connection.release();

        // 显示统计信息
        const [stats] = await pool.query(`
            SELECT entity_type, COUNT(*) as count, AVG(rating) as avg_rating
            FROM reviews
            GROUP BY entity_type
        `);
        console.log('\n💬 点评统计：');
        stats.forEach(stat => {
            console.log(`  ${stat.entity_type}: ${stat.count} 条点评, 平均评分: ${stat.avg_rating.toFixed(1)}⭐`);
        });

    } catch (error) {
        console.error('❌ 插入点评数据失败:', error.message);
    } finally {
        process.exit();
    }
}

seedReviews();
