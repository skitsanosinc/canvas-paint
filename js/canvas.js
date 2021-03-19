//stripmined  from canvaspaint.org
//took out all the junk i didn't want
//want to add more weird brushes, contrast control, etc...

//global vars
var canvas, c, canvastemp, ctemp, wsp, co;
var iface = {xy: null, txy: null};

function getxy(e, o)
{
//gets mouse position relative to object o
    if (c)
    {
        var bo = getpos(o);
        var x = e.clientX - bo.x + wsp.scrollLeft;	//correct for canvas position, workspace scroll offset
        var y = e.clientY - bo.y + wsp.scrollTop;
        x += document.documentElement.scrollLeft;	//correct for window scroll offset
        y += document.documentElement.scrollTop;
        return {x: x - 0.5, y: y - 0.5}; //-.5 prevents antialiasing of stroke lines
    }
}

function getpos(o)
{
//gets position of object o
    var bo, x, y, b;
    x = y = 0;
    if (document.getBoxObjectFor)
    {	//moz
        bo = document.getBoxObjectFor(o);
        x = bo.x;
        y = bo.y;
    }
    else
    { //opera, safari etc
        while (o && o.nodeName != 'body')
        {
            x += o.offsetLeft;
            y += o.offsetTop;
            b = parseFloat(document.defaultView.getComputedStyle(o, null).getPropertyValue('border-width'));
            if (b > 0)
            {
                x += b;
                y += b;
            }
            o = o.offsetParent;
        }
    }
    return {x: x, y: y};
}

function c_up(e)
{
//handles mouseup on the canvas depending on tool selected
    m = getxy(e, canvas);
    e.stopPropagation();
    if (iface.dragging)
    {
        bodyUp(e);
    } //but not if dragging
    c.tool.up(e);
    return false;
}

function bodyMove(e)
{
//lets the user move outside the canvas while drawing shapes and lines
    if (c.tool.status > 0)
    {
        c_move(e);
    }
    if (iface.dragging)
    {
        m = getxy(e, document.body);
        var win = wsp.parentNode.parentNode.parentNode;
        win.style.left = e.clientX - c.start.x + 'px';
        win.style.top = e.clientY - c.start.y + 'px';
    }
}

function c_move(e)
{
    m = getxy(e, canvas);
    e.stopPropagation();
    if (iface.dragging)
    {
        bodyMove(e);
    } //don't stop propagation if dragging
    if (c.tool.status > 0)
    {
        c.tool.move(e);
    }
    if (c.tool.start && c.tool.status > 0)
    {
        iface.xy.innerHTML = Math.round(c.tool.start.x) + ', ' + Math.round(c.tool.start.y);
    }
    else
    {
        iface.xy.innerHTML = Math.round(m.x) + ', ' + Math.round(m.y);
    }
    return false;
}

function bodyUp(e)
{
//stops drawing even if mouseup happened outside canvas
//closes menus if clicking somewhere else
    if (iface.dragging)
    {
        iface.dragging = false;
    }
    if (c && c.tool.name != 'polygon' && c.tool.status > 0)
    {
        c_up(e);
    }
}

function c_down(e)
{
//handles mousedown on the canvas depending on tool selected
    m = getxy(e, canvas);
    c.tool.down(e);
    c.moveTo(m.x, m.y);
    return false;
}

function c_out(e)
{
    if (c && (c.tool.name == 'pencil' || c.tool.name == 'brush') && c.tool.status == 1)
    {
        c.tool.disconnected = 1;
        m = getxy(e, canvas);
        c.tool.draw();
    }
    iface.xy.innerHTML = '&nbsp;';
}

function activateTempCanvas()
{
//resets and shows overlay canvas
    if (m)
    {
        ctemp.moveTo(m.x, m.y);
    }		//copy context from main
    ctemp.fillStyle = c.fillStyle;
    ctemp.clearRect(0, 0, canvastemp.width, canvastemp.height);		//clear
    canvastemp.style.display = 'block';		//show
}

function drawLine(x1, y1, x2, y2, mod, trg)
{
    trg.beginPath();
    trg.moveTo(x1, y1);
    if (mod)
    {
        var dx = Math.abs(x2 - x1);
        var dy = Math.abs(y2 - y1);
        var dd = Math.abs(dx - dy);
        if (dx > 0 && dy > 0 && dx != dy)
        {
            if (dd < dx && dd < dy)
            { //diagonal
                if (dx < dy)
                {
                    y2 = y1 + (((y2 - y1) / dy) * dx);
                }
                else
                {
                    x2 = x1 + (((x2 - x1) / dx) * dy);
                }
            }
            else if (dx < dy)
            {
                x2 = x1;
            }
            else if (dy < dx)
            {
                y2 = y1;
            }
        }
    }
    trg.lineTo(x2, y2);
    trg.stroke();
    trg.beginPath();
    return {x: x2, y: y2};
}

