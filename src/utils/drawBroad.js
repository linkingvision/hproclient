class RectangleSelector {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas not found', canvasId);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.start = null;
    this.end = null;
    this.isDrawing = false;

    //canvas自身的宽高
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;

    // 配置选项
    this.strokeStyle = options.strokeStyle || '#000';
    this.fillStyle = options.fillStyle || 'rgba(255,255,255,0.1)';
    this.lineWidth = options.lineWidth || 1;
    this.onDrawStart = options.onDrawStart || null;
    this.onDrawing = options.onDrawing || null;
    this.onDrawEnd = options.onDrawEnd || null;

    this._bindEvents();
  }

  _bindEvents() {
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);

    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseup', this._onMouseUp);
  }
  // 添加启用方法
  enable() {
    this.enabled = true;
    this.canvas.style.cursor = 'crosshair';
  }

  // 添加禁用方法
  disable() {
    this.enabled = false;
    this.canvas.style.cursor = 'default';
    this.clear();
  }

  _getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  _onMouseDown(e) {
    if (!this.enabled) return;
    const coords = this._getCanvasCoords(e);
    this.start = {
      x: Math.max(0, Math.min(coords.x, this.canvasWidth)),
      y: Math.max(0, Math.min(coords.y, this.canvasHeight))
    };
    this.isDrawing = true;

    if (this.onDrawStart) {
      this.onDrawStart(this.start);
    }
  }

  _onMouseMove(e) {
    if (!this.isDrawing) return;

    const coords = this._getCanvasCoords(e);
    this.end = {
      x: Math.max(0, Math.min(coords.x, this.canvasWidth)),
      y: Math.max(0, Math.min(coords.y, this.canvasHeight))
    };

    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制矩形

    const x1 = Math.min(this.start.x, this.end.x);
    const y1 = Math.min(this.start.y, this.end.y);
    const x2 = Math.max(this.start.x, this.end.x);
    const y2 = Math.max(this.start.y, this.end.y);
    const width = x2 - x1;
    const height = y2 - y1;

    if (width > 0 && height > 0) {
      if (this.fillStyle) {
        this.ctx.fillStyle = this.fillStyle;
        this.ctx.fillRect(x1, y1, width, height);
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = this.strokeStyle;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeRect(x1, y1, width, height);

      if (this.onDrawing) {
        this.onDrawing(this.start, this.end);
      }
    }

  }

  _onMouseUp() {
    if (!this.enabled) return;
    if (!this.isDrawing) return;

    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.onDrawEnd && this.start && this.end) {
      const rect = this._getRect();
      if (rect && rect.width > 5 && rect.height > 5) {
        this.onDrawEnd(rect);
      }
    }

    // 重置状态
    this.start = null;
    this.end = null;
    this.isDrawing = false;
  }

  _getRect() {
    if (!this.start || !this.end) return null;

    return {
      x: Math.min(this.start.x, this.end.x),
      y: Math.min(this.start.y, this.end.y),
      width: Math.abs(this.end.x - this.start.x),
      height: Math.abs(this.end.y - this.start.y),
      start: this.start,
      end: this.end
    };
  }

  // 获取当前绘制的矩形（如果正在绘制）
  getCurrentRect() {
    if (!this.isDrawing || !this.start || !this.end) return null;
    return this._getRect();
  }

  // 手动清除画布
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.start = null;
    this.end = null;
    this.isDrawing = false;
  }
  // 更新 canvas 尺寸（当父容器大小变化时调用）
  updateSize() {
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
  }

  // 销毁实例，移除事件监听
  destroy() {
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.clear();
  }
}

let rectangleSelectorInstance = null;
let currentCanvasId = null;

export function initRectangleSelector(canvasId, options) {
  if (rectangleSelectorInstance) {
    rectangleSelectorInstance.destroy();
    rectangleSelectorInstance = null;
  }
  currentCanvasId = canvasId;
  rectangleSelectorInstance = new RectangleSelector(canvasId, options);
  rectangleSelectorInstance.disable();
  return rectangleSelectorInstance;
}

export function enableRectangleSelector() {
  if (rectangleSelectorInstance) {
    rectangleSelectorInstance.enable();
  }
}

export function disableRectangleSelector() {
  if (rectangleSelectorInstance) {
    rectangleSelectorInstance.disable();
  }
}

export function destroyRectangleSelector() {
  if (rectangleSelectorInstance) {
    rectangleSelectorInstance.destroy();
    rectangleSelectorInstance = null;
    currentCanvasId = null;
  }
}

export function updateRectangleSelectorSize() {
  if (rectangleSelectorInstance && currentCanvasId) {
    const canvas = document.getElementById(currentCanvasId);
    if (canvas) {
      rectangleSelectorInstance.canvasWidth = canvas.width;
      rectangleSelectorInstance.canvasHeight = canvas.height;
      rectangleSelectorInstance.updateSize();
    }
  }
}

export { RectangleSelector } 