# Windows 版本打包流程

## 1. 操作系统

Windows 10/11

## 2. Node.js & npm

```cmd
node --version    # v22.18.0
npm --version     # v10.9.3
```

## 3. 项目依赖安装

进入项目目录：
```cmd
cd C:\project\hproclient
```

### 3.1 清理旧项目依赖
```cmd
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
```

### 3.2 安装依赖
```cmd
npm install
```

## 4. 缓存清理（按需执行）

当构建异常或 Electron 启动失败时，可清理缓存：

```cmd
rmdir /s /q %USERPROFILE%\.cache\electron
rmdir /s /q %USERPROFILE%\.cache\electron-builder
```

## 5. 镜像源配置（国内网络推荐）

### 方式一：npm 配置（永久）
```cmd
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/
```

### 方式二：环境变量（临时）
```cmd
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

## 6. Electron 打包

### 6.1 执行打包命令
```cmd
npm run build
```

### 6.2 构建异常时的完整重来流程
```cmd
rmdir /s /q release
rmdir /s /q node_modules
del package-lock.json
rmdir /s /q %USERPROFILE%\.cache\electron
rmdir /s /q %USERPROFILE%\.cache\electron-builder
npm cache clean --force
npm install
npm run build
```

### 6.3 构建产物说明

打包完成后，输出目录一般为：
```
release/
├── hproclient-win64-1.1.0202.26.exe
├── hproclient-win64-1.1.0202.26.exe.blockmap
├── win-unpacked/
└── ...
```

