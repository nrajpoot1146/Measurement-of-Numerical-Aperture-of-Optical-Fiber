var preCon = null;
//update the x and y coordinate
var update = function (x, y) {
    var tempX = document.getElementById("mouseX");
    var tempY = document.getElementById("mouseY");
    if (tempX && tempY) {
        tempX.innerHTML = x;
        tempY.innerHTML = y;
    }
};

var Terminal = function () {
    this.obj = document.getElementById("terminal");
    this.obj.innerHTML = ">>";
    this.update = function (str) {
        this.value = this.obj.innerHTML;
        this.value += str + "<br>>>";
        this.obj.innerHTML = this.value;
        this.obj.scrollTo(0, this.obj.scrollHeight);
    }
    this.reset = function () {
        this.obj.innerHTML = "";
    }
}

var getMousePos = function (canvas, e) {
    var boundingClientRect = canvas.getBoundingClientRect();
    var tx = e.clientX - boundingClientRect.left;
    var ty = e.clientY - boundingClientRect.top;
    return {
        x: tx < 0 ? 0 : tx,
        y: ty < 0 ? 0 : ty
    };
};

var operationType = {
    DRAW_POINT: 0X00,
    DRAW_TWO_WAY_KEY: 0X01,
    DRAW_RESISTOR: 0X02,
    DRAW_CELL: 0X03,
    DRAW_GALVANOMETER: 0X04,
    DRAW_POTENTIOMETER: 0X05,
    DRAW_CONDENSER: 0X06,
    DRAW_TAPKEY: 0x07,

    MAKE_CONNECTION: 0X13,
    START_SIMULATION: 0X14,
    STOP_SIMULATION: 0X15,

    START_CHARGING: 0X31,
    STOP_CHARGING: 0x41,
    START_DISCHARGING: 0X32,
    STOP_DISCHARGING: 0x42,
    READ_DEFLACTION: 0X33,

    DISCHARGE: 0X50,

    RESET: 0X21,
    UNDO: 0X22,
    REDO: 0X23
};

class Element {
    constructor(canvas, x, y, width, height, isCenter = false) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.borderColor = "red";
        this.shadowColor = "royalblue";
        this.isBorder = false;
        if (this instanceof Circle) {
            this.width = width * 2;
            this.height = height * 2;
            this.x = x - this.width / 2;
            this.y = y - this.height / 2;
        }
        else {
            this.width = width;
            this.height = height;
            if (isCenter) {
                this.x = x - this.width;
                this.y = y - this.height;
            }
            else {
                this.x = x;
                this.y = y;
            }

        }

    }
    draw() {
        if(this.isBorder){
            this.drawBorder()
        }
        this.context.strokeStyle = "black";
    }
    drawBorder() {
        this.context.beginPath();
        this.context.rect(this.x, this.y, this.width, this.height);
        this.context.strokeStyle = "black";
        this.context.lineWidth = 1;
        this.context.stroke();
        this.context.closePath();
        this.context.strokeStyle = "black";
    }
    drawHover() {
        this.context.beginPath();
        this.context.rect(this.x-1, this.y-1, this.width+2, this.height+2);
        this.context.strokeStyle = this.borderColor;
        this.context.lineWidth = 1;
        this.context.stroke();
        this.context.closePath();
        this.draw();
        this.context.strokeStyle = "black";
    }
    hoverIn() {
        this.borderColor = "royalblue";
        this.clear();
        this.context.shadowColor = this.shadowColor;
        this.context.shadowBlur = 2;
        this.draw();
        this.context.shadowBlur = 0;
    }
    hoverOut() {
        this.borderColor = "red";
        this.clear();
        this.context.shadowColor = this.shadowColor;
        this.context.shadowBlur = 0;
        this.draw();
    }
    clear() {
        this.context.clearRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);
    }
    isInside(x, y) {
        if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height) {
            this.hoverIn();
            return true;
        }
        this.hoverOut();
        return false;
    }
}

class Circle extends Element {
    constructor(canvas, x, y, r) {
        super(canvas, x, y, r, r, true);
        this.cx = x;
        this.cy = y;
        this.r = r;
    }
    draw() {
        super.draw();
        this.context.beginPath();
        this.context.lineWidth = "1";
        this.context.arc(this.cx, this.cy, this.r, 0, 360);
        this.context.stroke();
        this.context.closePath();
    }
}

class Simulator {
    constructor() {
        this.canvas = document.getElementById("myCanvas");
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.context = this.canvas.getContext('2d');
        this.element = [];
        this.redoArray = [];
        this.addEvent();
    }
    draw() {
        this.clear();
        for (let ele in this.element) {
            this.element[ele].draw();
        }
    }
    undo() {
        this.redoArray.push(this.element.pop());
    }
    redo() {
        this.element.push(this.redoArray.pop());
    }
    add(element) {
        this.element.push(element);
        this.redoArray = [];
    }
    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }
    hover(e = null) {
        var mosPos = getMousePos(this.canvas, e);
        for (let i in this.element) {
            if (this.element[i].isInside(mosPos.x, mosPos.y)) {
                this.currentElement = this.element[i];
            }
        }
    }
    addEvent() {
        var temp = this;
        this.canvas.addEventListener("mousemove", function (e) {
            temp.hover(e);
        }, false);
    }
}

window.onload = function () {
    this.simulator = new Simulator();
    simulator.add(new Circle(simulator.canvas, 100, 100, 50));
    this.temp = new Element(simulator.canvas, 150, 150, 50, 50);
    temp.isBorder = true;
    simulator.add(temp);
    simulator.draw();

    window.onmousemove = function (e) {
        var mp = this.getMousePos(this.simulator.canvas, e);
        this.update(mp.x, mp.y);
    }
    document.getElementsByClassName("loader")[0].style.display = "none";
}

function createTable() {
    var str = "<h3 class='text-center'>Datatable</h3>";
    str += "<table>";
    str += "<tr><th>Sr No.</th><th>First Deflection<br>(&theta;<sub>0</sub>)</th><th>Time (t)<br>(s)</th><th>Deflection After Discharging<br>(&theta;<sub>t</sub>)<br> </th><th>(&theta;<sub>0</sub>/&theta;<sub>t</sub>)</th><th>log<sub>10</sub>(&theta;<sub>0</sub>/&theta;<sub>t</sub>)</th></tr>";
    var table = document.getElementById("dataTable");
    for (i = 1; i <= 4; i++) {
        str += '<tr><td>' + i + '.</td><td id = "d' + i + '1"><input type="text"></td><td id = "d' + i + '2"><input type="text"></td><td id = "d' + i + '3"><input type="text"></td><td id = "d' + i + '4"><input type="text"></td><td id = "d' + i + '5"><input type="text"></td></tr>';
    }
    str += "</table>";
    table.innerHTML = str;
}

function drawGraph() {

    var datapoints1 = [];
    for (let i = 1; i <= 4; i++) {
        var tx = document.getElementById("d" + i + "2").firstChild.value;
        var ty = document.getElementById("d" + i + "5").firstChild.value;
        datapoints1.push({ x: parseInt(tx), y: parseInt(ty) });
        graphline("l1", datapoints1, "Time(t-s)", "log(θ0/θt)");
    }
}