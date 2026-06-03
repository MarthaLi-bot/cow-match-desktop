# cow-match-desktop

## 牛了个牛

原创“牛 / 牧场 / 奶制品”主题 Windows 本地桌面版叠层三消卡槽游戏原型。

### 技术路线

- Electron：本地桌面窗口，入口为 `electron/main.cjs`，加载本地构建产物 `dist/index.html`。
- Vite：安装依赖后用于前端构建；当前云端环境无法从 npm registry 拉取依赖时，`npm run build` 会自动生成一个无依赖 fallback 产物以便验收核心玩法。
- Phaser：主实现位于 `src/game/PastureScene.ts`，负责棋盘渲染、叠层遮挡、卡槽、消除、胜负判定和动画。

### 本地运行

```bash
npm install
npm run desktop
```

`npm run desktop` 会先执行 `npm run build`，然后启动 Electron 桌面窗口。应用不联网、不登录、不使用数据库、不读取用户本地文件。

### 构建

```bash
npm run build
```

### 第一阶段验收点

- 开始界面与关卡选择界面。
- 3 个测试关卡：晨光草场、奶香小路、暖黄谷仓。
- 多层叠放图块，并只允许点击未被上层遮挡的图块。
- 点击图块进入底部 7 格卡槽。
- 卡槽中 3 个相同牧场图标自动消除。
- 卡槽满且无法消除时失败。
- 所有图块消除后胜利。
- 游戏内提供重新开始和返回选关按钮。
- 包含 12 种本地原创 SVG 图标：cow、milk、bell、grass、cheese、barn、hoof、flower、hen、corgi、goose、farmer。
