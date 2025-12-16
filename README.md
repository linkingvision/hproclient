# hproclient

🥳 `Electron` + `Vue` + `Vite`

## Node Version

```sh

node -v
v20.19.1

```

## Quick Setup

```sh

# install dependency
npm install

# develop
npm run dev
```

## Directory

```diff
hproclient/
├── src/
│   ├── main/                 # Electron 主进程
│   ├── renderer/            # Vue 渲染进程
│   │   ├── components/      # 组件
│   │   ├── views/           # 页面
│   │   ├── stores/          # 状态管理
│   │   ├── utils/           # 工具函数
│   │   └── assets/          # 静态资源
│   └── preload/             # 预加载脚本
├── dist/                    # 构建输出
└── package.json
```
