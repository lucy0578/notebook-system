<template>
  <el-table :data="notebooks" style="width: 100%">
    <el-table-column prop="notebookId" label="ID" width="80" />
    <el-table-column prop="title" label="标题" />
    <el-table-column prop="category" label="分类" />
    <el-table-column prop="userId" label="用户ID" width="100" />
    <el-table-column prop="createTime" label="创建时间" />
    <el-table-column prop="updateTime" label="更新时间" />
    <el-table-column label="操作" width="220">
      <template #default="scope">
        <el-button size="small" @click="$emit('edit', scope.row.notebookId)">修改</el-button>
        <el-button size="small" type="danger" @click="deleteNotebook(scope.row.notebookId)">删除</el-button>
        <el-button size="small" type="success" @click="shareNotebook(scope.row.notebookId)">共享</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref, onMounted, defineExpose } from 'vue'
import axios from 'axios'

const notebooks = ref([])

const fetchNotebooks = async () => {
  const res = await axios.get('http://localhost:8080/notebook')
  if (res.data && res.data.code === 1) {
    notebooks.value = res.data.data
  }
}

const deleteNotebook = async (id) => {
  await axios.delete(`http://localhost:8080/notebook/${id}`)
  fetchNotebooks()
}

const shareNotebook = async (id) => {
  await axios.post(`http://localhost:8080/notebook/share/${id}`)
  fetchNotebooks()
}

onMounted(fetchNotebooks)

// 暴露方法给父组件调用
defineExpose({ fetchNotebooks })
</script> 