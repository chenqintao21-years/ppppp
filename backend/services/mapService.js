// 地图API服务 - 高德地图（主数据源）+ 百度地图（辅助数据源）
const axios = require('axios');
require('dotenv').config();

// API配置
const AMAP_KEY = process.env.AMAP_KEY;
const BAIDU_AK = process.env.BAIDU_AK;

if (!AMAP_KEY) {
    console.warn('⚠️  警告: 未配置 AMAP_KEY 环境变量');
}
if (!BAIDU_AK) {
    console.warn('⚠️  警告: 未配置 BAIDU_AK 环境变量');
}

/**
 * 高德地图API服务
 */
class AmapService {
    /**
     * 周边搜索酒店
     * @param {string} location - 经纬度 "lng,lat"
     * @param {number} radius - 搜索半径（米）
     * @param {number} offset - 返回数量
     */
    async searchNearbyHotels(location, radius = 3000, offset = 20) {
        try {
            const response = await axios.get('https://restapi.amap.com/v3/place/around', {
                params: {
                    key: AMAP_KEY,
                    location: location,
                    types: '100100', // 酒店类型码
                    radius: radius,
                    offset: offset,
                    extensions: 'all' // 返回详细信息
                }
            });

            if (response.data.status === '1' && response.data.pois) {
                return response.data.pois;
            }
            return [];
        } catch (error) {
            console.error('高德地图搜索失败:', error.message);
            return [];
        }
    }

    /**
     * 关键字搜索酒店
     * @param {string} keywords - 关键字
     * @param {string} city - 城市名称
     * @param {number} offset - 返回数量
     */
    async searchHotelsByKeyword(keywords, city, offset = 20) {
        try {
            const response = await axios.get('https://restapi.amap.com/v3/place/text', {
                params: {
                    key: AMAP_KEY,
                    keywords: keywords,
                    city: city,
                    types: '100100',
                    offset: offset,
                    extensions: 'all'
                }
            });

            if (response.data.status === '1' && response.data.pois) {
                return response.data.pois;
            }
            return [];
        } catch (error) {
            console.error('高德地图关键字搜索失败:', error.message);
            return [];
        }
    }

    /**
     * 搜索餐厅
     * @param {string} keywords - 关键字（如"美食"、"餐厅"、"火锅"等）
     * @param {string} city - 城市名称
     * @param {number} offset - 返回数量
     * @param {number} page - 页码
     */
    async searchRestaurants(keywords, city, offset = 20, page = 1) {
        try {
            const response = await axios.get('https://restapi.amap.com/v3/place/text', {
                params: {
                    key: AMAP_KEY,
                    keywords: keywords,
                    city: city,
                    types: '050000|060000', // 050000:餐饮服务, 060000:购物服务(包含美食广场)
                    offset: offset,
                    page: page,
                    extensions: 'all'
                }
            });

            if (response.data.status === '1' && response.data.pois) {
                return {
                    pois: response.data.pois,
                    count: parseInt(response.data.count) || 0
                };
            }
            return { pois: [], count: 0 };
        } catch (error) {
            console.error('高德地图搜索餐厅失败:', error.message);
            return { pois: [], count: 0 };
        }
    }

    /**
     * 搜索景点
     * @param {string} keywords - 关键字
     * @param {string} city - 城市名称
     * @param {number} offset - 返回数量
     * @param {number} page - 页码
     */
    async searchAttractions(keywords, city, offset = 20, page = 1) {
        try {
            const response = await axios.get('https://restapi.amap.com/v3/place/text', {
                params: {
                    key: AMAP_KEY,
                    keywords: keywords,
                    city: city,
                    types: '110000', // 风景名胜
                    offset: offset,
                    page: page,
                    extensions: 'all'
                }
            });

            if (response.data.status === '1' && response.data.pois) {
                return {
                    pois: response.data.pois,
                    count: parseInt(response.data.count) || 0
                };
            }
            return { pois: [], count: 0 };
        } catch (error) {
            console.error('高德地图搜索景点失败:', error.message);
            return { pois: [], count: 0 };
        }
    }

    /**
     * 获取POI详情
     * @param {string} id - POI的ID
     */
    async getPoiDetail(id) {
        try {
            const response = await axios.get('https://restapi.amap.com/v3/place/detail', {
                params: {
                    key: AMAP_KEY,
                    id: id
                }
            });

            if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
                return response.data.pois[0];
            }
            return null;
        } catch (error) {
            console.error('高德地图获取详情失败:', error.message);
            return null;
        }
    }
}

