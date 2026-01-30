function parseGoods() {
            const goodsList = [];
            const productList = innerGoodsData?.data?.floorData?.items?.[0]?.productList || [];
            
            if (productList.length === 0) {
                console.error('未获取到商品列表，检查数据层级！');
                return goodsList;
            }
            
            productList.forEach(item => {
                let businessType = '119501';
                if (item.jumpUrl) {
                    const reg = /businessType=([^&]+)/;
                    const match = item.jumpUrl.match(reg);
                    if (match) businessType = match[1];
                }

                const params = { businessType, activityId: item.activityId, skuId: item.skuId };
                const baseUrl = 'https://m-sep.jd.com/Settlement?showhead=no';
                const query = Object.entries(params)
                    .filter(([k, v]) => v)
                    .map(([k, v]) => `${k}=${v}`)
                    .join('&');
                const targetUrl = query ? `${baseUrl}&${query}` : baseUrl;

                goodsList.push({
                    name: item.rewardName || '未知商品',
                    params,
                    targetUrl
                });
            });
            
            return goodsList;
        }
