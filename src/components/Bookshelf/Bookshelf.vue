<template>
  <el-container>
    
    <el-header style="padding: 0; height: auto;">
      <NavMenu />
    </el-header>
    <el-container>
      <el-main>
        <div style="margin-left: 10px">
          <category-bar 
            ref="categoryBar"
            @category-select="getNotes"
          />
          <Note 
            ref="noteRef"
            @edit-info="handleEditInfo"
            @add-note="handleAddNote"
            @update-info="getNotes"
            @edit-category="handleEditCategory"
          />
          <note-edit-form 
            ref="noteEditForm"
            @update="getNotes"
          />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import Note from './Note.vue'
import CategoryBar from './CategoryBar.vue'
import NoteEditForm from './NoteEditForm.vue'
import NavMenu from '../common/NavMenu.vue'

const router = useRouter()
const categoryBar = ref(null)
const noteRef = ref(null)
const noteEditForm = ref(null)

const getNotes = async () => {
  try {
    if (!categoryBar.value?.currentCid) return
    
    const currentCid = categoryBar.value.currentCid
    await router.push({
      query: { cid: currentCid }
    })
    
    const response = await axios.get(`categories/${currentCid}/notes`)
    if (response.status === 200) {
      noteRef.value?.showNotes(response.data)
    }
  } catch (error) {
    console.error('Failed to get notes:', error)
    ElMessage.error('获取笔记失败')
  }
}

const handleEditInfo = (noteInfo) => {
  if (noteEditForm.value) {
    noteEditForm.value.dialogFormVisible = true
    noteEditForm.value.isCreate = false
    noteEditForm.value.form = { ...noteInfo }
  }
}

const handleAddNote = () => {
  if (noteEditForm.value && categoryBar.value) {
    const currentCid = categoryBar.value.currentCid
    noteEditForm.value.dialogFormVisible = true
    noteEditForm.value.isCreate = true
    noteEditForm.value.form = {}
    noteEditForm.value.cid = currentCid
  }
}

const handleEditCategory = () => {
  categoryBar.value?.edit()
}
</script>

<style scoped>
.el-tabs__item {
  height: 20px !important;
  line-height: 20px !important;
  font-size: 12px;
}

.el-tabs__item.is-active {
  font-weight: bolder !important;
}

:deep(.el-header) {
  padding: 0;
}

:deep(.el-main) {
  padding: 20px;
}
</style>