/**
 * 百度地图API服务
 */
class BaiduMapService {
    /**
     * 搜索酒店
     * @param {string} query - 搜索关键字
     * @param {string} region - 城市名称
     * @param {number} pageSize - 每页数量
     */
    async searchHotels(query, region, pageSize = 20) {
        try {
            const response = await axios.get('https://api.map.baidu.com/place/v2/search', {
                params: {
                    query: query,
                    region: region,
                    output: 'json',
                    ak: BAIDU_AK,
                    page_size: pageSize
                }
            });

            if (response.data.status === 0 && response.data.results) {
                return response.data.results;
            }
            return [];
        } catch (error) {
            console.error('百度地图搜索失败:', error.message);
            return [];
        }
    }

    /**
     * 获取POI详情
     * @param {string} uid - POI的UID
     */
    async getPoiDetail(uid) {
        try {
            const response = await axios.get('https://api.map.baidu.com/place/v2/detail', {
                params: {
                    uid: uid,
                    output: 'json',
                    ak: BAIDU_AK,
                    scope: 2 // 返回详细信息
                }
            });

            if (response.data.status === 0 && response.data.result) {
                return response.data.result;
            }
            return null;
        } catch (error) {
            console.error('百度地图获取详情失败:', error.message);
            return null;
        }
    }
}

/**
 * 数据融合服务
 */
class MapDataMergeService {
    constructor() {
        this.amapService = new AmapService();
        this.baiduService = new BaiduMapService();
    }

    /**
     * 名称相似度计算
     */
    nameSimilarity(name1, name2) {
        // 移除常见后缀
        const clean1 = name1.replace(/酒店|宾馆|旅馆|Hotel|Inn|大酒店/gi, '').trim();
        const clean2 = name2.replace(/酒店|宾馆|旅馆|Hotel|Inn|大酒店/gi, '').trim();

        // 检查是否包含
        if (clean1.includes(clean2) || clean2.includes(clean1)) {
            return 0.8;
        }

        // 简单的字符匹配
        let matches = 0;
        const minLen = Math.min(clean1.length, clean2.length);
        for (let i = 0; i < minLen; i++) {
            if (clean1[i] === clean2[i]) matches++;
        }
        return matches / Math.max(clean1.length, clean2.length);
    }

    /**
     * 融合高德和百度数据
     */
    mergeHotelData(amapHotel, baiduDetail) {
        const bizExt = amapHotel.biz_ext || {};
        const detailInfo = baiduDetail?.detail_info || {};

        return {
            // 基础信息（来自高德）
            id: amapHotel.id,
            name: amapHotel.name,
            address: amapHotel.address,
            tel: amapHotel.tel || '',
            location: {
                lng: parseFloat(amapHotel.location.split(',')[0]),
                lat: parseFloat(amapHotel.location.split(',')[1])
            },

            // 图片（来自高德）✅
            images: (amapHotel.photos || []).map(photo => photo.url),

            // 评分（高德主评分 + 百度细分评分）
            rating: parseFloat(bizExt.rating) || null,
            ratingBreakdown: {
                overall: parseFloat(bizExt.rating) || parseFloat(detailInfo.overall_rating) || null,
                service: parseFloat(detailInfo.service_rating) || null,
                facility: parseFloat(detailInfo.facility_rating) || null,
                hygiene: parseFloat(detailInfo.hygiene_rating) || null
            },

            // 评论数
            reviews: parseInt(detailInfo.comment_num) || 0,

            // 商圈（来自高德）✅
            businessArea: amapHotel.business_area || '',

            // 标签（来自高德）
            tags: amapHotel.tag ? (typeof amapHotel.tag === 'string' ? amapHotel.tag.split(';').filter(t => t) : []) : [],
            type: amapHotel.type || '',

            // 网站（来自高德）
            website: amapHotel.website || '',

            // 星级（来自百度）
            level: detailInfo.level || null,

            // 酒店服务（来自百度）✅
            hotelService: detailInfo.hotel_service || null,

            // 内部设施（来自百度）✅
            innerFacility: detailInfo.inner_facility || null,

            // 设施列表（解析为数组）
            amenities: this.parseAmenities(detailInfo),

            // 价格（两者都可能有）
            price: bizExt.cost || bizExt.lowest_price || detailInfo.price || null,

            // 营业时间
            shopHours: detailInfo.shop_hours || '',

            // 数据来源标记
            dataSources: {
                primary: 'amap',
                supplementary: baiduDetail ? 'baidu' : null
            }
        };
    }

