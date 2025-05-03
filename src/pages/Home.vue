<template>
  <el-container>
    <el-header class="header">
      <h2>我的笔记本</h2>
      <el-button type="primary" @click="showCreate = true">新建笔记</el-button>
    </el-header>
    <el-main>
      <NotebookList ref="notebookListRef" @edit="onEdit" />
    </el-main>
    <el-dialog v-model="showCreate" title="新建笔记" width="400px">
      <el-form :model="form">
        <el-form-item label="分类">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="form.userId" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="createNotebook">创建</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NotebookList from '../components/NotebookList.vue'
import axios from 'axios'

const showCreate = ref(false)
const form = ref({ category: '', userId: '', title: '' })
const router = useRouter()

const notebookListRef = ref(null)

const createNotebook = async () => {
  const notebookData = {
    category: form.value.category || '',
    title: form.value.title || '',
    userId: parseInt(form.value.userId) || 0,
    notebookId: 0,
    createTime: ''
  }
  
  await axios.post('http://localhost:8080/notebook_create', notebookData)
  showCreate.value = false
  notebookListRef.value.fetchNotebooks()
  // 重置表单
  form.value = { category: '', userId: '', title: '' }
}

const onEdit = (id) => {
  router.push(`/edit/${id}`)
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: white;
  border-bottom: 1px solid #eee;
}

.el-header {
  height: 60px;
}

h2 {
  margin: 0;
}
</style> 