# 今天也不想干了吗

一款帮助职场人解压的 PWA 小工具。每当你想撂挑子，就来敲一下木鱼——把情绪记录下来，别让它白白消耗你。

## 功能

- **不想干了** — 点击木鱼发泄，累计里程碑解锁专属文案（支持 66、88、233 等特殊数字）
- **小成就** — 记录今天做到的事，正向积累
- **摸鱼计时** — 专注休息，计时摸鱼
- **统计** — 月历热力图 + 近 7 天趋势，回顾你的职场情绪曲线
- **摸鱼证** — 系统自动签发专属证号（`MYZ-XXXXXX`），换设备可凭证号找回历史数据

## 技术栈

- React 19 + Vite 8
- Tailwind CSS v4
- Framer Motion
- Supabase（数据同步，本地优先）
- vite-plugin-pwa（PWA 离线支持）
- 部署于 Cloudflare Pages

## 本地开发

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

> 需要 Node.js >= 20

## 数据说明

数据以 `localStorage` 为主存储，Supabase 作为异步备份。设备标识存储在 `quit_device_id`，无需注册登录。摸鱼证号存储在 `quit_fish_card_no`，可跨设备找回数据。
