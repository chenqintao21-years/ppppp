# 景点 API 测试文档

## 测试文件说明

### 1. seed-attractions.js
测试数据初始化脚本，用于向数据库插入测试数据。

**功能：**
- 清空现有数据
- 插入 10 个测试景点
- 插入 2 个测试用户
- 插入 3 条测试评论

### 2. attractions.test.js
景点 API 完整测试脚本，测试所有景点相关的 API 端点。

**测试覆盖：**
- ✅ 搜索景点（无参数、关键词、类型、位置、组合搜索）
- ✅ 获取热门景点
- ✅ 获取推荐景点
- ✅ 获取热门目的地
- ✅ 获取景点详情
- ✅ 收藏功能（添加/移除）
- ✅ 预订功能
- ✅ 评论列表
- ✅ 图片上传
- ✅ 健康检查

## 运行测试

### 前置条件

1. 确保 MySQL 数据库已启动
2. 配置数据库连接（.env 文件）
3. 安装依赖：`npm install`

### 步骤 1：启动后端服务器

```bash
cd backend
npm start
```

服务器应该运行在 `http://localhost:3000`

### 步骤 2：初始化测试数据

```bash
cd backend/tests
node seed-attractions.js
```

**预期输出：**
```
✅ 数据库连接成功
🗑️  清空现有数据...
✅ 现有数据已清空
👤 插入测试用户...
✅ 已插入 2 个测试用户
📍 插入测试景点...
✅ 已插入 10 个测试景点
💬 插入测试评论...
✅ 已插入 3 条测试评论
📊 验证插入的数据...
   景点数量: 10
   用户数量: 2
   评论数量: 3
✨ 测试数据初始化完成!
```

### 步骤 3：运行 API 测试

```bash
node attractions.test.js
```

**预期输出：**
```
🚀 开始测试景点 API
============================================================

📍 1. 搜索景点测试
📝 测试: 搜索景点 - 无参数
   状态码: 200
   响应: {"success":true,"data":[...],"total":10}
   ✅ 通过

...

============================================================
📊 测试结果统计
============================================================
总测试数: 25
通过: 23
失败: 2
成功率: 92.00%

✨ 测试完成!
```

## 测试数据

### 景点列表

| ID | 名称 | 位置 | 评分 | 价格 |
|----|------|------|------|------|
| 1 | 卢浮宫博物馆 | 巴黎, 法国 | 4.5 | $35 |
| 2 | 埃菲尔铁塔 | 巴黎, 法国 | 4.7 | $28 |
| 3 | 凡尔赛宫 | 凡尔赛, 法国 | 4.6 | $45 |
| 4 | 圣家堂 | 巴塞罗那, 西班牙 | 4.8 | $32 |
| 5 | 罗马斗兽场 | 罗马, 意大利 | 4.7 | $38 |
| 6 | 大英博物馆 | 伦敦, 英国 | 4.6 | 免费 |
| 7 | 自由女神像 | 纽约, 美国 | 4.5 | $25 |
| 8 | 长城 | 北京, 中国 | 4.8 | $15 |
| 9 | 泰姬陵 | 阿格拉, 印度 | 4.9 | $20 |
| 10 | 悉尼歌剧院 | 悉尼, 澳大利亚 | 4.7 | $42 |

## API 端点列表

### GET 请求

- `GET /api/attractions/search` - 搜索景点
- `GET /api/attractions/trending` - 获取热门景点
- `GET /api/attractions/recommendations` - 获取推荐景点
- `GET /api/attractions/destinations` - 获取热门目的地
- `GET /api/attractions/:id` - 获取景点详情
- `GET /api/reviews` - 获取评论列表

### POST 请求

- `POST /api/attractions/favorites` - 添加/移除收藏
- `POST /api/bookings` - 创建预订
- `POST /api/attractions/upload` - 上传图片

## 常见问题

### 1. 数据库连接失败

**错误：** `❌ 数据库连接失败: connect ECONNREFUSED`

**解决方案：**
- 检查 MySQL 是否已启动
- 验证 .env 文件中的数据库配置
- 确认数据库名称是否存在

### 2. 测试失败

**错误：** `❌ 错误: fetch failed`

**解决方案：**
- 确保后端服务器正在运行
- 检查端口 3000 是否被占用
- 验证 API_BASE_URL 配置

### 3. 数据初始化失败

**错误：** `❌ 数据初始化失败: Table doesn't exist`

**解决方案：**
- 先启动一次后端服务器，让数据库表自动创建
- 或手动运行数据库迁移脚本

## 手动测试示例

### 使用 curl 测试

```bash
# 搜索景点
curl "http://localhost:3000/api/attractions/search?keyword=museum"

# 获取景点详情
curl "http://localhost:3000/api/attractions/1"

# 创建预订
curl -X POST "http://localhost:3000/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "attractionId": 1,
    "attractionName": "卢浮宫博物馆",
    "date": "2026-05-15",
    "travelers": 2,
    "price": 35
  }'
```

### 使用浏览器测试

直接在浏览器中访问：
- http://localhost:3000/api/attractions/search
- http://localhost:3000/api/attractions/trending
- http://localhost:3000/api/attractions/1

## 下一步

- [ ] 添加单元测试（Jest/Mocha）
- [ ] 添加集成测试
- [ ] 添加性能测试
- [ ] 添加 API 文档（Swagger）
- [ ] 添加 CI/CD 自动化测试
