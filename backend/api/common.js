// 通用搜索API接口

/**
 * 全局搜索
 * POST /api/search
 */
async function globalSearch(req, res) {
    const { query, type } = req.body;

    // 返回空结果，所有数据从数据库获取
    let results = {
        success: true,
        query,
        type,
        data: []
    };

    res.json(results);
}

/**
 * 收藏功能
 * POST /api/favorites
 */
async function manageFavorites(req, res) {
    const { itemName, hotelName, attractionName, action } = req.body;
    const name = itemName || hotelName || attractionName;

    const result = {
        success: true,
        message: action === 'add' ? '已添加到收藏' : '已从收藏中移除',
        data: {
            name,
            action,
            timestamp: new Date().toISOString()
        }
    };

    res.json(result);
}

/**
 * 获取用户收藏列表
 * GET /api/favorites
 */
async function getFavorites(req, res) {
    const favorites = {
        success: true,
        data: []
    };

    res.json(favorites);
}

/**
 * 获取热门目的地
 * GET /api/destinations
 */
async function getDestinations(req, res) {
    const destinations = {
        success: true,
        data: []
    };

    res.json(destinations);
}

/**
 * 获取推荐内容
 * GET /api/recommendations
 */
async function getRecommendations(req, res) {
    const { type } = req.query;

    const recommendations = {
        success: true,
        type,
        data: []
    };

    res.json(recommendations);
}

module.exports = {
    globalSearch,
    manageFavorites,
    getFavorites,
    getDestinations,
    getRecommendations
};
