# 灯绳锁屏组件设计文档

**日期**：2026-04-22  
**项目**：pandaSleepAdmin2.0  
**组件路径**：`src/components/lampLock/index.vue`

---

## 一、问题与目标

在管理后台整体页面顶部添加一个"灯绳"交互入口，拉动后弹出全屏遮罩（锁屏效果），遮罩中央展示一个带闭眼表情的台灯插画，灯光向下定向照射，营造夜间睡眠氛围，与项目整体"熊猫睡眠"主题呼应。

---

## 二、组件结构

```
src/components/lampLock/
└── index.vue   # 唯一文件：灯绳图标 + 全屏遮罩
```

在 `layout/index.vue` 中引入并放置于模板最顶层，通过 `<Teleport to="body">` 渲染到 body 最外层，与路由/页面完全解耦。

---

## 三、UI 结构

### 3.1 灯绳入口

- **位置**：`position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 9999`
- **外观**：纯 SVG，细竖线（灯线）+ 末端绳结（圆圈+小节），宽约 20px，高约 48px
- **悬停效果**：绳子轻微左右摆动（`@keyframes swing`，±5deg，1.5s infinite）
- **点击效果**：绳子向下拉伸（`scaleY(1.2)`，0.15s）→ 弹回（0.1s）→ 触发遮罩

### 3.2 全屏遮罩

- **层级**：`position: fixed; inset: 0; z-index: 9998`
- **背景**：深蓝夜空渐变，与项目主题一致（`#0b0620 → #130b36`）+ 少量星点装饰
- **锁屏**：遮罩显示时 `pointer-events: all`，背景页面完全不可操作
- **关闭**：点击遮罩任意位置触发关闭动画

### 3.3 台灯插画（内联 SVG，约 200×280px，居中显示）

- **灯罩**：梯形，顶窄底宽，填充暖黄色（`#FCD34D`），描边深色
- **灯柱**：垂直线段，连接灯罩与底座
- **底座**：椭圆形，厚实稳重
- **眼睛**：灯罩正面两条弯弧线（闭眼状态，类似 `~~ ~~`），描边白色
- **光束**：从灯罩底部向下扩散的锥形 SVG polygon，填充半透明琥珀黄渐变（`#FDE68A → transparent`），`filter: blur(6px)`
- **地面光斑**：光束末端椭圆形 `radial-gradient`，模拟光打地面

---

## 四、动画规格

| 动作 | 动画参数 |
|------|---------|
| 遮罩滑入 | `translateY(-100%) → translateY(0)`，0.6s，`cubic-bezier(0.34, 1.2, 0.64, 1)` 含回弹 |
| 遮罩滑出（关闭） | `translateY(0) → translateY(-100%)`，0.45s，`ease-in` |
| 灯光闪烁 | `opacity: 0.5 ↔ 1.0`，2.5s，`ease-in-out infinite` |
| 灯绳悬停摆动 | `rotate: -5deg ↔ 5deg`，1.5s，`ease-in-out infinite` |
| 灯绳点击下拉 | `scaleY(1.2)`，0.15s → 弹回 0.1s |

> 回弹效果通过 `cubic-bezier(0.34, 1.2, 0.64, 1)` 贝塞尔曲线实现，无需额外关键帧。

---

## 五、技术实现要点

- **渲染方式**：`<Teleport to="body">` 保证遮罩不受父级 `overflow: hidden` / `z-index` 影响
- **状态**：单个 `ref<boolean> isLocked` 控制显隐
- **样式**：`<style scoped>`，所有动画用 CSS `@keyframes`，无 JS 动画库依赖
- **兼容性**：不依赖 Element Plus 组件，纯 Vue 3 + CSS

---

## 六、接入方式

在 `src/layout/index.vue` 中：

```vue
import LampLock from '@/components/lampLock/index.vue'

<template>
  <div class="admin-layout">
    <LampLock />   <!-- Teleport 到 body，不影响布局 -->
    <!-- 其余 layout 结构不变 -->
  </div>
</template>
```
