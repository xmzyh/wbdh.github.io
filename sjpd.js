// 全局变量
let generateBtn, resultArea, copySuccess, btnText, countdownLabel, countdownValue;
let currentBeijingTime; // 当前北京时间
let lastCommitTime; // config.js 最后提交时间

// ========== 原有核心逻辑（更新日期显示 + 场次判断）==========
/**
 * 初始化日期显示（保留原有逻辑）
 */
function initDateDisplay() {
    // 获取当前北京时间
    currentBeijingTime = getBeijingTime();
    
    // 格式化并显示当前日期（保留你原有的显示格式）
    const dateStr = currentBeijingTime.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long'
    });
    document.getElementById('currentDate').textContent = `当前时间：${dateStr}`;

    // 场次判断（保留你原有的场次逻辑，示例：按小时划分场次）
    judgeCurrentSession();
}

/**
 * 场次判断（保留原有逻辑，可根据你的实际需求调整）
 */
function judgeCurrentSession() {
    const hour = currentBeijingTime.getHours();
    let sessionInfo = '';
    
    // 示例场次规则（你可根据实际业务修改）
    if (hour >= 0 && hour < 12) {
        sessionInfo = '上午场';
        countdownLabel.textContent = '距离上午场结束剩余';
    } else if (hour >= 12 && hour < 18) {
        sessionInfo = '下午场';
        countdownLabel.textContent = '距离下午场结束剩余';
    } else {
        sessionInfo = '晚上场';
        countdownLabel.textContent = '距离今日场次结束剩余';
    }

    // 更新倒计时标签（保留原有场次提示）
    console.log(`当前场次：${sessionInfo}`);
    // 可根据场次设置倒计时（保留原有倒计时逻辑）
    initCountdownBySession();
}

/**
 * 按场次初始化倒计时（保留原有逻辑）
 */
function initCountdownBySession() {
    // 示例：计算到下一场/当日结束的倒计时
    const now = currentBeijingTime;
    let targetTime;

    const hour = now.getHours();
    if (hour < 12) {
        // 上午场：倒计时到12:00
        targetTime = new Date(now);
        targetTime.setHours(12, 0, 0, 0);
    } else if (hour < 18) {
        // 下午场：倒计时到18:00
        targetTime = new Date(now);
        targetTime.setHours(18, 0, 0, 0);
    } else {
        // 晚上场：倒计时到次日00:00
        targetTime = new Date(now);
        targetTime.setDate(targetTime.getDate() + 1);
        targetTime.setHours(0, 0, 0, 0);
    }

    // 更新倒计时显示
    updateCountdown(targetTime);

    // 每秒更新倒计时
    setInterval(() => {
        currentBeijingTime = getBeijingTime();
        updateCountdown(targetTime);
        // 同步更新当前日期显示
        initDateDisplay();
    }, 1000);
}

/**
 * 更新倒计时显示（保留原有逻辑）
 */
function updateCountdown(targetTime) {
    const now = getBeijingTime();
    const diff = targetTime - now;

    if (diff <= 0) {
        countdownValue.textContent = '00:00:00';
        // 倒计时结束后重新判断场次
        judgeCurrentSession();
        return;
    }

    // 计算时分秒
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    // 补零格式化
    countdownValue.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ========== 新增：GitHub 提交时间判断逻辑 ==========
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
 * 根据提交时间和当前时段更新按钮文本（核心逻辑）
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

// ========== 初始化入口（整合原有 + 新增逻辑）==========
/**
 * 初始化倒计时（整合原有逻辑 + 提交时间判断）
 */
function initCountdown() {
    // 1. 执行原有逻辑：初始化日期显示 + 场次判断 + 倒计时
    initDateDisplay();

    // 2. 新增逻辑：请求 GitHub 提交时间并更新按钮文本
    fetchLastCommitTime();
}

/**
 * 初始化事件监听（保留原有逻辑）
 */
function initEventListeners() {
    // 这里保留你原有的事件监听逻辑（如按钮点击、复制等）
    // 如果 an.js 中已有相关逻辑，可留空或复用
}
