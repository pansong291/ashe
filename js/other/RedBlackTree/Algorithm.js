function addLabelToAlgorithmBar(labelName) {
    var element = document.createTextNode(labelName);
    var tableEntry = document.createElement("td");
    tableEntry.appendChild(element);
    var controlBar = document.getElementById("AlgorithmSpecificControls");
    controlBar.appendChild(tableEntry);
    return element
}

function addCheckboxToAlgorithmBar(boxLabel) {
    var element = document.createElement("input");
    element.setAttribute("type", "checkbox");
    element.setAttribute("value", boxLabel);
    var label = document.createTextNode(boxLabel);
    var tableEntry = document.createElement("td");
    tableEntry.appendChild(element);
    tableEntry.appendChild(label);
    var controlBar = document.getElementById("AlgorithmSpecificControls");
    controlBar.appendChild(tableEntry);
    return element
}

function addRadioButtonGroupToAlgorithmBar(buttonNames, groupName) {
    var buttonList = [];
    var newTable = document.createElement("table");
    for (var i = 0; i < buttonNames.length; i++) {
        var midLevel = document.createElement("tr");
        var bottomLevel = document.createElement("td");
        var button = document.createElement("input");
        button.setAttribute("type", "radio");
        button.setAttribute("name", groupName);
        button.setAttribute("value", buttonNames[i]);
        bottomLevel.appendChild(button);
        midLevel.appendChild(bottomLevel);
        var txtNode = document.createTextNode(" " + buttonNames[i]);
        bottomLevel.appendChild(txtNode);
        newTable.appendChild(midLevel);
        buttonList.push(button)
    }
    var topLevelTableEntry = document.createElement("td");
    topLevelTableEntry.appendChild(newTable);
    var controlBar = document.getElementById("AlgorithmSpecificControls");
    controlBar.appendChild(topLevelTableEntry);
    return buttonList
}

function addControlToAlgorithmBar(type, name) {
    var element = document.createElement("input");
    element.setAttribute("type", type);
    element.setAttribute("value", name);
    var tableEntry = document.createElement("td");
    tableEntry.appendChild(element);
    var controlBar = document.getElementById("AlgorithmSpecificControls");
    controlBar.appendChild(tableEntry);
    return element
}

function Algorithm(am) {
}

Algorithm.prototype.setCodeAlpha = function (code, newAlpha) {
    var i, j;
    for (i = 0; i < code.length; i++) {
        for (j = 0; j < code[i].length; j++) {
            this.cmd("SetAlpha", code[i][j], newAlpha)
        }
    }
};

Algorithm.prototype.addCodeToCanvasBase = function (code, start_x, start_y, line_height, standard_color, layer) {
    layer = typeof layer !== "undefined" ? layer : 0;
    var codeID = Array(code.length);
    var i, j;
    for (i = 0; i < code.length; i++) {
        codeID[i] = new Array(code[i].length);
        for (j = 0; j < code[i].length; j++) {
            codeID[i][j] = this.nextIndex++;
            this.cmd("CreateLabel", codeID[i][j], code[i][j], start_x, start_y + i * line_height, 0);
            this.cmd("SetForegroundColor", codeID[i][j], standard_color);
            this.cmd("SetLayer", codeID[i][j], layer);
            if (j > 0) {
                this.cmd("AlignRight", codeID[i][j], codeID[i][j - 1])
            }
        }
    }
    return codeID
};

Algorithm.prototype.init = function (am, w, h) {
    this.animationManager = am;
    am.addListener("AnimationStarted", this, this.disableUI);
    am.addListener("AnimationEnded", this, this.enableUI);
    am.addListener("AnimationUndo", this, this.undo);
    this.canvasWidth = w;
    this.canvasHeight = h;
    this.actionHistory = [];
    this.recordAnimation = true;
    this.commands = []
};

Algorithm.prototype.sizeChanged = function (newWidth, newHeight) {
};

Algorithm.prototype.implementAction = function (funct, val) {
    var nxt = [funct, val];
    this.actionHistory.push(nxt);
    var retVal = funct(val);
    this.animationManager.StartNewAnimation(retVal)
};

Algorithm.prototype.isAllDigits = function (str) {
    for (var i = str.length - 1; i >= 0; i--) {
        if (str.charAt(i) < "0" || str.charAt(i) > "9") {
            return false
        }
    }
    return true
};

Algorithm.prototype.normalizeNumber = function (input, maxLen) {
    if (!this.isAllDigits(input) || input == "") {
        return input
    } else {
        return ("OOO0000" + input).substr(-maxLen, maxLen)
    }
};

Algorithm.prototype.disableUI = function (event) {
};

Algorithm.prototype.enableUI = function (event) {
};


function controlKey(keyASCII) {
    return keyASCII == 8 || keyASCII == 9 || keyASCII == 37 || keyASCII == 38 || keyASCII == 39 || keyASCII == 40 || keyASCII == 46
}

Algorithm.prototype.returnSubmitFloat = function (field, funct, maxsize) {
    if (maxsize != undefined) {
        field.size = maxsize
    }
    return function (event) {
        var keyASCII = 0;
        if (window.event) {
            keyASCII = event.keyCode
        } else {
            if (event.which) {
                keyASCII = event.which
            }
        }
        if (keyASCII == 13) {
            funct()
        } else {
            if (controlKey(keyASCII)) {
                return
            } else {
                if (keyASCII == 109) {
                    return
                } else {
                    if ((maxsize != undefined || field.value.length < maxsize) && (keyASCII >= 48 && keyASCII <= 57)) {
                        return
                    } else {
                        if ((maxsize != undefined || field.value.length < maxsize) && (keyASCII == 190) && field.value.indexOf(".") == -1) {
                            return
                        } else {
                            return false
                        }
                    }
                }
            }
        }
    }
};

Algorithm.prototype.returnSubmit = function (field, funct, maxsize, intOnly) {
    if (maxsize != undefined) {
        field.size = maxsize
    }
    return function (event) {
        var keyASCII = 0;
        if (window.event) {
            keyASCII = event.keyCode
        } else {
            if (event.which) {
                keyASCII = event.which
            }
        }
        if (keyASCII == 13 && funct !== null) {
            funct()
        } else {
            if (keyASCII == 190 || keyASCII == 59 || keyASCII == 173 || keyASCII == 189) {
                return false
            } else {
                if ((maxsize != undefined && field.value.length >= maxsize) || intOnly && (keyASCII < 48 || keyASCII > 57)) {
                    if (!controlKey(keyASCII)) {
                        return false
                    }
                }
            }
        }
    }
};

Algorithm.prototype.addReturnSubmit = function (field, action) {
    field.onkeydown = this.returnSubmit(field, action, 4, false)
};

Algorithm.prototype.reset = function () {
};

Algorithm.prototype.undo = function (event) {
    this.actionHistory.pop();
    this.reset();
    var len = this.actionHistory.length;
    this.recordAnimation = false;
    for (var i = 0; i < len; i++) {
        this.actionHistory[i][0](this.actionHistory[i][1])
    }
    this.recordAnimation = true
};

Algorithm.prototype.clearHistory = function () {
    this.actionHistory = []
};

Algorithm.prototype.cmd = function () {
    if (this.recordAnimation) {
        var command = arguments[0];
        for (i = 1; i < arguments.length; i++) {
            command = command + "<;>" + String(arguments[i])
        }
        this.commands.push(command)
    }
};
