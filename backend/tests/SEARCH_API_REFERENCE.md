# 搜索 API 快速参考

## 基础搜索
```bash
# 搜索所有景点
curl "http://localhost:3000/api/attractions/search"

# 关键词搜索
curl "http://localhost:3000/api/attractions/search?keyword=博物馆"

# 位置搜索
curl "http://localhost:3000/api/attractions/search?location=巴黎"
```

## 过滤
```bash
# 价格过滤
curl "http://localhost:3000/api/attractions/search?minPrice=20&maxPrice=40"

# 评分过滤
curl "http://localhost:3000/api/attractions/search?minRating=4.5"

# 组合过滤
curl "http://localhost:3000/api/attractions/search?location=法国&minPrice=20&minRating=4.5"
```

## 排序
```bash
# 按评分排序
curl "http://localhost:3000/api/attractions/search?sortBy=rating"

# 按价格排序（低到高）
curl "http://localhost:3000/api/attractions/search?sortBy=price"

# 按评论数排序
curl "http://localhost:3000/api/attractions/search?sortBy=reviews"
```

## 分页
```bash
# 第1页，每页10条
curl "http://localhost:3000/api/attractions/search?page=1&limit=10"

# 第2页
curl "http://localhost:3000/api/attractions/search?page=2&limit=10"
```

## 搜索建议
```bash
# 获取搜索建议
curl "http://localhost:3000/api/attractions/suggestions?q=巴黎"

# 限制返回数量
curl "http://localhost:3000/api/attractions/suggestions?q=博物&limit=3"
```

## 过滤器选项
```bash
# 获取所有可用的过滤器选项
curl "http://localhost:3000/api/attractions/filters"
```

## 复杂查询示例
```bash
# 搜索法国的博物馆，价格10-50，评分4.0以上，按评分排序
curl "http://localhost:3000/api/attractions/search?\
keyword=博物馆&\
location=法国&\
minPrice=10&\
maxPrice=50&\
minRating=4.0&\
sortBy=rating&\
page=1&\
limit=10"
```

## 前端 JavaScript 示例
```javascript
// 搜索函数
async function search(filters) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/attractions/search?${params}`);
    return await res.json();
}

// 使用示例
const results = await search({
    keyword: '博物馆',
    location: '巴黎',
    minRating: 4.5,
    sortBy: 'rating',
    page: 1,
    limit: 10
});

console.log(results.data); // 景点列表
console.log(results.pagination); // 分页信息
```

## 响应格式
```json
{
  "success": true,
  "data": [
    {
      "id": 18,
      "name": "卢浮宫博物馆",
      "description": "...",
      "rating": "4.5",
      "review_count": 603,
      "price": "35.00",
      "location_city": "巴黎",
      "location_country": "法国",
      "relevance_score": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasMore": true
  },
  "filters": {
    "keyword": "博物馆",
    "location": "巴黎",
    "minRating": "4.5",
    "sortBy": "rating"
  }
}
```

## 参数说明

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| keyword | string | 搜索关键词 | `博物馆` |
| type | string | 景点类型 | `museum` |
| location | string | 位置 | `巴黎` |
| minPrice | number | 最低价格 | `20` |
| maxPrice | number | 最高价格 | `50` |
| minRating | number | 最低评分 | `4.5` |
| sortBy | string | 排序方式 | `rating` |
| page | number | 页码 | `1` |
| limit | number | 每页数量 | `10` |

## 排序选项

| 值 | 说明 |
|----|------|
| relevance | 相关性（默认） |
| rating | 评分最高 |
| price | 价格最低 |
| price_desc | 价格最高 |
| reviews | 评论最多 |
