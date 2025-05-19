<template>
  <div class="notebook-container">
    <div class="search-bar">
      <el-input 
        v-model="userId" 
        placeholder="Enter User ID to search" 
        style="width: 250px;" 
        clearable
        :prefix-icon="User"
      />
      <el-button type="primary" @click="fetchNotebooks" :icon="Search">Search</el-button>
    </div>

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
              <el-button size="small" type="primary" plain @click="$emit('edit', scope.row.notebookId)">
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
  </div>
</template>

<script setup>
import { ref, onMounted, defineExpose, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, User } from '@element-plus/icons-vue'

const notebooks = ref([])
const userId = ref('')
const isLoading = ref(false)

// Computed property for empty table message
const emptyTableMessage = computed(() => {
  if (isLoading.value) return 'Loading data...'
  if (userId.value) return `No notebooks found for user ID: ${userId.value}`
  return 'No notebooks found. Try searching by user ID.'
})

const fetchNotebooks = async () => {
  try {
    isLoading.value = true
    
    // Use relative path for fetching notebook list
    const url = userId.value 
      ? `/notebook/${userId.value}`
      : '/notebook'
    console.log('Request URL:', url)
    
    const res = await axios.get(url)
    
    if (res.data && res.data.code === 1) {
      // Get original data
      const originalData = res.data.data
      
      // Use original data directly
      notebooks.value = originalData
      
      // Success message
      if (originalData.length === 0) {
        ElMessage.info('No notebooks found')
      } else {
        ElMessage.success(`Found ${originalData.length} notebooks`)
      }
    } else {
      console.error('Error getting notebooks:', res.data)
      ElMessage.error(res.data?.msg || 'Failed to get notebooks')
      notebooks.value = []
    }
  } catch (error) {
    console.error('Failed to fetch notebooks:', error)
    ElMessage.error('Network error, please try again later')
    notebooks.value = []
  } finally {
    isLoading.value = false
  }
}

// Confirm before deleting
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
    console.log('Deleting notebook:', id)
    // Use relative path for delete method
    const res = await axios.delete('/notebook_remove', {
      data: {
        notebookId: id,
        userId: userId.value
      }
    })
    console.log('Delete notebook response:', res.data)
    
    if (res.data && res.data.code === 1) {
      ElMessage.success('Notebook deleted successfully')
    } else if (res.data && res.data.msg === '不是笔记拥有者') {
      ElMessage.error('You are not the owner')
    } else {
      ElMessage.error(res.data?.msg || 'Failed to delete notebook')
    }
    
    // Refresh the list
    fetchNotebooks()
  } catch (error) {
    console.error('Failed to delete notebook:', error)
    if (error.response && error.response.data && error.response.data.msg === '不是笔记拥有者') {
      ElMessage.error('You are not the owner')
    } else if (error.response) {
      ElMessage.error(error.response.data?.msg || 'Failed to delete notebook')
    } else {
      ElMessage.error('Network error, please try again later')
    }
  }
}

// Toggle public status logic with relative URL
const togglePublicStatus = async (notebook, index) => {
  try {
    const isPublic = notebook.public
    const notebookId = notebook.notebookId
    
    // Prepare request data
    const requestData = {
      notebookId: notebookId,
      userId: userId.value || notebook.userId // Prefer userId from input, otherwise use notebook's userId
    }
    
    // Determine which API endpoint to use
    const url = isPublic 
      ? '/notebook_unpublic'  // Make private
      : '/notebook_public'    // Make public
      
    // Send request to backend with relative path
    const response = await axios.put(url, requestData)
    
    // Check response result
    if (response.data && response.data.code === 1) {
      // Update UI after success
      notebooks.value[index].public = !isPublic
      
      // Determine new status for success message
      const newStatus = !isPublic ? 'public' : 'private'
      ElMessage.success(`Notebook "${notebook.title}" is now ${newStatus}`)
    } else {
      // Handle specific error messages
      if (response.data?.msg === '用户ID不一致') {
        ElMessage.error('Permission denied: You can only change the status of your own notebooks')
      } else {
        ElMessage.error(response.data?.msg || 'Failed to change status')
      }
    }
  } catch (error) {
    console.error('Failed to change notebook public status:', error)
    
    // Show detailed error information
    if (error.response?.data) {
      // Handle specific error responses
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

// Expose methods to parent component
defineExpose({ fetchNotebooks })
</script>

<style scoped>
.notebook-container {
  padding: 24px;
  background-color: #f5f7fa;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  padding: 1px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.notebook-table {
  margin-top: 0;
  border-radius: 6px;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 5px;
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
