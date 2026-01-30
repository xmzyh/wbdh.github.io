function initEventListeners() {
            let isGenerating = false;
            
            generateBtn.addEventListener('click', function() {
                if (isGenerating) return;
                
                isGenerating = true;
                this.classList.add('loading');
                btnText.innerText = '正在生成...';
                
                try {
                    setTimeout(() => {
                        const goodsList = parseGoods();
                        const renderSuccess = renderQrcode(goodsList);
                        
                        btnText.innerText = renderSuccess ? '商品加载成功' : '获取商品失败';
                        generateBtn.classList.remove('loading');
                        isGenerating = false;
                    }, 800);
                } catch (e) {
                    console.error('生成失败：', e);
                    alert(`解析失败：${e.message}`);
                    
                    btnText.innerText = '获取商品失败';
                    generateBtn.classList.remove('loading');
                    isGenerating = false;
                }
            });
        }
