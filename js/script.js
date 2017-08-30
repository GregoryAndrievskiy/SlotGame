const iconsColor = [
    ['red', 'blue', 'yellow', 'black', 'tan', 'green', 'orange', 'blue', 'teal', 'gold'],
    ['white', 'tan', 'white', 'black', 'yellow', 'green', 'green', 'tan', 'blue', 'blue'],
    ['gold', 'blue', 'black', 'orange', 'yellow', 'black', 'orange', 'tan', 'teal', 'tan'],
    ['red', 'green', 'white', 'black', 'yellow', 'green', 'orange', 'gold', 'white', 'gold'],
    ['yellow', 'teal', 'white', 'gold', 'yellow', 'green', 'green', 'black', 'teal', 'tan']
];

const cylinderSpeed = [1,2,3,4,5];

const frameWidth = 50;
const frameHeight = 50;
const cylinderNumbers = 10;
const numberOfCylinders = 5;
const visibleRows = 3;
const timeOfGame = 5000;

const canvasAll = document.querySelectorAll('.slotScreen');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const linesButton = document.getElementById('lines');

//тени на полях барабанов
canvasAll.forEach(function (item) {
    const canvasItem = item.getContext('2d');
    canvasItem.beginPath();
    canvasItem.strokeStyle = 'black';
    canvasItem.lineWidth = 5;
    canvasItem.shadowBlur = 15;
    canvasItem.shadowColor = 'black';
    canvasItem.shadowOffsetX = 0;
    canvasItem.shadowOffsetY = 0;
    canvasItem.stroke();
});

//функция для острисовки следующей очереди из 4ех символов одного барабана
function preRenderCylinder(ctx, colorBank, position) {
    for (let i = 0; i < visibleRows + 2; i++) {
        let currentIndex = position - i;
        if (currentIndex < 0) currentIndex = cylinderNumbers + currentIndex;
        if (currentIndex > 9) currentIndex = currentIndex - cylinderNumbers;
        let currentIconColorIndex = (currentIndex);
        if (currentIconColorIndex > cylinderNumbers - 1) currentIconColorIndex -= (cylinderNumbers - 1);
        ctx.fillStyle = colorBank[currentIndex];
        ctx.fillRect(0, (i * frameHeight), frameHeight , frameWidth);
    }
}

// функция рассчитывающаяя время для синхронизации моментов окончания анимации сдвига барабана вниз и отрисовкой селдущей очереди символов
function calcSpeed(arg) {
    return {
    delta: arg,
    updateTime: 5 / arg,
    generateTime: 250 / arg
    };
}

class Cylinder {    //генератор барабанов
    constructor(amountOfCylinders) {
        this.number = amountOfCylinders;
        this.position = 0;
        this.cylinder = iconsColor[this.number];
        this.canvas = canvasAll[this.number];
        this.ctx = this.canvas.getContext('2d');
        this.speed = calcSpeed(cylinderSpeed[this.number]);
        this.state = 'ready';
        this.stopDelay = null;
    }
    generate() {    //отображение следующей очереди из 4ех симвлов на барабане
        preRenderCylinder(this.ctx, this.cylinder, this.position);
        this.canvas.style.top = '-100px';
    }
    animation() {  //анимация фращения барабана
        const speed = this.speed;
        let state = this.state;
        const cylinder = this;
        const start = Date.now();
        let top = -100;
        const timer = setInterval(function() {
            const timePassed = Date.now() - start;
            top += speed.delta;
            cylinder.canvas.style.top = top + 'px';
            if (timePassed >= speed.generateTime) {
                clearInterval(timer);
                switch (state) {    //проверка состояния барабана
                    case 'ready':    //начало или продолжение анимации вращения
                        cylinder.position++;
                        if (cylinder.position === 10) cylinder.position = 0;
                        cylinder.generate();
                        cylinder.animation();
                        break;
                    case 'stop':    //остановка анимации вращения
                        clearTimeout(cylinder.stopDelay);
                        if (cylinder.number === 0) break;
                        setTimeout(function () {
                            const postRoll = setInterval(function() {
                                top += 1;
                                cylinder.canvas.style.top = top - 11 - speed.delta + 'px';
                                if (top = 50) {
                                    clearInterval(postRoll);
                                }
                            }, 50);
                        }, speed.generateTime);
                        break;
                }
            }
        }, speed.updateTime);
    }
    stopAnimation() {   //изменения состояния барабана
        this.state = 'stop';
    }
}

