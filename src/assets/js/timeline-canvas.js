/**
 * options参数
 * @param {*} init_cells //录像列表
 * @param {*} thumimg_cb //缩略图回调函数 
 * @param {*} canvasid //画布id
 * @param {*} begintime //开始时间
 * @param {*} videoid //视频id
 * @param {*} mousedown //鼠标按下
 * @param {*} mouseup //鼠标抬起
 * @param {*} croppingCallback // 裁剪视频修改时间后，返回时间
 * 
 */
class TimeSlider {
    constructor(options) {
        this.canvas = document.getElementById(options.canvasid);
        this.ctx = this.canvas.getContext("2d");
        this.timecell = options.init_cells || [];
        this.thumimgCB = options.thumimg_cb;
        this.mouseCB = {
            mousedown: options.mousedown,
            mouseup: options.mouseup,
            mousemove: options.mousemove,
        }
        this.ctx.font = "16px Arial";
        this.graduation_step = 10;//刻度间最小宽度，单位px
        this.distance_between_gtitle = 80;
        this.zoom = options.zoom || 24;
        this.minutes_per_step = [1, 2, 5, 10, 15, 20, 30, 60, 120, 180, 240, 360, 720, 1440]; // min/格
        this.g_isMousedown = false;//拖动mousedown标记
        this.g_isMousemove = false;//拖动mousemove标记
        this.g_mousedownCursor = null;//拖动mousedown的位置
        this.returnTime = null;//mouseup返回时间
        this.startTime = "";//传递的数组的结束时间
        this.endTime = "";//传递的数组的结束时间
        this.time_flag = false;
        this.interval = null;
        this.cropping = false; //是否允许裁剪视频绘制
        this.CroppingStartTime = new Date(new Date().toLocaleDateString()); //裁剪视频默认的开始时间
        this.CroppingEndTime = new Date(new Date(new Date().toLocaleDateString()).setMinutes(30));//裁剪视频默认的结束时间(相差半小时)
        this.isResizingLeft = false;//点击左边的
        this.isResizingRight = false;//点击右边的
        this.DragCropping = false; //是否在拖拽裁剪视频
        this.croppingCallback = options.croppingCallback;
        this.cropping_time_flag = false; //裁剪视频
        this.cropping_isMousedown = false; //裁剪视频移动
        if (options.videoid) {
            let video = document.getElementById(options.videoid);
            // 获取video的宽
            let divWidth = video.offsetWidth;
            this.canvas.width = divWidth;
            this.canvas.height = 55;
        }
        this.zoomMap = { 24: 24, 20: 16, 16: 8, 12: 4, 8: 1, 4: 0.5, 1: 0.1 }
        this.hours_per_ruler = this.zoomMap[this.zoom];//时间轴显示24小时

        this.start_timestamp = options.begintime ? options.begintime - (this.hours_per_ruler * 3600 * 1000) / 2 : new Date().getTime() - 12 * 60 * 60 * 1000;
        this.canvansW = this.canvas.width;
        this.canVansH = this.canvas.height;

        this.leftBracketX = this.canvansW / 2;//裁剪视频默认的起点
        this.rightBracketX = (this.hours_per_ruler * 3600 * 1000) / 2 + (0.5 * 3600 * 1000);//裁剪视频默认的终点
        this.init(false);
    }
    init(redrawFlag) {
        this.add_graduations();
        this.draw_cells();

        this.ctx.fillStyle = 'rgb(12, 12, 12)';
        this.ctx.fillRect(0, 0, this.canvansW, 13);//上边时间 

        this.ctx.fillStyle = '#2C7BF4 ';
        this.ctx.fillRect(this.canvansW / 2 - 70, 0, 130, 13); //上面背景块

        var time = this.start_timestamp + (this.hours_per_ruler * 3600 * 1000) / 2;

        this.drawLine(this.canvansW / 2, 18, this.canvansW / 2, 55, "yellow ", 2); //中间播放点时间线

        //中间画一个三角
        this.brief(this.canvansW);
        if (!redrawFlag) {//只有第一次进入才需要添加事件
            this.add_events();
        }
        this.ctx.fillStyle = "#FFF";
        this.ctx.font = "12px Arial";
        this.ctx.fillText(this.changeTime(time), this.canvansW / 2 - 60, 10.5);

    }
    /**
     * 绘制添加刻度
     * @param {*} start_timestamp 最左侧时间
     **/
    add_graduations() {
        let start_timestamp = this.start_timestamp;
        var px_per_min = this.canvansW / (this.hours_per_ruler * 60); // px/min24  24*60
        var px_per_ms = this.canvansW / (this.hours_per_ruler * 60 * 60 * 1000); // px/ms

        var px_per_step = this.graduation_step;  // px/格 默认最小值20px
        var min_per_step = px_per_step / px_per_min; // min/格

        for (var i = 0; i < this.minutes_per_step.length; i++) {
            if (min_per_step <= this.minutes_per_step[i]) { //让每格时间在minutes_per_step规定的范围内
                min_per_step = this.minutes_per_step[i];
                px_per_step = px_per_min * min_per_step;
                break
            }
        }
        var medium_step = 0;
        for (var i = 0; i < this.minutes_per_step.length; i++) {
            if (this.distance_between_gtitle / px_per_min <= this.minutes_per_step[i]) {
                medium_step = this.minutes_per_step[i];
                break;
            }
        }
        var num_steps = this.canvansW / px_per_step; //总格数
        var graduation_left;
        var graduation_time;
        var graduation_times;
        var caret_class;
        var lineH;
        var ms_offset = this.ms_to_next_step(start_timestamp, min_per_step * 60 * 1000);//开始的偏移时间 ms
        var px_offset = ms_offset * px_per_ms; //开始的偏移距离 px
        var ms_per_step = px_per_step / px_per_ms; // ms/step
        for (var i = 0; i < num_steps; i++) {
            graduation_left = px_offset + i * px_per_step; // 距离=开始的偏移距离+格数*px/格
            graduation_time = start_timestamp + ms_offset + i * ms_per_step; //时间=左侧开始时间+偏移时间+格数*ms/格
            graduation_times = start_timestamp + ms_offset + i * ms_per_step / 60; //时间=左侧开始时间+偏移时间+格数*ms/格
            var date = new Date(graduation_time);
            if (date.getUTCHours() == 0 && date.getUTCMinutes() == 0) {
                caret_class = 'big';
                lineH = 27;//刻度位置
                var big_date = this.graduation_title(date);
                this.ctx.fillText(big_date, graduation_left - 20, 45);//刻度时间位置
                this.ctx.fillStyle = "rgba(151,158,167,1)";
            } else if (graduation_time / (60 * 1000) % medium_step == 0) {
                caret_class = 'middle';
                lineH = 27;//刻度位置
                var middle_date = this.graduation_title(date);
                if (middle_date.length > 9) {
                    this.ctx.font = '11px Arial'
                    this.ctx.fillStyle = "#FFF";
                    this.ctx.fillText(middle_date, graduation_left - 30, 43);//刻度时间位置
                } else {
                    this.ctx.fillStyle = "rgba(151,158,167,1)";
                    this.ctx.font = '13px Arial'
                    this.ctx.fillText(middle_date, graduation_left - 25, 43);//刻度时间位置
                }
            } else {
                lineH = 22;
            }

            this.drawLine(graduation_left, 15, graduation_left, lineH, "rgba(151,158,167,1)", 1);
            if (this.hours_per_ruler == 0.1) {
                for (let j = 1; j < 30; j++) {
                    if (i == 0) {
                        this.drawLine(graduation_left - parseFloat(px_per_step / 30) * j, 15, graduation_left - parseFloat(px_per_step / 30) * j, 22, "rgba(151,158,167,1)", 1);
                    }
                    this.drawLine(graduation_left + parseFloat(px_per_step / 30) * j, 15, graduation_left + parseFloat(px_per_step / 30) * j, 22, "rgba(151,158,167,1)", 1);
                }
            }
        }
    }
    ms_to_next_step(timestamp, step) {
        var remainder = timestamp % step;
        return remainder ? step - remainder : 0;
    }
    graduation_title(datetime) {
        if (datetime.getHours() == 0 && datetime.getMinutes() == 0 && datetime.getMilliseconds() == 0) {
            return ('0' + datetime.getDate().toString()).substr(-2) + '.' +
                ('0' + (datetime.getMonth() + 1).toString()).substr(-2) + '.' +
                datetime.getFullYear();
        }
        return datetime.getHours() + ':' + ('0' + datetime.getMinutes().toString()).substr(-2) + ':' + ('0' + datetime.getSeconds().toString()).substr(-2);
    };
    drawLine(beginX, beginY, endX, endY, color, width) {
        if (beginX < 0) {
            return;
        }
        this.ctx.beginPath();
        this.ctx.moveTo(beginX, beginY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }
    brief(s) {
        this.ctx.fillStyle = "#2C7BF4 ";
        this.ctx.beginPath() // 新建一条路径
        this.ctx.moveTo(s / 2, 22) // 画笔移动到（10,10）
        this.ctx.lineTo(s / 2 - 7, 12)
        this.ctx.lineTo(s / 2 + 7, 12)
        this.ctx.fill()
    }
    set_cells(cells) {
        this.timecell = cells;
        if (cells.length > 0) {
            this.startTime = new Date(this.timecell[0].beginTime);
            this.endTime = new Date(this.timecell[this.timecell.length - 1].endTime);
        }
        this.draw_cells();
    }
    draw_cells() {
        let lastBeginX = 0;//记录上一次结束的位置
        this.timecell.forEach(cell => {
            var px_per_ms = this.canvansW / (this.hours_per_ruler * 60 * 60 * 1000); // px/ms
            var beginX = (cell.beginTime - this.start_timestamp) * px_per_ms;
            var cell_width = (cell.endTime - cell.beginTime) * px_per_ms;
            if (beginX + cell_width < 0) {
                return;
            }
            this.ctx.fillStyle = cell.style.background;
            if (beginX < lastBeginX) {
                this.ctx.fillRect(lastBeginX, 50, cell_width - lastBeginX + beginX, 8);
            } else {
                this.ctx.fillRect(beginX, 50, cell_width, 8);
            }
            lastBeginX = beginX + cell_width;
        });
        if (this.cropping && !this.cropping_isMousedown) {
            this.draw_cropping();
        }
    }
    // 根据时间计算裁剪视频应该绘制的位置
    draw_cropping() {
        var px_per_ms = this.canvansW / (this.hours_per_ruler * 60 * 60 * 1000); // px/ms
        var beginX = (this.CroppingStartTime - this.start_timestamp) * px_per_ms;
        var cell_width = (this.CroppingEndTime - this.CroppingStartTime) * px_per_ms;
        if (beginX + cell_width < 0) {
            return;
        }
        this.leftBracketX = beginX;
        this.rightBracketX = cell_width + beginX;
        // 裁剪视频部分颜色设置
        if (this.cropping) {
            const start2Timestamp = new Date(this.CroppingStartTime).getTime();
            const end2Timestamp = new Date(this.CroppingEndTime).getTime();
            this.ctx.fillStyle = "#06E8EA";
            var px_per_ms1 = this.canvansW / (this.hours_per_ruler * 60 * 60 * 1000); // px/ms
            var beginX1 = (start2Timestamp - this.start_timestamp) * px_per_ms1;
            var cell_width1 = (end2Timestamp - start2Timestamp) * px_per_ms1;
            this.ctx.fillRect(beginX1, 50, cell_width1, 8);
        }
        this.drawBrackets();
    }
    /**
     * 时间轴事件
     */
    add_events() {
        if (this.canvas.addEventListener) {
            this.canvas.addEventListener('wheel', this.mousewheelFunc.bind(this));
            this.canvas.addEventListener('mousedown', this.mousedownFunc.bind(this));
            this.canvas.addEventListener('mousemove', this.mousemoveFunc.bind(this));
            this.canvas.addEventListener('mouseup', this.mouseupFunc.bind(this));
            this.canvas.addEventListener('mouseout', this.mouseoutFunc.bind(this));
            this.canvas.addEventListener('mouseleave', this.mouseleaveFunc.bind(this));
        }
    }
    //修改zoom
    setZoom(zoom) {
        this.zoom = zoom
        var middle_time = this.start_timestamp + (this.hours_per_ruler * 3600 * 1000) / 2; //ms 记住当前中间的时间
        let zoomMap = { 24: 24, 20: 16, 16: 8, 12: 4, 8: 1, 4: 0.5, 1: 0.1 }
        this.hours_per_ruler = zoomMap[this.zoom];
        this.clearCanvas();
        this.start_timestamp = middle_time - (this.hours_per_ruler * 3600 * 1000) / 2; //start_timestamp = 当前中间的时间 - zoom/2
        this.init(true)
    }
    mousewheelFunc(event) {
        if (this.cropping) return;
        if (event && event.preventDefault) {
            event.preventDefault()
        } else {
            window.event.returnValue = false;
            return false;
        }

        var e = window.event || event;
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        let zoom = { 24: 24, 20: 16, 16: 8, 12: 4, 8: 1, 4: 0.5, 1: 0.1 }
        if (delta < 0) {
            if (this.zoom == 1) {
                this.zoom = 4
            } else {
                this.zoom = this.zoom + 4;
            }
            if (this.zoom >= 24) {
                this.zoom = 24;//放大最大24小时
            }
            this.hours_per_ruler = this.zoom;
        } else if (delta > 0) {
            this.zoom = this.zoom - 4;
            if (this.zoom <= 1) {
                this.zoom = 1;//缩小最小1小时
            }
            this.hours_per_ruler = zoom[this.zoom];
        }
        this.clearCanvas();
        if (this.thumimgCB) {
            this.thumimgCB(this.hours_per_ruler);
        }

        this.start_timestamp = this.returnTime - (this.hours_per_ruler * 60 * 60 * 1000) / 2;
        this.init(true)
        if (this.cropping) {
            if (this.returnTime <= this.endTime.getTime()) {
                if (this.zoom == 4 || this.zoom == 1) {
                    if (this.CroppingStartTime.getTime() + this.CroppingEndTime.getTime() >= this.hours_per_ruler * 60 * 60 * 1000) {
                        this.CroppingStartTime = new Date(this.returnTime - (this.hours_per_ruler * 60 * 60 * 1000) / 2);
                        this.CroppingEndTime = new Date(this.returnTime + (this.hours_per_ruler * 60 * 60 * 1000) / 2);
                    }
                } else {
                    if (this.CroppingEndTime.getTime() >= this.endTime.getTime()) {
                        this.CroppingEndTime = new Date(this.endTime);
                    }
                }
            } else {
                this.CroppingStartTime = new Date(this.endTime.getTime() - 30 * 60 * 1000);
                this.CroppingEndTime = new Date(this.endTime);
            }
            this.croppingCallback("start", this.CroppingStartTime);
            this.croppingCallback("end", this.CroppingEndTime);
        }
    }
    /**
     * 拖动/点击 mousedown事件
     */
    mousedownFunc(e) {
        this.g_isMousedown = true;
        console.log("点击", this.g_isMousedown);
        if (this.mouseCB.mousedown) {
            this.mouseCB.mousedown()
        }
        this.g_mousedownCursor = this.get_cursor_x_position(e);//记住mousedown的位置
        if (this.cropping) {
            this.cropping_isMousedown = true;
            const mouseX = e.offsetX;
            // 检测鼠标是否在左边框
            if (mouseX >= this.leftBracketX - 20 && mouseX <= this.leftBracketX) {
                this.isResizingLeft = true;
                this.canvas.classList.add('dragging'); // 更改鼠标样式
                this.DragCropping = true;
            }
            // 检测鼠标是否在右边框
            if (mouseX >= this.rightBracketX && mouseX <= this.rightBracketX + 20) {
                this.isResizingRight = true;
                this.canvas.classList.add('dragging'); // 更改鼠标样式
                this.DragCropping = true;
            }
        }
    }

    /**
     * 拖动/鼠标hover显示 mousemove事件
     */
    mousemoveFunc(e) {
        if (this.g_isMousedown) {
            if (!this.DragCropping) {
                var pos_x = this.get_cursor_x_position(e);
                var px_per_ms = this.canvansW / (this.hours_per_ruler * 60 * 60 * 1000); // px/ms
                this.clearCanvas();
                var diff_x = pos_x - this.g_mousedownCursor;
                this.start_timestamp = this.start_timestamp - Math.round(diff_x / px_per_ms);
                this.init(true);
                this.g_isMousemove = true;
                this.g_mousedownCursor = pos_x;
            } else {
                if (this.cropping) {
                    var pos_x = this.get_cursor_x_position(e);
                    var px_per_ms = this.canvansW / (this.hours_per_ruler * 60 * 60 * 1000); // px/ms
                    var diff_x = pos_x - this.g_mousedownCursor;
                    if (this.isResizingLeft) {
                        const mouseX = e.offsetX;
                        // 限制左边框不能超过右边框
                        if (mouseX > 20 && mouseX < this.rightBracketX) {
                            this.leftBracketX = mouseX;
                        }
                        this.CroppingStartTime = new Date(this.CroppingStartTime).getTime() + Math.round(diff_x / px_per_ms);
                    } else if (this.isResizingRight) {
                        const mouseX = e.offsetX;
                        // 限制右边框不能超过左边框
                        if (mouseX < this.canvas.width - 20 && mouseX > this.leftBracketX) {
                            this.rightBracketX = mouseX;
                        }
                        this.CroppingEndTime = new Date(this.CroppingEndTime).getTime() + Math.round(diff_x / px_per_ms);
                    }
                    if (new Date(this.CroppingEndTime).getTime() > this.endTime.getTime()) {
                        this.CroppingEndTime = new Date(this.endTime.getTime());
                    }
                    if (new Date(this.CroppingStartTime).getTime() < this.startTime.getTime()) {
                        this.CroppingStartTime = new Date(this.startTime.getTime());
                    }
                    if (new Date(this.CroppingStartTime).getTime() > this.endTime.getTime()) {
                        this.CroppingStartTime = new Date(this.endTime.getTime() - 30 * 60 * 1000);
                        this.CroppingEndTime = new Date(this.endTime.getTime());
                    }
                    if (this.CroppingEndTime < this.CroppingStartTime) {
                        this.CroppingEndTime = this.CroppingStartTime;
                    }
                    this.g_mousedownCursor = pos_x;
                    this.clearCanvas();
                    this.init(true);
                    this.cropping_isMousedown = false;
                }
            }
            this.mouseCB.mousemove();
        }
    }

    /**
     * 拖动/点击 mouseup事件
     */
    mouseupFunc(e) {
        console.log("抬起", this.g_isMousemove);
        if (this.g_isMousemove) { //拖动 事件
            this.returnTime = this.start_timestamp + (this.hours_per_ruler * 3600 * 1000) / 2;
            if (this.mouseCB.mouseup) {
                console.log("this.mouseCB.mouseup", this.mouseCB.mouseup);
                this.mouseCB.mouseup(this.returnTime)
            }
        }

        if (this.cropping) {
            if (this.isResizingLeft) {
                this.CroppingStartTime = new Date(this.CroppingStartTime);
                this.croppingCallback("start", this.CroppingStartTime);
            } else if (this.isResizingRight) {
                this.CroppingEndTime = new Date(this.CroppingEndTime);
                this.croppingCallback("end", this.CroppingEndTime);
            } else {
                if (this.returnTime >= this.endTime.getTime() || this.endTime.getTime() - this.returnTime < 30 * 60 * 1000) {
                    this.CroppingStartTime = new Date(this.endTime.getTime() - 30 * 60 * 1000);
                    this.CroppingEndTime = new Date(this.endTime);
                } else {
                    // 向右拖动，限制裁剪视频的结束时间，不能超过录像数据
                    if (this.endTime.getTime() - this.returnTime > this.hours_per_ruler * 60 * 60 * 1000) {
                        this.CroppingEndTime = new Date(this.returnTime + (this.hours_per_ruler * 60 * 60 * 1000) / 2);
                    } else {
                        this.CroppingEndTime = new Date(this.returnTime + 30 * 60 * 1000);
                    }
                    // 向左拖动，拖动的时间，是不是小于开始时间，导致根本没数据
                    if (this.returnTime <= new Date(this.timecell[0].beginTime).getTime()) {
                        this.CroppingStartTime = new Date(this.timecell[0].beginTime);
                        this.CroppingEndTime = new Date(new Date(this.timecell[0].beginTime).getTime() + 30 * 60 * 1000);
                    } else {
                        this.CroppingStartTime = new Date(this.returnTime);
                    }
                }
            }
            this.croppingCallback("start", this.CroppingStartTime);
            this.croppingCallback("end", this.CroppingEndTime);
            this.cropping_isMousedown = false;
            this.DragCropping = false;
            this.isResizingLeft = false;
            this.isResizingRight = false;
            this.canvas.classList.remove('dragging'); // 恢复鼠标样式
        }
        this.g_isMousemove = false;
        this.g_isMousedown = false;
        // else { // click 事件
        //     this.g_isMousedown = false;
        //     var posx = this.get_cursor_x_position(e); //鼠标距离 px
        //     var ms_per_px = (this.zoom * 3600 * 1000) / this.canvansW; // ms/px
        //     this.returnTime = this.start_timestamp + (posx - 390) * ms_per_px;
        //     this.set_time_to_middle(this.returnTime);
        // }
    }

    /**
     * 鼠标移出隐藏时间 mouseout事件
     * @param {*} e 
     */
    mouseoutFunc(e) {
        if (this.g_isMousedown) {
            this.mouseupFunc(e)
        }
    }
    mouseleaveFunc(e) {
        if (this.cropping) {
            this.cropping_isMousedown = false;
            this.DragCropping = false;
            this.isResizingLeft = false;
            this.isResizingRight = false;
            this.canvas.classList.remove('dragging'); // 恢复鼠标样式
        }
    }

    /**
     * 滚轮放大缩小，以时间轴中心为准 mousewheel事件
     */
    mousewhs(delta) {
        if (this.cropping) return;
        var middle_time = this.start_timestamp + (this.hours_per_ruler * 3600 * 1000) / 2; //ms 记住当前中间的时间
        let zoom = { 24: 24, 20: 16, 16: 8, 12: 4, 8: 1, 4: 0.5, 1: 0.1 }
        if (delta < 0) {
            if (this.zoom == 1) {
                this.zoom = 4
            } else {
                this.zoom = this.zoom + 4;
            }
            if (this.zoom >= 24) {
                this.zoom = 24;//放大最大24小时
            }
            this.hours_per_ruler = this.zoom;
        } else if (delta > 0) {// 放大
            this.zoom = this.zoom - 4;
            if (this.zoom <= 1) {
                this.zoom = 1;//缩小最小1小时
            }
            this.hours_per_ruler = zoom[this.zoom];
        }
        this.clearCanvas();
        if (this.thumimgCB) {
            this.thumimgCB(this.hours_per_ruler);
        }
        this.start_timestamp = middle_time - (this.hours_per_ruler * 3600 * 1000) / 2; //start_timestamp = 当前中间的时间 - zoom/2
        this.init(true)
    }
    /**
     * 获取鼠标posx
     * @param {*} e 
     */
    get_cursor_x_position(e) {
        var posx = 0;

        if (!e) {
            e = window.event;
        }

        if (e.pageX || e.pageY) {
            posx = e.pageX;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        }

        return posx;
    }
    /**
     * 清除canvas上画的进度条,关闭视频时
     */
    clearLine() {
        this.timecell = [];
        this.clearCanvas();
        this.init(true);
    }
    /**
     * 清除canvas 每次重新绘制需要先清除
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvansW, 150);
    }
    changeTime(time) {
        var newTime = new Date(time);
        var year = newTime.getFullYear();
        var month = newTime.getMonth() + 1;
        if (month < 10) {
            var month = "0" + month;
        }
        var date = newTime.getDate();
        if (date < 10) {
            var date = "0" + date;
        }
        var hour = newTime.getHours();
        if (hour < 10) {
            var hour = "0" + hour;
        }
        var minute = newTime.getMinutes();
        if (minute < 10) {
            var minute = "0" + minute;
        }
        var second = newTime.getSeconds();
        if (second < 10) {
            var second = "0" + second;
        }
        return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
    }
    // 初始化设置开始时间
    set_start_time(time) {
        this.start_timestamp = time - (this.hours_per_ruler * 60 * 60 * 1000) / 2;
    }
    set_time_to_middle(time) {
        if (new Date(time).getTime() >= new Date(this.endTime).getTime()) {
            // 边录边放功能
            if (!this.time_flag) {
                this.time_flag = true;
                this.mouseCB.mouseup(time);
                clearInterval(this.interval);
                this.interval = setInterval(() => {
                    this.mouseCB.mouseup(time);
                }, 1000 * 60);
                setTimeout(() => {
                    this.time_flag = false;
                }, 1000); // 1000毫秒内不会再次执行
            }
        } else {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }
        this.clearCanvas();
        this.returnTime = time;
        this.start_timestamp = time - (this.hours_per_ruler * 60 * 60 * 1000) / 2;
        this.init(true);
    }
    // 点击开启裁剪视频
    IsCropping() {
        if (this.cropping) {
            if (!this.cropping_time_flag) {
                this.cropping_time_flag = true;
                // 裁剪视频的时间，要重新设置
                this.CroppingStartTime = new Date(this.returnTime);
                if (this.endTime.getTime() - this.returnTime >= 30 * 60 * 1000) {
                    var date = new Date(new Date(this.returnTime));
                    this.CroppingEndTime = new Date(date.setMinutes(date.getMinutes() + 30));
                } else {
                    this.CroppingEndTime = new Date(this.endTime);
                }
                this.croppingCallback("start", this.CroppingStartTime);
                this.croppingCallback("end", this.CroppingEndTime);
                this.clearCanvas();
                this.init(true);
                this.draw_cropping();
                setTimeout(() => {
                    this.cropping_time_flag = false;
                }, 1000); // 1000毫秒内不会再次执行
            }
        } else {
            this.clearCanvas();
            this.init(true);
        }
    }
    // 裁剪视频
    drawBrackets() {
        // this.ctx.clearRect(0, 0, this.canvansW, 150);
        this.ctx.strokeStyle = '#FEC403';
        // 绘制左中括号 [
        // 绘制横线
        this.ctx.beginPath();
        this.ctx.lineWidth = 2; // 横线宽度
        this.ctx.moveTo(this.leftBracketX + 8, 15);  // 起点
        this.ctx.lineTo(this.leftBracketX, 15);  // 左上横线
        this.ctx.stroke();
        this.ctx.beginPath();
        // 绘制竖线
        this.ctx.lineWidth = 5; // 竖线宽度
        this.ctx.moveTo(this.leftBracketX, 14);  // 竖线起点
        this.ctx.lineTo(this.leftBracketX, this.canVansH);  // 竖线
        this.ctx.stroke();
        this.ctx.beginPath();
        // 绘制横线
        this.ctx.lineWidth = 2; // 横线宽度
        this.ctx.moveTo(this.leftBracketX + 8, this.canVansH - 1);  // 起点
        this.ctx.lineTo(this.leftBracketX, this.canVansH - 1);  // 左下横线
        this.ctx.stroke();
        // 绘制右中括号 ]
        // 绘制横线
        this.ctx.beginPath();
        this.ctx.lineWidth = 2; // 横线宽度
        this.ctx.moveTo(this.rightBracketX - 8, 15);  // 起点
        this.ctx.lineTo(this.rightBracketX, 15);  // 右上横线
        this.ctx.stroke();
        this.ctx.beginPath();
        // 绘制竖线
        this.ctx.lineWidth = 5; // 竖线宽度
        this.ctx.moveTo(this.rightBracketX, 14);  // 竖线起点
        this.ctx.lineTo(this.rightBracketX, this.canVansH);  // 竖线
        this.ctx.stroke();
        this.ctx.beginPath();
        // 绘制横线
        this.ctx.lineWidth = 2; // 横线宽度
        this.ctx.moveTo(this.rightBracketX - 8, this.canVansH - 1);  // 起点
        this.ctx.lineTo(this.rightBracketX, this.canVansH - 1);  // 右下横线
        this.ctx.stroke();
    }
};
export { TimeSlider }