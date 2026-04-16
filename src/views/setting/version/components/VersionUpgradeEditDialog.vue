<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { VERSION_CHANNEL_OPTIONS } from '@/constants/version'
import type { VersionUpgradeChannel, VersionUpgradeItem, VersionUpgradePayload, VersionUpgradeStatus } from '@/views/setting/version/types'

const props = defineProps<{
  modelValue: boolean
  modelValueData: VersionUpgradeItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: VersionUpgradePayload]
}>()

const upgradeTypeOptions = [
  { label: '强制升级', value: 1 },
  { label: '强提示升级', value: 2 },
  { label: '弱提示升级', value: 3 },
  { label: '不提示升级', value: 4 },
]

const statusOptions: Array<{ label: string; value: VersionUpgradeStatus }> = [
  { label: '生产/Mirror 启用', value: 1 },
  { label: '不启用', value: 2 },
  { label: '仅 Mirror 环境启用', value: 3 },
]

interface FormState {
  id?: number
  channel: VersionUpgradeChannel
  appVersion: string
  minVersion: string
  upgradeType: 1 | 2 | 3 | 4
  upgradeTitle: string
  upgradeTip: string
  status: VersionUpgradeStatus
  isDefaultConfig: 1 | 2
}

function createDefaultForm(): FormState {
  return {
    channel: 'other',
    appVersion: '',
    minVersion: '',
    upgradeType: 2,
    upgradeTitle: '',
    upgradeTip: '',
    status: 1,
    isDefaultConfig: 2,
  }
}

const form = reactive<FormState>(createDefaultForm())

const dialogTitle = computed(() => (props.modelValueData ? '编辑升级配置' : '新增升级配置'))

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      return
    }

    const source = props.modelValueData

    Object.assign(
      form,
      source
        ? {
            id: source.id,
            channel: source.channel,
            appVersion: source.appVersion,
            minVersion: source.minVersion,
            upgradeType: source.upgradeType,
            upgradeTitle: source.upgradeTitle,
            upgradeTip: source.upgradeTip,
            status: source.status,
            isDefaultConfig: source.isDefaultConfig,
          }
        : createDefaultForm(),
    )
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:modelValue', false)
}

function handleSubmit() {
  emit('submit', {
    ...form,
    appVersion: form.isDefaultConfig === 1 ? '' : form.appVersion.trim(),
    minVersion: form.minVersion.trim(),
    upgradeTitle: form.upgradeTitle.trim(),
    upgradeTip: form.upgradeTip.trim(),
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="60%"
    destroy-on-close
    @close="closeDialog"
  >
    <el-form label-position="left" label-width="auto">
      <el-form-item label="渠道">
        <el-radio-group v-model="form.channel">
          <el-radio v-for="item in VERSION_CHANNEL_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="配置类型">
        <el-radio-group v-model="form.isDefaultConfig">
          <el-radio :value="1">最低兼容版本配置</el-radio>
          <el-radio :value="2">普通升级配置</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.isDefaultConfig !== 1" label="版本号">
        <el-input v-model="form.appVersion" placeholder="请输入版本号，例如 2.3.0" />
      </el-form-item>

      <el-form-item label="最低兼容版本号">
        <el-input v-model="form.minVersion" placeholder="请输入最低兼容版本号，例如 2.1.0" />
      </el-form-item>

      <el-form-item label="升级类型">
        <el-radio-group v-model="form.upgradeType">
          <el-radio v-for="item in upgradeTypeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="升级标题">
        <el-input v-model="form.upgradeTitle" placeholder="请输入升级标题" />
      </el-form-item>

      <el-form-item label="升级提示语">
        <el-input
          v-model="form.upgradeTip"
          type="textarea"
          :rows="4"
          placeholder="请输入升级提示语"
        />
      </el-form-item>

      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio v-for="item in statusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
