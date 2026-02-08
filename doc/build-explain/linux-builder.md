# Linux Ubuntu 版本打包流程

## 1. 操作系统

Ubuntu

## 2. Node.js & npm

```bash
node --version    # v22.18.0
npm --version     # v10.9.3
```

## 3. 系统依赖安装

Electron-builder 在 Linux 下生成 .deb / .rpm 等安装包时，需要以下系统工具：

```bash
sudo apt update
sudo apt install -y \
  fakeroot \
  dpkg \
  libarchive-tools \
  xorriso \
  p7zip-full \
  binutils
```

## 4. 项目依赖安装

进入项目目录：
```bash
cd /home/user/project/hproclient
```

### 4.1 清理旧项目依赖
```bash
rm -rf node_modules
rm -f package-lock.json
npm cache clean --force
```

### 4.2 安装依赖
```bash
npm install
```

## 5. 缓存清理（按需执行）

当构建异常或 Electron 启动失败时，可清理缓存：

```bash
rm -rf ~/.cache/electron
rm -rf ~/.cache/electron-builder
```

## 6. 镜像源配置（国内网络推荐）

### 方式一：npm 配置（永久）
```bash
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/
```

### 方式二：环境变量（临时）
```bash
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

## 7. Electron 打包

### 7.1 执行打包命令
```bash
npm run build
```

### 7.2 构建异常时的完整重来流程
```bash
rm -rf release
rm -rf node_modules
rm -f package-lock.json
rm -rf ~/.cache/electron
rm -rf ~/.cache/electron-builder
npm cache clean --force
npm install
npm run build
```

### 7.3 构建产物说明

打包完成后，输出目录一般为：
```
release/
├── hproclient-linux-1.1.0202.26.deb
├── linux-unpacked/
└── ...
```

## 8. Linux 安装 & 卸载流程（deb 包）

### 8.1 安装 deb 包
```bash
cd release
sudo dpkg -i hproclient-linux-1.1.0202.26.deb
```

### 8.2 验证安装
```bash
which hproclient
```

常见路径：
- `/usr/bin/hproclient`
- `/opt/Hpro/`

### 8.3 卸载方式

#### 使用 apt 卸载（推荐）
```bash
sudo apt remove hproclient
# 或完全清理配置
sudo apt purge hproclient
```

#### 使用 dpkg 卸载
```bash
sudo dpkg -r hproclient
sudo dpkg -P hproclient
```

#### 手动清理残留（必要时）
```bash
sudo rm -rf /opt/Hpro
sudo rm -f /usr/bin/hproclient
```