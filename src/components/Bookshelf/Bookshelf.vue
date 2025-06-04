<template>
  <el-container class="bookshelf-container">
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
          <h2>{{ activeCategory === 'all' ? 'All Notebooks' : `${activeCategory}` }}</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showCreate = true">
              <el-icon class="button-icon"><Plus /></el-icon>
              <span class="button-text">New Notebook</span>
            </el-button>
          </div>
        </el-header>
        <el-main>
          <div class="notebooks-container">
            <el-row :gutter="20" class="notebook-grid">
              <el-col 
                v-for="notebook in filteredNotebooks" 
                :key="notebook.notebookId" 
                :xs="24" 
                :sm="12" 
                :md="8" 
                :lg="6"
              >
                <el-card class="notebook-card" :body-style="{ padding: '0px' }">
                  <div class="notebook-cover" @click="openNotebook(notebook)">
                    <div class="notebook-title">{{ notebook.title }}</div>
                    <div class="notebook-category">{{ notebook.category }}</div>
                  </div>
                  <div class="notebook-info">
                    <div class="notebook-meta">
                      <span class="create-time">{{ formatDate(notebook.createTime) }}</span>
                      <el-tag 
                        :type="notebook.public ? 'success' : 'info'" 
                        size="small"
                        class="privacy-tag"
                        @click="togglePrivacy(notebook)"
                      >
                        {{ notebook.public ? 'Public' : 'Private' }}
                      </el-tag>
                    </div>
                    <div class="notebook-actions">
                      <el-button 
                        type="primary" 
                        :icon="Edit"
                        text
                        class="action-btn edit-btn"
                        @click="editNotebook(notebook)"
                      />
                      <el-button 
                        type="danger" 
                        :icon="Delete"
                        text
                        class="action-btn delete-btn"
                        @click="deleteNotebook(notebook)"
                      />
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </el-container>

  <!-- Create Notebook Dialog -->
  <el-dialog
    v-model="showCreate"
    title="Create New Notebook"
    width="400px"
  >
    <el-form :model="newNotebook" label-width="80px">
      <el-form-item label="Title">
        <el-input v-model="newNotebook.title" />
      </el-form-item>
      <el-form-item label="Category">
        <template v-if="newNotebook.category === '__new__'">
          <el-input v-model="newCategory" placeholder="Enter new category" @blur="onNewCategoryBlur" @keyup.enter.native="onNewCategoryBlur" />
        </template>
        <template v-else>
          <el-select v-model="newNotebook.category" placeholder="Select category" style="width: 100%;">
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
            <el-option :label="''" :value="'__new__'">
              <template #default>
                <el-icon><Plus /></el-icon>
                <span style="margin-left: 6px;">Add Category</span>
              </template>
            </el-option>
          </el-select>
        </template>
      </el-form-item>
      <el-form-item label="Public">
        <el-switch v-model="newNotebook.public" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showCreate = false">Cancel</el-button>
      <el-button type="primary" @click="createNotebook">Create</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showRecycleBinDialog" title="Recycle Bin" width="900px">
    <div class="table-container">
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
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Folder, Edit, Delete } from '@element-plus/icons-vue'
import NavMenu from '../common/NavMenu.vue'
import Categories from '../common/Categories.vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const notebooks = ref([])
const categories = ref([])
const activeCategory = ref('all')
const showCreate = ref(false)
const newCategory = ref('')
const categoriesRef = ref(null)
const showRecycleBinDialog = ref(false)
const recycleNotebooks = ref([])
const recycleLoading = ref(false)

const newNotebook = ref({
  title: '',
  category: '',
  public: false
})

// Filter notebooks based on selected category
const filteredNotebooks = computed(() => {
  let filtered = activeCategory.value === 'all' 
    ? notebooks.value 
    : notebooks.value.filter(notebook => notebook.category === activeCategory.value)
  
  // Sort by update time in descending order (newest first)
  return filtered.sort((a, b) => {
    return new Date(b.updateTime) - new Date(a.updateTime)
  })
})

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// Fetch notebooks
const fetchNotebooks = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('User not found, please login again')
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    
    const response = await axios.get(`/personal_notebook/${userData.id}`)
    if (response.data.code === 1) {
      notebooks.value = response.data.data
      // Extract unique categories
      const uniqueCategories = new Set(notebooks.value.map(n => n.category).filter(Boolean))
      categories.value = Array.from(uniqueCategories)
    } else {
      ElMessage.error(response.data.msg || 'Failed to fetch notebooks')
    }
  } catch (error) {
    ElMessage.error('Failed to load notebooks')
  }
}

// Handle category change
const handleCategoryChange = (category) => {
  activeCategory.value = category
}

