// 高德地图定位工具类
export class AmapLocationService {
    constructor(apiKey = '987e520a1fb34f1680b515ff7ceb572e') {
        this.apiKey = apiKey;
        this.isLoaded = false;
        this.loadPromise = null;
    }

    /**
     * 加载高德地图API
     */
    loadAmapAPI() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise((resolve, reject) => {
            if (window.AMap) {
                this.isLoaded = true;
                resolve(window.AMap);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.apiKey}`;
            script.async = true;

            script.onload = () => {
                this.isLoaded = true;
                resolve(window.AMap);
            };

            script.onerror = () => {
                reject(new Error('加载高德地图API失败'));
            };

            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    /**
     * 获取当前位置（浏览器定位）
     */
    async getCurrentPosition() {
        await this.loadAmapAPI();

        return new Promise((resolve, reject) => {
            window.AMap.plugin('AMap.Geolocation', () => {
                const geolocation = new window.AMap.Geolocation({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    zoomToAccuracy: true
                });

                geolocation.getCurrentPosition((status, result) => {
                    if (status === 'complete') {
                        // 检查是否有地址信息
                        if (!result.addressComponent) {
                            // 如果没有地址信息，但有经纬度，使用逆地理编码
                            if (result.position) {
                                console.log('定位成功但无地址信息，使用逆地理编码:', result.position);
                                this.getAddressByLocation(result.position.lng, result.position.lat)
                                    .then(addressInfo => {
                                        resolve({
                                            success: true,
                                            position: {
                                                lng: result.position.lng,
                                                lat: result.position.lat
                                            },
                                            city: addressInfo.city,
                                            province: addressInfo.province,
                                            district: addressInfo.district,
                                            address: addressInfo.address,
                                            addressComponent: addressInfo.addressComponent
                                        });
                                    })
                                    .catch(err => {
                                        reject({
                                            success: false,
                                            message: '逆地理编码失败: ' + err.message
                                        });
                                    });
                                return;
                            }

                            reject({
                                success: false,
                                message: '定位成功但无法获取地址信息'
                            });
                            return;
                        }

                        resolve({
                            success: true,
                            position: {
                                lng: result.position.lng,
                                lat: result.position.lat
                            },
                            city: result.addressComponent.city || result.addressComponent.province,
                            province: result.addressComponent.province,
                            district: result.addressComponent.district,
                            address: result.formattedAddress,
                            addressComponent: result.addressComponent
                        });
                    } else {
                        reject({
                            success: false,
                            message: result.message || '定位失败'
                        });
                    }
                });
            });
        });
    }

    /**
     * 逆地理编码：根据经纬度获取地址信息
     */
    async getAddressByLocation(lng, lat) {
        await this.loadAmapAPI();

        return new Promise((resolve, reject) => {
            window.AMap.plugin('AMap.Geocoder', () => {
                const geocoder = new window.AMap.Geocoder();

                console.log('开始逆地理编码:', lng, lat);

                geocoder.getAddress([lng, lat], (status, result) => {
                    console.log('逆地理编码响应 - status:', status, 'result:', result);

                    if (status === 'complete' && result.regeocode) {
                        const regeocode = result.regeocode;
                        const addressComponent = regeocode.addressComponent;

                        console.log('逆地理编码成功:', addressComponent);

                        resolve({
                            success: true,
                            city: addressComponent.city || addressComponent.province,
                            province: addressComponent.province,
                            district: addressComponent.district,
                            address: regeocode.formattedAddress,
                            addressComponent: addressComponent
                        });
                    } else {
                        console.error('逆地理编码失败 - status:', status, 'result:', result);
                        reject({
                            success: false,
                            message: '逆地理编码失败: ' + (result?.info || '未知错误')
                        });
                    }
                });
            });
        });
    }

    /**
     * 根据城市名获取城市中心坐标
     */
    async getCityCenter(cityName) {
        await this.loadAmapAPI();

        return new Promise((resolve, reject) => {
            window.AMap.plugin('AMap.Geocoder', () => {
                const geocoder = new window.AMap.Geocoder({
                    city: cityName
                });

                geocoder.getLocation(cityName, (status, result) => {
                    if (status === 'complete' && result.geocodes.length > 0) {
                        const geocode = result.geocodes[0];
                        resolve({
                            success: true,
                            city: geocode.addressComponent.city || geocode.addressComponent.province,
                            province: geocode.addressComponent.province,
                            position: {
                                lng: geocode.location.lng,
                                lat: geocode.location.lat
                            },
                            adcode: geocode.adcode
                        });
                    } else {
                        reject({
                            success: false,
                            message: '未找到该城市'
                        });
                    }
                });
            });
        });
    }

    /**
     * 搜索附近的POI
     */
    async searchNearby(position, keyword, radius = 3000) {
        await this.loadAmapAPI();

        return new Promise((resolve, reject) => {
            window.AMap.plugin('AMap.PlaceSearch', () => {
                const placeSearch = new window.AMap.PlaceSearch({
                    type: keyword,
                    pageSize: 50,
                    pageIndex: 1,
                    city: '全国',
                    citylimit: false,
                    extensions: 'all'
                });

                placeSearch.searchNearBy('', [position.lng, position.lat], radius, (status, result) => {
                    if (status === 'complete' && result.poiList) {
                        resolve({
                            success: true,
                            pois: result.poiList.pois.map(poi => ({
                                id: poi.id,
                                name: poi.name,
                                type: poi.type,
                                address: poi.address,
                                location: {
                                    lng: poi.location.lng,
                                    lat: poi.location.lat
                                },
                                tel: poi.tel,
                                distance: poi.distance
                            }))
                        });
                    } else {
                        reject({
                            success: false,
                            message: '搜索失败'
                        });
                    }
                });
            });
        });
    }

    /**
     * 城市搜索建议
     */
    async searchCitySuggestions(keyword) {
        await this.loadAmapAPI();

        return new Promise((resolve, reject) => {
            window.AMap.plugin('AMap.AutoComplete', () => {
                const autoComplete = new window.AMap.AutoComplete({
                    city: '全国',
                    datatype: 'city'
                });

                autoComplete.search(keyword, (status, result) => {
                    if (status === 'complete' && result.tips) {
                        resolve({
                            success: true,
                            cities: result.tips.map(tip => ({
                                name: tip.name,
                                district: tip.district,
                                adcode: tip.adcode,
                                location: tip.location ? {
                                    lng: tip.location.lng,
                                    lat: tip.location.lat
                                } : null
                            }))
                        });
                    } else {
                        reject({
                            success: false,
                            message: '搜索失败'
                        });
                    }
                });
            });
        });
    }
}

// 导出单例
export const amapLocationService = new AmapLocationService();
