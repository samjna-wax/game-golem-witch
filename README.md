# game-golem-witch

在一个架空的中世纪魔法世界里，玩家扮演一名魔女，用符文为哥雷姆编写程序，让它们自动完成生产。编程与自动化是核心玩法，基地建设和冒险作为辅助元素。

## 原型方向

原型完全采用 HTML 开发，方便通过浏览器远程试玩。具体系统在制作和试玩中逐步探索，剧情与最终目标留待以后决定。

地图移动是核心玩法之一。地点是节点，通路是边，哥雷姆可以沿哪些路线移动由通路决定。地点也可以探索多层嵌套，例如在庭院内展开查看中庭和仓库。

## 开场原型

使用 Vue 3 和 Vite。魔力从 0 开始，每次点击房间里的「提炼魔力」增加 1 点。刷新页面可重新开始。

本地运行使用 Node.js 22.12+ 和 npm，先执行 `npm ci`，再执行 `npm run dev`。执行 `npm run build` 会生成可直接在浏览器中打开的单文件 `dist/index.html`。

## 前端技术备选

等原型出现相应需求时，再决定是否引入以下工具。

| 原型需求 | 候选及适用场景 |
| --- | --- |
| 查看地点与通路 | [Cytoscape.js](https://js.cytoscape.org/) 支持图的自动布局、节点交互和嵌套，适合查看相邻地点、高亮移动路线。 |
| 展开与收起区域 | [AntV G6](https://g6.antv.antgroup.com/manual/behavior/collapse-expand) 的 Combo 可以嵌套。收起庭院时仍可看到对外通路，展开后可查看通路连接的具体地点。 |
| 拼接符文指令 | [Blockly](https://docs.blockly.com/guides/get-started/what-is-blockly/) 支持自定义指令块、拖拽拼接和嵌套，适合尝试顺序、条件与循环。 |
| 连线式符文编程 | [Vue Flow](https://vueflow.dev/) 支持自定义节点和连线，适合试验用符文的不同出口连接后续指令。 |
| 哥雷姆与生产动画 | [PixiJS](https://pixijs.com/8.x/guides/getting-started/intro) 可用于绘制沿路搬运的角色、货物和施法效果。 |
| 实时冒险场景 | [Phaser](https://docs.phaser.io/phaser/concepts/scenes) 提供场景管理、摄像机和动画工具，可在需要独立探索场景时考虑。 |
