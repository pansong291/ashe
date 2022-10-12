/* - ==========================================================
*     开发人员：卢印刚
*     编写时间：2006-9-26
*     函数名称：JsPoint
*     参数说明：
*     功能说明：对C++的CPoint类的实现
*     使用说明： 1、JsPoint( x, y )，根据x,y构造新的对象，最基本的构造方式
*               2、JsPoint.Clone()，复制当前的JsPoint对象
*               3、JsPoint.Copy( JsPoint )，复制JsPoint对象对象到当前
*               4、JsPoint.SetPoint( x, y )，将x,y赋值到当前
*               5、JsPoint.Offset( x, y )，将JsPoint对象进行Offset操作，分别加上x和y
*               6、JsPoint.Equal( JsPointNew )，判断当前的对象是否与新的JsPointNew对象相等
*               7、JsPoint.Add( JsPointNew )，实现了 + 操作附，并返回新的值
*               8、JsPoint.Sub( JsPointNew )，实现了 - 操作附，并返回新的值
*               9、JsPoint.AddEv( JsPointNew )，实现了 += 操作符
*               10、JsPoint.SubEv( JsPointNew )，实现了 -= 操作符
*/

function JsPoint() {
    this.x = this.y = 0;
    if (arguments.length >= 2) {
        this.x = isNaN(arguments[0]) ? 0 : arguments[0];
        this.y = isNaN(arguments[1]) ? 0 : arguments[1];
    }
}

JsPoint.prototype.Clone = function () {
    return (new this.constructor(this.x, this.y));
};

JsPoint.prototype.Copy = function (JsPt) {
    if (JsPt instanceof JsPoint) {
        this.constructor(JsPt.x, JsPt.y);
    }
};

JsPoint.prototype.SetPoint = function (x, y) {
    if (isNaN(x) || isNaN(y)) return;
    this.x = x;
    this.y = y;
};

JsPoint.prototype.Offset = function (x, y) {
    if (isNaN(x) || isNaN(y)) return;
    this.x += x;
    this.y += y;
};

JsPoint.prototype.Equal = function (x, y) {
    if (arguments.length == 1)
        return (this.x == x.x) && (this.y == x.y);
    return this.x == x && this.y == y;
};

JsPoint.prototype.Add = function (JsPt) {
    try {
        var PT = this.Clone();
        PT.Offset(JsPt.x, JsPt.y);
        return PT;
    } catch (e) {
        return null;
    }
};

JsPoint.prototype.Sub = function (JsPt) {
    try {
        var PT = this.Clone();
        PT.Offset(-JsPt.x, -JsPt.y);
        return PT;
    } catch (e) {
        return null;
    }
};