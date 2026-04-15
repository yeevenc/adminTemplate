import { reactive, computed } from 'vue'

const STORAGE_KEY = 'panda-sleep-admin:theme'

export interface ThemePreset {
  id: string
  name: string
  color: string
}

export const THEMES: ThemePreset[] = [
  { id: 'purple', name: '星夜紫', color: '#8B5CF6' },
  { id: 'blue',   name: '月光蓝', color: '#3B82F6' },
  { id: 'indigo', name: '星河靛', color: '#6366F1' },
  { id: 'teal',   name: '极光绿', color: '#14B8A6' },
  { id: 'pink',   name: '流星粉', color: '#EC4899' },
]

// ─── Color math helpers ────────────────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function toHexStr(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
}

/** El Plus light-N: channel + (255 - channel) * N * 0.1 */
function elLight(hex: string, n: number): string {
  const [r, g, b] = parseHex(hex)
  return toHexStr(r + (255 - r) * n * 0.1, g + (255 - g) * n * 0.1, b + (255 - b) * n * 0.1)
}

/** El Plus dark-N: channel * (1 - N * 0.1) */
function elDark(hex: string, n: number): string {
  const [r, g, b] = parseHex(hex)
  return toHexStr(r * (1 - n * 0.1), g * (1 - n * 0.1), b * (1 - n * 0.1))
}

