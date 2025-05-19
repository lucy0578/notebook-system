<template>
  <div class="message-center">
    <h3>消息中心</h3>

    <div v-if="pendingMessages.length === 0" class="no-messages">
      暂无待处理消息
    </div>

    <el-card v-for="message in pendingMessages" :key="message.id" class="message-card">
      <div class="message-content">
        <div class="message-info">
          <!-- 显示邀请/申请的内容 -->
          <template v-if="message.type === 'invite'">
            <p><b>{{ message.fromUserName }}</b> 邀请您加入群组 <b>{{ message.groupName }}</b></p>
          </template>
          <template v-else-if="message.type === 'apply'">
            <p><b>{{ message.fromUserName }}</b> 申请加入群组 <b>{{ message.groupName }}</b></p>
          </template>
          <p class="message-time">{{ formatTime(message.createTime) }}</p>
        </div>
        <div class="message-actions">
          <el-button type="success" size="small" @click="handleAccept(message)">接受</el-button>
          <el-button type="danger" size="small" @click="handleReject(message)">拒绝</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 获取当前用户ID
const currentUser = ref(localStorage.getItem('user'))
const user = JSON.parse(currentUser.value)
const userId = user.id

// 待处理消息列表
const pendingMessages = ref([])

// 获取待处理消息
const fetchPendingMessages = async () => {
  try {
    const response = await axios.get(`/view_group_request/${userId}`)
    if (response.data.code === 1 && response.data.data) {
      pendingMessages.value = response.data.data
    } else {
      pendingMessages.value = []
    }
  } catch (error) {
    console.error('获取待处理消息失败:', error)
    ElMessage.error('获取待处理消息失败')
  }
}

// 接受邀请/申请
const handleAccept = async (message) => {
  try {
    const response = await axios.get(`/agree_group_request/${message.id}`)
    if (response.data.code === 1) {
      ElMessage.success('已接受')
      // 移除当前消息
      pendingMessages.value = pendingMessages.value.filter(item => item.id !== message.id)
    } else {
      ElMessage.error(response.data.msg || '操作失败')
    }
  } catch (error) {
    console.error('接受失败:', error)
    ElMessage.error('接受失败')
  }
}

// 拒绝邀请/申请
const handleReject = async (message) => {
  try {
    const response = await axios.get(`/refuse_group_request/${message.id}`)
    if (response.data.code === 1) {
      ElMessage.success('已拒绝')
      // 移除当前消息
      pendingMessages.value = pendingMessages.value.filter(item => item.id !== message.id)
    } else {
      ElMessage.error(response.data.msg || '操作失败')
    }
  } catch (error) {
    console.error('拒绝失败:', error)
    ElMessage.error('拒绝失败')
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 生命周期钩子
onMounted(() => {
  fetchPendingMessages()
})
</script>

<style scoped>
.message-center {
  padding: 20px;
}

.no-messages {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.message-card {
  margin-bottom: 15px;
}

.message-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-info {
  flex: 1;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.message-actions {
  display: flex;
  gap: 10px;
}
</style> 