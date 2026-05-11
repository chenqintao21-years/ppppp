// 保存到收藏夹
export function saveToFavorites(hotelId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favorites.includes(hotelId)) {
        favorites.push(hotelId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

// 从收藏夹移除
export function removeFromFavorites(hotelId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(hotelId);
    if (index > -1) {
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

// 获取收藏列表
export function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}
