<template>
  <div class="recycle-bin-container">
    <div class="recycle-header">
      <h2>🗑️ Recycle Bin</h2>
      <div class="recycle-search">
        <el-input v-model="userId" placeholder="Enter User ID to search" class="user-input" clearable />
        <el-button type="primary" class="search-btn" @click="fetchRecycleNotes">Search</el-button>
      </div>
    </div>
    <div class="table-container">
      <el-table
        v-if="hasSearched"
        :data="notebooks"
        style="width: 800px; margin: 0 auto; min-height: 180px;"
        border
        stripe
        highlight-current-row
        :empty-text="emptyTableMessage"
        class="notebook-table"
      >
        <el-table-column prop="notebookId" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="Title" min-width="120" align="left" />
        <el-table-column prop="category" label="Category" width="120" align="center" />
        <el-table-column label="Actions" width="260" align="center">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" type="success" plain @click="recoverNotebook(scope.row.notebookId)">Recover</el-button>
              <el-button size="small" type="danger" plain @click="deleteNotebook(scope.row.notebookId)">Delete Permanently</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="table-placeholder"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const notebooks = ref([])
const userId = ref('')
const isLoading = ref(false)
const hasSearched = ref(false)

const emptyTableMessage = computed(() => {
  if (isLoading.value) return 'Loading...'
  if (userId.value) return 'No notes in recycle bin for this user.'
  return 'Recycle bin is empty.'
})

const fetchRecycleNotes = async () => {
  if (!userId.value) {
    ElMessage.warning('Please enter User ID')
    return
  }
  hasSearched.value = true
  try {
    isLoading.value = true
    const url = `/notebook_list/${userId.value}`
    const res = await axios.get(url)
    if (res.data && res.data.code === 1) {
      notebooks.value = res.data.data || []
      if (notebooks.value.length === 0) {
        ElMessage.info('Recycle bin is empty.')
      }
    } else {
      notebooks.value = []
      ElMessage.info('Recycle bin is empty.')
    }
  } catch (error) {
    notebooks.value = []
    ElMessage.error('Failed to fetch recycle bin notes')
  } finally {
    isLoading.value = false
  }
}

const recoverNotebook = async (notebookId) => {
  try {
    await axios.put(`/notebook_recover/${notebookId}`)
    ElMessage.success('Notebook recovered successfully')
    fetchRecycleNotes()
  } catch (error) {
    ElMessage.error('Failed to recover notebook')
  }
}

const deleteNotebook = async (notebookId) => {
  try {
    await axios.delete(`/notebook_delete/${notebookId}`)
    ElMessage.success('Notebook deleted permanently')
    fetchRecycleNotes()
  } catch (error) {
    ElMessage.error('Failed to delete notebook')
  }
}
</script>

<style scoped>
.recycle-bin-container {
  padding: 32px 0 0 0;
  background-color: #f5f7fa;
  border-radius: 16px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.08);
  max-width: 900px;
  margin: 32px auto 0 auto;
  min-height: 90vh;
}
.recycle-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-left: 32px;
}
.recycle-header h2 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 18px;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
}
.recycle-search {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-input {
  width: 260px;
  border-radius: 6px;
  font-size: 16px;
}
.search-btn {
  font-size: 16px;
  border-radius: 6px;
  padding: 0 18px;
  height: 36px;
}
.table-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px 0 16px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  justify-content: center;
  min-height: 220px;
  width: 800px;
  margin: 0 auto;
}
.table-placeholder {
  width: 800px;
  min-height: 180px;
}
.notebook-table {
  margin-top: 0;
  border-radius: 8px;
  overflow: hidden;
  font-size: 16px;
}
.el-table th {
  background: #f2f6fc !important;
  color: #222;
  font-weight: 600;
  font-size: 16px;
}
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 24px;
}
.el-button--success {
  background: #67c23a;
  color: #fff;
  border: none;
}
.el-button--danger {
  background: #f56c6c;
  color: #fff;
  border: none;
}
.el-button--success:hover, .el-button--danger:hover {
  filter: brightness(0.95);
}
</style> 