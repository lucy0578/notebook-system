<template>
    <div style="text-align: initial;">
      <el-row :gutter="10">
        <el-col 
          v-for="(item, i) in visibleNotes"
          :key="i"
          :xl="6" 
          :lg="6" 
          :sm="24"
        >
          <el-card shadow="hover" class="box-card">
            <template #header>
              <div class="note-header">
                <span class="note-title">{{ item.title }}</span>
                <div class="note-actions">
                  <el-tooltip
                    transition="0s"
                    effect="dark"
                    content="编辑笔记内容"
                    placement="top-start"
                  >
                    <el-button
                      class="note-operation"
                      type="text"
                      @click="editNote(item.id)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    transition="0s"
                    effect="dark"
                    content="编辑笔记标题与简介"
                    placement="top-start"
                  >
                    <el-button
                      class="note-operation"
                      type="text"
                      @click="editInfo(item)"
                    >
                      <el-icon><EditPen /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    transition="0s"
                    effect="dark"
                    content="删除此笔记"
                    placement="top-start"
                  >
                    <el-button
                      class="note-operation"
                      type="text"
                      @click="deleteNote(item.id)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </template>
            <div class="text item note-abs" @click="readNote(item.id)">
              {{ restrict(item.abs) }}
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-button
        type="success"
        circle
        class="edit-category-btn"
        @click="editCategory"
      >
        <el-icon><Edit /></el-icon>
      </el-button>

      <el-button
        type="primary"
        circle
        class="add-note-btn"
        @click="addNote"
      >
        <el-icon><DocumentAdd /></el-icon>
      </el-button>

      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="notes.length"
        layout="prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
      />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Edit, EditPen, Delete, DocumentAdd } from '@element-plus/icons-vue'
import axios from 'axios'
/**获取用户id */
const currentUserId = ref(localStorage.getItem('user')) 
const user = JSON.parse(currentUserId.value)
const userId = user.data.id




const router = useRouter()

// State
const notes = ref([])
const currentPage = ref(1)
const pageSize = ref(12)

// Computed
// const visibleNotes = computed(() => {
//   const start = (currentPage.value - 1) * pageSize.value
//   const end = start + pageSize.value
//   return notes.value.slice(start, end)
// })

// Methods
const showNotes = (newNotes) => {
  notes.value = newNotes
}

const restrict = (abs) => {
  if (!abs) return ''
  return abs.length > 48 ? abs.substring(0, 48) + '...' : abs
}

const editInfo = (note) => {
  emit('editInfo', note)
}

const editNote = (id) => {
  router.push({
    path: '/note/edit',
    name: 'NoteEdit',
    query: { noteId: id }
  })
}

const readNote = (id) => {
  router.push({
    path: '/note/detail',
    name: 'NoteDetail',
    query: { noteId: id }
  })
}

const addNote = () => {
  emit('addNote')
}

const deleteNote = async (id) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该笔记, 是否继续?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await axios.get(`note/delete/${id}`)
    if (response.data.status === 200) {
      ElMessage.success('删除成功!')
      emit('updateInfo')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete note:', error)
      ElMessage.error('删除失败')
    } else {
      ElMessage.info('已取消删除')
    }
  }
}

const editCategory = () => {
  emit('editCategory')
}

const handlePageChange = (page) => {
  currentPage.value = page
}
/**笔记列表 */
const visibleNotes = ref([])
/**
 * 获取笔记
 */
const getNotes = async () => {
  const response = await axios.get(`notebook/${userId}`)
  notes.value = response.data.data
  console.log(response.data.data,'-------')
  if(response.data.data.length > 0){
    visibleNotes.value = response.data.data
  }else{
    visibleNotes.value = []
  }
}
getNotes()
// Expose methods to parent
defineExpose({
  showNotes
})

// Emit declarations
const emit = defineEmits(['editInfo', 'addNote', 'updateInfo', 'editCategory'])
</script>

<style scoped>
.box-card {
  display: inline-block;
  width: 95%;
  margin: 5px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-title {
  font-weight: bold;
}

.note-actions {
  display: flex;
  gap: 4px;
}

.note-abs {
  font-size: 12px;
  height: 50px;
  cursor: pointer;
}

.note-operation {
  padding: 3px 0;
}

.edit-category-btn {
  position: fixed;
  bottom: 10px;
  right: 10px;
}

.add-note-btn {
  position: fixed;
  bottom: 70px;
  right: 10px;
}

.pagination {
  text-align: center;
  position: fixed;
  margin: auto;
  left: 0;
  right: 0;
  bottom: 20px;
}

:deep(.el-card__header) {
  padding: 9px 20px;
  height: 40px;
}
</style>