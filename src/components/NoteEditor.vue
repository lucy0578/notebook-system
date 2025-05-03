<template>
  <el-form v-if="note" :model="note" label-width="80px" style="max-width: 800px; margin: 0 auto;">
    <el-form-item label="笔记ID">
      <el-input v-model="note.notebookId" disabled />
    </el-form-item>
    <el-form-item label="版本">
      <el-input v-model="note.version" disabled />
    </el-form-item>
    <el-form-item label="内容">
      <div class="editor-container">
        <QuillEditor
          v-model:content="note.content"
          contentType="html"
          theme="snow"
          :options="editorOptions"
        />
      </div>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="saveNote">保存</el-button>
      <el-button @click="fetchNote">重新加载</el-button>
    </el-form-item>
  </el-form>
  <div v-else style="text-align:center;">加载中...</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps({
  notebookId: [String, Number]
})

const note = ref(null)
let websocket = null
const clientId = Math.random().toString(36).substr(2)
const lastWsMsg = ref('')

// Quill编辑器配置
const editorOptions = {
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': ['Sans Serif', 'Arial', 'Times New Roman', '宋体', '黑体', '微软雅黑'] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ]
    }
  },
  placeholder: '请输入笔记内容...',
  theme: 'snow'
}

// 获取笔记内容
const fetchNote = async () => {
  const res = await axios.get(`http://localhost:8080/noteContent/${props.notebookId}`)
  if (res.data && res.data.code === 1) {
    if (res.data.data) {
      note.value = res.data.data
      if (note.value.content === undefined || note.value.content === null) {
        note.value.content = ''
      }
    } else {
      note.value = {
        notebookId: props.notebookId,
        content: '',
        version: 1
      }
    }
    ElMessage.success('已加载最新内容')
  } else {
    note.value = null
  }
}

// 保存笔记
const saveNote = async () => {
  const payload = {
    content: note.value.content,
    id: note.value.id || '',
    notebookId: note.value.notebookId,
    version: note.value.version
  }
  
  const res = await axios.post('http://localhost:8080/noteContent_create', payload)
  
  if (res.data && res.data.code === 1) {
    // 笔记保存成功
    ElMessage.success('笔记已保存，新版本可用')
    
    // 仅在笔记有修改时，广播 WebSocket 消息
    if (res.data.msg !== '笔记没有修改' && websocket && websocket.readyState === 1) {
      const message = {
        msg: '新版本笔记保存，请更新',
        notebookId: note.value.notebookId
      }
      websocket.send(JSON.stringify(message))
    }
    
  } else if (res.data && res.data.msg === '笔记没有修改') {
    ElMessage.info('笔记没有修改')
  } else if (res.data && res.data.msg && res.data.msg.includes('笔记已被更新')) {
    ElMessage.error('笔记已被更新，请点击更新按钮获取最新内容')
  }
}

// 连接 WebSocket
const connectWS = () => {
  if ('WebSocket' in window) {
    websocket = new WebSocket(`ws://localhost:8080/ws/${clientId}`)
    websocket.onopen = function() {}
    
    websocket.onmessage = function(event) {
      let msg = event.data
      try {
        const obj = JSON.parse(event.data)
        if (obj.msg && obj.msg.includes('新版本笔记保存，请更新')) {
          ElMessage.info('新版本笔记保存，请更新')
          lastWsMsg.value = event.data
          return
        }
        if (obj.msg && obj.msg.includes('笔记已被更新')) {
          ElMessage.error('笔记已被更新，请点击更新按钮获取最新内容')
          return
        }
        if (obj.msg && obj.msg.includes('笔记没有修改')) {
          ElMessage.info('笔记没有修改')
          return
        }
        msg = obj.msg || event.data
      } catch (e) {}
      
      // 修复：此部分判断仅在"新版本笔记保存，请更新"消息时弹出
      if (msg.includes('新版本笔记保存，请更新')) {
        ElMessage.info('新版本笔记保存，请更新')
        lastWsMsg.value = event.data
        return
      }
      // 确保不会错误显示"新版本笔记保存，请更新"消息
      if (msg.includes('笔记已被更新')) {
        ElMessage.error('笔记已被更新，请点击更新按钮获取最新内容')
        return
      }
      if (msg.includes('笔记没有修改')) {
        ElMessage.info('笔记没有修改')
        return
      }
    }

    websocket.onerror = function() {}

    websocket.onclose = function() {}
  } else {
    ElMessage.error('当前浏览器不支持WebSocket')
  }
}

onMounted(() => {
  fetchNote()
  connectWS()
})

onBeforeUnmount(() => {
  if (websocket) websocket.close()
})
</script>

<style>
.editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ql-toolbar.ql-snow {
  border: none !important;
  border-bottom: 1px solid #e2e2e2 !important;
  background-color: #f8f9fa;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.ql-toolbar.ql-snow .ql-formats {
  margin-right: 12px;
}

.ql-container.ql-snow {
  border: none !important;
  height: calc(100% - 72px);
}

.ql-editor {
  height: 100%;
  min-height: 320px;
  font-family: "Microsoft YaHei", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 15px;
  overflow-y: auto;
}

.ql-snow .ql-tooltip {
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.ql-snow .ql-picker.ql-expanded .ql-picker-options {
  border-color: #e2e2e2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
