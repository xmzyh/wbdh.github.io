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
    
    // 修复：正确定义24:00（次日00:00）
    const time14 = new Date(today);
    time14.setHours(14, 0, 0, 0); // 14:00
    
    const time17 = new Date(today);
    time17.setHours(17, 0, 0, 0); // 17:00
    
    const time20 = new Date(today);
    time20.setHours(20, 0, 0, 0); // 20:00
    
    // 修复：明确指向次日00:00（当天的24:00）
    const timeNextDay0 = new Date(today);
    timeNextDay0.setDate(timeNextDay0.getDate() + 1);
    timeNextDay0.setHours(0, 0, 0, 0); // 次日00:00（即当天24:00）
    
    let disableUntil = null;
    let tipText = '';

    // 情况1：当前时间在00:00-14:00之间
    if (now >= today && now < time14) {
        if (!(commitDate >= today && commitDate < time14)) {
            disableUntil = time17;
            tipText = `14:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 情况2：当前时间在14:00-17:00之间
    else if (now >= time14 && now < time17) {
        if (!(commitDate >= today && commitDate < time14)) {
            disableUntil = time17;
            tipText = `14:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 情况3：当前时间在17:00-20:00之间
    else if (now >= time17 && now < time20) {
        if (!(commitDate >= time17 && commitDate < time20)) {
            disableUntil = timeNextDay0; // 改用修复后的次日00:00
            tipText = `20:00场商品码未更新，获取商品按钮已禁用`;
        }
    }

    return { disableUntil, tipText };
}

// 禁用按钮并设置定时解禁（修复定时器逻辑）
function disableButtonUntil(targetTime, tipText) {
    const generateBtn = document.getElementById('generateBtn');
    
    // 禁用按钮
    generateBtn.disabled = true;
    generateBtn.dataset.disabledUntil = targetTime.getTime(); // 存储目标时间戳
    // 显示禁用提示弹窗
    document.getElementById('disabledTipMessage').textContent = tipText;
    showModal('disabledTipModal');
    
    // 修复：使用时间戳比较，避免日期对象精度问题
    const targetTimeStamp = targetTime.getTime();
    const checkInterval = setInterval(() => {
        const nowStamp = new Date().getTime();
        if (nowStamp >= targetTimeStamp) {
            // 解禁按钮
            generateBtn.disabled = false;
            delete generateBtn.dataset.disabledUntil;
            // 清除定时器
            clearInterval(checkInterval);
        }
    }, 1000); // 每秒检查一次
    
    // 存储定时器ID，避免重复创建
    generateBtn.dataset.intervalId = checkInterval;
}

// 从GitHub API获取config.js的最新提交时间
async function getLatestConfigUpdateTime() {
    try {
        const apiUrl = 'https://api.github.com/repos/xmzyh/wbdh.github.io/commits/main?path=config.js';
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`请求失败，状态码：${response.status}`);
        }

        const commitData = await response.json();
        const commitTime = commitData.commit.committer.date;
        const formattedTime = `${formatCommitTime(commitTime)}`;
        
        document.getElementById('updateTimeMessage').textContent = formattedTime;
        showModal('updateTimeModal');
        
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        if (disableUntil) {
            disableButtonUntil(disableUntil, tipText);
        }
        
        return { formattedTime, rawCommitTime: commitTime }; // 返回原始时间
    } catch (error) {
        console.error('获取config.js最新更新时间失败：', error);
        const defaultText = '最新更新时间：未知';
        document.getElementById('updateTimeMessage').textContent = defaultText;
        showModal('updateTimeModal');
        return { formattedTime: defaultText, rawCommitTime: null };
    }
}

// 新增：实时检查按钮禁用状态（修复逻辑覆盖问题）
function startRealTimeStatusCheck(commitTime) {
    if (!commitTime) return;
    
    // 每分钟检查一次
    setInterval(() => {
        const generateBtn = document.getElementById('generateBtn');
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        const currentDisabledUntil = generateBtn.dataset.disabledUntil;
        
        // 逻辑1：需要禁用且未禁用 → 执行禁用
        if (disableUntil && !generateBtn.disabled) {
            disableButtonUntil(disableUntil, tipText);
        }
        // 逻辑2：已禁用但时间已到 → 手动解禁
        else if (generateBtn.disabled && currentDisabledUntil) {
            const nowStamp = new Date().getTime();
            if (nowStamp >= Number(currentDisabledUntil)) {
                generateBtn.disabled = false;
                delete generateBtn.dataset.disabledUntil;
                // 清除残留定时器
                if (generateBtn.dataset.intervalId) {
                    clearInterval(generateBtn.dataset.intervalId);
                    delete generateBtn.dataset.intervalId;
                }
            }
        }
    }, 60 * 1000);
}

// 页面初始化（优化重复请求）
async function initPage() {
    // 获取DOM元素
    const generateBtn = document.getElementById('generateBtn');
    const resultArea = document.getElementById('resultArea');
    const copySuccess = document.getElementById('copySuccess');
    const btnText = document.querySelector('.btn-text');
    const countdownLabel = document.getElementById('countdownLabel');
    const countdownValue = document.getElementById('countdownValue');
    
    // 优化：只请求一次API，避免重复请求
    const { formattedTime, rawCommitTime } = await getLatestConfigUpdateTime();
    
    // 启动实时检查
    if (rawCommitTime) {
        startRealTimeStatusCheck(rawCommitTime);
    }
    
    // 初始化倒计时和事件（原有逻辑）
    // initCountdown(); // 保留原有逻辑
    // initEventListeners(); // 保留原有逻辑
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
