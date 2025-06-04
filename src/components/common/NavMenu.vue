<template>
  <div class="nav-bar">
    <el-menu
      class="el-menu-demo"
      mode="horizontal"
      :default-active="activeIndex"
      router
    >
      <el-menu-item 
        v-for="(item, i) in navList" 
        :key="i"
        :index="item.url"
      >
        {{ item.name }}
      </el-menu-item>

      <el-sub-menu index="user" class="user-menu-fixed">
        <template #title>{{ userFlag.name }}</template>
        <el-menu-item
          v-for="(item, i) in userFlag.menuList"
          :key="i"
          @click="handleUserMenuClick(item)"
        >
          {{ item.name }}
        </el-menu-item>
        <el-menu-item
          v-show="isLogin"
          index="logout"
          @click="handleLogout"
        >
          Logout
        </el-menu-item>
      </el-sub-menu>

      <!-- 消息通知图标 -->
      <li 
        class="notification-icon" 
        v-if="isLogin" 
        @click="handleNotificationClick"
        :title="`You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`"
      >
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
          <el-icon>
            <Bell />
          </el-icon>
        </el-badge>
      </li>

      <li class="fullscreen-icon">
        <el-icon 
          @click="toggleFullScreen"
        >
          <FullScreen />
        </el-icon>
      </li>
    </el-menu>
  </div>

  <!-- 消息通知弹窗 -->
  <el-dialog
    v-model="showMessageDialog"
    title="Messages"
    width="700px"
    top="20vh"
    @opened="fetchGroupRequests"
  >
    <div v-if="groupRequests.length > 0">
      <el-table :data="groupRequests" style="width: 100%">
        <el-table-column prop="fromUserName" label="User" width="200">
          <template #default="scope">
            {{ scope.row.fromUserName || 'Unknown User' }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="Type" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'invite' ? 'success' : 'warning'">
              {{ scope.row.type === 'invite' ? 'Invitation' : 'Application' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="Time" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="200">
          <template #default="scope">
            <el-button 
              type="success" 
              size="small" 
              @click="handleRequest(scope.row, 'accept')"
              :loading="scope.row.loading"
            >
              Accept
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleRequest(scope.row, 'reject')"
              :loading="scope.row.loading"
            >
              Reject
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else class="no-requests">
      No pending requests
    </div>
  </el-dialog>

  <!-- 用户中心右侧抽屉 -->
  <el-drawer
    v-model="showUserDrawer"
    direction="rtl"
    size="500px"
    :with-header="false"
    destroy-on-close
  >
    <Usercenter />
  </el-drawer>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { FullScreen, Bell } from '@element-plus/icons-vue'
import axios from 'axios'
import Usercenter from '../User/Usercenter.vue'
import { ElDrawer } from 'element-plus'

const router = useRouter()
const route = useRoute()
const store = useStore()

// 响应式状态
const isLogin = ref(false)
const activeIndex = ref('/home')
const userFlag = reactive({
  name: '未登录',
  menuList: []
})

// 未读消息计数
const unreadCount = ref(0)
let checkMessagesTimer = null

const navList = [
  { name: 'Dashboard', url: '/home' },
  { name: 'Bookshelf', url: '/bookshelf' },
  { name: 'My Groups', url: '/groups' }
]

// 消息通知相关
const showMessageDialog = ref(false)
const groupRequests = ref([])
const showUserDrawer = ref(false)

// 方法
const handleLogout = async () => {
  try {
    await store.dispatch('logout')
    router.push('/login')
  } catch (error) {
    ElMessage.error('Logout failed')
  }
}

const toggleFullScreen = () => {
  const isFull = !!(
    document.webkitIsFullScreen ||
    document.mozFullScreen ||
    document.msFullscreenElement ||
    document.fullscreenElement
  )

  if (!isFull) {
    const element = document.documentElement
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }
}

// 获取群组申请列表
const fetchGroupRequests = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return
    
    const userData = JSON.parse(userStr)
    const userId = userData.id
    
    console.log('=== 获取群组请求开始 ===')
    console.log('当前用户ID:', userId)
    
    const response = await axios.get(`show_group_request/${userId}`)
    
    console.log('群组请求API响应:', response.data)
    
    if (response.data.code === 1 && response.data.data) {
      // 分别统计邀请和申请
      const invites = response.data.data.filter(r => r.type === 'invite')
      const applies = response.data.data.filter(r => r.type === 'join')
      
      console.log(`📩 收到 ${invites.length} 个邀请(invite), ${applies.length} 个申请(apply)`)
      
      // 打印每个请求的详细信息，特别标记类型
      response.data.data.forEach((request, index) => {
        const requestType = request.type === 'invite' ? '📨 邀请' : '📝 申请'
        console.log(`${requestType} ${index + 1}:`, {
          id: request.id,
          type: request.type,
          fromUserId: request.fromUserId || request.from_user_id,
          toUserId: request.toUserId || request.to_user_id,
          groupId: request.groupId || request.group_id,
          fromUserName: request.fromUserName || request.from_user_name,
          groupName: request.groupName || request.group_name,
          status: request.status,
          createTime: request.createTime || request.create_time,
          原始数据: request
        })
      })
      
      groupRequests.value = response.data.data.map(request => ({
        ...request,
        loading: false
      }))
      unreadCount.value = groupRequests.value.length
      
      console.log('=== 处理后的群组请求 ===')
      console.log('总数:', groupRequests.value.length)
      console.log('详细数据:', groupRequests.value)
    } else {
      groupRequests.value = []
      unreadCount.value = 0
      console.log('❌ 没有群组请求数据')
    }
  } catch (error) {
    console.error('❌ 获取群组请求失败:', error)
    ElMessage.error('Failed to load group requests')
    groupRequests.value = []
    unreadCount.value = 0
  }
}

// 处理群组申请
const handleRequest = async (request, action) => {
  try {
    request.loading = true
    
    console.log(`=== 开始处理群组请求 - ${action} ===`)
    console.log('请求详情:', {
      requestId: request.id,
      requestType: request.type,
      requestTypeCheck: typeof request.type,
      requestTypeEquals: request.type === 'join',
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
      groupId: request.groupId,
      fromUserName: request.fromUserName,
      原始request对象: request
    })
    
    // 根据API文档要求：PUT /accept_request/{group_request_id}
    let apiUrl = ''
    if (action === 'accept') {
      console.log('🔍 检查request.type:', {
        value: request.type,
        type: typeof request.type,
        isApply: request.type === 'join',
        isInvite: request.type === 'invite'
      })
      
      if (request.type === 'join') {
        apiUrl = `accept_apply/${request.id}`
        console.log('✅ 使用apply接口:', apiUrl)
      } else { // Assuming 'invite' is the other primary type for acceptance
        apiUrl = `accept_request/${request.id}`
        console.log('✅ 使用invite接口 (或默认):', apiUrl)
      }
    } else if (action === 'reject') {
      apiUrl = `reject_request/${request.id}`
    } else {
      // Fallback or error for unknown action
      console.error('Unknown action in handleRequest:', action)
      ElMessage.error('Invalid request action')
      request.loading = false
      return
    }
    console.log('📤 调用API:', apiUrl)
    
    const response = await axios.put(apiUrl)
    console.log('📥 API响应:', response.data)
    
    if (response.data.code === 1) {
      ElMessage.success(`Request ${action}ed successfully`)
      console.log('✅ 请求处理成功')
      
      // 从列表中移除已处理的请求
      groupRequests.value = groupRequests.value.filter(r => r.id !== request.id)
      unreadCount.value = groupRequests.value.length
      
      console.log('📊 更新后的请求列表长度:', unreadCount.value)
      
      // 提醒检查群组成员列表
      if (request.type === 'invite') {
        console.log('🔍 邀请已处理 - 请检查群组', request.groupId, '是否包含用户', request.toUserId, '(', request.fromUserName, '邀请的用户)')
      } else {
        console.log('🔍 申请已处理 - 请检查群组', request.groupId, '是否包含用户', request.fromUserId, '(申请者', request.fromUserName, ')')
      }
    } else {
      console.log('❌ API返回失败:', response.data)
      throw new Error(response.data.msg || `Failed to ${action} request`)
    }
  } catch (error) {
    console.error(`❌ ${action} 请求失败:`, {
      错误信息: error.message,
      响应数据: error.response?.data,
      状态码: error.response?.status
    })
    ElMessage.error(error.response?.data?.msg || `Failed to ${action} request`)
  } finally {
    request.loading = false
  }
}

// 监听弹窗打开状态
watch(showMessageDialog, (val) => {
  if (val) {
    fetchGroupRequests()
  }
})

// 修改原有的fetchUnreadMessagesCount函数
const fetchUnreadMessagesCount = async () => {
  if (!isLogin.value) return
  
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return
    
    const userData = JSON.parse(userStr)
    const userId = userData.id
    
    const response = await axios.get(`show_group_request/${userId}`)
    if (response.data.code === 1 && response.data.data) {
      const newCount = response.data.data.length
      // 如果有新消息，立即更新计数并显示通知
      // if (newCount > unreadCount.value && unreadCount.value >= 0) {
      //   const newMessages = newCount - unreadCount.value
      //   if (newMessages > 0) {
      //     ElMessage.info(`You have ${newMessages} new group invitation(s)`)
      //   }
      // }
      unreadCount.value = newCount
    } else {
      unreadCount.value = 0
    }
  } catch (error) {
    console.error('Failed to get message count:', error)
    // 不显示错误消息，避免频繁弹出
  }
}

