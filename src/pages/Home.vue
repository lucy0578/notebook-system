<template>
  <el-container class="home-container">
    <el-header style="padding: 0; height: auto; z-index: 1000;">
      <NavMenu />
    </el-header>
    <el-container>
      <Categories
        ref="categoriesRef"
        v-model:activeCategory="activeCategory"
        @categoryChange="handleCategoryChange"
        @showRecycleBin="showRecycleBinDialog = true"
        @categoryDeleted="fetchNotebooks"
      />
      <el-container>
        <el-header class="content-header">
          <h2>My Notebooks</h2>
          <div class="header-actions">
            <el-input
              v-model="userId"
              placeholder="Enter user ID to search"
              class="search-input"
              clearable
              :prefix-icon="User"
              @keyup.enter="fetchNotebooks"
            />
          </div>
        </el-header>
        <el-main>
          <div class="table-container">
            <el-table 
              :data="notebooks" 
              style="width: 100%"
              border
              stripe
              highlight-current-row
              :empty-text="emptyTableMessage"
              class="notebook-table"
            >
              <el-table-column prop="notebookId" label="ID" width="70" align="center" />
              <el-table-column prop="title" label="Title" min-width="180" align="left" />
              <el-table-column prop="category" label="Category" width="120" align="center" />
              <el-table-column prop="username" label="Owner" width="100" align="center" />
              <el-table-column label="Status" width="100" align="center">
                <template #default="scope">
                  <el-tag
                    :type="scope.row.public ? 'success' : 'info'"
                    effect="dark"
                    size="small"
                    class="status-tag"
                  >
                    {{ scope.row.public ? 'Public' : 'Private' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="Created" width="140" align="center" />
              <el-table-column prop="updateTime" label="Updated" width="140" align="center" />
              <el-table-column label="Actions" width="250" align="center">
                <template #default="scope">
                  <div class="action-buttons">
                    <el-button size="small" type="primary" plain @click="onEdit(scope.row.notebookId)">
                      Edit
                    </el-button>
                    <el-button size="small" type="danger" plain @click="confirmDelete(scope.row)">
                      Delete
                    </el-button>
                    <el-button 
                      size="small" 
                      :type="scope.row.public ? 'warning' : 'success'" 
                      plain
                      @click="togglePublicStatus(scope.row, scope.$index)"
                    >
                      {{ scope.row.public ? 'Set Private' : 'Set Public' }}
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-main>
      </el-container>
    </el-container>
    <el-dialog v-model="showRecycleBinDialog" title="Recycle Bin" width="900px">
      <div class="recycle-container">
        <el-table
          :data="recycleNotebooks"
          style="width: 100%"
          border
          stripe
          highlight-current-row
          :empty-text="recycleEmptyTableMessage"
          class="notebook-table"
        >
          <el-table-column prop="notebookId" label="ID" width="80" align="center" />
          <el-table-column prop="title" label="Title" min-width="120" align="left" />
          <el-table-column prop="category" label="Category" width="120" align="center" />
          <el-table-column label="Actions" width="260" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <el-button size="small" type="success" plain @click="recoverNotebook(scope.row.notebookId)">Recover</el-button>
                <el-button size="small" type="danger" plain @click="deleteNotebookPermanently(scope.row.notebookId)">Delete Permanently</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavMenu from '@/components/common/NavMenu.vue'
import Categories from '@/components/common/Categories.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const activeCategory = ref('all')
const notebooks = ref([])
const isLoading = ref(false)
const showRecycleBinDialog = ref(false)
const recycleNotebooks = ref([])
const recycleLoading = ref(false)
const userId = ref('')
const categoriesRef = ref(null)

const handleCategoryChange = (category) => {
  activeCategory.value = category
}

const onEdit = (id) => {
  router.push(`/edit/${id}`)
}

const emptyTableMessage = computed(() => {
  if (isLoading.value) return 'Loading data...'
  return 'No notebooks found.'
})

const fetchNotebooks = async () => {
  try {
    isLoading.value = true
    let url = ''
    if (userId.value) {
      url = `/notebook/${userId.value}`
    } else {
      const userStr = localStorage.getItem('user')
      if (!userStr) return
      const localId = JSON.parse(userStr).id
      url = `/notebook/${localId}`
    }
    const res = await axios.get(url)
    if (res.data && res.data.code === 1) {
      const originalData = res.data.data
      notebooks.value = originalData
      if (originalData.length === 0) {
        ElMessage.info('No notebooks found')
      } else {
        ElMessage.success(`Found ${originalData.length} notebooks`)
      }
    } else {
      ElMessage.error(res.data?.msg || 'Failed to get notebooks')
      notebooks.value = []
    }
  } catch (error) {
    ElMessage.error('Network error, please try again later')
    notebooks.value = []
  } finally {
    isLoading.value = false
  }
}

const confirmDelete = (notebook) => {
  ElMessageBox.confirm(
    `Are you sure you want to delete notebook "${notebook.title}"?`,
    'Warning',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(() => {
      deleteNotebook(notebook.notebookId)
    })
    .catch(() => {
      ElMessage.info('Delete cancelled')
    })
}

const deleteNotebook = async (id) => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return
    const userId = JSON.parse(userStr).id
    const res = await axios.delete('/notebook_remove', {
      data: {
        notebookId: id,
        userId: userId
      }
    })
    if (res.data && res.data.code === 1) {
      ElMessage.success('Notebook deleted successfully')
    } else if (res.data && res.data.msg === '不是笔记拥有者') {
      ElMessage.error('You are not the owner')
    } else {
      ElMessage.error(res.data?.msg || 'Failed to delete notebook')
    }
    fetchNotebooks()
    // Refresh categories after deleting notebook
    categoriesRef.value?.refreshCategories()
  } catch (error) {
    if (error.response && error.response.data && error.response.data.msg === '不是笔记拥有者') {
      ElMessage.error('You are not the owner')
    } else if (error.response) {
      ElMessage.error(error.response.data?.msg || 'Failed to delete notebook')
    } else {
      ElMessage.error('Network error, please try again later')
    }
  }
}

const togglePublicStatus = async (notebook, index) => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return
    const userId = JSON.parse(userStr).id
    const isPublic = notebook.public
    const notebookId = notebook.notebookId
    const requestData = {
      notebookId: notebookId,
      userId: userId || notebook.userId
    }
    const url = isPublic 
      ? '/notebook_unpublic'
      : '/notebook_public'
    const response = await axios.put(url, requestData)
    if (response.data && response.data.code === 1) {
      notebooks.value[index].public = !isPublic
      const newStatus = !isPublic ? 'public' : 'private'
      ElMessage.success(`Notebook "${notebook.title}" is now ${newStatus}`)
    } else {
      if (response.data?.msg === '用户ID不一致') {
        ElMessage.error('Permission denied: You can only change the status of your own notebooks')
      } else {
        ElMessage.error(response.data?.msg || 'Failed to change status')
      }
    }
  } catch (error) {
    if (error.response?.data) {
      if (error.response.data.msg === '用户ID不一致') {
        ElMessage.error('Permission denied: You can only change the status of your own notebooks')
      } else {
        ElMessage.error(error.response.data.msg || 'Failed to change status')
      }
    } else {
      ElMessage.error('Network error, please try again later')
    }
  }
}

