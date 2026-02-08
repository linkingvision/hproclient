# macOS 版本打包流程

## 1. 操作系统

macOS 10.15+ (Catalina 或更高版本)

## 2. Node.js & npm

```bash
node --version    # v22.18.0
npm --version     # v10.9.3
```

## 3. 安装依赖
```bash
npm install
```

## 4. 镜像源配置（国内网络推荐）

### 方式一：npm 配置（永久）
```bash
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/
```

### 方式二：环境变量（临时）
```bash
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

## 5. Electron 打包

### 5.1 执行打包命令
```bash
npm run build
```

### 5.2 构建异常时的完整重来流程
```bash
rm -rf release
rm -rf node_modules
rm -f package-lock.json
rm -rf ~/Library/Caches/electron
rm -rf ~/Library/Caches/electron-builder
npm cache clean --force
npm install
npm run build
```

### 5.3 构建产物说明

打包完成后，输出目录一般为：
```
release/
├── hproclient-mac-1.1.0202.26.dmg
├── mac/
│   └── Hpro.app
└── ...
```