function drawCircle(x1, y1, x2, y2, mod, trg)
{
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var radius = (dx + dy);
    var start = 0;
    var end = Math.PI * 360;
    var clockwise = 1;
    trg.beginPath();
    trg.arc(x1, y1, radius, start, end, clockwise);
    trg.fillStyle = c.strokeStyle;
    trg.fill();
}

function drawRectangle(x1, y1, x2, y2, mod, trg)
{
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    if (mod && dx != dy)
    {	//shift held down: constrain
        if (dx < dy)
        {
            y2 = y1 + (((y2 - y1) / dy) * dx);
        }
        else
        {
            x2 = x1 + (((x2 - x1) / dx) * dy);
        }
    }
    trg.rect(x1, y1, (x2 - x1), (y2 - y1));
    if (c.strokeFill == 2 || c.strokeFill == 3)
    {
        trg.fill();
    }
    if (c.strokeFill == 1 || c.strokeFill == 3)
    {
        trg.stroke();
    }
}


var tool = {

    _shapes: function ()
    {
        this.down = this._down = function ()
        {
            activateTempCanvas();
            this.start = {x: m.x, y: m.y};
            this.status = 1;
            c.beginPath();
        };
        this._move = function ()
        {
            ctemp.clearRect(0, 0, canvastemp.width, canvastemp.height);
            iface.txy.innerHTML = Math.round(m.x - this.start.x) + 'x' + Math.round(m.y - this.start.y);
        };
        this._up = function ()
        {
            canvastemp.style.display = 'none';
            this.status = 0;
            iface.txy.innerHTML = '&nbsp;';
        };

    },

    _brushes: function ()
    {
        this.down = function ()
        {
            this.last = null;
            this.cp = null;
            this.lastcp = null;
            this.disconnected = null;
            c.beginPath();
            this.sstart = this.last = {x: m.x, y: m.y};//extra s in sstart to not affect status bar display
            this.status = 1;
        };
        this.move = function (e)
        {

            if (this.disconnected)
            {	//re-entering canvas: dont draw a line
                this.disconnected = null;
                this.last = {x: m.x, y: m.y};
            }
            else
            {				//draw connecting line
                this.draw();
            }
            c.moveTo(m.x, m.y);
        };
        this.up = function ()
        {
            if (this.sstart && this.sstart.x == m.x && this.sstart.y == m.y)
            {
                drawDot(m.x, m.y, c.lineWidth, c.strokeStyle);
            }
            this.sstart = null;
            this.status = 0;
        };
        this.draw = function ()
        {
            c.lineTo(m.x, m.y);
            c.stroke();
            c.beginPath();
            this.last = {x: m.x, y: m.y};
        };
    },

    pencil: function ()
    {
        this.name = 'pencil';
        this.status = 0;
        this.inherit = tool._brushes;
        this.inherit();
        c.lineCap = 'butt';
        c.lineWidth = 1;
    },

    brush: function ()
    {
        this.name = 'brush';
        this.status = 0;
        this.inherit = tool._brushes;
        this.inherit();
    },

    line: function ()
    {
        this.name = 'line';
        this.status = 0;
        this.inherit = tool._shapes;
        this.inherit();
        c.lineCap = 'round';
        c.lineWidth = 1;
        this.move = function (e)
        {
            this._move();
            drawLine(this.start.x, this.start.y, m.x, m.y, e.shiftKey, ctemp);
        };
        this.up = function (e)
        {
            this._up();
            drawLine(this.start.x, this.start.y, m.x, m.y, e.shiftKey, c);
        };
    },

    circle: function ()
    {
        this.name = 'circle';
        this.status = 0;
        this.inherit = tool._shapes;
        this.inherit();
        c.lineCap = 'round';
        c.lineWidth = 1;
        this.move = function (e)
        {
            this._move();
            drawCircle(this.start.x, this.start.y, m.x, m.y, e.shiftKey, ctemp);
        };
        this.up = function (e)
        {
            this._up();
            drawCircle(this.start.x, this.start.y, m.x, m.y, e.shiftKey, c);
        };
    },


    rectangle: function ()
    {
        this.name = 'rectangle';
        this.status = 0;
        this.inherit = tool._shapes;
        this.inherit();
        this.move = function (e)
        {
            this._move();
            drawRectangle(this.start.x, this.start.y, m.x, m.y, e.shiftKey, ctemp);
        };
        this.up = function (e)
        {
            this._up();
            drawRectangle(this.start.x, this.start.y, m.x, m.y, e.shiftKey, c);
        };
    },

    curve: function ()
    {
        this.name = 'curve';
        this.status = 0;
        c.lineCap = 'round';
        c.lineWidth = 1;
        this.down = function ()
        {
            if (this.status === 0)
            { //starting
                activateTempCanvas();
                this.start = {x: m.x, y: m.y};
                this.end = null;
                this.bezier1 = null;
                this.status = 5;
                c.beginPath();
            }
            else if (this.status == 4 || this.status == 2)
            { //continuing
                this.status--;
            }
        };
        this.move = function (e)
        {
            if (this.status == 5)
            {
                ctemp.clearRect(0, 0, canvastemp.width, canvastemp.height);
                drawLine(this.start.x, this.start.y, m.x, m.y, e.shiftKey, ctemp);
                ctemp.stroke();
                iface.txy.innerHTML = Math.round(m.x - this.start.x) + 'x' + Math.round(m.y - this.start.y);
            }
            else if (this.status == 3 || this.status == 1)
            {
                ctemp.clearRect(0, 0, canvastemp.width, canvastemp.height);
                ctemp.moveTo(this.start.x, this.start.y);
                var b1x = (this.bezier1) ? this.bezier1.x : m.x;
                var b1y = (this.bezier1) ? this.bezier1.y : m.y;
                var b2x = (this.bezier1) ? m.x : this.end.x;
                var b2y = (this.bezier1) ? m.y : this.end.y;
                ctemp.bezierCurveTo(b1x, b1y, b2x, b2y, this.end.x, this.end.y);
                ctemp.stroke();
                iface.txy.innerHTML = Math.round(this.end.x - this.start.x) + 'x' + Math.round(this.end.y - this.start.y);
            }
        };
        this.up = function ()
        {
            if (this.status == 5)
            { //setting endpoint     // && source.id != 'body'
                this.end = {x: m.x, y: m.y};
                this.status = 4;
            }
            else if (this.status == 3)
            { //setting bezier1  && source.id != 'body'
                this.bezier1 = {x: m.x, y: m.y};
                ctemp.clearRect(0, 0, canvastemp.width, canvastemp.height);
                ctemp.moveTo(this.start.x, this.start.y);
                ctemp.bezierCurveTo(m.x, m.y, this.end.x, this.end.y, this.end.x, this.end.y);
                ctemp.stroke();
                this.status = 2;
            }
            else if (this.status == 1)
            { //setting bezier2  && source.id != 'body'
                canvastemp.style.display = 'none';
                c.moveTo(this.start.x, this.start.y);
                c.bezierCurveTo(this.bezier1.x, this.bezier1.y, m.x, m.y, this.end.x, this.end.y);
                c.stroke();
                this.status = 0;
                iface.txy.innerHTML = '&nbsp;';
            }
        };
    },

    polygon: function ()
    {
        this.name = 'polygon';
        this.status = 0;
        this.points = new Array();
        this.down = function ()
        {
            if (this.status === 0)
            { //starting poly
                activateTempCanvas();
                this.start = {x: m.x, y: m.y};
                this.last = null;
                this.status = 3;
                this.points = new Array();
                c.beginPath();
            }
            else if (this.status == 1)
            { //adding points
                this.status = 2;
            }
        };
        this.move = function (e)
        {
            if (this.status == 3)
            { //first polyline
                ctemp.clearRect(0, 0, canvastemp.width, canvastemp.height);
                drawLine(this.start.x, this.start.y, m.x, m.y, e.shiftKey, ctemp);
            }
            else if (this.status == 2)
            { // next polyline
                ctemp.clearRect(0, 0, canvastemp.width, canvastemp.height);
                drawLine(this.last.x, this.last.y, m.x, m.y, e.shiftKey, ctemp);
            }
            iface.txy.innerHTML = Math.round(m.x - this.start.x) + 'x' + Math.round(m.y - this.start.y);
        };
        this.up = function (e)
        {
            if (Math.abs(m.x - this.start.x) < 4 && Math.abs(m.y - this.start.y) < 4)
            { //closing
                this.close();
            }
            else
            {
                ctemp.clearRect(0, 0, canvastemp.width, canvastemp.height);
                var fromx = (this.status == 2) ? this.last.x : this.start.x;
                var fromy = (this.status == 2) ? this.last.y : this.start.y;
                var end = drawLine(fromx, fromy, m.x, m.y, e.shiftKey, c); //TODO cant drawline on c yet...3rd canvas??
                this.last = {x: m.x, y: m.y};
                this.points[this.points.length] = {x: m.x, y: m.y};
                this.status = 1;
            }
        };
        this.close = function ()
        {
            if (this.last.x)
            { // not just started
                c.beginPath();
                c.moveTo(this.start.x, this.start.y);
                for (var i = 0; i < this.points.length; i++)
                {
                    c.lineTo(this.points[i].x, this.points[i].y);
                }
                c.lineTo(this.last.x, this.last.y);
                c.lineTo(this.start.x, this.start.y);
                if (c.strokeFill == 2 || c.strokeFill == 3)
                {
                    c.fill();
                }
                if (c.strokeFill == 1 || c.strokeFill == 3)
                {
                    c.stroke();
                }
                c.fill();
            }
            canvastemp.style.display = 'none';
            this.status = 0;
        };
    }
};


