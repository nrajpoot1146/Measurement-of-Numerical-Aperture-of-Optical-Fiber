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
    DRAW_SCREEN: 0X00,
    DRAW_SCREEN2: 0X01,
    DRAW_FIBRE_STAND: 0X02,
    DRAW_FIBRE_CABLE: 0X03,
    DRAW_EMITTER: 0X04,

    MAKE_CONNECTION: 0X13,
    START_SIMULATION: 0X14,
    STOP_SIMULATION: 0X15,

    RESET: 0X21,
    UNDO: 0X22,
    REDO: 0X23
};

var elementCount = {
    emitter: 0,
    cable: 0,
    stand: 0,
    screen: 0
}

class Element {
    constructor(canvas, x, y, width, height, name = "element", isCenter = false) {
        this.canvas = canvas;
        this.name = name;
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
        if (this.isBorder) {
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
        this.context.rect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        this.context.strokeStyle = this.borderColor;
        this.context.lineWidth = 1;
        this.context.stroke();
        this.context.closePath();
        this.draw();
        this.context.strokeStyle = "black";
    }
    hoverIn() {
        // this.borderColor = "royalblue";
        // this.clear();
        // this.context.shadowColor = this.shadowColor;
        // this.context.shadowBlur = 2;
        // this.draw();
        // this.context.shadowBlur = 0;
    }
    hoverOut() {
        // this.borderColor = "red";
        // this.clear();
        // this.context.shadowColor = this.shadowColor;
        // this.context.shadowBlur = 0;
        // this.draw();
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

class Cable extends Element {
    constructor(canvas, x, y, width, height, name = "element") {
        super(canvas, x, y, width, height, name);
        this.image = document.getElementById("wire");
        this.NAList = {
            fibre: 0.4856,
            glass: 0.6893
        }
    }
    draw() {
        //super.draw();
        this.context.beginPath();
        this.context.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.context.stroke();
        this.context.closePath();
    }
}

class Item extends Element {
    constructor(canvas, x, y, width, height, name = "element", imageId = null) {
        super(canvas, x, y, width, height, name);
        this.imageId = imageId;
    }
    draw() {
        this.image = document.getElementById(this.imageId);
        this.context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Simulator {
    constructor() {
        this.canvas = document.getElementById("myCanvas");
        if (!this.canvas) {
            return;
        }
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.context = this.canvas.getContext('2d');
        this.element = [];
        this.redoArray = [];
        this.flag = false;
        this.action = operationType.STOP_SIMULATION;
        this.addEvent();
    }
    draw() {
        this.clear();
        this.context.beginPath();
        this.context.lineWidth = 6;
        this.context.strokeStyle = "#BBB";
        this.context.moveTo(0, 400);
        this.context.shadowColor = "#bbb"
        //this.context.shadowh
        this.context.shadowBlur = 10;
        this.context.lineTo(0 + this.canvas.width, 400);
        this.context.stroke();
        this.context.closePath();
        this.context.shadowBlur = 0;

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
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
        this.canvas.addEventListener("mousedown", function (e) {
            var mouPos = getMousePos(temp.canvas, e);
            mouseLeftDown(mouPos.x, mouPos.y);
        }, false);
    }
    start() {
        for (let i in elementCount) {
            this.flag = true && (elementCount[i] > 0);
        }
        if (this.flag) {
            document.getElementsByClassName("started")[0].style.display = "block";
            document.getElementsByClassName("components")[0].style.display = "none";
            document.getElementById("start").style.display = "none";
            this.action = operationType.START_SIMULATION;
            this.element = [];
            this.add(this.frontscreen);
            this.add(this.snap);
            this.add(this.light);
        }
        this.draw();
    }
    reset() {
        this.element = [];
        document.getElementsByClassName("started")[0].style.display = "none";
        document.getElementsByClassName("components")[0].style.display = "block";
        document.getElementById("start").style.display = "block";

        elementCount.emitter = 0;
        elementCount.screen = 0;
        elementCount.stand = 0;
        elementCount.cable = 0;

        this.action = operationType.STOP_SIMULATION;
        this.draw();
    }
}

window.onload = function () {
    this.terminal = new this.Terminal();
    this.cmpy = 290;
    this.cpx = 220;
    this.simulator = new Simulator();
    simulator.cable = new Cable(simulator.canvas, this.cpx, cmpy + 10, 300, 6, "Cable", "Cable");
    simulator.cable.NA = simulator.cable.NAList.fibre;
    simulator.stand1 = new Item(simulator.canvas, this.cpx, cmpy, 20, 100, "stand1", "stand");
    simulator.stand2 = new Item(simulator.canvas, this.cpx + 280, cmpy, 20, 100, "stand2", "stand");
    simulator.emitter = new Item(simulator.canvas, this.cpx + 350, cmpy - 5, 100, 120, "emitter", "emit");
    simulator.screen = new Item(simulator.canvas, this.cpx - 180, cmpy - 25, 100, 150, "screen", "screen");
    simulator.snap = new Item(simulator.canvas, 0, 0, 420, 110, "snap", "snap");

    simulator.frontscreen = new Item(simulator.canvas, simulator.canvas.width / 2 - 50, simulator.canvas.height / 2 - 110, 100, 300, "screen2", "frontscreen");
    simulator.light = new Item(simulator.canvas, simulator.canvas.width / 2 - 25, simulator.canvas.height / 2 - 45, 50, 50, "light", "green");
    simulator.light.setR = function (r) {
        var R = (r / 12) * 50;
        this.width = this.height = R;
        this.x = simulator.canvas.width / 2 - R / 2;
        this.y = simulator.canvas.height / 2 - 0.8 * R;
    }

    simulator.rangeButton = document.getElementById("distance");
    simulator.screen.L = 0;

    simulator.draw();

    window.onmousemove = function (e) {
        var mp = this.getMousePos(this.simulator.canvas, e);
        this.update(mp.x, mp.y);
    }

    simulator.buttons = document.getElementsByClassName("btn");

    for (let i = 0; i < simulator.buttons.length; i++) {
        simulator.buttons[i].addEventListener("click", function (e) {
            switch (operationType[e.target.getAttribute("vlab-action")]) {
                case operationType.DRAW_EMITTER:
                    if (elementCount.emitter < 1) {
                        simulator.add(simulator.emitter);
                        elementCount.emitter = 1;
                    }
                    break;
                case operationType.DRAW_FIBRE_CABLE:
                    if (elementCount.cable < 1) {
                        if (elementCount.stand > 0) {
                            simulator.add(simulator.cable);
                            elementCount.cable = 1;
                        } else {
                            terminal.update("Fibre stand not found.");
                        }
                    }
                    break;
                case operationType.DRAW_FIBRE_STAND:
                    if (elementCount.stand < 1) {
                        simulator.add(simulator.stand1);
                        simulator.add(simulator.stand2);
                        elementCount.stand = 1;
                    }
                    break;
                case operationType.DRAW_SCREEN:
                    if (elementCount.screen < 1) {
                        simulator.add(simulator.screen);
                        elementCount.screen = 1;
                    }
                    break;
                case operationType.START_SIMULATION:
                    simulator.start();
                    break;
                case operationType.RESET:
                    simulator.reset();
                    break;
            }
            simulator.draw();
        }, false);
    }

    simulator.rangeButton.addEventListener("input", function (e) {
        simulator.screen.L = parseInt(e.target.value);
        document.getElementById("rbValue").innerHTML = simulator.screen.L + "mm";
        var r = simulator.cable.NA * simulator.screen.L / (Math.sqrt(1 - Math.pow(simulator.cable.NA, 2)));
        r = parseFloat(r.toFixed(3));
        simulator.light.setR(r);
        terminal.update("Diameter (D) = " + (2 * r) + "mm");
        simulator.draw();
    }, false);
    document.getElementById("cableType").addEventListener("change", function (e) {
        if (e.target.value == "fibre") {
            simulator.cable.NA = simulator.cable.NAList.fibre;
        } else {
            simulator.cable.NA = simulator.cable.NAList.glass;
        }
    }, false);
    this.createTable();
    this.drawGraph();
    document.getElementsByClassName("loader")[0].style.display = "none";
}

function mouseLeftDown(x, y) {

}

function createTable() {
    var str = "<h3 class='text-center'>Datatable</h3>";
    str += "<table>";
    str += "<tr><th>Sr No.</th><th>Distance of screen (L) in mm</th><th>Diameter (D) in mm</th></tr>";
    var table = document.getElementById("dataTable");
    for (i = 1; i <= 4; i++) {
        str += '<tr><td>' + i + '.</td><td id = "d' + i + '1"><input type="text"></td><td id = "d' + i + '2"><input type="text"></td></tr>';
    }
    str += "</table>";
    table.innerHTML = str;
}

function drawGraph() {
    var datapoints1 = [];
    for (let i = 1; i <= 4; i++) {
        var tx = document.getElementById("d" + i + "1").firstChild.value;
        var ty = document.getElementById("d" + i + "2").firstChild.value;
        datapoints1.push({ x: parseInt(tx), y: parseInt(ty) });
        graphline("l1", datapoints1, "Diameter (D) in mm", "Distance (L) in mm");
    }
}

function varify(e) {
    var answer = document.getElementById("answer").value;
    if(answer=="" || isNaN(answer)){
        alert("Box is empty or entered invalid value");
        terminal.update("Box is empty or entered invalid value");
        return;
    }
    var perError = (simulator.cable.NA - answer) / simulator.cable.NA;
    perError = perError.toFixed(2);
    terminal.update("Percentage Error = " + perError);
}