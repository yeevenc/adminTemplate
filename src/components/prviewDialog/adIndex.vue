<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { getAdvertisingPreview } from '@/api/config'

interface PreviewSkuItem {
  id: number | string
  checked: string | boolean
  background_checked: string
  background_default: string
}

interface PreviewCheckedTip {
  checked_img: string
  default_img: string
}

interface PreviewPayButton {
  notice?: string
  title?: string
  bg_color?: string
  title_color?: string
  countdown_bg_color?: string
  countdown_color?: string
}

interface AdvertisingPreviewData {
  banner?: string
  checked_tip?: PreviewCheckedTip
  sku_list?: PreviewSkuItem[]
  bottom_img?: string
  style?: number
  pay_button?: PreviewPayButton
  contentBgColor?: string
}

const drawerVisible = ref(false)
const loading = ref(false)
// 记录初始默认sku下标，用于checked_tip显示判断
const defaultSkuIndex = ref(-1)
const showCheckedTip = ref(true)
const previewData = ref<AdvertisingPreviewData>({
  pay_button: {},
  sku_list: [],
  contentBgColor:''
})

const skuList = computed(() => previewData.value.sku_list || [])
const payButton = computed(() => previewData.value.pay_button || {})
const phoneBodyStyle = computed(() => ({
  background: previewData.value.banner
    ? previewData.value.contentBgColor
    : 'linear-gradient(180deg, #0b1220 0%, #111a2f 100%)',
}))

const resetState = () => {
  defaultSkuIndex.value = -1
  showCheckedTip.value = true
  previewData.value = {
    pay_button: {},
    sku_list: [],
  }
}

const applyDefaultSku = () => {
  const list = skuList.value
  const defaultIndex = list.findIndex((item) => String(item.checked) === 'true')
  defaultSkuIndex.value = defaultIndex
  showCheckedTip.value = defaultIndex >= 0
}

const fetchPreviewData = async (id: number | string) => {
  loading.value = true

  try {
    const response = await getAdvertisingPreview(Number(id)) as ApiResponseData<AdvertisingPreviewData>
    previewData.value = {
      pay_button: {},
      sku_list: [],
      ...response.data,
    }
    applyDefaultSku()
  } finally {
    loading.value = false
  }
}

// 兼容旧用法：外部可直接传 id 打开并拉取预览数据
const open = async (id: number | string) => {
  drawerVisible.value = true
  await fetchPreviewData(id)
}

// 兼容旧组件命名
const getData = async (id: number | string) => {
  await open(id)
}

const handleSkuClick = (index: number) => {
  const list = previewData.value.sku_list
  if (!list) return
  // 将所有 checked 置为 false，再将选中项置为 true
  list.forEach((item, i) => {
    item.checked = i === index ? 'true' : 'false'
  })
  // 仅当选中的是初始默认项时展示 checked_tip
  showCheckedTip.value = index === defaultSkuIndex.value && defaultSkuIndex.value >= 0
}

const handleClose = () => {
  drawerVisible.value = false
  resetState()
}

