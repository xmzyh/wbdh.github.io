// 全局变量声明（放在最顶部，确保所有函数可访问）
let generateBtn, resultArea, copySuccess, btnText, countdownLabel, countdownValue;
let countdownTimer = null; // 倒计时定时器
let countdownSeconds = 0;   // 倒计时剩余秒数

// 弹窗控制函数
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// 格式化时间为 年-月-日 时:分:秒 格式
function formatCommitTime(isoTimeStr) {
    if (!isoTimeStr) {
        return '时间格式错误';
    }
    
    const date = new Date(isoTimeStr);
    if (isNaN(date.getTime())) {
        return '无效的时间格式';
    }
    
    const padZero = (num) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = padZero(date.getMonth() + 1);
    const day = padZero(date.getDate());
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// 判断是否需要禁用按钮的核心函数（修复版）
function checkButtonDisableStatus(commitTime) {
    if (!commitTime) {
        return { disableUntil: null, tipText: '' };
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const commitDate = new Date(commitTime);
    
    // 定义关键时间节点
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
        if (!(commitDate >= today && commitDate < time14)) {
            disableUntil = time17;
            tipText = `14:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 情况2：当前时间在17:00-20:00之间
    else if (now >= time17 && now < time20) {
        if (!(commitDate >= time17 && commitDate <= now)) {
            disableUntil = time20;
            tipText = `17:00场商品码未更新，获取商品按钮已禁用`;
        }
    }
    // 情况3：当前时间在20:00-24:00之间
    else if (now >= time20 && now < time24) {
        if (!(commitDate >= time17 && commitDate < time20)) {
            disableUntil = time24;
            tipText = `20:00场商品码未更新，获取商品按钮已禁用`;
        }
    }

    return { disableUntil, tipText };
}

// 禁用按钮并设置定时解禁
function disableButtonUntil(targetTime, tipText) {
    if (!generateBtn || !targetTime) {
        console.warn('禁用按钮失败：按钮元素或目标时间不存在');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.style.cursor = 'not-allowed'; // 视觉提示禁用状态
    
    const tipMessageEl = document.getElementById('disabledTipMessage');
    if (tipMessageEl) {
        tipMessageEl.textContent = tipText;
    }
    showModal('disabledTipModal');
    
    // 清除原有倒计时（如果有）
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    
    // 计算剩余时间并显示倒计时
    const updateCountdown = () => {
        const now = new Date();
        const remaining = Math.ceil((targetTime - now) / 1000);
        
        if (remaining <= 0) {
            // 解禁按钮
            generateBtn.disabled = false;
            generateBtn.style.cursor = 'pointer';
            closeModal('disabledTipModal');
            
            // 重置倒计时显示
            if (countdownLabel) countdownLabel.textContent = '';
            if (countdownValue) countdownValue.textContent = '';
            
            clearInterval(countdownTimer);
            countdownTimer = null;
        } else {
            // 格式化剩余时间为 时:分:秒
            const hours = Math.floor(remaining / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            const seconds = remaining % 60;
            
            const formatted = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
            if (countdownLabel) countdownLabel.textContent = '解禁倒计时：';
            if (countdownValue) countdownValue.textContent = formatted;
        }
    };
    
    // 立即执行一次，然后每秒更新
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
}

// 补零函数（全局可用）
function padZero(num) {
    return num.toString().padStart(2, '0');
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
        const formattedTime = formatCommitTime(commitTime);
        
        const updateTimeMsgEl = document.getElementById('updateTimeMessage');
        if (updateTimeMsgEl) {
            updateTimeMsgEl.textContent = `最新更新时间：${formattedTime}`;
        }
        showModal('updateTimeModal');
        
        // 先解禁按钮（确保更新后能正常点击）
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.cursor = 'pointer';
        }
        
        // 重新检查禁用状态
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        if (disableUntil) {
            disableButtonUntil(disableUntil, tipText);
        } else {
            // 无禁用状态时清除倒计时
            if (countdownTimer) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                if (countdownLabel) countdownLabel.textContent = '';
                if (countdownValue) countdownValue.textContent = '';
            }
        }
        
        return {
            rawTime: commitTime,
            formattedTime: formattedTime
        };
    } catch (error) {
        console.error('获取config.js最新更新时间失败：', error);
        const defaultText = '最新更新时间：未知';
        const updateTimeMsgEl = document.getElementById('updateTimeMessage');
        if (updateTimeMsgEl) {
            updateTimeMsgEl.textContent = defaultText;
        }
        showModal('updateTimeModal');
        
        // 出错时不禁用按钮，保证基础功能可用
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.cursor = 'pointer';
        }
        
        return {
            rawTime: null,
            formattedTime: defaultText
        };
    }
}

// 实时检查按钮禁用状态
function startRealTimeStatusCheck(commitTime) {
    if (!commitTime) {
        console.warn('实时检查启动失败：提交时间为空');
        return;
    }
    
    // 每分钟检查一次
    setInterval(() => {
        const { disableUntil, tipText } = checkButtonDisableStatus(commitTime);
        
        // 只有按钮未被禁用且需要禁用时，才执行禁用逻辑
        if (disableUntil && generateBtn && !generateBtn.disabled) {
            disableButtonUntil(disableUntil, tipText);
        } 
        // 如果不需要禁用但按钮被禁用了，强制解禁
        else if (!disableUntil && generateBtn && generateBtn.disabled) {
            generateBtn.disabled = false;
            generateBtn.style.cursor = 'pointer';
            closeModal('disabledTipModal');
            
            if (countdownTimer) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                if (countdownLabel) countdownLabel.textContent = '';
                if (countdownValue) countdownValue.textContent = '';
            }
        }
    }, 60 * 1000);
}

// 初始化倒计时（完整实现）
function initCountdown() {
    // 初始状态清空倒计时
    if (countdownLabel) countdownLabel.textContent = '';
    if (countdownValue) countdownValue.textContent = '';
    
    // 清除残留的定时器
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    
    console.log('倒计时初始化完成');
}

// 初始化事件监听器（完整实现）
function initEventListeners() {
    // 按钮点击事件
    if (generateBtn) {
        generateBtn.addEventListener('click', async function() {
            // 防止重复点击
            if (this.disabled) return;
            
            try {
                // 按钮点击后的核心逻辑（示例）
                btnText.textContent = '正在获取...';
                this.disabled = true;
                
                // 模拟获取数据（替换为你的实际逻辑）
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // 重新获取最新更新时间（确保数据最新）
                await getLatestConfigUpdateTime();
                
                // 显示结果（替换为你的实际结果）
                if (resultArea) {
                    resultArea.textContent = '商品码获取成功！' + new Date().toLocaleString();
                    resultArea.style.display = 'block';
                }
                
                // 显示复制成功提示
                if (copySuccess) {
                    copySuccess.style.display = 'block';
                    setTimeout(() => {
                        copySuccess.style.display = 'none';
                    }, 2000);
                }
                
            } catch (error) {
                console.error('按钮点击处理失败：', error);
                if (resultArea) {
                    resultArea.textContent = '获取失败，请稍后重试！';
                    resultArea.style.display = 'block';
                }
            } finally {
                // 恢复按钮状态
                btnText.textContent = '获取商品';
                this.disabled = false;
            }
        });
    }
    
    // 弹窗关闭按钮事件
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    
    console.log('事件监听器初始化完成');
}

// 页面初始化
async function initPage() {
    // 获取DOM元素
    generateBtn = document.getElementById('generateBtn');
    resultArea = document.getElementById('resultArea');
    copySuccess = document.getElementById('copySuccess');
    btnText = document.querySelector('.btn-text');
    countdownLabel = document.getElementById('countdownLabel');
    countdownValue = document.getElementById('countdownValue');
    
    // 初始化倒计时和事件
    initCountdown();
    initEventListeners();
    
    // 获取最新更新时间
    const { rawTime } = await getLatestConfigUpdateTime();
    
    // 启动实时检查
    if (rawTime) {
        startRealTimeStatusCheck(rawTime);
    }
    
    console.log('页面初始化完成');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);

// 窗口关闭时清除定时器（防止内存泄漏）
window.addEventListener('beforeunload', function() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
});
