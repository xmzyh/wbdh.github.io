// 格式化时间为 年-月-日 时:分:秒 格式
        function formatCommitTime(isoTimeStr) {
            const date = new Date(isoTimeStr);
            // 补零函数，确保数字为两位数
            const padZero = (num) => num.toString().padStart(2, '0');
            
            const year = date.getFullYear();
            const month = padZero(date.getMonth() + 1); // 月份从0开始，需+1
            const day = padZero(date.getDate());
            const hours = padZero(date.getHours());
            const minutes = padZero(date.getMinutes());
            
            return `${year}/${month}/${day} ${hours}:${minutes}`;
        }

        // 判断是否需要禁用按钮的核心函数
        function checkButtonDisableStatus(commitTime) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const commitDate = new Date(commitTime);
            
            // 定义时间节点
            const time14 = new Date(today);
            time14.setHours(14, 0, 0, 0); // 14:00
            
            const time17 = new Date(today);
            time17.setHours(17, 0, 0, 0); // 17:00
            
            const time20 = new Date(today);
            time20.setHours(20, 0, 0, 0); // 20:00
            
            const time24 = new Date(today);
            time24.setHours(24, 0, 0, 0); // 24:00
            
            let disableUntil = null;
            let tipText = '';

            // 情况1：当前时间在00:00-14:00之间
            if (now >= today && now < time14) {
                // 检查更新时间是否在今天00:00-14:00之间
                if (!(commitDate >= today && commitDate < time14)) {
                    disableUntil = time17;
                    tipText = `当前时段(00:00-14:00)商品码未更新，按钮将在17:00自动启用`;
                }
            }
            // 情况2：当前时间在17:00-20:00之间
            else if (now >= time17 && now < time20) {
                // 检查更新时间是否在今天17:00-20:00之间
                if (!(commitDate >= time17 && commitDate < time20)) {
                    disableUntil = time24;
                    tipText = `当前时段(17:00-20:00)商品码未更新，按钮将在24:00自动启用`;
                }
            }

            return { disableUntil, tipText };
        }

        // 禁用按钮并设置定时解禁
        function disableButtonUntil(targetTime, tipText) {
            const generateBtn = document.getElementById('generateBtn');
            const disabledTip = document.getElementById('disabledTip');
            
            // 禁用按钮
            generateBtn.disabled = true;
            // 显示提示信息
            disabledTip.textContent = tipText;
            disabledTip.style.display = 'block';
            
            // 计算剩余时间，设置定时检查
            const checkInterval = setInterval(() => {
                const now = new Date();
                if (now >= targetTime) {
                    // 解禁按钮
                    generateBtn.disabled = false;
                    disabledTip.style.display = 'none';
                    // 清除定时器
                    clearInterval(checkInterval);
                }
            }, 1000); // 每秒检查一次
        }

        // 从GitHub API获取config.js的最新提交时间
        async function getLatestConfigUpdateTime() {
            try {
                // GitHub API地址：获取指定仓库指定文件的最新提交信息
                const apiUrl = 'https://api.github.com/repos/xmzyh/wbdh.github.io/commits/main?path=config.js';
                const response = await fetch(apiUrl);

                // 处理API请求失败的情况
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }

                const commitData = await response.json();
                // 提取提交时间（ISO格式）并格式化
                const commitTime = commitData.commit.committer.date;
                const formattedTime = `商品码更新时间：${formatCommitTime(commitTime)}`;
                
                // 检查是否需要禁用按钮
                const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
                if (disableUntil) {
                    disableButtonUntil(disableUntil, tipText);
                }
                
                return formattedTime;
            } catch (error) {
                // 出错时返回默认文字，不影响页面正常使用
                console.error('获取config.js最新更新时间失败：', error);
                return '最新更新时间：未知';
            }
        }

        // 页面初始化（修改并整合原有逻辑）
        async function initPage() {
            // 获取DOM元素
            generateBtn = document.getElementById('generateBtn');
            resultArea = document.getElementById('resultArea');
            copySuccess = document.getElementById('copySuccess');
            btnText = document.querySelector('.btn-text');
            countdownLabel = document.getElementById('countdownLabel');
            countdownValue = document.getElementById('countdownValue');
            // 新增：获取展示更新时间的DOM元素
            updateTime = document.getElementById('updateTime');
            
            // 核心修改：获取最新更新时间并渲染到标题下方的元素中
            const latestUpdateTime = await getLatestConfigUpdateTime();
            updateTime.textContent = latestUpdateTime;
            
            // 初始化倒计时和事件（原有逻辑）
            initCountdown();
            initEventListeners();
        }

        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', initPage);
