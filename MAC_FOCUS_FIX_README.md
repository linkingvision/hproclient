# Mac 焦点问题修复说明

## 问题描述
在 Mac 平台上，当从 page 窗口切换到 header 窗口时，需要点击两次才能正常聚焦和操作 tab 切换功能。

## 解决方案
针对 Mac 平台的窗口焦点管理机制，我们实施了以下修复：

### 1. 窗口配置优化
- 为所有窗口添加 `acceptFirstMouse: true` 配置，允许第一次点击就激活窗口
- 设置 `skipTaskbar: false` 确保窗口在任务栏中正确显示

### 2. 焦点管理增强
- 在窗口显示后添加延迟聚焦机制
- 使用 `app.focus({ steal: true })` 强制激活应用
- 在切换标签时主动调用 `focus()` 方法

### 3. 新增 IPC 处理器
添加了 `mac-focus-fix` IPC 处理器，可以在渲染进程中调用来强制修复焦点问题：

```javascript
// 在渲染进程中使用
ipcRenderer.send('mac-focus-fix');
```

## 修改的文件
- `electron/main/index.ts` - 主要的焦点修复逻辑
- `electron/main/window_pool_manager.ts` - 窗口池配置优化

## 使用建议
如果在某些情况下仍然遇到焦点问题，可以在渲染进程的适当位置（如鼠标进入 header 区域时）调用 `mac-focus-fix` IPC 消息来主动修复焦点。

## 兼容性
所有修改都使用了 `process.platform === 'darwin'` 条件判断，只在 Mac 平台生效，不会影响 Windows 和 Linux 平台的正常运行。