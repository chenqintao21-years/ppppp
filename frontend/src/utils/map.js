// 高德地图工具类

// 配置安全密钥
window._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || ''
};

class AMapUtil {
    constructor(key) {
        this.key = key;
        this.map = null;
        this.AMap = null;
        this.markers = [];
    }

    // 加载高德地图API
    async loadMapScript() {
        if (window.AMap) {
            this.AMap = window.AMap;
            return Promise.resolve(window.AMap);
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.key}&plugin=AMap.Geocoder,AMap.Driving,AMap.PlaceSearch`;
            script.async = true;
            script.onload = () => {
                this.AMap = window.AMap;
                resolve(window.AMap);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 初始化地图
    async initMap(containerId, options = {}) {
        await this.loadMapScript();

        const defaultOptions = {
            zoom: 15,
            center: [2.3364, 48.8606], // 巴黎卢浮宫默认坐标
            viewMode: '3D',
            pitch: 0,
            ...options
        };

        this.map = new this.AMap.Map(containerId, defaultOptions);
        return this.map;
    }

    // 添加标记点
    addMarker(position, options = {}) {
        if (!this.map) {
            console.error('地图未初始化');
            return null;
        }

        const marker = new this.AMap.Marker({
            position: position,
            title: options.title || '',
            icon: options.icon,
            ...options
        });

        marker.setMap(this.map);
        this.markers.push(marker);

        // 添加点击事件
        if (options.onClick) {
            marker.on('click', options.onClick);
        }

        return marker;
    }

    // 添加信息窗体
    addInfoWindow(marker, content) {
        const infoWindow = new this.AMap.InfoWindow({
            content: content,
            offset: new this.AMap.Pixel(0, -30)
        });

        marker.on('click', () => {
            infoWindow.open(this.map, marker.getPosition());
        });

        return infoWindow;
    }

    // 清除所有标记
    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    // 地理编码（地址转坐标）
    async geocode(address) {
        return new Promise((resolve, reject) => {
            const geocoder = new this.AMap.Geocoder();
            geocoder.getLocation(address, (status, result) => {
                if (status === 'complete' && result.geocodes.length) {
                    resolve(result.geocodes[0].location);
                } else {
                    reject(new Error('地理编码失败'));
                }
            });
        });
    }

    // 逆地理编码（坐标转地址）
    async reverseGeocode(lnglat) {
        return new Promise((resolve, reject) => {
            const geocoder = new this.AMap.Geocoder();
            geocoder.getAddress(lnglat, (status, result) => {
                if (status === 'complete' && result.regeocode) {
                    resolve(result.regeocode.formattedAddress);
                } else {
                    reject(new Error('逆地理编码失败'));
                }
            });
        });
    }

    // 计算两点之间的距离（米）
    calculateDistance(point1, point2) {
        if (!this.AMap) return 0;

        const p1 = new this.AMap.LngLat(point1[0], point1[1]);
        const p2 = new this.AMap.LngLat(point2[0], point2[1]);
        return p1.distance(p2);
    }

    // 格式化距离显示
    formatDistance(distance) {
        if (distance < 1000) {
            return `${Math.round(distance)}米`;
        } else {
            return `${(distance / 1000).toFixed(1)}公里`;
        }
    }

    // 路线规划（驾车）
    async planRoute(start, end, options = {}) {
        return new Promise((resolve, reject) => {
            const driving = new this.AMap.Driving({
                map: this.map,
                panel: options.panel,
                hideMarkers: options.hideMarkers || false,
                ...options
            });

            driving.search(start, end, (status, result) => {
                if (status === 'complete') {
                    resolve(result);
                } else {
                    reject(new Error('路线规划失败'));
                }
            });
        });
    }

    // 搜索附近地点
    async searchNearby(center, keyword, options = {}) {
        return new Promise((resolve, reject) => {
            const placeSearch = new this.AMap.PlaceSearch({
                type: options.type || '',
                pageSize: options.pageSize || 10,
                pageIndex: options.pageIndex || 1,
                city: options.city || '全国',
                citylimit: options.citylimit || false
            });

            placeSearch.searchNearBy(keyword, center, options.radius || 5000, (status, result) => {
                if (status === 'complete') {
                    resolve(result.poiList.pois);
                } else {
                    reject(new Error('搜索失败'));
                }
            });
        });
    }

    // 搜索附近酒店
    async searchNearbyHotels(center, options = {}) {
        return new Promise((resolve, reject) => {
            const placeSearch = new this.AMap.PlaceSearch({
                type: '100100',  // 酒店类型码
                pageSize: options.pageSize || 20,
                pageIndex: options.pageIndex || 1,
                extensions: 'all'  // 返回详细信息
            });

            placeSearch.searchNearBy('', center, options.radius || 3000, (status, result) => {
                if (status === 'complete' && result.poiList) {
                    // 打印完整的原始数据
                    console.log('=== 原始result对象 ===');
                    console.log('result:', result);
                    console.log('result.poiList:', result.poiList);
                    console.log('第一个POI完整数据:', result.poiList.pois[0]);

                    const hotels = result.poiList.pois.map(poi => {
                        // 调试日志
                        console.log('POI名称:', poi.name);
                        console.log('biz_ext对象:', poi.biz_ext);
                        console.log('rating:', poi.biz_ext?.rating);
                        console.log('cost:', poi.biz_ext?.cost);

                        return {
                            id: poi.id,
                            name: poi.name,
                            address: poi.address,
                            location: {
                                lng: poi.location.lng,
                                lat: poi.location.lat
                            },
                            tel: poi.tel || '暂无电话',
                            distance: this.calculateDistance(center, [poi.location.lng, poi.location.lat]),
                            type: poi.type,
                            typecode: poi.typecode,
                            photos: poi.photos || [],
                            website: poi.website || '',
                            // 商业扩展信息
                            rating: poi.biz_ext?.rating || '',
                            cost: poi.biz_ext?.cost || '',
                            // 地理信息
                            pname: poi.pname || '',  // 省份
                            cityname: poi.cityname || '',  // 城市
                            adname: poi.adname || '',  // 区域
                            // 其他信息
                            alias: poi.alias || '',  // 别名
                            tag: poi.tag || '',  // 标签
                            business_area: poi.business_area || ''  // 商圈
                        };
                    });
                    resolve(hotels);
                } else {
                    reject(new Error('搜索酒店失败'));
                }
            });
        });
    }

    // 在地图上显示附近酒店
    async showNearbyHotels(center, options = {}) {
        try {
            const hotels = await this.searchNearbyHotels(center, options);

            hotels.forEach(hotel => {
                const marker = this.addMarker(
                    [hotel.location.lng, hotel.location.lat],
                    {
                        title: hotel.name,
                        icon: options.icon || new this.AMap.Icon({
                            size: new this.AMap.Size(25, 34),
                            image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
                            imageSize: new this.AMap.Size(25, 34)
                        })
                    }
                );

                // 构建图片HTML
                let photosHtml = '';
                if (hotel.photos && hotel.photos.length > 0) {
                    photosHtml = `
                        <div style="display: flex; gap: 5px; margin-top: 8px; overflow-x: auto;">
                            ${hotel.photos.slice(0, 3).map(photo =>
                                `<img src="${photo.url}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;" alt="${hotel.name}">`
                            ).join('')}
                        </div>
                    `;
                }

                const content = `
                    <div style="padding: 12px; min-width: 250px; max-width: 300px;">
                        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">${hotel.name}</h4>
                        ${hotel.rating ? `<p style="margin: 0 0 5px 0; color: #ff9800; font-size: 12px;">⭐ ${hotel.rating}</p>` : ''}
                        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">
                            <span style="color: #999;">📍</span> ${hotel.address}
                        </p>
                        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">
                            <span style="color: #999;">📞</span> ${hotel.tel}
                        </p>
                        <p style="margin: 0; color: #00aa6c; font-size: 12px; font-weight: bold;">
                            <span style="color: #999;">📏</span> 距离: ${this.formatDistance(hotel.distance)}
                        </p>
                        ${photosHtml}
                    </div>
                `;
                this.addInfoWindow(marker, content);
            });

            return hotels;
        } catch (error) {
            console.error('显示附近酒店失败:', error);
            return [];
        }
    }

    // 在地图上显示附近地点
    async showNearbyPlaces(center, keyword, options = {}) {
        try {
            const places = await this.searchNearby(center, keyword, options);

            places.forEach(place => {
                const marker = this.addMarker(
                    [place.location.lng, place.location.lat],
                    {
                        title: place.name,
                        icon: options.icon
                    }
                );

                // 添加信息窗体
                const distance = this.calculateDistance(center, [place.location.lng, place.location.lat]);
                const content = `
                    <div style="padding: 10px;">
                        <h4 style="margin: 0 0 5px 0;">${place.name}</h4>
                        <p style="margin: 0; color: #666; font-size: 12px;">${place.address}</p>
                        <p style="margin: 5px 0 0 0; color: #00aa6c; font-size: 12px;">距离: ${this.formatDistance(distance)}</p>
                    </div>
                `;
                this.addInfoWindow(marker, content);
            });

            return places;
        } catch (error) {
            console.error('显示附近地点失败:', error);
            return [];
        }
    }

    // 设置地图中心点
    setCenter(lnglat, zoom) {
        if (this.map) {
            this.map.setCenter(lnglat);
            if (zoom) {
                this.map.setZoom(zoom);
            }
        }
    }

    // 自适应显示所有标记
    fitView() {
        if (this.map && this.markers.length > 0) {
            this.map.setFitView();
        }
    }

    // 销毁地图
    destroy() {
        if (this.map) {
            this.map.destroy();
            this.map = null;
        }
        this.markers = [];
    }
}

// 导出单例
const mapUtil = new AMapUtil(import.meta.env.VITE_AMAP_KEY || '');

export default mapUtil;
