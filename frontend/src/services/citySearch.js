// 城市搜索和自动导入服务
import mapUtil from '../utils/map.js';
import { get, post } from './api.js';

class CitySearchService {
    constructor() {
        this.currentCity = null;
        this.currentLocation = null;
    }

    /**
     * 使用高德地图定位当前城市
     */
    async getCurrentCity() {
        try {
            await mapUtil.loadMapScript();

            return new Promise((resolve, reject) => {
                mapUtil.AMap.plugin('AMap.CitySearch', () => {
                    const citySearch = new mapUtil.AMap.CitySearch();
                    citySearch.getLocalCity((status, result) => {
                        if (status === 'complete' && result.info === 'OK') {
                            this.currentCity = {
                                name: result.city,
                                adcode: result.adcode,
                                bounds: result.bounds,
                                center: result.rectangle.split(';')[0].split(',')
                            };
                            resolve(this.currentCity);
                        } else {
                            reject(new Error('定位失败'));
                        }
                    });
                });
            });
        } catch (error) {
            console.error('获取当前城市失败:', error);
            throw error;
        }
    }

    /**
     * 搜索城市（支持模糊搜索）
     */
    async searchCity(keyword) {
        try {
            await mapUtil.loadMapScript();

            return new Promise((resolve, reject) => {
                mapUtil.AMap.plugin('AMap.AutoComplete', () => {
                    const autoComplete = new mapUtil.AMap.AutoComplete({
                        city: '全国',
                        datatype: 'city'
                    });

                    autoComplete.search(keyword, (status, result) => {
                        if (status === 'complete' && result.tips && result.tips.length > 0) {
                            const cities = result.tips.map(tip => ({
                                name: tip.name,
                                adcode: tip.adcode,
                                district: tip.district,
                                location: tip.location ? [tip.location.lng, tip.location.lat] : null
                            }));
                            resolve(cities);
                        } else {
                            reject(new Error('未找到城市'));
                        }
                    });
                });
            });
        } catch (error) {
            console.error('搜索城市失败:', error);
            throw error;
        }
    }

    /**
     * 搜索城市的酒店
     */
    async searchCityHotels(cityName, options = {}) {
        try {
            await mapUtil.loadMapScript();

            return new Promise((resolve, reject) => {
                const placeSearch = new mapUtil.AMap.PlaceSearch({
                    city: cityName,
                    type: '100100', // 酒店类型码
                    pageSize: options.pageSize || 50,
                    pageIndex: options.pageIndex || 1,
                    extensions: 'all'
                });

                placeSearch.search('', (status, result) => {
                    if (status === 'complete' && result.poiList) {
                        const hotels = result.poiList.pois.map(poi => ({
                            source: 'amap',
                            amapId: poi.id,
                            name: poi.name,
                            address: poi.address,
                            location: {
                                lng: poi.location.lng,
                                lat: poi.location.lat
                            },
                            tel: poi.tel || '',
                            rating: poi.biz_ext?.rating || '',
                            price: poi.biz_ext?.cost || '',
                            photos: poi.photos || [],
                            cityname: poi.cityname || cityName,
                            adname: poi.adname || '',
                            type: poi.type,
                            typecode: poi.typecode
                        }));
                        resolve(hotels);
                    } else {
                        reject(new Error('搜索酒店失败'));
                    }
                });
            });
        } catch (error) {
            console.error('搜索城市酒店失败:', error);
            throw error;
        }
    }

    /**
     * 搜索城市的景点
     */
    async searchCityAttractions(cityName, options = {}) {
        try {
            await mapUtil.loadMapScript();

            return new Promise((resolve, reject) => {
                const placeSearch = new mapUtil.AMap.PlaceSearch({
                    city: cityName,
                    type: '110000|120000|130000|140000|150000|160000|170000|180000|190000', // 景点类型码
                    pageSize: options.pageSize || 50,
                    pageIndex: options.pageIndex || 1,
                    extensions: 'all'
                });

                placeSearch.search('', (status, result) => {
                    if (status === 'complete' && result.poiList) {
                        const attractions = result.poiList.pois.map(poi => ({
                            source: 'amap',
                            amapId: poi.id,
                            name: poi.name,
                            address: poi.address,
                            location: {
                                lng: poi.location.lng,
                                lat: poi.location.lat
                            },
                            tel: poi.tel || '',
                            rating: poi.biz_ext?.rating || '',
                            price: poi.biz_ext?.cost || '',
                            photos: poi.photos || [],
                            cityname: poi.cityname || cityName,
                            adname: poi.adname || '',
                            type: poi.type,
                            typecode: poi.typecode,
                            opentime: poi.biz_ext?.opentime || '',
                            tag: poi.tag || ''
                        }));
                        resolve(attractions);
                    } else {
                        reject(new Error('搜索景点失败'));
                    }
                });
            });
        } catch (error) {
            console.error('搜索城市景点失败:', error);
            throw error;
        }
    }