function mixWithWhite(hex: string, ratio: number): string {
  const [r, g, b] = parseHex(hex)
  return toHexStr(r + (255 - r) * ratio, g + (255 - g) * ratio, b + (255 - b) * ratio)
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function computeGradient(hex: string, dark: boolean): string {
  const [r, g, b] = parseHex(hex)
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`

  if (dark) {
    // Deep, color-tinted dark background with two radial glow orbs
    const s0 = toHexStr(r * 0.08, g * 0.07, b * 0.14)
    const s1 = toHexStr(r * 0.15, g * 0.12, b * 0.24)
    const s2 = toHexStr(r * 0.10, g * 0.09, b * 0.18)
    return [
      `radial-gradient(ellipse 72% 65% at 88% 8%,  ${rgba(0.28)} 0%, transparent 58%)`,
      `radial-gradient(ellipse 58% 72% at 6%  94%, ${rgba(0.20)} 0%, transparent 55%)`,
      `radial-gradient(ellipse 42% 48% at 50% 52%, ${rgba(0.10)} 0%, transparent 52%)`,
      `linear-gradient(145deg, ${s0} 0%, ${s1} 48%, ${s2} 100%)`,
    ].join(', ')
  }

  // Light pastel background with very soft orbs
  const s0 = mixWithWhite(hex, 0.87)
  const s1 = mixWithWhite(hex, 0.93)
  const s2 = mixWithWhite(hex, 0.89)
  return [
    `radial-gradient(ellipse 72% 65% at 88% 8%,  ${rgba(0.09)} 0%, transparent 58%)`,
    `radial-gradient(ellipse 58% 72% at 6%  94%, ${rgba(0.07)} 0%, transparent 55%)`,
    `linear-gradient(145deg, ${s0} 0%, ${s1} 48%, ${s2} 100%)`,
  ].join(', ')
}

// ─── localStorage ─────────────────────────────────────────────────────────────

function loadStored(): { mode: 'dark' | 'light'; primaryColor: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveStored(mode: 'dark' | 'light', primaryColor: string) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, primaryColor })) } catch { /* noop */ }
}

// ─── Reactive state ────────────────────────────────────────────────────────────

const stored = loadStored()

const state = reactive({
  mode: (stored?.mode ?? 'dark') as 'dark' | 'light',
  primaryColor: stored?.primaryColor ?? THEMES[0].color,
  collapsed: false,
  menuTitle: '数据概览',
})

// ─── applyTheme ────────────────────────────────────────────────────────────────

export function applyTheme() {
  const hex = state.primaryColor
  const isDark = state.mode === 'dark'
  const root = document.documentElement

  // El Plus primary color system — all derived vars so El Plus components follow the theme
  root.style.setProperty('--el-color-primary',         hex)
  root.style.setProperty('--el-color-primary-dark-2',  elDark(hex, 2))
  root.style.setProperty('--el-color-primary-light-3', elLight(hex, 3))
  root.style.setProperty('--el-color-primary-light-5', elLight(hex, 5))
  root.style.setProperty('--el-color-primary-light-7', elLight(hex, 7))
  root.style.setProperty('--el-color-primary-light-8', elLight(hex, 8))
  root.style.setProperty('--el-color-primary-light-9', elLight(hex, 9))

  // Custom vars used by our components
  root.style.setProperty('--color-primary',       hex)
  root.style.setProperty('--color-primary-light', mixWithWhite(hex, 0.3))
  root.style.setProperty('--color-glow',          hexToRgba(hex, 0.35))
  root.style.setProperty('--gradient-bg',         computeGradient(hex, isDark))

  if (isDark) {
    root.style.setProperty('--glass-bg',     'rgba(255,255,255,0.055)')
    root.style.setProperty('--glass-border', 'rgba(255,255,255,0.10)')
    root.style.setProperty('--glass-hover',  'rgba(255,255,255,0.09)')
    root.style.setProperty('--glass-active', 'rgba(255,255,255,0.14)')
    root.style.setProperty('--glass-card',   'rgba(255,255,255,0.05)')
    root.style.setProperty('--text-primary',   '#F1F5F9')
    root.style.setProperty('--text-secondary', '#94A3B8')
    root.style.setProperty('--text-muted',     '#64748B')
    root.style.setProperty('--divider', 'rgba(255,255,255,0.08)')
    // Clouds: white wisps visible on dark; nebulae brighter
    root.style.setProperty('--cloud-nebula-op',   '0.24')
    root.style.setProperty('--cloud-wisp-color',  'rgba(255,255,255,0.08)')
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.style.setProperty('--glass-bg',     'rgba(255,255,255,0.60)')
    root.style.setProperty('--glass-border', 'rgba(255,255,255,0.80)')
    root.style.setProperty('--glass-hover',  'rgba(255,255,255,0.78)')
    root.style.setProperty('--glass-active', 'rgba(255,255,255,0.88)')
    root.style.setProperty('--glass-card',   'rgba(255,255,255,0.55)')
    root.style.setProperty('--text-primary',   '#1E1B4B')
    root.style.setProperty('--text-secondary', '#4C4B7A')
    root.style.setProperty('--text-muted',     '#6B7280')
    root.style.setProperty('--divider', 'rgba(0,0,0,0.07)')
    // Clouds: color-tinted wisps on light; nebulae softer
    root.style.setProperty('--cloud-nebula-op',   '0.13')
    root.style.setProperty('--cloud-wisp-color',  hexToRgba(hex, 0.07))
    root.classList.add('light')
    root.classList.remove('dark')
  }

  saveStored(state.mode, state.primaryColor)
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function setCustomPrimary(hex: string) {
  state.primaryColor = hex
  applyTheme()
}

export function useTheme() {
  const currentPreset = computed(() => ({
    color: state.primaryColor,
    light: mixWithWhite(state.primaryColor, 0.3),
    glow:  hexToRgba(state.primaryColor, 0.35),
  }))

  function setMode(mode: 'dark' | 'light') {
    state.mode = mode
    applyTheme()
  }

  function setTheme(id: string) {
    const preset = THEMES.find(t => t.id === id)
    if (preset) { state.primaryColor = preset.color; applyTheme() }
  }

  function toggleCollapse() { state.collapsed = !state.collapsed }

  function setMenuTitle(title: string) { state.menuTitle = title }

  return { state, currentPreset, THEMES, setMode, setTheme, toggleCollapse, setMenuTitle }
}
