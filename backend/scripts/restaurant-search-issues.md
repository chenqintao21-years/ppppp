## 餐厅搜索页面 (restaurant-search.html) 问题总结

### 问题描述
用户反馈：在 http://localhost:5173/views/restaurant-search.html 页面，点击筛选功能后，详情页面显示的不是搜索到的结果。

### 已发现的问题

#### 1. **数据字段不匹配** ✅ 已修复
- **问题**：前端 `createRestaurantCard()` 期望 `cuisine`、`features` 数组，但数据库返回的是下划线命名的字段
- **修复**：已修改 `createRestaurantCard()` 函数，兼容数据库字段格式

#### 2. **筛选参数未传递给API** ✅ 已修复
- **问题**：`handleFilterChange()` 收集了筛选条件，但 `loadRestaurants()` 没有将这些条件传递给后端API
- **修复**：已在 `loadRestaurants()` 中添加筛选参数（price, cuisine, feature, meal）

#### 3. **排序功能只对餐厅生效** ✅ 已修复
- **问题**：排序改变时只调用 `loadRestaurants()`，对其他分类无效
- **修复**：已修改为调用 `reloadCurrentCategory()`

#### 4. **详情页跳转路径问题** ⚠️ 需要确认
- **问题**：所有详情页面使用相对路径（如 `attraction-detail.html`）
- **当前路径**：
  - `viewAttractionDetails()` → `attraction-detail.html?id=${attractionId}`
  - `viewHotelDetails()` → `hotel-detail.html?id=${hotelId}&city=${city}`
  - `viewDestinationDetails()` → `destination.html?id=${destinationId}`
  - `viewRestaurantDetails()` → `restaurant-detail.html?id=${restaurantId}`
- **可能的问题**：如果当前页面在 `/views/` 目录，跳转会失败

#### 5. **目的地ID查询可能失败** ⚠️ 需要测试
- **问题**：切换到景点/酒店分类时，需要先查询城市的 `destinationId`
- **流程**：
  1. 用户搜索"长沙"
  2. 点击"景点玩乐"筛选项
  3. `loadAttractions()` 调用 `getDestinationIdByName('长沙')`
  4. 查询 `destinations` 表中是否有"长沙"的记录
  5. 如果没有，返回 null，显示"未找到相关数据"
- **当前状态**：数据库中可能没有"长沙"的目的地记录

### 需要测试的场景

1. **餐厅搜索**
   - 搜索"长沙" → 应该显示79个餐厅
   - 点击餐厅详情 → 应该跳转到正确的餐厅详情页

2. **景点搜索**
   - 搜索"长沙" → 点击"景点玩乐"筛选项
   - 应该显示74个景点
   - 点击景点详情 → 应该跳转到正确的景点详情页

3. **酒店搜索**
   - 搜索"长沙" → 点击"酒店"筛选项
   - 需要先在 destinations 表中有"长沙"记录
   - 点击酒店详情 → 应该跳转到正确的酒店详情页

4. **目的地搜索**
   - 搜索"长沙" → 点击"目的地"筛选项
   - 应该显示"长沙"目的地
   - 点击目的地详情 → 应该跳转到正确的目的地详情页

### 下一步行动

1. **测试餐厅搜索功能**
   - 打开 http://localhost:5173/views/restaurant-search.html
   - 搜索"长沙"
   - 验证是否显示餐厅列表
   - 点击详情按钮，验证跳转是否正确

2. **测试景点筛选功能**
   - 在餐厅搜索页面搜索"长沙"
   - 点击"景点玩乐"筛选项
   - 验证是否显示景点列表
   - 点击详情按钮，验证跳转是否正确

3. **检查 destinations 表**
   - 查询数据库中是否有"长沙"的目的地记录
   - 如果没有，需要添加

4. **修复详情页路径**（如果需要）
   - 如果跳转失败，需要修改为绝对路径或正确的相对路径
