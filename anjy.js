// 弹窗控制函数
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

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
            tipText = `14:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 情况2：当前时间在14:00-17:00之间
    else if (now >= time14 && now < time17) {
        // 检查14:00场是否更新（更新时间需在00:00-14:00之间）
        if (!(commitDate >= today && commitDate < time14)) {
            disableUntil = time17;
            tipText = `14:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 情况3：当前时间在17:00-20:00之间
    else if (now >= time17 && now < time20) {
        // 检查更新时间是否在今天17:00-20:00之间
        if (!(commitDate >= time17 && commitDate < time20)) {
            disableUntil = time24;
            tipText = `20:00场商品码未更新，获取商品按钮已禁用`;
        }
    }

    return { disableUntil, tipText };
}

// 禁用按钮并设置定时解禁
function disableButtonUntil(targetTime, tipText) {
    const generateBtn = document.getElementById('generateBtn');
    
    // 禁用按钮
    generateBtn.disabled = true;
    // 显示禁用提示弹窗
    document.getElementById('disabledTipMessage').textContent = tipText;
    showModal('disabledTipModal');
    
    // 计算剩余时间，设置定时检查
    const checkInterval = setInterval(() => {
        const now = new Date();
        if (now >= targetTime) {
            // 解禁按钮
            generateBtn.disabled = false;
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
        const formattedTime = `${formatCommitTime(commitTime)}`;
        
        // 显示更新时间弹窗
        document.getElementById('updateTimeMessage').textContent = formattedTime;
        showModal('updateTimeModal');
        
        // 检查是否需要禁用按钮
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        if (disableUntil) {
            disableButtonUntil(disableUntil, tipText);
        }
        
        return formattedTime;
    } catch (error) {
        // 出错时返回默认文字，不影响页面正常使用
        console.error('获取config.js最新更新时间失败：', error);
        const defaultText = '最新更新时间：未知';
        // 显示更新时间弹窗（错误信息）
        document.getElementById('updateTimeMessage').textContent = defaultText;
        showModal('updateTimeModal');
        return defaultText;
    }
}

// 新增：实时检查按钮禁用状态（解决页面已打开但时间到了需要禁用的问题）
function startRealTimeStatusCheck(commitTime) {
    // 每分钟检查一次，避免性能消耗
    setInterval(() => {
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        const generateBtn = document.getElementById('generateBtn');
        
        // 只有按钮未被禁用且需要禁用时，才执行禁用逻辑
        if (disableUntil && !generateBtn.disabled) {
            disableButtonUntil(disableUntil, tipText);
        }
    }, 60 * 1000);
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
    
    // 核心修改：获取最新更新时间并显示弹窗
    const latestUpdateTime = await getLatestConfigUpdateTime();
    
    // 获取原始提交时间用于实时检查
    try {
        const apiUrl = 'https://api.github.com/repos/xmzyh/wbdh.github.io/commits/main?path=config.js';
        const response = await fetch(apiUrl);
        if (response.ok) {
            const commitData = await response.json();
            const commitTime = commitData.commit.committer.date;
            // 启动实时检查
            startRealTimeStatusCheck(commitTime);
        }
    } catch (error) {
        console.error('启动实时检查失败：', error);
    }
    
    // 初始化倒计时和事件（原有逻辑）
    initCountdown();
    initEventListeners();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
