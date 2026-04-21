<template>
  <div class="rich-editor">
    <Toolbar
      class="editor-toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      :mode="mode"
    />
    <Editor
      class="editor-content"
      :style="{ height }"
      v-model="valueHtml"
      :default-config="editorConfig"
      :mode="mode"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, shallowRef, ref, watch } from 'vue'
// import { Editor, Toolbar } from '@wangeditor/editor-for-vue"'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    height?: string
    mode?: 'default' | 'simple'
    placeholder?: string
    readonly?: boolean
  }>(),
  {
    modelValue: '',
    height: '400px',
    mode: 'default',
    placeholder: '请输入内容...',
    readonly: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'change', v: string): void
}>()

const editorRef = shallowRef<IDomEditor>()
const valueHtml = ref(props.modelValue)

watch(
  () => props.modelValue,
  v => {
    if (v !== valueHtml.value) valueHtml.value = v
  },
)

const toolbarConfig: Partial<IToolbarConfig> = {}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  readOnly: props.readonly,
  MENU_CONF: {},
}

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

const handleChange = (editor: IDomEditor) => {
  const html = editor.getHtml()
  emit('update:modelValue', html)
  emit('change', html)
}

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})

defineExpose({ editor: editorRef })
</script>

<style scoped>
.rich-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  z-index: 1;
}
.editor-toolbar {
  border-bottom: 1px solid #dcdfe6;
}
.editor-content {
  overflow-y: auto;
}
</style>