window.onload = function ()
{
    wsp = document.getElementById('workspace');
//set up canvas
    canvas = document.getElementById('canvas');
    if (canvas.getContext)
    {
        c = canvas.getContext("2d");
        iface.xy = document.getElementById('xy').firstChild;
        iface.txy = document.getElementById('txy').firstChild;
        //set up defaults
        c.tool = new tool.brush();
        c.lineWidth = 1;
        c.strokeStyle = '#000';
        c.fillStyle = '#fff';
        c.tertStyle = '#ddd';
        c.strokeFill = 1; //outline shapes
        //set up overlay canvas (for preview when drawing lines, rects etc)
        canvastemp = document.getElementById('canvastemp');
        ctemp = canvastemp.getContext('2d');
        //set up events
        window.onmouseup = bodyUp;
        window.onmousemove = bodyMove;
        canvas.onmousedown = canvastemp.onmousedown = c_down;
        canvas.onmousemove = canvastemp.onmousemove = c_move;
        canvas.onmouseout = canvastemp.onmouseout = c_out;
        canvas.onmouseup = canvastemp.onmouseup = c_up;
    }
};

function intersects(m, start, dim)
{//checks if m(x,y) is between start(x,y) and start+dim(x,y)
    if (m.x >= start.x && m.y >= start.y && m.x <= (start.x + dim.x) && m.y <= (start.y + dim.y))
    {
        return true;
    }
    else
    {
        return false;
    }
}

