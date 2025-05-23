<template>
  <el-container class="home-container">
    <el-header style="padding: 0; height: auto; z-index: 1000;">
      <NavMenu />
    </el-header>
    <el-container>
      <el-header class="content-header">
        <h2>My Notebooks</h2>
      </el-header>
      <el-main>
        <NotebookList ref="notebookListRef" @edit="onEdit" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NotebookList from '@/components/NotebookList.vue'
import NavMenu from '@/components/common/NavMenu.vue'

const router = useRouter()
const notebookListRef = ref(null)

const onEdit = (id) => {
  router.push(`/edit/${id}`)
}
</script>

<style scoped>
.home-container {
  padding-top: 60px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: white;
  border-bottom: 1px solid #eee;
  border-radius: 7px;
  height: 60px;
  margin-top: 1px;
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
</style> 