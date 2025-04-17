document.addEventListener("DOMContentLoaded", function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const box = document.getElementById('box');
    const inputField = document.getElementById('keyInput');
    
    // 按钮点击时切换动画淡入淡出效果
    toggleBtn.addEventListener('click', function() {
        box.classList.toggle('hidden');
    });
    
    // 键盘输入交互，输出输入框中按下的键
    inputField.addEventListener('keyup', function(e) {
        console.log('你按下的键:', e.key);
    });
});