    /**
     * 解析设施信息为数组
     */
    parseAmenities(detailInfo) {
        const amenities = [];

        // 从酒店服务中提取
        if (detailInfo.hotel_service) {
            const services = detailInfo.hotel_service.split(/\s+/);
            amenities.push(...services.filter(s => s.length > 0));
        }

        // 从内部设施中提取
        if (detailInfo.inner_facility) {
            const facilities = detailInfo.inner_facility.split(/\s+/);
            amenities.push(...facilities.filter(f => f.length > 0));
        }

        return [...new Set(amenities)]; // 去重
    }

    /**
     * 搜索并融合酒店数据
     * @param {Object} params - 搜索参数
     * @param {string} params.location - 经纬度 "lng,lat"（周边搜索）
     * @param {string} params.city - 城市名称（关键字搜索）
     * @param {string} params.keywords - 关键字（可选）
     * @param {number} params.radius - 搜索半径（米）
     * @param {number} params.limit - 返回数量
     */
    async searchAndMergeHotels(params) {
        const { location, city, keywords = '酒店', radius = 3000, limit = 20 } = params;

        // 1. 从高德获取酒店列表（主数据源）
        let amapHotels = [];
        if (location) {
            amapHotels = await this.amapService.searchNearbyHotels(location, radius, limit);
        } else if (city) {
            amapHotels = await this.amapService.searchHotelsByKeyword(keywords, city, limit);
        } else {
            throw new Error('必须提供location或city参数');
        }

        if (amapHotels.length === 0) {
            return [];
        }

        // 2. 从百度获取酒店列表（辅助数据源）
        const baiduHotels = city ? await this.baiduService.searchHotels(keywords, city, 50) : [];

        // 3. 数据融合
        const mergedHotels = [];
        for (const amapHotel of amapHotels) {
            // 尝试在百度数据中找到匹配的酒店
            let matchedBaidu = null;
            let maxSimilarity = 0;

            for (const baiduHotel of baiduHotels) {
                const similarity = this.nameSimilarity(amapHotel.name, baiduHotel.name);
                if (similarity > maxSimilarity && similarity > 0.6) {
                    maxSimilarity = similarity;
                    matchedBaidu = baiduHotel;
                }
            }

            // 如果找到匹配，获取百度详情
            let baiduDetail = null;
            if (matchedBaidu) {
                console.log(`匹配到百度数据: ${amapHotel.name} <-> ${matchedBaidu.name} (相似度: ${(maxSimilarity * 100).toFixed(0)}%)`);
                baiduDetail = await this.baiduService.getPoiDetail(matchedBaidu.uid);
            }

            // 融合数据
            const mergedData = this.mergeHotelData(amapHotel, baiduDetail);
            mergedHotels.push(mergedData);
        }

        return mergedHotels;
    }

    /**
     * 获取酒店详情（融合数据）
     * @param {string} amapId - 高德地图POI ID
     * @param {string} city - 城市名称（用于百度搜索）
     */
    async getHotelDetail(amapId, city) {
        // 1. 获取高德详情
        const amapDetail = await this.amapService.getPoiDetail(amapId);
        if (!amapDetail) {
            return null;
        }

        // 2. 尝试在百度找到匹配的酒店
        const baiduHotels = await this.baiduService.searchHotels(amapDetail.name, city, 10);
        let baiduDetail = null;

        for (const baiduHotel of baiduHotels) {
            const similarity = this.nameSimilarity(amapDetail.name, baiduHotel.name);
            if (similarity > 0.7) {
                baiduDetail = await this.baiduService.getPoiDetail(baiduHotel.uid);
                break;
            }
        }

        // 3. 融合数据
        return this.mergeHotelData(amapDetail, baiduDetail);
    }
}

// 导出单例
const mapDataMergeService = new MapDataMergeService();

module.exports = {
    AmapService,
    BaiduMapService,
    MapDataMergeService,
    mapDataMergeService
};