// Create new notebook
const createNotebook = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('User not found, please login again')
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    
    const category = newNotebook.value.category
    
    const notebookData = {
      title: newNotebook.value.title,
      category: category,
      public: newNotebook.value.public,
      userId: userData.id,
      notebookId: 0,
      createTime: ''
    }

    const response = await axios.post('/notebook_create', notebookData)
    if (response.data.code === 1) {
      ElMessage.success('Notebook created successfully')
      showCreate.value = false
      newNotebook.value = { title: '', category: '', public: false }
      newCategory.value = ''
      await fetchNotebooks()
      // Refresh categories after creating notebook
      categoriesRef.value?.refreshCategories()
    } else {
      ElMessage.error(response.data.msg || 'Failed to create notebook')
    }
  } catch (error) {
    ElMessage.error('Failed to create notebook')
  }
}

// Open notebook
const openNotebook = (notebook) => {
  router.push(`/edit/${notebook.notebookId}`)
}

// Edit notebook
const editNotebook = (notebook) => {
  router.push(`/edit/${notebook.notebookId}`)
}

// Delete notebook
const deleteNotebook = async (notebook) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${notebook.title}"?`,
      'Warning',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    const response = await axios.delete('/notebook_remove', {
      data: {
        notebookId: notebook.notebookId,
        userId: JSON.parse(localStorage.getItem('user')).id
      }
    })
    
    if (response.data.code === 1) {
      ElMessage.success('Notebook deleted successfully')
      await fetchNotebooks()
      // Refresh categories after deleting notebook
      categoriesRef.value?.refreshCategories()
    } else {
      ElMessage.error(response.data.msg || 'Failed to delete notebook')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete notebook')
    }
  }
}

// Add togglePrivacy function
const togglePrivacy = async (notebook) => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('User not found, please login again')
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    
    const endpoint = notebook.public ? '/notebook_unpublic' : '/notebook_public'
    
    const response = await axios.put(endpoint, {
      notebookId: notebook.notebookId,
      userId: userData.id
    })
    
    if (response.data.code === 1) {
      notebook.public = !notebook.public
      ElMessage.success(`Notebook is now ${notebook.public ? 'public' : 'private'}`)
    } else {
      ElMessage.error(response.data.msg || 'Failed to update notebook privacy')
    }
  } catch (error) {
    ElMessage.error('Failed to update notebook privacy')
  }
}

// Add goRecycleBin function
const goRecycleBin = () => {
  router.push('/recycle')
}

// 新分类输入框失焦或回车时自动切回下拉框
const onNewCategoryBlur = () => {
  if (newCategory.value) {
    newNotebook.value.category = newCategory.value
    newCategory.value = ''
  } else {
    newNotebook.value.category = ''
  }
}

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

watch(showRecycleBinDialog, (val) => {
  if (val) fetchRecycleNotes()
})

// Watch route changes to update active category
watch(() => route.params.category, (newCategory) => {
  if (newCategory) {
    activeCategory.value = decodeURIComponent(newCategory)
  } else {
    activeCategory.value = 'all'
  }
})

// Initialize
onMounted(() => {
  // Set active category from route parameter
  const routeCategory = route.params.category
  if (routeCategory) {
    activeCategory.value = decodeURIComponent(routeCategory)
  }
  
  fetchNotebooks()
})
</script>

<style scoped>
.bookshelf-container {
  padding-top: 60px;
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
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: white;
  border-bottom: 1px solid #eee;
  height: 67px;
  margin-top: 1px;
}

.header-actions {
  display: flex;
  gap: 10px;
  padding-right: 20px;
}

h2 {
  margin: 15px;
  padding: 20px 0;
  color: #409EFF;
}

.notebooks-container {
  position: absolute;
  top: 110px;
  left: 300px;
  padding: 0;
  z-index: 0;
}

.notebook-grid {
  width: 1110px;
  margin-top: 40px;
}

.notebook-card {
  margin-bottom: 20px;
  transition: transform 0.3s;
  height: auto;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.notebook-card:hover {
  transform: translateY(-5px);
}

.notebook-cover {
  height: 120px;
  padding: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.notebook-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notebook-category {
  font-size: 14px;
  opacity: 0.8;
}

.notebook-info {
  padding: 10px;
  background-color: white;
  border-top: 1px solid #eee;
}

.notebook-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
}

.create-time {
  font-size: 12px;
  margin: 0 auto;
  color: #909399;
}

.notebook-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  color: #909399;
  transition: color 0.3s;
}

.edit-btn:hover {
  color: #409EFF;
}

.delete-btn:hover {
  color: #f56c6c;
}

:deep(.el-button) {
  padding: 8px;
}

:deep(.el-button .el-icon) {
  margin-right: 0;
}

:deep(.el-header) {
  padding: 0;
}

:deep(.el-menu--horizontal) {
  border-bottom: none;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-switch) {
  margin-top: 8px;
}

.privacy-tag {
  cursor: pointer;
  transition: opacity 0.3s;
  margin-left: 8px;
}

.privacy-tag:hover {
  opacity: 0.8;
}

:deep(.el-tag--success) {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
  color: #67c23a;
}

:deep(.el-tag--info) {
  background-color: #f4f4f5;
  border-color: #e9e9eb;
  color: #909399;
}

.button-icon {
  margin-right: 8px;
}

.button-text {
  margin-left: 4px;
}

:deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  justify-content: center;
  min-height: 220px;
  width: 800px;
  margin: 0 auto;
}
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>