// 生命周期钩子
onMounted(() => {
  activeIndex.value = route.path
  const user = localStorage.getItem('user')
  if (user) {
    const userData = JSON.parse(user)
    userFlag.name = userData.username
    userFlag.menuList = [
      {url: '/usercenter', name: 'User Center'},
    ]
    isLogin.value = true
    
    // 初始获取未读消息数
    fetchUnreadMessagesCount()
    
    // 设置定时检查新消息 - 改为15秒间隔以减少API调用频率
    checkMessagesTimer = setInterval(fetchUnreadMessagesCount, 15000) // 每15秒检查一次
  } else {
    userFlag.name = '未登录'
    userFlag.menuList = [
      { url: '/register', name: 'Register' },
      { url: '/login', name: 'Login' },
    ]
    isLogin.value = false
  }
})

onBeforeUnmount(() => {
  // 清除定时器
  if (checkMessagesTimer) {
    clearInterval(checkMessagesTimer)
  }
})

const handleUserMenuClick = (item) => {
  if (item.url === '/usercenter') {
    showUserDrawer.value = true
  } else {
    router.push(item.url)
  }
}

const handleNotificationClick = () => {
  console.log('🔔 消息通知图标被点击')
  console.log('当前未读消息数:', unreadCount.value)
  console.log('当前登录状态:', isLogin.value)
  showMessageDialog.value = true
  console.log('弹窗状态已设置为:', showMessageDialog.value)
}
</script>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  background: #fff;
  padding: 5px;
  margin: 0;
  /* box-shadow: 0 2px 8px rgba(0,0,0,0.05); */
}

