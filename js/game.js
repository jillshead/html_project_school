const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const keyState = {};
document.addEventListener("keydown", e => {
    keyState[e.code] = true;
});
document.addEventListener("keyup", e => {
    keyState[e.code] = false;
});

class Stickman {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = 20;        // 头部半径
        this.speed = 3;
        this.controls = controls; // 对应控制按键：上下左右和攻击
        this.isAttacking = false;
        this.attackDuration = 0;
        this.health = 100;       // 初始生命值
        this.hitRegistered = false;  // 防止一次攻击多次伤害
        this.direction = "right"; // 默认面向右
        this.walkingFrame = 0;  // 新增属性，用于步行动画
    }

    update() {
        let moving = false;
        if (keyState[this.controls.left]) {
            this.x -= this.speed;
            this.direction = "left";
            moving = true;
        }
        if (keyState[this.controls.right]) {
            this.x += this.speed;
            this.direction = "right";
            moving = true;
        }
        if (keyState[this.controls.up]) {
            this.y -= this.speed;
            moving = true;
        }
        if (keyState[this.controls.down]) {
            this.y += this.speed;
            moving = true;
        }
        
        // 如果有移动，则更新步行动画帧，否则重置
        if (moving) {
            this.walkingFrame += 0.2;
        } else {
            this.walkingFrame = 0;
        }

        // 检测攻击按键：按下后进入攻击状态
        if (keyState[this.controls.attack] && !this.isAttacking) {
            this.isAttacking = true;
            this.attackDuration = 15; // 攻击状态维持的帧数
        }
        if (this.attackDuration > 0) {
            this.attackDuration--;
            if (this.attackDuration === 0) {
                this.isAttacking = false;
                this.hitRegistered = false;
            }
        }
        
        // 限制在 canvas 范围内
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size * 3, this.y));
    }

    draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        // 绘制头部
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();

        // 绘制身体
        ctx.beginPath();
        const bodyStart = { x: this.x, y: this.y + this.size };
        const bodyEnd = { x: this.x, y: this.y + this.size * 2 };
        ctx.moveTo(bodyStart.x, bodyStart.y);
        ctx.lineTo(bodyEnd.x, bodyEnd.y);
        ctx.stroke();

        // 绘制肩部（身体起点）
        const shoulder = { x: this.x, y: this.y + this.size };

        // 根据步行动画计算手臂的摆动角度
        const armSwingAngleLeft = Math.sin(this.walkingFrame) * 0.5;   // 弧度值
        const armSwingAngleRight = Math.sin(this.walkingFrame + Math.PI) * 0.5;

        // 计算手臂终点（手的位置），长度为 this.size * 1.5
        const leftHand = {
            x: shoulder.x - this.size * 1.5 * Math.cos(armSwingAngleLeft),
            y: shoulder.y + this.size * 1.5 * Math.sin(armSwingAngleLeft)
        };
        const rightHand = {
            x: shoulder.x + this.size * 1.5 * Math.cos(armSwingAngleRight),
            y: shoulder.y + this.size * 1.5 * Math.sin(armSwingAngleRight)
        };

        // 绘制手臂（左右分别独立绘制）
        ctx.beginPath();
        ctx.moveTo(shoulder.x, shoulder.y);
        ctx.lineTo(leftHand.x, leftHand.y);
        ctx.moveTo(shoulder.x, shoulder.y);
        ctx.lineTo(rightHand.x, rightHand.y);
        ctx.stroke();

        // 绘制手臂关节（肩部及手腕，用小圆点表示）
        ctx.fillStyle = this.color;
        // 肩部
        ctx.beginPath();
        ctx.arc(shoulder.x, shoulder.y, 3, 0, Math.PI * 2);
        ctx.fill();
        // 左手腕
        ctx.beginPath();
        ctx.arc(leftHand.x, leftHand.y, 3, 0, Math.PI * 2);
        ctx.fill();
        // 右手腕
        ctx.beginPath();
        ctx.arc(rightHand.x, rightHand.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // 定义腿部运动参数
        const swingAmplitude = 0.5;  // 增加后的摆动幅度（弧度）
        const separation = 30 * Math.PI / 180; // 左右腿初始分离角度为30度（转换为弧度）
        const legLength = this.size * 2;  // 整条腿的长度
        const thighLength = legLength * 0.6;  // 大腿长度
        const shinLength = legLength * 0.4;   // 小腿长度

        // 髋部位置（采用身体下端作为腰部）
        const hip = { x: this.x, y: bodyEnd.y };

        // 计算左右腿的当前角度，基底角为垂直向下（Math.PI/2），
        // 左腿初始角为垂直向下+ separation/2, 右腿为垂直向下- separation/2，
        // 并分别加上摆动偏移（左右运动方向相反）
        const leftLegAngle = Math.PI / 2 + separation / 2 + swingAmplitude * Math.sin(this.walkingFrame);
        const rightLegAngle = Math.PI / 2 - separation / 2 - swingAmplitude * Math.sin(this.walkingFrame);

        // 计算左腿：大腿末端（膝盖）位置
        const leftKnee = {
            x: hip.x + thighLength * Math.cos(leftLegAngle),
            y: hip.y + thighLength * Math.sin(leftLegAngle)
        };
        // 左腿脚部位置（小腿末端）
        const leftFoot = {
            x: leftKnee.x + shinLength * Math.cos(leftLegAngle),
            y: leftKnee.y + shinLength * Math.sin(leftLegAngle)
        };

        // 计算右腿：大腿末端（膝盖）位置
        const rightKnee = {
            x: hip.x + thighLength * Math.cos(rightLegAngle),
            y: hip.y + thighLength * Math.sin(rightLegAngle)
        };
        // 右腿脚部位置（小腿末端）
        const rightFoot = {
            x: rightKnee.x + shinLength * Math.cos(rightLegAngle),
            y: rightKnee.y + shinLength * Math.sin(rightLegAngle)
        };

        // 绘制左腿（从髋部 → 膝盖 → 脚）
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y);
        ctx.lineTo(leftKnee.x, leftKnee.y);
        ctx.lineTo(leftFoot.x, leftFoot.y);
        ctx.stroke();

        // 绘制右腿（从髋部 → 膝盖 → 脚）
        ctx.beginPath();
        ctx.moveTo(hip.x, hip.y);
        ctx.lineTo(rightKnee.x, rightKnee.y);
        ctx.lineTo(rightFoot.x, rightFoot.y);
        ctx.stroke();

        // 绘制腿部关节（膝盖，用小圆点表示）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(leftKnee.x, leftKnee.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightKnee.x, rightKnee.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
