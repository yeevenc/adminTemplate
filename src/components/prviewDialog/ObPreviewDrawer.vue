<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ApiResponseData } from '@/utils/request'
import { previewObRetain, previewObSubscription } from '@/api/operation'
import videoOld from '@/assets/video_old.mp4'
import videoNew from '@/assets/video.mp4'

type PreviewType = 1 | 2

interface PreviewSku {
  id?: number | string
  sku_id?: number | string
  background_default?: string
  background_checked?: string
  checked?: boolean
}

interface PayButton {
  title?: string
  title_color?: string
  bg_color?: string
  notice?: string
  notice_color?: string
  countdown_bg_color?: string
  countdown_color?: string
}

interface PreviewData {
  banner?: string
  bg_img?: string
  ob_video?: number
  style?: number
  background_type?: number
  cancel_icon?: number
  bottomBgColor?: string
  sku_list?: PreviewSku[]
  comment_card?: string[]
  checked_tip?: { checked_img?: string; default_img?: string }
  pay_button?: PayButton
  [key: string]: unknown
}

const drawerVisible = ref(false)
const loading = ref(false)
const type = ref<PreviewType>(1)
const data = ref<PreviewData | null>(null)
const defaultCheckedIndex = ref(0)
const isShowTip = ref(true)
const activeSkuIndex = ref(0)

const skuList = computed(() => data.value?.sku_list || [])
const phoneBodyStyle = computed(() => ({
  background:
    type.value === 1
      ? data.value?.background_type === 0
        ? 'rgba(13, 18, 34, 0.92)'
        : 'rgba(255, 255, 255, 0.96)'
      : data.value?.bottomBgColor || 'linear-gradient(180deg, #0b1220 0%, #111a2f 100%)',
}))

const resetState = () => {
  data.value = null
  defaultCheckedIndex.value = 0
  activeSkuIndex.value = 0
  isShowTip.value = true
}

const fetchData = async (id: number | string) => {
  loading.value = true
  try {
    const res = (
      type.value === 1 ? await previewObSubscription(id) : await previewObRetain(id)
    ) as ApiResponseData<PreviewData>
    data.value = res.data || null
    if (data.value?.sku_list) {
      const idx = data.value.sku_list.findIndex((item) => item.checked === true)
      defaultCheckedIndex.value = idx >= 0 ? idx : 0
      activeSkuIndex.value = defaultCheckedIndex.value
      isShowTip.value = true
    }
  } finally {
    loading.value = false
  }
}

const open = (id: number | string, previewType: PreviewType) => {
  type.value = previewType
  drawerVisible.value = true
  resetState()
  fetchData(id)
}

const handleClose = () => {
  drawerVisible.value = false
  resetState()
}

const skuItemClick = (_item: PreviewSku, index: number) => {
  if (!data.value?.sku_list) return
  data.value.sku_list.forEach((sku) => {
    sku.checked = false
  })
  data.value.sku_list[index].checked = true
  activeSkuIndex.value = index
  isShowTip.value = defaultCheckedIndex.value === index
}

