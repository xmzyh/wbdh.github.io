function copyLink(url) {
            navigator.clipboard.writeText(url)
                .then(showCopyTip)
                .catch(() => {
                    const input = document.createElement('input');
                    input.value = url;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                    showCopyTip();
                });
        }

        function showCopyTip() {
            copySuccess.classList.add('show');
            setTimeout(() => copySuccess.classList.remove('show'), 1500);
        }

        function renderQrcode(goodsList) {
            resultArea.innerHTML = '';
            
            if (goodsList.length === 0) {
                resultArea.innerHTML = '<div class="empty-tip">未提取到有效商品信息，请检查内置数据！</div>';
                return false;
            }
            
            goodsList.forEach((goods, index) => {
                const goodsItem = document.createElement('div');
                goodsItem.className = 'goods-item';
                goodsItem.setAttribute('data-index', index);
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'goods-name loading';
                nameDiv.innerText = `${index + 1}、${goods.name}`;
                goodsItem.appendChild(nameDiv);
                
                const qrBox = document.createElement('div');
                qrBox.className = 'qrcode-box';
                qrBox.id = `qrcode_${index}`;
                
                const qrLoading = document.createElement('div');
                qrLoading.className = 'qrcode-loading';
                const loadingIcon = document.createElement('div');
                loadingIcon.className = 'qrcode-loading-icon';
                qrLoading.appendChild(loadingIcon);
                qrBox.appendChild(qrLoading);
                
                goodsItem.appendChild(qrBox);
                resultArea.appendChild(goodsItem);
                
                setTimeout(() => {
                    const nameEl = goodsItem.querySelector('.goods-name');
                    nameEl.classList.remove('loading');
                    qrBox.querySelector('.qrcode-loading').remove();
                    
                    qrBox.onclick = () => copyLink(goods.targetUrl);
                    
                    new QRCode(document.getElementById(`qrcode_${index}`), {
                        text: goods.targetUrl,
                        width: 160,
                        height: 160,
                        colorDark: '#050b18',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.M
                    });
                    
                    const lackParams = [];
                    if (!goods.params.activityId) lackParams.push('activityId');
                    if (!goods.params.skuId) lackParams.push('skuId');
                    if (lackParams.length > 0) {
                        const tipDiv = document.createElement('div');
                        tipDiv.className = 'param-tip';
                        tipDiv.innerText = `缺失参数：${lackParams.join('、')}（二维码可能无效）`;
                        goodsItem.insertBefore(tipDiv, qrBox);
                    }
                }, 300 * (index + 1));
            });
            
            return true;
        }
