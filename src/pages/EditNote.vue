<template>
  <el-container>
    <el-main>
      <NoteEditor :notebookId="notebookId" />
      <div class="back-button-container">
        <el-button size="middle" type="primary" @click="$router.back()">Back</el-button>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import NoteEditor from '../components/NoteEditor.vue'

const route = useRoute()
const notebookId = route.params.id
</script>

<style scoped>
.back-button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-bottom: 20px;
}

:deep(.el-main) {
  padding: 20px;
  background-color: #f5f7fa;
}

:deep(.el-button--large) {
  padding: 15px 30px;
  font-size: 16px;
}
</style> 