defineExpose({ open })
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    :title="type === 1 ? '订阅页预览' : '挽留预览'"
    size="560px"
    direction="ltr"
    destroy-on-close
    @close="handleClose"
  >
    <div class="preview-drawer" v-loading="loading">
      <div class="phone-stage" v-if="data">
        <div class="iphone-shell">
          <div class="iphone-shadow" />
          <div class="iphone-frame">
            <div class="iphone-camera" />
            <div class="iphone-speaker" />
            <div class="iphone-screen" :style="phoneBodyStyle">
              <div class="screen-content">
                <div class="screen-scroll">
                <template v-if="type === 1">
                  <video
                    v-if="Number(data.ob_video) === 0"
                    :src="videoOld"
                    class="hero-banner"
                    autoplay
                    muted
                  />
                  <video
                    v-if="Number(data.ob_video) === 1"
                    :src="videoNew"
                    class="hero-banner"
                    autoplay
                    muted
                  />
                  <el-image v-if="data.banner" :src="data.banner" fit="cover" class="hero-banner" />
                </template>

                <el-image v-else-if="data.bg_img" :src="data.bg_img" fit="cover" class="hero-banner" />

                <el-image
                  v-if="data.checked_tip && isShowTip && data.checked_tip.checked_img"
                  :src="data.checked_tip.checked_img"
                  fit="cover"
                  class="tip-banner"
                />
                <el-image
                  v-else-if="data.checked_tip && data.checked_tip.default_img"
                  :src="data.checked_tip.default_img"
                  fit="cover"
                  class="tip-banner"
                />

                <div
                  v-if="skuList.length"
                  class="sku-list"
                  :class="{ 'sku-list--column': data.style !== 0 }"
                >
                  <button
                    v-for="(item, index) in skuList"
                    :key="item.id ?? item.sku_id ?? index"
                    type="button"
                    class="sku-item"
                    :class="{ 'is-active': index === activeSkuIndex }"
                    @click="skuItemClick(item, index)"
                  >
                    <img
                      :src="index === activeSkuIndex ? item.background_checked : item.background_default"
                      alt=""
                    >
                  </button>
                </div>

                <template v-if="type === 1">
                  <!-- <el-image
                    v-if="Number(data.background_type) === 0"
                    src="https://hwcdn.navoinfo.cn/resource/sleep/uploads/202405/6639ea175e4c3.png"
                    fit="cover"
                    class="bottom-banner"
                  />
                  <el-image
                    v-else
                    src="https://hwcdn.navoinfo.cn/resource/sleep/uploads/202406/665d6cc41f786.png"
                    fit="cover"
                    class="bottom-banner"
                  /> -->

                  <el-carousel
                    v-if="Array.isArray(data.comment_card) && data.comment_card.length"
                    :interval="3000"
                    height="60px"
                    loop
                    arrow="never"
                    indicator-position="none"
                    class="comment-carousel"
                  >
                    <el-carousel-item v-for="item3 in data.comment_card" :key="item3">
                      <img class="comment-card" :src="item3" />
                    </el-carousel-item>
                  </el-carousel>

                </template>

                <template v-else>
                </template>
                </div>

                <div class="screen-fixed-bottom">
                  <template v-if="type === 1">
                    <el-image
                      v-if="Number(data.background_type) === 0 && data.cancel_icon"
                      src="https://hwcdn.navoinfo.cn/resource/sleep/uploads/202406/665d63f8af6ef.png"
                      fit="cover"
                      class="footer-banner"
                    />
                    <el-image
                      v-else-if="Number(data.background_type) === 0"
                      src="https://hwcdn.navoinfo.cn/resource/sleep/uploads/202405/6639fac8f2920.png"
                      fit="cover"
                      class="footer-banner"
                    />
                    <el-image
                      v-else-if="data.cancel_icon"
                      src="https://hwcdn.navoinfo.cn/resource/sleep/uploads/202406/665d6b5deb0f1.png"
                      fit="cover"
                      class="footer-banner"
                    />
                    <el-image
                      v-else
                      src="https://hwcdn.navoinfo.cn/resource/sleep/uploads/202406/665d6b6c8a2df.png"
                      fit="cover"
                      class="footer-banner"
                    />
                  </template>

                  <template v-else>
                    <div v-if="data.pay_button" class="pay-panel" :style="{ background: data.bottomBgColor }">
                      <div class="pay-notice" :style="{ color: data.pay_button.notice_color }">
                        {{ data.pay_button.notice }}
                      </div>
                      <div class="countdown">
                        <div class="countdown-box" :style="{ background: data.pay_button.countdown_bg_color, color: data.pay_button.countdown_color }">10</div>
                        <div class="countdown-sep" :style="{ color: data.pay_button.countdown_color }">:</div>
                        <div class="countdown-box" :style="{ background: data.pay_button.countdown_bg_color, color: data.pay_button.countdown_color }">11</div>
                        <div class="countdown-sep" :style="{ color: data.pay_button.countdown_color }">:</div>
                        <div class="countdown-box" :style="{ background: data.pay_button.countdown_bg_color, color: data.pay_button.countdown_color }">23</div>
                      </div>
                      <div class="pay-button" :style="{ background: data.pay_button.bg_color, color: data.pay_button.title_color }">
                        {{ data.pay_button.title }}
                      </div>
                      <div class="agreement-row">
                        <el-radio :model-value="true" disabled style="margin:0" />
                        <span>开通前请阅读《会员协议》和《自动续订协议》</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else-if="!loading" description="暂无预览数据" />
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

.iphone-speaker {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  z-index: 3;
}

.iphone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 32px;
  overflow: hidden;
  border: 1px solid rgba(12, 18, 30, 0.55);
}

.screen-content {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.screen-scroll {
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.18) 100%);
  padding-bottom: 12px;
}

.screen-scroll::-webkit-scrollbar {
  width: 0;
}

.screen-fixed-bottom {
  position: sticky;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 2;
}

.hero-banner,
.tip-banner,
.bottom-banner,
.footer-banner {
  display: block;
  width: 100%;
}

.tip-banner {
  margin-top: 12px;
  height: 56px;
}

.sku-list {
  display: flex;
  padding: 0 14px 0 16px;
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

.comment-carousel {
  margin-top: 8px;
}

.comment-card {
  display: block;
  width: 84%;
  margin: 0 auto 8px;
}

.footer-banner {
  display: block;
  width: 100%;
}

.pay-panel {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 15px;
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
  margin: 14px 0;
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

.countdown-sep {
  font-size: 13px;
}

.pay-button {
  width: 100%;
  border-radius: 50px;
  padding: 10px 0;
  text-align: center;
}

.agreement-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 9px;
  color: #a1a1a1;
}
</style>
