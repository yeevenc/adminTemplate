<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import checkVersion from '@/components/checkVersion/index.vue'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <!-- <RouterView /> -->
    <checkVersion />
  </el-config-provider>
</template>