.el-menu {
  width: 100%;
}

.notification-icon {
  position: fixed;
  top: 20px;
  right: 60px;
  z-index: 1001;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  min-height: 20px;
  user-select: none;
}

.notification-icon:hover {
  background-color: #ecf5ff;
  transform: scale(1.05);
}

.notification-icon:active {
  transform: scale(0.95);
  background-color: #d4edff;
}

.notification-icon .el-icon {
  font-size: 22px;
  color: #606266;
  transition: color 0.3s ease;
}

.notification-icon:hover .el-icon {
  color: #409EFF;
}

.message-badge {
  margin-top: 0;
}

:deep(.el-badge__content) {
  transform: translateY(-5px);
}

.create-time {
  font-size: 12px;
  color: #909399;
}

.fullscreen-icon {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  min-height: 20px;
  user-select: none;
}

.fullscreen-icon:hover {
  background-color: #ecf5ff;
  transform: scale(1.05);
}

.fullscreen-icon:active {
  transform: scale(0.95);
  background-color: #d4edff;
}

.fullscreen-icon .el-icon {
  font-size: 22px;
  color: #606266;
  transition: color 0.3s ease;
}

.fullscreen-icon:hover .el-icon {
  color: #409EFF;
}

.no-requests {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-table th) {
  background-color: #f2f6fc;
  font-weight: bold;
  color: #333;
}

:deep(.el-table td) {
  padding: 12px 0;
}

.user-menu-fixed {
  position: fixed !important;
  top: 10px;
  right: 85px;
  z-index: 1001;
  /* 让它和右侧按钮对齐 */
}

.user-menu-fixed .el-sub-menu__title {
  font-weight: bold;
  font-size: 16px;
  color: #606266;
  background: transparent;
  border-radius: 4px;
  padding: 5px 10px;
}
</style>