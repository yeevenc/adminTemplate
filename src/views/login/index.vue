<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useSleepUserStore } from '@/stores/user'
import { applyTheme } from '@/stores/theme'

applyTheme()

const router = useRouter()
const route = useRoute()
const userStore = useSleepUserStore()

const formRef = ref<FormInstance>()
const form = reactive({ username: '', password: '' })
const loading = ref(false)

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
})

function isSafeRedirect(redirect: string | undefined): redirect is string {
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
}

async function handleLogin() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.loginAction(form)
    const redirect = route.query.redirect as string | undefined
    router.push(isSafeRedirect(redirect) ? redirect : '/')
  } catch {
    ElMessage.error('账号或密码错误')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 主题渐变云朵背景 -->
    <div class="bg-scene" aria-hidden="true">
      <div class="cloud cloud-tl-1" />
      <div class="cloud cloud-tl-2" />
      <div class="cloud cloud-br-1" />
      <div class="cloud cloud-br-2" />
      <div class="cloud cloud-center" />
    </div>

    <!-- Login card -->
    <el-card class="login-card glass-card">
      <div class="login-header">
        <span class="login-logo-icon">🐼</span>
        <h1 class="login-title">PandaSleep Admin</h1>
        <p class="login-subtitle">熊猫睡眠管理平台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            prefix-icon="User"
            size="large"
            autocomplete="username"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <button
            class="login-btn"
            type="submit"
            :class="{ loading }"
            :disabled="loading"
          >
            <span v-if="!loading">登 录</span>
            <span v-else class="btn-loading">
              <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              登录中
            </span>
          </button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* ── 主题渐变云朵背景 ── */
.bg-scene {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.cloud {
  position: absolute;
  transition: background 0.6s ease;
  animation: cloud-drift ease-in-out infinite;
}

/* 左上角云朵 */
.cloud-tl-1 {
  width: 900px; height: 500px;
  top: -180px; left: -200px;
  background: radial-gradient(ellipse at 40% 45%, var(--color-primary) 100%, var(--color-primary-light) 95%, transparent 20%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(100px);
  border-radius: 60% 40% 55% 45% / 70% 50% 80% 40%;
  animation-duration: 40s; animation-delay: 0s;
}

.cloud-tl-2 {
  width: 600px; height: 350px;
  top: -60px; left: -50px;
  background: radial-gradient(ellipse at 50% 55%, var(--color-primary-light) 0%, transparent 68%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(80px);
  border-radius: 50% 65% 42% 58% / 60% 42% 68% 50%;
  animation-duration: 33s; animation-delay: -10s;
}

/* 右下角云朵 */
.cloud-br-1 {
  width: 850px; height: 480px;
  bottom: -180px; right: -200px;
  background: radial-gradient(ellipse at 60% 55%, var(--color-primary) 0%, var(--color-primary-light) 35%, transparent 70%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(100px);
  border-radius: 45% 55% 40% 60% / 55% 65% 45% 70%;
  animation-duration: 46s; animation-delay: -16s;
}

.cloud-br-2 {
  width: 550px; height: 320px;
  bottom: -40px; right: -30px;
  background: radial-gradient(ellipse at 55% 50%, var(--color-primary-light) 0%, transparent 68%);
  opacity: var(--cloud-nebula-op, 0.24);
  filter: blur(80px);
  border-radius: 62% 38% 58% 42% / 52% 68% 42% 62%;
  animation-duration: 36s; animation-delay: -22s;
}

/* 中间点缀云朵 */
.cloud-center {
  width: 400px; height: 200px;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse at 50% 50%, var(--color-primary) 0%, transparent 72%);
  opacity: calc(var(--cloud-nebula-op, 0.24) * 0.5);
  filter: blur(90px);
  border-radius: 48% 52% 60% 40% / 65% 38% 58% 48%;
  animation-duration: 50s; animation-delay: -30s;
}

@keyframes cloud-drift {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  20%       { transform: translate(18px, -9px) scale(1.01); }
  40%       { transform: translate(34px, 6px) scale(0.99); }
  60%       { transform: translate(22px, -13px) scale(1.02); }
  80%       { transform: translate(6px, 10px) scale(0.98); }
}

/* ── Login card ── */
.login-card {
  position: relative;
  width: 380px;
  padding: 40px 36px 36px;
  transform-origin: center center;
  animation: login-card-enter 3s cubic-bezier(0.42, 0.85, 0.24, 1) both;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo-icon {
  font-size: 40px;
  line-height: 1;
  margin-bottom: 12px;
  display: block;
  filter: drop-shadow(0 0 16px var(--color-glow));
}

.login-title {
  font-family: 'Raleway', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Form ── */
.login-form {
  width: 100%;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.login-form :deep(.el-input__wrapper) {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  box-shadow: none;
  padding: 2px 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: var(--color-primary-light);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-glow);
}

.login-form :deep(.el-input__inner) {
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--text-muted);
}

.login-form :deep(.el-input__prefix .el-icon) {
  color: var(--text-muted);
  font-size: 16px;
}

/* ── Login button ── */
.login-btn {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  background: linear-gradient(135deg, var(--color-primary), var(--el-color-primary-dark-2));
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 20px var(--color-glow);
  font-family: inherit;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 6px 28px var(--color-glow);
}

.login-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spin-icon { animation: spin 0.8s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes login-card-enter {
  0% {
    opacity: 0;
    transform: scale(0.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
