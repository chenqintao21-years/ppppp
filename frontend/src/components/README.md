# 统一搜索组件使用文档

## 📖 概述

统一搜索组件是一个功能完整的搜索解决方案，支持实时搜索建议、搜索历史、热门搜索、多类型搜索等功能。

## ✨ 功能特性

- ⚡ **实时搜索建议** - 输入时自动显示相关建议，支持防抖优化
- 📝 **搜索历史** - 自动保存搜索历史，支持删除和清空
- 🔥 **热门搜索** - 显示最近7天的热门搜索词
- 🎯 **多类型搜索** - 支持餐厅、景点、酒店的统一搜索
- ⌨️ **键盘导航** - 支持上下键选择，Enter确认，Esc关闭
- 📱 **移动端适配** - 响应式设计，支持移动端全屏模式
- 🎨 **高亮显示** - 搜索结果中关键词高亮显示
- 🌙 **深色模式** - 自动适配系统深色模式

## 🚀 快速开始

### 1. 引入文件

```html
<!-- CSS -->
<link rel="stylesheet" href="../styles/components/search-bar.css">

<!-- JavaScript -->
<script src="../components/search-bar.js"></script>
```

### 2. 添加容器

```html
<div class="search-bar-component" id="my-search"></div>
```

### 3. 初始化组件

```javascript
const searchBar = new SearchBar({
    container: '#my-search',
    placeholder: '搜索餐厅、景点、酒店'
});
```

## 📝 配置选项

### 基础配置

```javascript
new SearchBar({
    // 必需参数
    container: '.search-bar-component',  // 容器选择器

    // 可选参数
    placeholder: '搜索...',              // 占位符文本
    type: 'all',                         // 搜索类型: all, restaurants, attractions, hotels
    apiBaseUrl: 'http://localhost:3000/api', // API 基础 URL
    debounceDelay: 300,                  // 防抖延迟（毫秒）
    minSearchLength: 2,                  // 最小搜索长度
    maxHistoryItems: 10,                 // 最大历史记录数
    showHistory: true,                   // 显示搜索历史
    showTrending: true,                  // 显示热门搜索
    showTypeFilter: true,                // 显示类型筛选器

    // 回调函数
    onSearch: function(query, type) {},  // 搜索回调
    onSelect: function(item) {}          // 选择回调
});
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `container` | String | 必需 | 容器的 CSS 选择器 |
| `placeholder` | String | '搜索餐厅、景点、酒店' | 输入框占位符 |
| `type` | String | 'all' | 搜索类型：all, restaurants, attractions, hotels |
| `apiBaseUrl` | String | 'http://localhost:3000/api' | 后端 API 基础 URL |
| `debounceDelay` | Number | 300 | 防抖延迟时间（毫秒） |
| `minSearchLength` | Number | 2 | 触发搜索的最小字符数 |
| `maxHistoryItems` | Number | 10 | 最大历史记录保存数量 |
| `showHistory` | Boolean | true | 是否显示搜索历史 |
| `showTrending` | Boolean | true | 是否显示热门搜索 |
| `showTypeFilter` | Boolean | true | 是否显示类型筛选器 |
| `onSearch` | Function | null | 搜索回调函数 |
| `onSelect` | Function | null | 选择项目回调函数 |

## 💡 使用示例

### 基础示例

```javascript
const searchBar = new SearchBar({
    container: '#search-basic',
    placeholder: '搜索餐厅、景点、酒店'
});
```

### 餐厅专用搜索

```javascript
const restaurantSearch = new SearchBar({
    container: '#search-restaurant',
    type: 'restaurants',
    placeholder: '搜索餐厅',
    showTypeFilter: false
});
```

### 景点专用搜索

```javascript
const attractionSearch = new SearchBar({
    container: '#search-attraction',
    type: 'attractions',
    placeholder: '搜索景点玩乐',
    showTypeFilter: false
});
```

### 酒店专用搜索

```javascript
const hotelSearch = new SearchBar({
    container: '#search-hotel',
    type: 'hotels',
    placeholder: '搜索酒店',
    showTypeFilter: false
});
```

### 自定义回调

```javascript
const customSearch = new SearchBar({
    container: '#search-custom',
    onSearch: function(query, type) {
        console.log('用户搜索:', query, type);
        // 自定义搜索逻辑
        // 例如：跳转到自定义搜索结果页
        window.location.href = `/search?q=${query}&type=${type}`;
    },
    onSelect: function(item) {
        console.log('用户选择:', item);
        // 自定义选择逻辑
        // 例如：跳转到详情页
        window.location.href = `/detail/${item.type}/${item.id}`;
    }
});
```

### 禁用历史和热门搜索

```javascript
const simpleSearch = new SearchBar({
    container: '#search-simple',
    showHistory: false,
    showTrending: false
});
```

## 🔌 后端 API 接口

### 1. 搜索建议接口

**请求：**
```
GET /api/search/suggestions?q=关键词&type=all&limit=10
```

**参数：**
- `q`: 搜索关键词（必需）
- `type`: 搜索类型，可选值：all, restaurants, attractions, hotels（默认：all）
- `limit`: 返回结果数量（默认：10）

**响应：**
```json
{
    "success": true,
    "data": {
        "restaurants": [
            {
                "id": 1,
                "name": "餐厅名称",
                "cuisine": "菜系",
                "address": "地址",
                "rating": 4.5,
                "review_count": 1234
            }
        ],
        "attractions": [...],
        "hotels": [...],
        "total": 15
    }
}
```

### 2. 热门搜索接口

**请求：**
```
GET /api/search/trending?type=all&limit=10
```

**参数：**
- `type`: 搜索类型（默认：all）
- `limit`: 返回结果数量（默认：10）

**响应：**
```json
{
    "success": true,
    "data": [
        {
            "keyword": "桂林",
            "search_type": "all",
            "search_count": 156,
            "last_searched": "2024-01-01T12:00:00Z"
        }
    ]
}
```

### 3. 全局搜索接口

**请求：**
```
GET /api/search?q=关键词&type=all&page=1&limit=20&sort=relevance
```

**参数：**
- `q`: 搜索关键词（必需）
- `type`: 搜索类型（默认：all）
- `page`: 页码（默认：1）
- `limit`: 每页数量（默认：20）
- `sort`: 排序方式，可选值：relevance, rating, reviews, price（默认：relevance）

**响应：**
```json
{
    "success": true,
    "data": {
        "results": [...],
        "total": 100,
        "page": 1,
        "limit": 20,
        "hasMore": true,
        "query": "桂林",
        "type": "all"
    }
}
```

## 🎨 样式自定义

### CSS 变量

可以通过覆盖 CSS 变量来自定义样式：

```css
.search-bar-component {
    --search-primary-color: #00aa6c;
    --search-border-color: #e0e0e0;
    --search-hover-bg: #f5f5f5;
    --search-text-color: #333;
    --search-placeholder-color: #999;
}
```

### 自定义样式示例

```css
/* 修改搜索框圆角 */
.search-input-container {
    border-radius: 12px;
}

