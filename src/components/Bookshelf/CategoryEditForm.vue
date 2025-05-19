<template>
  <el-dialog
    v-model="dialogFormVisible"
    :title="isCreate ? '新建分类' : '编辑分类'"
    width="30%"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item 
        label="分类名称" 
        prop="name"
      >
        <el-input 
          v-model="form.name" 
          placeholder="请输入分类名称"
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="onSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// Props & Emits
const emit = defineEmits(['update'])

// Template refs
const formRef = ref(null)

// State
const dialogFormVisible = ref(false)
const isCreate = ref(true)
const form = reactive({
  id: '',
  name: ''
})

// Form validation rules
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// Methods
const resetForm = () => {
  form.id = ''
  form.name = ''
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const closeDialog = () => {
  dialogFormVisible.value = false
  resetForm()
}

const onSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    const url = isCreate.value ? 'category/add' : 'category/update'
    const response = await axios.post(url, form)
    
    if (response.data.status === 200) {
      ElMessage.success(isCreate.value ? '新增成功!' : '更新成功!')
      dialogFormVisible.value = false
      resetForm()
      emit('update')
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

// 显式暴露属性和方法给父组件
defineExpose({
  dialogFormVisible,
  isCreate,
  form,
  resetForm,
  closeDialog
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: bold;
}

:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-dialog__body) {
  padding: 20px 40px;
}
</style>