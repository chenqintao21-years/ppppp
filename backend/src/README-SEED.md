# 数据库优化和数据填充

本目录包含数据库优化和数据填充脚本。

## 文件说明

### 数据库优化
- `optimize-database.sql` - 数据库索引优化脚本，为所有表添加性能索引

### 数据填充脚本
- `seed-attractions.js` - 景点数据填充（50+条记录）
- `seed-restaurants.js` - 餐厅数据填充（30条记录）
- `seed-hotels.js` - 酒店数据填充（20条记录）
- `seed-reviews.js` - 点评数据填充（自动生成）
- `seed-all.js` - 一键运行所有数据填充脚本

## 使用方法

### 1. 一键填充所有数据（推荐）
```bash
cd backend/src
node seed-all.js
```

这将按顺序执行：
1. 初始化数据库表
2. 应用数据库索引优化
3. 填充景点数据（50+条）
4. 填充餐厅数据（30条）
5. 填充酒店数据（20条）
6. 填充点评数据（自动生成）

### 2. 单独填充某类数据
```bash
# 填充景点数据
node seed-attractions.js

# 填充餐厅数据
node seed-restaurants.js

# 填充酒店数据
node seed-hotels.js

# 填充点评数据（需要先有用户、景点、餐厅、酒店数据）
node seed-reviews.js
```

### 3. 手动应用数据库优化
```bash
# 使用MySQL客户端执行
mysql -u root -p tripadvisor < optimize-database.sql
```

## 数据统计

### 景点数据（50+条）
- 覆盖全球主要旅游城市
- 包含详细的位置、价格、评分信息
- 涵盖博物馆、地标建筑、自然景观等多种类型

### 餐厅数据（30条）
- 包含米其林星级餐厅和特色餐厅
- 覆盖法国、美国、中国、日本、意大利等多个国家
- 包含价格区间、营业时间、联系方式等完整信息

### 酒店数据（20条）
- 包含世界知名的奢华酒店
- 覆盖主要旅游城市
- 包含入住/退房时间、位置、评分等信息

### 点评数据
- 自动为景点、餐厅、酒店生成点评
- 每个实体2-4条点评
- 包含评分、标题、内容、有用数等信息

## 数据库索引优化

优化脚本为以下字段添加了索引：

### 景点表 (attractions)
- 评分索引（rating）
- 位置索引（location_city, location_country）
- 价格索引（price）
- 评论数索引（review_count）
- 地理坐标索引（latitude, longitude）
- 创建时间索引（created_at）

### 餐厅表 (restaurants)
- 评分索引（rating）
- 价格范围索引（price_range）
- 评论数索引（review_count）
- 地理坐标索引（latitude, longitude）

### 酒店表 (hotels)
- 评分索引（rating）
- 位置索引（location）
- 评论数索引（review_count）
- 地理坐标索引（latitude, longitude）

### 点评表 (reviews)
- 用户ID索引（user_id）
- 实体类型和ID复合索引（entity_type, entity_id）
- 评分索引（rating）
- 创建时间索引（created_at）
- 有用数索引（helpful_count）

### 预订表 (bookings)
- 用户ID索引（user_id）
- 预订ID索引（booking_id）
- 实体类型和ID复合索引（entity_type, entity_id）
- 预订日期索引（booking_date）
- 状态索引（status）
- 创建时间索引（created_at）

### 收藏表 (favorites)
- 用户ID索引（user_id）
- 实体类型和ID复合索引（entity_type, entity_id）
- 创建时间索引（created_at）

### 用户表 (users)
- 邮箱索引（email）
- 用户名索引（username）

## 注意事项

1. 运行脚本前请确保：
   - 数据库连接配置正确（.env文件）
   - 数据库已创建
   - 有足够的权限创建表和索引

2. 如果数据已存在：
   - 脚本会检测并提示已有数据
   - 不会重复插入数据
   - 可以安全地重复运行

3. 点评数据填充：
   - 需要先有用户数据
   - 会自动关联现有的景点、餐厅、酒店
   - 如果没有用户数据会提示先创建用户

4. 性能优化：
   - 索引会提升查询性能
   - 但会略微降低插入/更新速度
   - 适合读多写少的场景

## 故障排除

### 问题：连接数据库失败
解决：检查 .env 文件中的数据库配置

### 问题：表已存在错误
解决：脚本会自动处理，如需重新创建请先删除表

### 问题：索引已存在
解决：脚本会忽略重复索引错误，可以安全运行

### 问题：点评数据填充失败
解决：确保先运行景点、餐厅、酒店数据填充脚本