/* 修改主题色 */
.search-input-container:hover {
    border-color: #ff5722;
}

/* 修改下拉菜单最大高度 */
.search-dropdown {
    max-height: 600px;
}
```

## ⌨️ 键盘快捷键

- `↑` / `↓` - 在建议列表中上下移动
- `Enter` - 选择当前高亮项或执行搜索
- `Esc` - 关闭下拉菜单

## 📱 移动端适配

组件自动适配移动端，在小屏幕设备上：
- 隐藏类型筛选器
- 调整字体大小和间距
- 支持全屏搜索模式（可选）

## 🗄️ 数据库设置

### 创建搜索日志表

运行以下 SQL 脚本创建搜索日志表：

```bash
mysql -u root -p your_database < backend/database/migrations/create_search_logs.sql
```

或手动执行：

```sql
CREATE TABLE IF NOT EXISTS search_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    keyword VARCHAR(255) NOT NULL,
    search_type VARCHAR(50) DEFAULT 'all',
    result_count INT DEFAULT 0,
    user_id INT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_keyword (keyword),
    INDEX idx_search_type (search_type),
    INDEX idx_created_at (created_at)
);
```

## 🔧 方法 API

### 实例方法

```javascript
const searchBar = new SearchBar({ container: '#search' });

// 清除输入
searchBar.clearInput();

// 打开下拉菜单
searchBar.openDropdown();

// 关闭下拉菜单
searchBar.closeDropdown();

// 清除搜索历史
searchBar.clearHistory();

// 销毁组件
searchBar.destroy();
```

## 🐛 常见问题

### 1. 搜索建议不显示

**原因：** 后端 API 未启动或 URL 配置错误

**解决：**
```javascript
const searchBar = new SearchBar({
    container: '#search',
    apiBaseUrl: 'http://your-api-url/api'  // 确保 URL 正确
});
```

### 2. 搜索历史不保存

**原因：** localStorage 被禁用或浏览器隐私模式

**解决：** 检查浏览器设置，确保允许使用 localStorage

### 3. 样式显示异常

**原因：** CSS 文件未正确引入

**解决：**
```html
<link rel="stylesheet" href="../styles/components/search-bar.css">
```

## 📦 文件结构

```
frontend/src/
├── components/
│   └── search-bar.js          # 搜索组件 JS
├── styles/
│   └── components/
│       └── search-bar.css     # 搜索组件样式
└── views/
    └── search-demo.html       # 示例页面

backend/
├── api/
│   ├── search.js              # 搜索 API
│   └── routes.js              # 路由配置
└── database/
    └── migrations/
        └── create_search_logs.sql  # 数据库迁移
```

## 🎯 示例页面

访问示例页面查看完整功能演示：

```
http://localhost:3000/views/search-demo.html
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请联系开发团队或查看项目文档。