function constrain(n, min, max)
{
    if (n > max)
    {
        return max;
    }
    if (n < min)
    {
        return min;
    }
    return n;
}

function intersects(m, start, dim)
{//checks if m(x,y) is between start(x,y) and start+dim(x,y)
    if (m.x >= start.x && m.y >= start.y && m.x <= (start.x + dim.x) && m.y <= (start.y + dim.y))
    {
        return true;
    }
    else
    {
        return false;
    }
}

function selCol2(col, e, context)
{
    if (e && e.ctrlKey)
    {//tertiary
        c.tertStyle = col;
    }
    else if (context == 1 || (e && e.button == 2))
    { //right
        c.fillStyle = col;
        ctemp.fillStyle = col;
    }
    else
    {
        c.strokeStyle = col;
        ctemp.strokeStyle = col;
    }
}

function selCol(o, e, context)
{//context because silly safari doesnt capture right click, apparently.. thus oncontextmenu
    col = (typeof(o) == 'string') ? o : o.style.backgroundColor;
    selCol2(col, e, context);
}

function shareSettingsPanels(tool)
{
    if (tool == 'line' || tool == 'curve')
    {
        return 'line';
    }
    if (tool == 'experiment1' || tool == 'rectangle' || tool == 'polygon' || tool == 'rounded' || tool == 'circle')
    {
        return 'shape';
    }
    return tool;
}

function selTool(o)
{
    c.tool.status = 0;
    canvastemp.style.display = 'none';
    var newtool = o.id;
    document.getElementById('workspace').className = newtool;
//reset color (after eraser and select)
    if (c.lastStrokeStyle)
    {
        selCol(c.lastStrokeStyle);
        c.lastStrokeStyle = null;
    }
    if (c.tool.name == 'polygon')
    {
        c.tool.close();
    }
    c.lastTool = c.tool.name;
    c.tool = new tool[newtool]();
    newtool = shareSettingsPanels(c.tool.name);

}

function selSetting(o)
{
    c.tool.status = 0;
    canvastemp.style.display = 'none';
    var newtool = shareSettingsPanels(c.tool.name);
    if (document.getElementById(newtool + '-settings'))
    {
        var settingbtns = document.getElementById(newtool + '-settings').childNodes;
        for (var i = 0; i < settingbtns.length; i++)
        {
            if (settingbtns[i].className == 'sel')
            {
                settingbtns[i].className = '';
            }
        }
        o.className = 'sel';
    }
}
