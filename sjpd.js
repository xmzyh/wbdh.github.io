/**
 * 格式化时间（补零）
 * @param {number} num 数字
 * @returns {string} 补零后的字符串
 */
function formatTime(num) {
    return num.toString().padStart(2, '0');
}

/**
 * 格式化日期（年-月-日）
 * @param {Date} date 日期对象，不传则默认当前日期
 * @returns {string} 格式化后的日期字符串，如：2026年01月31日
 */
function formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = formatTime(date.getMonth() + 1); // 月份从0开始，需+1
    const day = formatTime(date.getDate());
    return `${year}年${month}月${day}日`;
}

/**
 * 获取GitHub文件的最新提交时间
 * @returns {Promise<Date|null>} 最新提交的日期对象，失败则返回null
 */
async function getLatestCommitDate() {
    const apiUrl = 'https://api.github.com/repos/xmzyh/wbdh.github.io/commits/main?path=an.js';
    try {
        // 发起请求获取最新提交信息（添加缓存控制，避免频繁请求）
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'max-age=300' // 5分钟缓存，减轻GitHub API压力
            }
        });

        if (!response.ok) {
            console.error('获取提交记录失败：', response.status);
            return null;
        }

        const commitData = await response.json();
        // 解析提交时间（GitHub返回的是ISO格式字符串）
        const commitTime = new Date(commitData.commit.committer.date);
        return commitTime;
    } catch (error) {
        console.error('获取提交记录出错：', error);
        return null;
    }
}

/**
 * 判断日期是否为当天（00:00-24:00）
 * @param {Date} date 要判断的日期
 * @returns {boolean} 是否为当天
 */
function isToday(date) {
    const today = new Date();
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
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
    tomorrow.setDate(tomorrow.getDate() + 1); // 明日0点（今日24点）

    // 定义各时段目标时间
    const target14 = new Date(today); target14.setHours(14, 0, 0, 0); // 今日14点
    const target17 = new Date(today); target17.setHours(17, 0, 0, 0); // 今日17点
    const target20 = new Date(today); target20.setHours(20, 0, 0, 0); // 今日20点
    const target24 = tomorrow; // 今日24点（即明日0点），作为20:00场的结束时间

    // 按4个时段判断
    if (hours >= 0 && hours < 14) {
        // 00:00-14:00：距离14点场开始剩余 → 目标14点
        return { label: '距离14:00场开始剩余', target: target14 };
    } else if (hours >= 14 && hours < 17) {
        // 14:00-17:00：距离14点场结束剩余 → 目标17点
        return { label: '距离14:00场结束剩余', target: target17 };
    } else if (hours >= 17 && hours < 20) {
        // 17:00-20:00：距离20点场开始剩余 → 目标20点
        return { label: '距离20:00场开始剩余', target: target20 };
    } else {
        // 20:00-24:00：距离20点场结束剩余 → 目标24点（明日0点）
        return { label: '距离20:00场结束剩余', target: target24 };
    }
}

/**
 * 更新倒计时和日期显示
 * @param {Date|null} latestCommitDate 最新提交日期（可选）
 */
function updateCountdown(latestCommitDate = null) {
    // 1. 确定要显示的日期
    let displayDate;
    if (latestCommitDate && isToday(latestCommitDate)) {
        // 如果当天有更新，显示当天日期
        displayDate = new Date();
    } else if (latestCommitDate) {
        // 如果没有当天更新，显示最后一次提交的日期
        displayDate = latestCommitDate;
    } else {
        // 获取提交记录失败时，默认显示当天日期
        displayDate = new Date();
    }

    // 更新日期显示
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = formatDate(displayDate);
    }

    // 2. 更新倒计时显示
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
    const countdownLabel = document.getElementById('countdownLabel');
    const countdownValue = document.getElementById('countdownValue');
    if (countdownLabel && countdownValue) {
        countdownLabel.textContent = label;
        countdownValue.textContent = `${formatTime(h)}:${formatTime(m)}:${formatTime(s)}`;
    }
}

/**
 * 初始化倒计时（每秒更新）
 */
async function initCountdown() {
    // 第一步：获取最新提交日期
    const latestCommitDate = await getLatestCommitDate();
    
    // 第二步：立即更新一次（带提交日期参数）
    updateCountdown(latestCommitDate);
    
    // 第三步：每秒刷新（复用最新提交日期，避免频繁请求GitHub API）
    setInterval(() => {
        updateCountdown(latestCommitDate);
    }, 1000);

    // 可选：每30分钟重新检测一次提交记录（更新最新日期）
    setInterval(async () => {
        const newLatestCommitDate = await getLatestCommitDate();
        // 仅当提交日期变化时更新（优化性能）
        if (
            (!latestCommitDate && newLatestCommitDate) ||
            (latestCommitDate && newLatestCommitDate && latestCommitDate.getTime() !== newLatestCommitDate.getTime())
        ) {
            latestCommitDate = newLatestCommitDate;
        }
    }, 30 * 60 * 1000); // 30分钟刷新一次提交记录
}
