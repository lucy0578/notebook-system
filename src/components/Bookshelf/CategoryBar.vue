<template>
  <div class="category-bar">
    <el-tabs
      v-model="currentCid"
      type="card"
      editable
      @tab-click="handleClick"
      @edit="handleEdit"
    >
      <el-tab-pane
        v-for="item in categories"
        :key="item.id"
        :label="item.name"
        :name="item.id.toString()"
      />
    </el-tabs>
    <CategoryEditForm 
      ref="categoryFormRef" 
      @update="handleUpdate" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import CategoryEditForm from './CategoryEditForm.vue'

const route = useRoute()
const router = useRouter()

// Template refs
const editFormRef = ref(null)

// State
const currentCid = ref('-1')
const categories = ref([])

// Methods
const handleUpdate = async () => {
  try {
    const cid = route.query.cid
    const response = await axios.get('/categories')
    if (response.status === 200) {
      categories.value = response.data
      if (categories.value.length > 0) {
        currentCid.value = cid ?? categories.value[0].id.toString()
        emit('category-select')
      }
    }
  } catch (error) {
    console.error('Failed to update categories:', error)
    ElMessage.error('Failed to fetch categories')
  }
}

const handleClick = () => {
  emit('category-select')
}

const handleEdit = async (targetName, action) => {
  if (action === 'remove') {
    try {
      await ElMessageBox.confirm(
        '此操作将永久删除该笔记分类, 是否继续?',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      const response = await axios.get(`category/delete/${targetName}`)
      if (response.data.status === 200) {
        ElMessage.success('删除成功!')
        
        // Update active tab
        let activeName = currentCid.value
        if (activeName === targetName) {
          const currentIndex = categories.value.findIndex(tab => tab.id.toString() === targetName)
          const nextTab = categories.value[currentIndex + 1] || categories.value[currentIndex - 1]
          if (nextTab) {
            activeName = nextTab.id.toString()
          }
        }
        
        currentCid.value = activeName
        categories.value = categories.value.filter(tab => tab.id.toString() !== targetName)
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Failed to delete category:', error)
        ElMessage.error('删除失败')
      } else {
        ElMessage.info('已取消删除')
      }
    }
  } else if (action === 'add') {
    openCreateForm()
  }
}

const openCreateForm = () => {
  if (categoryFormRef.value) {
    categoryFormRef.value.isCreate = true
    categoryFormRef.value.dialogFormVisible = true
    categoryFormRef.value.resetForm()
  }
}

const openEditForm = (category) => {
  if (categoryFormRef.value) {
    categoryFormRef.value.isCreate = false
    categoryFormRef.value.form.id = category.id
    categoryFormRef.value.form.name = category.name
    categoryFormRef.value.dialogFormVisible = true
  }
}

const edit = () => {
  const currentCategory = categories.value.find(
    cat => cat.id.toString() === currentCid.value
  )
  if (currentCategory) {
    openEditForm(currentCategory)
  }
}

// Expose methods and properties to parent
defineExpose({
  currentCid,
  edit
})

// Emit declarations
const emit = defineEmits(['category-select'])

// Lifecycle hooks
onMounted(() => {
  handleUpdate()
})
</script>

<style scoped>
.category-bar {
  margin: 15px;
}

:deep(.el-tabs__new-tab) {
  border: none;
  margin: 0 10px 0 0;
  font-size: 18px;
  color: crimson;
}

:deep(.el-tabs__nav-prev),
:deep(.el-tabs__nav-next) {
  line-height: 22px;
}
</style>