    /**
     * 搜索城市的餐厅/美食
     */
    async searchCityRestaurants(cityName, options = {}) {
        try {
            await mapUtil.loadMapScript();

            return new Promise((resolve, reject) => {
                const placeSearch = new mapUtil.AMap.PlaceSearch({
                    city: cityName,
                    type: '050000|060000', // 餐饮服务类型码
                    pageSize: options.pageSize || 50,
                    pageIndex: options.pageIndex || 1,
                    extensions: 'all'
                });

                placeSearch.search('', (status, result) => {
                    if (status === 'complete' && result.poiList) {
                        const restaurants = result.poiList.pois.map(poi => ({
                            source: 'amap',
                            amapId: poi.id,
                            name: poi.name,
                            address: poi.address,
                            location: {
                                lng: poi.location.lng,
                                lat: poi.location.lat
                            },
                            tel: poi.tel || '',
                            rating: poi.biz_ext?.rating || '',
                            price: poi.biz_ext?.cost || '',
                            photos: poi.photos || [],
                            cityname: poi.cityname || cityName,
                            adname: poi.adname || '',
                            type: poi.type,
                            typecode: poi.typecode,
                            opentime: poi.biz_ext?.opentime || '',
                            tag: poi.tag || '',
                            cuisine: this.extractCuisineType(poi.type)
                        }));
                        resolve(restaurants);
                    } else {
                        reject(new Error('搜索餐厅失败'));
                    }
                });
            });
        } catch (error) {
            console.error('搜索城市餐厅失败:', error);
            throw error;
        }
    }

    /**
     * 提取菜系类型
     */
    extractCuisineType(type) {
        const cuisineMap = {
            '中餐厅': 'chinese',
            '西餐厅': 'western',
            '日本料理': 'japanese',
            '韩国料理': 'korean',
            '东南亚菜': 'southeast_asian',
            '快餐': 'fast_food',
            '咖啡厅': 'cafe',
            '甜品店': 'dessert'
        };

        for (const [key, value] of Object.entries(cuisineMap)) {
            if (type.includes(key)) {
                return value;
            }
        }
        return 'other';
    }

    /**
     * 自动搜索并导入城市所有数据
     */
    async autoImportCityData(cityName, options = {}) {
        const results = {
            city: cityName,
            hotels: [],
            attractions: [],
            restaurants: [],
            errors: []
        };

        try {
            // 并行搜索所有类型
            const [hotels, attractions, restaurants] = await Promise.allSettled([
                this.searchCityHotels(cityName, options),
                this.searchCityAttractions(cityName, options),
                this.searchCityRestaurants(cityName, options)
            ]);

            if (hotels.status === 'fulfilled') {
                results.hotels = hotels.value;
            } else {
                results.errors.push({ type: 'hotels', error: hotels.reason.message });
            }

            if (attractions.status === 'fulfilled') {
                results.attractions = attractions.value;
            } else {
                results.errors.push({ type: 'attractions', error: attractions.reason.message });
            }

            if (restaurants.status === 'fulfilled') {
                results.restaurants = restaurants.value;
            } else {
                results.errors.push({ type: 'restaurants', error: restaurants.reason.message });
            }

            return results;
        } catch (error) {
            console.error('自动导入城市数据失败:', error);
            throw error;
        }
    }

    /**
     * 将数据保存到后端数据库
     */
    async saveCityDataToBackend(cityData) {
        try {
            const response = await post('/cities/import', cityData);
            return response;
        } catch (error) {
            console.error('保存城市数据到后端失败:', error);
            throw error;
        }
    }

    /**
     * 完整流程：搜索城市并自动导入所有数据
     */
    async searchAndImportCity(cityName, options = {}) {
        try {
            // 1. 搜索城市信息
            const cities = await this.searchCity(cityName);
            if (!cities || cities.length === 0) {
                throw new Error('未找到该城市');
            }

            const targetCity = cities[0];

            // 2. 自动搜索该城市的酒店、景点、餐厅
            const cityData = await this.autoImportCityData(targetCity.name, options);

            // 3. 如果需要保存到后端
            if (options.saveToBackend) {
                await this.saveCityDataToBackend(cityData);
            }

            return {
                success: true,
                city: targetCity,
                data: cityData,
                summary: {
                    hotels: cityData.hotels.length,
                    attractions: cityData.attractions.length,
                    restaurants: cityData.restaurants.length,
                    errors: cityData.errors.length
                }
            };
        } catch (error) {
            console.error('搜索并导入城市失败:', error);
            throw error;
        }
    }

    /**
     * 使用当前定位自动导入
     */
    async autoImportCurrentLocation(options = {}) {
        try {
            // 1. 获取当前城市
            const city = await this.getCurrentCity();

            // 2. 自动导入该城市数据
            return await this.searchAndImportCity(city.name, options);
        } catch (error) {
            console.error('自动导入当前位置失败:', error);
            throw error;
        }
    }
}

// 导出单例
const citySearchService = new CitySearchService();
export default citySearchService;
