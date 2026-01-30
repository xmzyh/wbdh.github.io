 /**
         * 格式化时间（补零）
         * @param {number} num 数字
         * @returns {string} 补零后的字符串
         */
        function formatTime(num) {
            return num.toString().padStart(2, '0');
        }

        /**
         * 核心：判断当前时段，返回倒计时配置（标题+目标时间）
         * @returns {Object} {label: 倒计时标题, target: 目标时间戳}
         */
        function getCountdownConfig() {
            const now = new Date();
            const hours = now.getHours(); // 当前小时（0-23）
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 今日0点
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1); // 明日0点

            // 定义各时段目标时间
            const target14 = new Date(today); target14.setHours(14, 0, 0, 0); // 今日14点
            const target17 = new Date(today); target17.setHours(17, 0, 0, 0); // 今日17点
            const target20 = new Date(today); target20.setHours(20, 0, 0, 0); // 今日20点
            const targetNext14 = new Date(tomorrow); targetNext14.setHours(14, 0, 0, 0); // 次日14点

            // 按4个时段判断
            if (hours >= 0 && hours < 14) {
                // 00:00-14:00：距离本场开始剩余 → 目标14点
                return { label: '距离14:00场开始剩余', target: target14 };
            } else if (hours >= 14 && hours < 17) {
                // 14:00-17:00：距离本场结束剩余 → 目标17点
                return { label: '距离14:00场结束剩余', target: target17 };
            } else if (hours >= 17 && hours < 20) {
                // 17:00-20:00：距离本场开始剩余 → 目标20点
                return { label: '距离20:00场开始剩余', target: target20 };
            } else {
                // 20:00-24:00：距离本场开始剩余 → 目标24点
                return { label: '距离20:00场结束剩余', target: target14 };
            }
        }

        /**
         * 更新倒计时显示
         */
        function updateCountdown() {
            const { label, target } = getCountdownConfig();
            const now = new Date();
            let diff = target - now; // 时间差（毫秒）

            // 时间差为负则取0（防止出现负数时间）
            if (diff < 0) diff = 0;

            // 转换为 时:分:秒
            const h = Math.floor(diff / (1000 * 60 * 60));
            diff -= h * 1000 * 60 * 60;
            const m = Math.floor(diff / (1000 * 60));
            diff -= m * 1000 * 60;
            const s = Math.floor(diff / 1000);

            // 动态更新标题和时间
            countdownLabel.textContent = label;
            countdownValue.textContent = `${formatTime(h)}:${formatTime(m)}:${formatTime(s)}`;
        }

        /**
         * 初始化倒计时（每秒更新）
         */
        function initCountdown() {
            updateCountdown(); // 立即更新
            setInterval(updateCountdown, 1000); // 每秒刷新
        }