class Game {    //генератор игр
    constructor() {
        this.gameTimer = null;
        this.state = 'ready';
        this.gameBank = [];
        for (let i = 0; i < numberOfCylinders; i++) {
            this.gameBank.push(new Cylinder(i));
            this.gameBank[i].generate();
        }
        this._onStart();
        this._lineControl();
    }
    _init() {   //запуск вращения всех барабанов и инициализация таймера автоматической остановки игры через 5 секунд
        const game = this;
        this.state = 'ready';
        startButton.classList.remove('blink');
        linesButton.classList.remove('blink');
        stopButton.classList.add('blink');
        stopButton.disabled = false;
        startButton.disabled = true;
        linesButton.disabled = true;
        startButton.onclick = null;
        game.gameBank.forEach(function (cylinder) {
            cylinder.state = 'ready';
            cylinder.animation();
        });
        this.gameTimer = setTimeout(    //таймер автоматической остановки
            function () {
                game._stop();
                }, timeOfGame);
    }
    _stop() {   //поочередная остановка вращения барабнов
        const game = this;
        clearTimeout(this.gameTimer);
        stopButton.disabled = true;
        stopButton.classList.remove('blink');
        game.gameBank.forEach(function (cylinder, index) {      //поочередная остановка каждого барабана с задержкой 500мс
            cylinder.stopDelay = setTimeout(function () {cylinder.stopAnimation();}, 500 + index * 500);
        });
        setTimeout(function () {    //разблокировка необходимых кнопок, после окончания вращения всех барабанов
            startButton.disabled = false;
            startButton.classList.add('blink');
            stopButton.onclick = null;
            linesButton.disabled = false;
            linesButton.classList.add('blink');
            game._onStart();
        }, 2550);
    }
    _onStart() {    //обработчик нажания на кнопку start
        const game = this;
        startButton.onclick = function() {
            game._init();
            game._onStop();
            game._displayLine(0);
        };
    }
    _onStop() {     //обработчик нажания на кнопку stop
        const game = this;
        stopButton.onclick = function() {
            game._stop();
            game.state = 'finished';
        };
    }
    _lineControl() {    //обработчик переключения выигрышных линий
        const game = this;
        let lineTypeNumber = 0;
        linesButton.onclick = function () {
            lineTypeNumber++;
            clear();
            if (lineTypeNumber === 10) lineTypeNumber = 0;
            game._displayLine(lineTypeNumber);
        }
    }
    _displayLine(type) {    //отрисовка выигрышных линий
        const canvas = document.querySelector('.lineScreen');
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 4;
        switch (type) {     //переключатель выигрышных линий
            case 0:
                break;
            case 1:
                drawFiveLine(0);
                break;
            case 2:
                drawFiveLine(1);
                break;
            case 3:
                drawFiveLine(2);
                break;
            case 4:
                drawThreeLine(0);
                break;
            case 5:
                drawThreeLine(1);
                break;
            case 6:
                drawThreeLine(2);
                break;
            case 7:
                drawBackThreeLine(0);
                break;
            case 8:
                drawBackThreeLine(1);
                break;
            case 9:
                drawBackThreeLine(2);
                break;
        }
    }
}

const canvas = document.querySelector('.lineScreen');
const ctx = canvas.getContext('2d');
ctx.strokeStyle = 'purple';
ctx.lineWidth = 4;

function clear() {
    ctx.clearRect(0,0,270,150);
}

function drawFiveLine(line) {  //горизонтальная выигрышная линия
    ctx.beginPath();
    ctx.moveTo(2, line * 50 + 2);
    ctx.lineTo(268, line * 50 + 2);
    ctx.lineTo(268, line * 50 + 48);
    ctx.lineTo(2, line * 50 + 48);
    ctx.closePath();
    ctx.stroke();
}
function drawThreeLine(line) {     //диагональная выигрышная линия
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(8 + 50 * line, 2);
    ctx.lineTo(54 + 50 * line, 2);
    ctx.lineTo(164 + 50 * line, 100);
    ctx.lineTo(164 + 50 * line, 148);
    ctx.lineTo(118 + 50 * line, 148);
    ctx.lineTo(8 + 50 * line, 48);
    ctx.closePath();
    ctx.stroke();
}
function drawBackThreeLine(line) {     //обратная диагональная выигрышная линия
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(8 + 50 * line, 148);
    ctx.lineTo(54 + 50 * line, 148);
    ctx.lineTo(164 + 50 * line, 48);
    ctx.lineTo(164 + 50 * line, 2);
    ctx.lineTo(118 + 50 * line, 2);
    ctx.lineTo(8 + 50 * line, 100);
    ctx.closePath();
    ctx.stroke();
}

//запуск игры
new Game();
