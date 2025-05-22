<template>
  <el-container class="bookshelf-container">
    <el-header style="padding: 0; height: auto; z-index: 1000;">
      <NavMenu />
    </el-header>
    <el-container>
      <el-aside width="250px" class="category-sidebar">
        <div class="category-header">
          <h3>Categories</h3>
          <el-button type="primary" size="small" @click="showAddCategory = true">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        <el-menu
          :default-active="activeCategory"
          class="category-menu"
          @select="handleCategorySelect"
        >
          <el-menu-item index="all">
            <el-icon><Document /></el-icon>
            <span>All Notebooks</span>
          </el-menu-item>
          <el-menu-item 
            v-for="category in categories" 
            :key="category"
            :index="category"
          >
            <el-icon><Folder /></el-icon>
            <span>{{ category }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="content-header">
          <h2>{{ activeCategory === 'all' ? 'All Notebooks' : activeCategory }}</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showCreate = true">
              <!-- <el-icon><Plus /></el-icon> -->
              New Notebook
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
                :lg="8"
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
                      >
                        {{ notebook.public ? 'Public' : 'Private' }}
                      </el-tag>
                    </div>
                    <div class="notebook-actions">
                      <el-button 
                        type="primary" 
                        :icon="Edit"
                        @click="editNotebook(notebook)"
                      />
                      <el-button 
                        type="danger" 
                        :icon="Delete"
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
        <el-select v-model="newNotebook.category" placeholder="Select category">
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
          <el-option label="New Category" value="new" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="newNotebook.category === 'new'" label="New Category">
        <el-input v-model="newCategory" />
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

  <!-- Add Category Dialog -->
  <el-dialog
    v-model="showAddCategory"
    title="Add New Category"
    width="300px"
  >
    <el-form :model="newCategoryForm">
      <el-form-item label="Category Name">
        <el-input v-model="newCategoryForm.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddCategory = false">Cancel</el-button>
      <el-button type="primary" @click="addCategory">Add</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Folder, Edit, Delete } from '@element-plus/icons-vue'
import NavMenu from '../common/NavMenu.vue'
import axios from 'axios'

const router = useRouter()
const notebooks = ref([])
const categories = ref([])
const activeCategory = ref('all')
const showCreate = ref(false)
const showAddCategory = ref(false)
const newCategory = ref('')
const newCategoryForm = ref({ name: '' })

const newNotebook = ref({
  title: '',
  category: '',
  public: false
})

// Filter notebooks based on selected category
const filteredNotebooks = computed(() => {
  if (activeCategory.value === 'all') {
    return notebooks.value
  }
  return notebooks.value.filter(notebook => notebook.category === activeCategory.value)
})

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Fetch notebooks
const fetchNotebooks = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('未找到用户信息，请重新登录')
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    
    const response = await axios.get(`/notebook/${userData.id}`)
    if (response.data.code === 1) {
      notebooks.value = response.data.data
      // Extract unique categories
      const uniqueCategories = new Set(notebooks.value.map(n => n.category).filter(Boolean))
      categories.value = Array.from(uniqueCategories)
    } else {
      ElMessage.error(response.data.msg || 'Failed to fetch notebooks')
    }
  } catch (error) {
    console.error('Failed to fetch notebooks:', error)
    ElMessage.error('Failed to fetch notebooks: ' + (error.response?.data?.msg || error.message))
  }
}

// Handle category selection
const handleCategorySelect = (category) => {
  activeCategory.value = category
}

// Create new notebook
const createNotebook = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('未找到用户信息，请重新登录')
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    
    const category = newNotebook.value.category === 'new' ? newCategory.value : newNotebook.value.category
    
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
    } else {
      ElMessage.error(response.data.msg || 'Failed to create notebook')
    }
  } catch (error) {
    console.error('Failed to create notebook:', error)
    ElMessage.error('Failed to create notebook: ' + (error.response?.data?.msg || error.message))
  }
}

// Add new category
const addCategory = () => {
  if (!newCategoryForm.value.name) {
    ElMessage.warning('Please enter a category name')
    return
  }
  
  if (categories.value.includes(newCategoryForm.value.name)) {
    ElMessage.warning('Category already exists')
    return
  }
  
  categories.value.push(newCategoryForm.value.name)
  showAddCategory.value = false
  newCategoryForm.value.name = ''
  ElMessage.success('Category added successfully')
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
    } else {
      ElMessage.error(response.data.msg || 'Failed to delete notebook')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete notebook:', error)
      ElMessage.error('Failed to delete notebook: ' + (error.response?.data?.msg || error.message))
    }
  }
}

// Initialize
onMounted(() => {
  fetchNotebooks()
})
</script>

<style scoped>
.bookshelf-container {
  padding-top: 60px;
}

.content-header {
  position: fixed;
  top: 60px;
  left: 250px;
  right: 0;
  z-index: 1000;
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

.category-sidebar {
  background-color: white;
  border-right: 1px solid #e6e6e6;
  height: calc(100vh - 60px);
  position: fixed;
  left: 0;
  top: 60px;
  z-index: 999;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.category-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e6e6e6;
}

h2 {
  margin: 15px;
  padding: 20px 0;
  color: #409EFF;
}

.category-header h3 {
  margin: 0;
  color: #409EFF;
  font-weight: 500;
}

.category-menu {
  border-right: none;
}

/* :deep(.el-main) {
  padding: 20px;
  background-color: #f5f7fa;
  margin-left: 250px;
} */

.notebooks-container {
  position: absolute;
  left: 300px;
  padding: 0;
}

.notebook-grid {
  margin-top: 20px;
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
  color: #909399;
}

.notebook-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

:deep(.el-button) {
  padding: 8px;
}

:deep(.el-button .el-icon) {
  margin-right: 0;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409EFF;
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
</style>