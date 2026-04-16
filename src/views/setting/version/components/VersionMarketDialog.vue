<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { VersionUpgradeLatestConfig } from '@/views/setting/version/types'

const props = defineProps<{
  modelValue: boolean
  config: VersionUpgradeLatestConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: VersionUpgradeLatestConfig]
}>()

const form = reactive<VersionUpgradeLatestConfig>({
  ios: '',
  huawei: '',
  other: '',
})

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      return
    }

    Object.assign(form, props.config)
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:modelValue', false)
}

function handleSubmit() {
  emit('submit', {
    ios: form.ios.trim(),
    huawei: form.huawei.trim(),
    other: form.other.trim(),
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="最新版本号配置"
    width="60%"
    destroy-on-close
    @close="closeDialog"
  >
  <el-alert title="提示" type="warning" description="当前配置为各渠道市场最新版本号。
      弱提示升级会基于客户端记录的版本号与这里的配置做对比，不一致时只提示一次。" :closable="false" />
    <el-form label-position="left" label-width="auto" class="m-t-10">
      <el-form-item label="iOS">
        <el-input v-model="form.ios" placeholder="请输入该渠道当前市场最新版本号，如 4.5.8" />
      </el-form-item>

      <el-form-item label="华为">
        <el-input v-model="form.huawei" placeholder="请输入该渠道当前市场最新版本号，如 4.5.8" />
      </el-form-item>

      <el-form-item label="安卓其他">
        <el-input v-model="form.other" placeholder="请输入该渠道当前市场最新版本号，如 4.5.8" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
</style>