defineExpose({
  open,
  getData,
  handleClose,
})
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="全屏预览"
    size="560px"
    destroy-on-close
    direction="ltr"
    @close="handleClose"
  >
    <div class="preview-drawer" v-loading="loading">
      <div class="phone-stage">
        <div class="iphone-shell">
          <div class="iphone-shadow" />
          <div class="iphone-frame">
            <div class="iphone-camera" />
            <div class="iphone-speaker" />
            <div class="iphone-screen" :style="phoneBodyStyle">
              <!-- 可滚动内容区 -->
              <div class="scroll-area">
                <el-scrollbar height="100%">
                  <el-image
                    v-if="previewData.banner"
                    :src="previewData.banner"
                    fit="cover"
                    class="hero-banner"
                  />

                  <el-image
                    v-if="previewData.checked_tip && showCheckedTip"
                    :src="previewData.checked_tip.checked_img"
                    fit="cover"
                    class="tip-banner"
                  />

                  <el-image
                    v-else-if="previewData.checked_tip"
                    :src="previewData.checked_tip.default_img"
                    fit="cover"
                    class="tip-banner"
                  />

                  <div
                    v-if="skuList.length > 1"
                    class="sku-list"
                    :class="{ 'sku-list--column': previewData.style !== 0 }"
                  >
                    <button
                      v-for="(item, index) in skuList"
                      :key="item.id"
                      type="button"
                      class="sku-item"
                      :class="{ 'is-active': String(item.checked) === 'true' }"
                      @click="handleSkuClick(index)"
                    >
                      <img
                        :src="String(item.checked) === 'true' ? item.background_checked : item.background_default"
                        alt=""
                      >
                    </button>
                  </div>

                  <el-image
                    v-if="previewData.bottom_img"
                    :src="previewData.bottom_img"
                    fit="cover"
                    class="bottom-banner"
                  />
                </el-scrollbar>
              </div>

              <!-- 底部固定付款区 -->
              <div class="pay-panel">
                <div class="pay-notice" :style="{ color: payButton.title_color || '#FFFFFF' }">
                  {{ payButton.notice || '限时优惠，仅当前页面预览使用' }}
                </div>

                <!-- <div class="countdown">
                  <div
                    v-for="item in ['10', '11', '23']"
                    :key="item"
                    class="countdown-box"
                    :style="{
                      background: payButton.countdown_bg_color || '#1f2a44',
                      color: payButton.countdown_color || '#ffffff',
                    }"
                  >
                    {{ item }}
                  </div>
                </div> -->

                <div
                  class="pay-button"
                  :style="{
                    background: payButton.bg_color,
                    color: payButton.title_color || '#ffffff',
                  }"
                >
                  {{ payButton.title || '立即开通' }}
                </div>

                <div class="agreement-row">
                  <el-radio :model-value="true" disabled style="margin:0" />
                  <span>开通前请阅读《会员协议》和《自动续订协议》</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.preview-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.preview-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.phone-stage {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 8px 0 24px;
}

.iphone-shell {
  position: relative;
}

.iphone-shadow {
  position: absolute;
  inset: 16px -10px -18px;
  background: radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.22), transparent 60%);
  filter: blur(24px);
  border-radius: 44px;
}

.iphone-frame {
  position: relative;
  width: 320px;
  height: 680px;
  padding: 14px;
  border-radius: 42px;
  background:
    linear-gradient(180deg, #f6f7fb 0%, #dfe4ee 12%, #c7cfdb 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.75),
    inset 0 0 0 5px rgba(17, 24, 39, 0.06),
    0 30px 60px rgba(8, 12, 25, 0.24);
}

.iphone-camera {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 30px;
  border-radius: 16px;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  z-index: 2;
}


.iphone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 32px;
  overflow: hidden;
  border: 1px solid rgba(12, 18, 30, 0.55);
  display: flex;
  flex-direction: column;
}

/* 可滚动内容区，撑满剩余高度 */
.scroll-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.screen-scroll {
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.18) 100%);
}

.screen-scroll::-webkit-scrollbar {
  width: 0;
}

.hero-banner,
.tip-banner,
.bottom-banner {
  display: block;
  width: 100%;
}

.hero-banner {
  /* height: 240px; */
}

.tip-banner {
  margin-top: 12px;
  height: 56px;
}

.sku-list {
  display: flex;
  gap: 10px;
  padding: 16px 14px 8px;
}

.sku-list--column {
  flex-direction: column;
}

.sku-item {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  opacity: 0.84;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.sku-item.is-active {
  opacity: 1;
  transform: translateY(-1px);
}

.sku-item img {
  display: block;
  width: 100%;
  border-radius: 14px;
}

.bottom-banner {
  margin-top: 12px;
  height: 72px;
}

.pay-panel {
  padding: 10px 15px 0px;
  flex-shrink: 0;
}

.pay-notice {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 10px 0;
}

.countdown-box {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.pay-button {
  border-radius: 999px;
  text-align: center;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 700;

}

.agreement-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  font-size: 11px;
  color: #8b93a7;
}
</style>