// 回收站相关
const recycleEmptyTableMessage = computed(() => {
  if (recycleLoading.value) return 'Loading...'
  return 'Recycle bin is empty.'
})

const fetchRecycleNotes = async () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return
  const userId = JSON.parse(userStr).id
  try {
    recycleLoading.value = true
    const url = `/notebook_list/${userId}`
    const res = await axios.get(url)
    if (res.data && res.data.code === 1) {
      recycleNotebooks.value = res.data.data || []
    } else {
      recycleNotebooks.value = []
    }
  } catch (error) {
    recycleNotebooks.value = []
    ElMessage.error('Failed to fetch recycle bin notes')
  } finally {
    recycleLoading.value = false
  }
}

const recoverNotebook = async (notebookId) => {
  try {
    await axios.put(`/notebook_recover/${notebookId}`)
    ElMessage.success('Notebook recovered successfully')
    fetchRecycleNotes()
    fetchNotebooks()
    // Refresh categories after recovering notebook
    categoriesRef.value?.refreshCategories()
  } catch (error) {
    ElMessage.error('Failed to recover notebook')
  }
}

const deleteNotebookPermanently = async (notebookId) => {
  try {
    await axios.delete(`/notebook_delete/${notebookId}`)
    ElMessage.success('Notebook deleted permanently')
    fetchRecycleNotes()
  } catch (error) {
    ElMessage.error('Failed to delete notebook')
  }
}

import { watch } from 'vue'
watch(showRecycleBinDialog, (val) => {
  if (val) fetchRecycleNotes()
})

// 自动加载一次
fetchNotebooks()
</script>

<style scoped>
.home-container {
  padding-top: 80px;
  background: #fff;
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 0;
}

.content-header {
  position: fixed;
  top: 60px;
  left: 250px;
  right: 0;
  z-index: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: white;
  border-bottom: 1px solid #eee;
  height: 67px;
  margin-top: 1px;
  width: calc(100% - 250px);
}

:deep(.el-main) {
  background: #fff;
  min-height: calc(100vh - 60px);
  margin-left: 250px;
  padding-top: 67px;
}

h2 {
  margin: 15px;
  padding: 20px 0;
  color: #409EFF;
}

:deep(.el-menu--horizontal) {
  border-bottom: none;
}

:deep(.el-header) {
  padding: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0;
  padding-right: 20px;
}

.search-input {
  width: 230px;
}

.table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  justify-content: center;
  min-height: 100px;
  width: 1100px;
  margin: 0 auto;
}

.recycle-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  justify-content: center;
  min-height: 100px;
  width: 800px;
  margin: 0 auto;
}

.notebook-table {
  margin-top: 0;
  border-radius: 6px;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.status-tag {
  font-weight: bold;
  padding: 4px 8px;
}

:deep(.el-table th) {
  background-color: #f2f6fc;
  font-weight: bold;
  color: #333;
}

:deep(.el-table--border) {
  border-radius: 6px;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafbfc;
}

:deep(.el-table tr:hover) {
  background-color: #ecf5ff;
}
</style> 