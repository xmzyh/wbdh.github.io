// 全局变量
let generateBtn, resultArea, copySuccess, btnText, countdownLabel, countdownValue;
let currentBeijingTime; // 当前北京时间
let lastCommitTime; // config.js 最后提交时间

/**
 * 获取当前北京时间（解决时区问题）
 * @returns {Date} 北京时间 Date 对象
 */
function getBeijingTime() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const beijingTime = new Date(utcTime + (8 * 3600000));
    return beijingTime;
}

/**
 * 格式化日期为 YYYY-MM-DD（用于日期对比）
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * 检查时间是否在指定时段内
 * @param {Date} date 要检查的时间
 * @param {number} startHour 开始小时（0-23）
 * @param {number} endHour 结束小时（0-23）
 * @returns {boolean} 是否在时段内
 */
function isInTimePeriod(date, startHour, endHour) {
    const hour = date.getHours();
    return hour >= startHour && hour < endHour;
}

/**
 * 请求 GitHub API 获取 config.js 最后提交时间
 */
async function fetchLastCommitTime() {
    try {
        const response = await fetch('https://api.github.com/repos/xmzyh/wbdh.github.io/commits/main?path=config.js', {
            // 添加请求头避免 403 限制
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        const commitData = await response.json();
        // 解析提交时间（ISO 格式转 Date 对象）
        lastCommitTime = new Date(commitData.commit.committer.date);
        // 转换为北京时间（GitHub 返回的是 UTC 时间）
        lastCommitTime = new Date(lastCommitTime.getTime() + (8 * 3600000));
        
        // 获取提交时间后更新按钮文本
        updateButtonText();
    } catch (error) {
        console.error('获取提交时间失败:', error);
        // 请求失败时保持默认文本
        btnText.textContent = '获取本场商品（码未更新）';
    }
}

/**
 * 根据提交时间和当前时段更新按钮文本
 */
function updateButtonText() {
    if (!lastCommitTime) return;

    const today = formatDate(currentBeijingTime);
    const commitDate = formatDate(lastCommitTime);

    // 1. 提交时间非今天 → 显示未更新
    if (commitDate !== today) {
        btnText.textContent = '获取本场商品（码未更新）';
        return;
    }

    const currentHour = currentBeijingTime.getHours();
    const isCommitInAM = isInTimePeriod(lastCommitTime, 0, 17); // 00:00-17:00 提交
    const isCommitInPM = isInTimePeriod(lastCommitTime, 17, 24); // 17:00-24:00 提交

    // 2. 当前时段 00:00-17:00 且有提交 → 显示已更新
    if (currentHour >= 0 && currentHour < 17 && isCommitInAM) {
        btnText.textContent = '获取本场商品（码已更新）';
    }
    // 3. 当前时段 17:00-24:00：仅当该时段有提交才显示已更新，否则未更新
    else if (currentHour >= 17 && currentHour < 24) {
        if (isCommitInPM) {
            btnText.textContent = '获取本场商品（码已更新）';
        } else {
            btnText.textContent = '获取本场商品（码未更新）';
        }
    }
    // 其他情况默认未更新
    else {
        btnText.textContent = '获取本场商品（码未更新）';
    }
}

/**
 * 初始化倒计时（原逻辑保留，仅补充时间相关）
 */
function initCountdown() {
    // 获取当前北京时间
    currentBeijingTime = getBeijingTime();
    // 更新页面显示的当前日期
    document.getElementById('currentDate').textContent = currentBeijingTime.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // 请求 GitHub API 获取提交时间
    fetchLastCommitTime();

    // 可选：每秒更新时间（如果需要实时刷新）
    setInterval(() => {
        currentBeijingTime = getBeijingTime();
        document.getElementById('currentDate').textContent = currentBeijingTime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        // 可选：每秒重新检查提交时间（根据需求决定是否开启）
        // fetchLastCommitTime();
    }, 1000);
}

/**
 * 初始化事件监听（原逻辑保留）
 */
function initEventListeners() {
    // 这里保留你原有的事件监听逻辑（如按钮点击、复制等）
    // 如果 an.js 中已有相关逻辑，可留空或复用
}
