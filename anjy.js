// 弹窗控制函数
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { // 增加空值判断，避免DOM不存在时报错
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { // 增加空值判断，避免DOM不存在时报错
        modal.classList.remove('show');
    }
}

// 格式化时间为 年-月-日 时:分:秒 格式
function formatCommitTime(isoTimeStr) {
    // 增加参数校验
    if (!isoTimeStr) {
        return '时间格式错误';
    }
    
    const date = new Date(isoTimeStr);
    // 校验日期是否有效
    if (isNaN(date.getTime())) {
        return '无效的时间格式';
    }
    
    // 补零函数，确保数字为两位数
    const padZero = (num) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = padZero(date.getMonth() + 1); // 月份从0开始，需+1
    const day = padZero(date.getDate());
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds()); // 补充秒数，格式更完整
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// 判断是否需要禁用按钮的核心函数（修复版）
function checkButtonDisableStatus(commitTime) {
    // 增加参数校验
    if (!commitTime) {
        return { disableUntil: null, tipText: '' };
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const commitDate = new Date(commitTime);
    
    // 定义关键时间节点（优化：统一定义，避免重复）
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
    // 情况2：当前时间在17:00-20:00之间（新增：修复核心问题）
    else if (now >= time17 && now < time20) {
        // 检查更新时间是否在今天17:00-当前时间之间（确保是最新更新）
        if (!(commitDate >= time17 && commitDate <= now)) {
            disableUntil = time20; // 禁用至20:00
            tipText = `17:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 情况3：当前时间在20:00-24:00之间
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
    
    // 增加空值判断
    if (!generateBtn || !targetTime) {
        console.warn('禁用按钮失败：按钮元素或目标时间不存在');
        return;
    }
    
    // 禁用按钮
    generateBtn.disabled = true;
    // 显示禁用提示弹窗
    const tipMessageEl = document.getElementById('disabledTipMessage');
    if (tipMessageEl) {
        tipMessageEl.textContent = tipText;
    }
    showModal('disabledTipModal');
    
    // 计算剩余时间，设置定时检查
    const checkInterval = setInterval(() => {
        const now = new Date();
        if (now >= targetTime) {
            // 解禁按钮
            generateBtn.disabled = false;
            // 清除定时器
            clearInterval(checkInterval);
            // 关闭弹窗
            closeModal('disabledTipModal');
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
        const formattedTime = formatCommitTime(commitTime);
        
        // 显示更新时间弹窗
        const updateTimeMsgEl = document.getElementById('updateTimeMessage');
        if (updateTimeMsgEl) {
            updateTimeMsgEl.textContent = formattedTime;
        }
        showModal('updateTimeModal');
        
        // 检查是否需要禁用按钮
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        if (disableUntil) {
            disableButtonUntil(disableUntil, tipText);
        }
        
        // 返回原始时间和格式化时间，避免重复请求
        return {
            rawTime: commitTime,
            formattedTime: formattedTime
        };
    } catch (error) {
        // 出错时返回默认文字，不影响页面正常使用
        console.error('获取config.js最新更新时间失败：', error);
        const defaultText = '最新更新时间：未知';
        // 显示更新时间弹窗（错误信息）
        const updateTimeMsgEl = document.getElementById('updateTimeMessage');
        if (updateTimeMsgEl) {
            updateTimeMsgEl.textContent = defaultText;
        }
        showModal('updateTimeModal');
        return {
            rawTime: null,
            formattedTime: defaultText
        };
    }
}

// 新增：实时检查按钮禁用状态（解决页面已打开但时间到了需要禁用的问题）
function startRealTimeStatusCheck(commitTime) {
    // 增加参数校验
    if (!commitTime) {
        console.warn('实时检查启动失败：提交时间为空');
        return;
    }
    
    // 每分钟检查一次，避免性能消耗
    setInterval(() => {
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        const generateBtn = document.getElementById('generateBtn');
        
        // 只有按钮未被禁用且需要禁用时，才执行禁用逻辑
        if (disableUntil && generateBtn && !generateBtn.disabled) {
            disableButtonUntil(disableUntil, tipText);
        }
    }, 60 * 1000);
}

// 模拟原有未展示的函数（确保代码完整性）
function initCountdown() {
    // 这里是原有倒计时初始化逻辑，保持不变
    console.log('倒计时初始化完成');
}

function initEventListeners() {
    // 这里是原有事件监听初始化逻辑，保持不变
    console.log('事件监听初始化完成');
}

// 页面初始化（修改并整合原有逻辑）
async function initPage() {
    // 声明全局变量（如果需要）
    window.generateBtn = document.getElementById('generateBtn');
    window.resultArea = document.getElementById('resultArea');
    window.copySuccess = document.getElementById('copySuccess');
    window.btnText = document.querySelector('.btn-text');
    window.countdownLabel = document.getElementById('countdownLabel');
    window.countdownValue = document.getElementById('countdownValue');
    
    // 核心优化：只请求一次API，获取原始时间和格式化时间
    const { rawTime, formattedTime } = await getLatestConfigUpdateTime();
    
    // 启动实时检查（使用已获取的原始时间，避免重复请求）
    if (rawTime) {
        startRealTimeStatusCheck(rawTime);
    }
    
    // 初始化倒计时和事件（原有逻辑）
    initCountdown();
    initEventListeners();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
