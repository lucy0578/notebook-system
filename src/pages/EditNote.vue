<template>
  <el-container>
    <el-header>
      <el-button @click="$router.back()">返回</el-button>
      <span style="margin-left: 16px; font-weight: bold;">编辑笔记</span>
    </el-header>
    <el-main>
      <NoteEditor :notebookId="notebookId" />
    </el-main>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import NoteEditor from '../components/NoteEditor.vue'

const route = useRoute()
const notebookId = route.params.id
</script> 