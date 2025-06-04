<template>
  <el-aside width="250px" class="category-sidebar">
    <div class="category-header">
      <h3>Top Categories</h3>
    </div>
    <div class="category-list-wrapper">
      <el-menu
        :default-active="activeCategory"
        class="category-menu"
        @select="handleCategorySelect"
      >
        <el-menu-item index="all">
          <el-icon><Document /></el-icon>
          <span>All</span>
        </el-menu-item>
        <el-menu-item 
          v-for="category in displayedCategories" 
          :key="category"
          :index="category"
        >
          <el-icon><Folder /></el-icon>
          <span>{{ category }}</span>
          <el-button 
            type="danger" 
            :icon="Delete"
            text
            class="delete-category-btn"
            @click.stop="deleteCategory(category)"
          />
        </el-menu-item>
      </el-menu>
      <div v-if="categories.length > 5" class="show-more-btn">
        <el-button type="text" @click="showAll = !showAll" style="width: 100%; color: #409EFF;">
          {{ showAll ? 'Show less' : 'Show more' }}
        </el-button>
      </div>
    </div>
    <div class="recycle-bin-entry">
      <el-button type="info" plain style="width: 90%;" @click="$emit('showRecycleBin')">
        🗑️ Recycle Bin
      </el-button>
    </div>
  </el-aside>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Folder, Delete } from '@element-plus/icons-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const props = defineProps({
  activeCategory: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['update:activeCategory', 'categoryChange', 'showRecycleBin', 'categoryDeleted'])

const categories = ref([])
const showAll = ref(false)
const router = useRouter()

const displayedCategories = computed(() => {
  return showAll.value ? categories.value : categories.value.slice(0, 5)
})

// Fetch categories
const fetchCategories = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('User not found, please login again')
      return
    }
    const userData = JSON.parse(userStr)
    
    const response = await axios.get(`/personal_notebook/${userData.id}`)
    if (response.data.code === 1) {
      const notebooks = response.data.data
      // Extract unique categories
      const uniqueCategories = new Set(notebooks.map(n => n.category).filter(Boolean))
      categories.value = Array.from(uniqueCategories)
    } else {
      ElMessage.error(response.data.msg || 'Failed to fetch categories')
    }
  } catch (error) {
    ElMessage.error('Failed to load categories')
  }
}

// For parent component to call refresh categories
const refreshCategories = () => {
  fetchCategories()
}

defineExpose({ refreshCategories })

// Handle category selection
const handleCategorySelect = (category) => {
  emit('update:activeCategory', category)
  emit('categoryChange', category)
  
  // Navigate to bookshelf with selected category (only if not already on bookshelf page)
  if (!router.currentRoute.value.path.startsWith('/bookshelf')) {
    if (category === 'all') {
      router.push('/bookshelf')
    } else {
      router.push(`/bookshelf/${encodeURIComponent(category)}`)
    }
  }
}

// Delete category
const deleteCategory = async (category) => {
  try {
    // First get all notebooks in this category to show count
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('User not found, please login again')
      return
    }
    const userData = JSON.parse(userStr)
    
    const response = await axios.get(`/personal_notebook/${userData.id}`)
    if (response.data.code === 1) {
      const notebooks = response.data.data
      const notebooksInCategory = notebooks.filter(n => n.category === category)
      const notebookCount = notebooksInCategory.length
      
      if (notebookCount === 0) {
        // No notebooks in this category, just remove it
        await ElMessageBox.confirm(
          `Are you sure you want to delete the category "${category}"?`,
          'Delete Category',
          {
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )
        
        categories.value = categories.value.filter(c => c !== category)
        if (props.activeCategory === category) {
          emit('update:activeCategory', 'all')
          emit('categoryChange', 'all')
        }
        ElMessage.success('Category deleted successfully')
        return
      }
      
      // Show confirmation with notebook count
      await ElMessageBox.confirm(
        `This category "${category}" contains ${notebookCount} notebook(s). Deleting this category will move all notebooks in it to the recycle bin. Are you sure you want to continue?`,
        'Delete Category and Notebooks',
        {
          confirmButtonText: 'Delete All',
          cancelButtonText: 'Cancel',
          type: 'warning',
          dangerouslyUseHTMLString: false
        }
      )
      
      // Delete all notebooks in this category
      const deletePromises = notebooksInCategory.map(notebook => 
        axios.delete('/notebook_remove', {
          data: {
            notebookId: notebook.notebookId,
            userId: userData.id
          }
        })
      )
      
      await Promise.all(deletePromises)
      
      // Remove category from the list
      categories.value = categories.value.filter(c => c !== category)
      
      // If the deleted category was active, switch to 'all'
      if (props.activeCategory === category) {
        emit('update:activeCategory', 'all')
        emit('categoryChange', 'all')
      }
      
      ElMessage.success(`Category "${category}" and ${notebookCount} notebook(s) deleted successfully`)
      
      // Emit event to refresh parent components
      emit('categoryDeleted')
      
    } else {
      throw new Error('Failed to fetch notebooks')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete category: ' + (error.response?.data?.msg || error.message))
    }
  }
}

// Initialize
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-sidebar {
  background-color: white;
  border-right: 1px solid #e6e6e6;
  height: calc(100vh - 60px);
  position: fixed;
  left: 0;
  top: 60px;
  z-index: 999;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  width: 250px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.category-header {
  padding: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border-bottom: 1px solid #e6e6e6;
}

.category-header h3 {
  margin: 0;
  color: #409EFF;
  font-weight: 500;
}

.category-list-wrapper {
  flex: 1 1 auto;
  overflow: hidden;
  position: relative;
}
.category-list-wrapper:hover {
  overflow-y: auto;
}

.category-menu {
  border-right: none;
  max-height: 60vh;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 50px;
  line-height: 50px;
  position: relative;
}

:deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409EFF;
}

.delete-category-btn {
  position: absolute;
  right: 20px;
  opacity: 0;
  transition: opacity 0.3s;
  padding: 0;
  border: none;
  background: none;
}

.delete-category-btn:hover {
  background: none;
  color: #f56c6c;
}

:deep(.el-menu-item:hover) .delete-category-btn {
  opacity: 1;
}

:deep(.el-button) {
  padding: 8px;
}

:deep(.el-button .el-icon) {
  margin-right: 0;
}

.show-more-btn {
  text-align: center;
  margin-top: 0;
}

.recycle-bin-entry {
  position: absolute;
  bottom: 20px;
  left: 0;
  width: 100%;
  text-align: center;
  margin-bottom: 0;
}
</style> 