# Mac Focus Issue Fix Documentation

## Problem Description
On macOS, when switching from the page window to the header window, two clicks are required to gain proper focus and interact with the tab switching functionality.

## Solution
The following fixes have been implemented to accommodate macOS’s native window focus management mechanism:

### 1. Window Configuration Optimization
- Add the `acceptFirstMouse: true` setting to all windows to allow window activation on the initial click
- Set `skipTaskbar: false` to ensure windows are displayed correctly in the taskbar

### 2. Enhanced Focus Management
- Implement a delayed focusing mechanism after windows are displayed
- Invoke `app.focus({ steal: true })` to forcibly activate the application
- Explicitly call the `focus()` method during tab switching

### 3. New IPC Handler Added
A `mac-focus-fix` IPC handler has been added, which can be invoked from the renderer process to forcibly resolve focus issues:

```javascript
// Usage within the renderer process
ipcRenderer.send('mac-focus-fix');
```

## Modified Files
- `electron/main/index.ts` - Core focus repair logic
- `electron/main/window_pool_manager.ts` - Window pool configuration optimization

## Usage Recommendations
If focus issues persist under certain scenarios, send the `mac-focus-fix` IPC message at appropriate points in the renderer process (for example, when the mouse enters the header area) to actively rectify focus abnormalities.

## Compatibility
All modifications are wrapped within the conditional check `process.platform === 'darwin'`. The logic only takes effect on macOS and does not disrupt normal operation on Windows and Linux platforms.