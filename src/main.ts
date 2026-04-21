import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from '@/App.vue'
import router from '@/router'
import pinia from '@/stores'
import { applyTheme } from '@/stores/theme'
import './style.css'
// 上传图片 
import upload from '@/components/upload/uploadImage.vue'
// 上传文件
import uploadFile from '@/components/upload/uploadFile.vue'
const app = createApp(App)

app.use(ElementPlus)
app.use(pinia)
app.use(router)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.component('uploadImage', upload)
app.component('uploadFile', uploadFile)
// Apply initial theme before mount
applyTheme()

app.mount('#app')