// 根据火柴人的方向调整攻击检测位置
function checkCollision(attacker, defender) {
    if (!attacker.isAttacking || attacker.hitRegistered) return;
    
    // 计算攻击点：根据攻击者方向确定攻击端点
    const attackX = attacker.direction === "right"
        ? attacker.x + attacker.size * 1.5
        : attacker.x - attacker.size * 1.5;
    const attackY = attacker.y + attacker.size * 1.2;
    
    // 定义防御者的整体区域（头部+身体+双腿）
    const defenderLeft = defender.x - defender.size;
    const defenderRight = defender.x + defender.size;
    const defenderTop = defender.y - defender.size;          // 头部顶部
    const defenderBottom = defender.y + defender.size * 3;     // 双腿底部
    
    // 当攻击点落入防御者区域内时视为命中
    if (attackX >= defenderLeft && attackX <= defenderRight &&
        attackY >= defenderTop && attackY <= defenderBottom) {
        defender.health = Math.max(0, defender.health - 10);  // 每次命中扣 10 血
        attacker.hitRegistered = true;
    }
}

// 新增函数：检测两个火柴人的碰撞并进行分离
function resolveCollision(a, b) {
    // 计算A的边界
    const aLeft = a.x - a.size;
    const aRight = a.x + a.size;
    const aTop = a.y - a.size;
    const aBottom = a.y + a.size * 3;
    // 计算B的边界
    const bLeft = b.x - b.size;
    const bRight = b.x + b.size;
    const bTop = b.y - b.size;
    const bBottom = b.y + b.size * 3;
    
    // 判断是否存在重叠区域
    const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
    const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);
    
    if (overlapX > 0 && overlapY > 0) {
        // 根据较小的重叠量选择沿水平或垂直方向分离
        if (overlapX < overlapY) {
            const separation = overlapX / 2;
            if (a.x < b.x) {
                a.x -= separation;
                b.x += separation;
            } else {
                a.x += separation;
                b.x -= separation;
            }
        } else {
            const separation = overlapY / 2;
            if (a.y < b.y) {
                a.y -= separation;
                b.y += separation;
            } else {
                a.y += separation;
                b.y -= separation;
            }
        }
    }
}

// 全局 HUD 绘制函数，显示血量百分比在屏幕上方
function drawHUD() {
    const barWidth = canvas.width * 0.3, barHeight = 20;
    // 蓝色火柴人的血条（左侧）
    const blueBarX = canvas.width * 0.1, blueBarY = 20;
    ctx.fillStyle = "gray";
    ctx.fillRect(blueBarX, blueBarY, barWidth, barHeight);
    ctx.fillStyle = "blue";
    ctx.fillRect(blueBarX, blueBarY, (stickman1.health / 100) * barWidth, barHeight);
    ctx.strokeStyle = "black";
    ctx.strokeRect(blueBarX, blueBarY, barWidth, barHeight);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`${stickman1.health}%`, blueBarX + barWidth / 2 - 15, blueBarY + 16);

    // 红色火柴人的血条（右侧）
    const redBarX = canvas.width * 0.6, redBarY = 20;
    ctx.fillStyle = "gray";
    ctx.fillRect(redBarX, redBarY, barWidth, barHeight);
    ctx.fillStyle = "red";
    ctx.fillRect(redBarX, redBarY, (stickman2.health / 100) * barWidth, barHeight);
    ctx.strokeStyle = "black";
    ctx.strokeRect(redBarX, redBarY, barWidth, barHeight);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`${stickman2.health}%`, redBarX + barWidth / 2 - 15, redBarY + 16);
}

// 定义两个火柴人对象
// stickman1 使用 W A S D 移动，F 键攻击
const stickman1 = new Stickman(150, 300, "blue", {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    attack: "KeyF"
});

// stickman2 使用方向键移动，回车键攻击
const stickman2 = new Stickman(650, 300, "red", {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    attack: "Enter"
});

function update() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stickman1.update();
    stickman2.update();
    
    // 检测攻击碰撞
    checkCollision(stickman1, stickman2);
    checkCollision(stickman2, stickman1);
    
    // 在绘制之前解决两个角色的重合问题
    resolveCollision(stickman1, stickman2);
    
    stickman1.draw();
    stickman2.draw();
    
    // 绘制全局血条 HUD
    drawHUD();
    
    requestAnimationFrame(update);
}

update();