<template>
  <el-dialog
    v-model="dialogFormVisible"
    :title="isCreate ? '新建笔记' : '编辑笔记'"
    width="70%"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <QuillEditor
          v-model:content="form.content"
          contentType="html"
          toolbar="full"
          theme="snow"
        />
      </el-form-item>
      <el-form-item label="标签">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请输入标签"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

// Props & Emits
const emit = defineEmits(['update-info'])

// Template refs
const formRef = ref(null)

// State
const dialogFormVisible = ref(false)
const isCreate = ref(true)
const cid = ref(null)
const availableTags = ref([])
const form = reactive({
  id: '',
  title: '',
  content: '',
  tags: []
})

// Form validation rules
const rules = {
  title: [
    { required: true, message: '请输入笔记标题', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入笔记内容', trigger: 'blur' }
  ]
}

// Methods
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    const url = isCreate.value 
      ? `/categories/${cid.value}/notes`
      : `/notes/${form.id}`
    
    const method = isCreate.value ? 'post' : 'put'
    const response = await axios[method](url, form)
    
    if (response.data.status === 200) {
      ElMessage.success(isCreate.value ? '创建成功' : '更新成功')
      dialogFormVisible.value = false
      emit('update-info')
    } else {
      throw new Error(response.data.message || '操作失败')
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
    console.error('Form submission failed:', error)
  }
}

// Load available tags
const loadTags = async () => {
  try {
    const response = await axios.get('/tags')
    if (response.status === 200) {
      availableTags.value = response.data
    }
  } catch (error) {
    console.error('Failed to load tags:', error)
  }
}

// Expose properties to parent
defineExpose({
  dialogFormVisible,
  isCreate,
  form,
  cid
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.ql-editor) {
  min-height: 200px;
}

:deep(.el-dialog) {
  display: flex;
  flex-direction: column;
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 90vh;
  min-height: 70vh;
}

:deep(.el-dialog__body) {
  flex: 1;
  overflow: auto;
}
</style>
