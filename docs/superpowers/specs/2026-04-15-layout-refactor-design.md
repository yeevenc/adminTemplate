# Layout Refactor Design

**Date:** 2026-04-15  
**Feature:** el-container layout + tag bar + keep-alive

---

## Problem

Current layout uses custom CSS flexbox with a `position: fixed` sidebar and `margin-left` offset on `.layout-main`. The header shows a breadcrumb. No multi-tab navigation or keep-alive exists.

## Goals

1. Replace custom layout with `el-container` / `el-aside` / `el-header` / `el-main` Element Plus components.
2. Replace breadcrumb in header with a dedicated tag bar row (below the header) using `el-tag` pill style.
3. Enable keep-alive for pages that have a route `name`, caching them as long as their tab is open.

---

## Architecture

```
el-container [direction=horizontal, full height]
  el-aside [width=240px | 64px collapsed]
    Sidebar.vue
  el-container [direction=vertical]
    el-header [height=64px]
      Header.vue (theme controls + user dropdown — no breadcrumb)
    TagBar.vue  [height=40px, own row]
    el-main
      <KeepAlive :include="cachedViews">
        <RouterView />
      </KeepAlive>

bg-scene (position:fixed, z-index:0, nebula clouds — unchanged)
```

---

## Components

### `src/layout/index.vue`

- Replace `<div class="admin-layout">` shell with `<el-container>`.
- Replace `<aside>` / `.layout-main` with `el-aside` + inner `el-container`.
- Keep `bg-scene` div (position:fixed nebula, unchanged).
- Add `<TagBar />` between `el-header` and `el-main`.
- Wrap `<RouterView />` with `<KeepAlive :include="cachedViews">`.
- `cachedViews` comes from the tabs store computed.

### `src/layout/components/Sidebar.vue`

Migrate from custom `<aside>` + `<button>` menu to `el-menu`:

- `<el-menu :collapse="state.collapsed" :default-active="route.path" @select="onSelect">`
- `<el-menu-item index="/path">` for leaf routes.
- `<el-sub-menu index="group-id">` for groups with `<el-menu-item>` children.
- Keep the logo section and collapse toggle button (custom, below el-menu).
- Keep inline SVG icons via the `#title` slot of `el-menu-item`.
- CSS variable overrides to apply glass theme over el-menu defaults:
  - `--el-menu-bg-color: transparent`
  - `--el-menu-hover-bg-color: var(--glass-hover)`
  - `--el-menu-active-color: var(--color-primary)`
  - `--el-menu-item-height: 44px`
- `buildMenuTree()` logic preserved; navigation via `@select` handler calling `router.push`.

### `src/layout/components/Header.vue`

- Remove the breadcrumb section (`.header-left` icon + nav).
- Keep all right-side controls (color picker, dark/light toggle, user dropdown) unchanged.
- Header becomes right-aligned controls only (or left can show a logo/title if desired).

### `src/layout/components/TagBar.vue` *(new)*

```
[ dashboard × ]  [ 用户管理 × ]  [ 设备管理 × ]  ...
```

- Fixed height 40px, horizontal scrollable on overflow.
- Reads `tabs` from `useTabs()` store.
- Each tab renders as `<el-tag :closable="tab.closable" @click="navigateTo(tab)" @close="closeTab(tab)">`.
- Active tab: `type="primary"` with glow effect; inactive: `type="info"`.
- Close action: removes tab from store, navigates to adjacent tab (prefer right, fallback left).
- Dashboard tab (name=`'dashboard'`): `closable=false`.
- Applies glass background + border styling to match the theme.

### `src/stores/tabs.ts` *(new)*

Module-level reactive state (same pattern as `stores/theme.ts`):

```typescript
interface TabItem {
  name: string      // route name — used for KeepAlive :include
  title: string     // display label from route.meta.title
  path: string      // full path for router.push
  closable: boolean // false for dashboard
}
```

Exports:
- `useTabs()` → `{ tabs, activeTab, cachedViews, addTab, removeTab, setActive }`
- `cachedViews`: `computed(() => tabs.value.map(t => t.name))` — feeds KeepAlive

Logic:
- `addTab(route)`: adds if not already in list; sets as active. Skips routes without `name` or with `meta.hidden`.
- `removeTab(name)`: removes tab; if it was active, navigates to adjacent tab.
- `setActive(name)`: updates active without adding.
- Initialized with the dashboard tab on store creation.

### `src/router/index.ts`

- Add `name` field to all layout children routes (already done for `dashboard`).
- Future routes must include `name` to participate in keep-alive.
- No `meta.keepAlive` flag needed — having a `name` is sufficient.

### View components (`defineOptions`)

- Each view under `src/views/` that should be keep-alived must declare `defineOptions({ name: '<routeName>' })` matching its route `name`.
- Currently only `home/index.vue` (name: `'dashboard'`).
- Error/login pages (`/login`, `/404`, `/500`) are outside the layout and excluded from keep-alive.

---

## Data Flow

```
Route change
  → router.beforeEach (existing auth guard)
  → layout/index.vue <RouterView> activates
  → watch(route) in layout calls addTab(route)
  → tabs store updates → cachedViews recomputes
  → KeepAlive :include updates → component is cached
  → TagBar re-renders with updated tabs list
```

---

## Keep-Alive Behavior

- KeepAlive `include` = array of route names of currently open tabs.
- Component is cached as long as its tab exists.
- When a tab is closed, its name is removed from `cachedViews`, component is destroyed.
- Vue requires the component's `name` option to match the string in `include`. All view components must use `defineOptions({ name: routeName })`.

---

## Styling Notes

- `el-aside` width controlled by `:style="{ width: state.collapsed ? '64px' : '240px' }"`.
- Transition on width: keep existing `transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1)`.
- `el-main` needs `padding: 24px` and `overflow-y: auto` (override el-main defaults).
- `el-header` height: `64px` (override default).
- TagBar height: `40px`, `background: var(--glass-bg)`, `border-bottom: 1px solid var(--glass-border)`.
- `el-tag` overrides: `border-radius: 20px` (pill), custom active color from CSS vars.
- Nebula bg-scene remains `position:fixed` and `z-index:0`; layout components sit at `z-index:1`.

---

## Out of Scope

- Right-click context menu on tags (not requested).
- Tab reordering / dragging.
- Persisting tabs to localStorage.
- Changes to error pages or login page.
- Changes to API/auth layer.
