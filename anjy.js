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

// 修复：判断是否需要禁用按钮的核心函数
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
    time24.setHours(24, 0, 0, 0); // 24:00（即次日00:00）
    
    let disableUntil = null;
    let tipText = '';

    // 情况1：当前时间在00:00-17:00之间
    if (now >= today && now < time17) {
        // 检查更新时间是否在今天00:00-14:00之间
        if (!(commitDate >= today && commitDate < time14)) {
            disableUntil = time17; // 禁用至17:00
            tipText = `14:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 修复：新增17:00-20:00的判断逻辑
    else if (now >= time17 && now < time20) {
        // 检查更新时间是否在今天17:00-20:00之间
        if (!(commitDate >= time17 && commitDate < time20)) {
            disableUntil = time20; // 禁用至20:00
            tipText = `17:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 情况2：当前时间在20:00-24:00之间
    else if (now >= time20 && now < time24) {
        // 检查更新时间是否在今天17:00-20:00之间
        if (!(commitDate >= time17 && commitDate < time20)) {
            disableUntil = time24; // 禁用至24:00
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

// 从GitHub API获取config.js的最新提交时间（返回原始时间和格式化时间）
async function getLatestConfigUpdateTime() {
    try {
        const apiUrl = 'https://api.github.com/repos/xmzyh/wbdh.github.io/commits/main?path=config.js';
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`请求失败，状态码：${response.status}`);
        }

        const commitData = await response.json();
        // 提取原始提交时间（ISO格式）和格式化时间
        const commitTime = commitData.commit.committer.date;
        const formattedTime = formatCommitTime(commitTime);
        
        // 显示更新时间弹窗
        document.getElementById('updateTimeMessage').textContent = formattedTime;
        showModal('updateTimeModal');
        
        // 检查是否需要禁用按钮
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        if (disableUntil) {
            disableButtonUntil(disableUntil, tipText);
        }
        
        // 返回原始时间和格式化时间，避免重复请求
        return { rawTime: commitTime, formattedTime };
    } catch (error) {
        console.error('获取config.js最新更新时间失败：', error);
        const defaultText = '最新更新时间：未知';
        document.getElementById('updateTimeMessage').textContent = defaultText;
        showModal('updateTimeModal');
        return { rawTime: null, formattedTime: defaultText };
    }
}

// 实时检查按钮禁用状态
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

// 页面初始化（修复重复请求问题）
async function initPage() {
    // 获取DOM元素
    const generateBtn = document.getElementById('generateBtn');
    const resultArea = document.getElementById('resultArea');
    const copySuccess = document.getElementById('copySuccess');
    const btnText = document.querySelector('.btn-text');
    const countdownLabel = document.getElementById('countdownLabel');
    const countdownValue = document.getElementById('countdownValue');
    
    // 只请求一次API，获取原始时间和格式化时间
    const { rawTime, formattedTime } = await getLatestConfigUpdateTime();
    
    // 如果获取到原始时间，启动实时检查
    if (rawTime) {
        startRealTimeStatusCheck(rawTime);
    }
    
    // 初始化倒计时和事件（原有逻辑）
    // initCountdown(); // 假设你有这个函数
    // initEventListeners(); // 假设你有这个函数
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
