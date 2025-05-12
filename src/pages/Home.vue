<template>
  <el-container>
    <el-header class="header">
      <h2>My Notebooks</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreate = true">New Notebook</el-button>
        <el-button @click="goRecycleBin">Recycle Bin</el-button>
      </div>
    </el-header>
    <el-main>
      <NotebookList ref="notebookListRef" @edit="onEdit" />
    </el-main>
    <el-dialog v-model="showCreate" title="Create New Notebook" width="400px">
      <el-form :model="form">
        <el-form-item label="Category">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="User ID">
          <el-input v-model="form.userId" />
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="form.title" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">Cancel</el-button>
        <el-button type="primary" @click="createNotebook">Create</el-button>
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
  try {
    const notebookData = {
      category: form.value.category || '',
      title: form.value.title || '',
      userId: parseInt(form.value.userId) || 0,
      notebookId: 0,
      createTime: ''
    }

    await axios.post('/notebook_create', notebookData)
    showCreate.value = false
    notebookListRef.value.fetchNotebooks()
    // Reset form
    form.value = { category: '', userId: '', title: '' }
  } catch (error) {
    console.error('Failed to create notebook:', error)
    alert('Failed to create notebook: ' + (error.response?.data?.message || error.message))
  }
}

const onEdit = (id) => {
  router.push(`/edit/${id}`)
}

const goRecycleBin = () => {
  router.push('/recycle')
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

.header-actions {
  display: flex;
  gap: 10px;
}

.el-header {
  height: 60px;
}

h2 {
  margin: 0;
}
</style> 