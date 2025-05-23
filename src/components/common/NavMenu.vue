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

      <el-sub-menu index="user" style="float: right;">
        <template #title>{{ userFlag.name }}</template>
        <el-menu-item
          v-for="(item, i) in userFlag.menuList"
          :key="i"
          :index="item.url"
          @click="() => router.push(item.url)"
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
      <li style="float: right; outline: none; cursor: pointer; margin-right: 15px;" v-if="isLogin">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
          <el-icon 
            style="height: 35px; line-height: 35px;"
            @click="goToMessageCenter"
          >
            <Bell />
          </el-icon>
        </el-badge>
      </li>

      <li style="float: right; outline: none; cursor: pointer">
        <el-icon 
          style="height: 35px; line-height: 35px;"
          @click="toggleFullScreen"
        >
          <FullScreen />
        </el-icon>
      </li>
    </el-menu>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { FullScreen, Bell } from '@element-plus/icons-vue'
import axios from 'axios'

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
  { name: 'OmniNote', url: '/home' },
  { name: 'Bookshelf', url: '/bookshelf' },
  { name: 'My Groups', url: '/groups' }
]

// 方法
const handleLogout = async () => {
  try {
    await store.dispatch('logout')
    ElMessage.success('注销成功')
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
    ElMessage.error('注销失败')
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

// 获取未读消息数量
const fetchUnreadMessagesCount = async () => {
  if (!isLogin.value) return
  
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return
    
    const userData = JSON.parse(userStr)
    const userId = userData.id
    
    const response = await axios.get(`/show_group_request/${userId}`)
    if (response.data.code === 1 && response.data.data) {
      unreadCount.value = response.data.data.length
    } else {
      unreadCount.value = 0
    }
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 跳转到消息中心
const goToMessageCenter = () => {
  router.push('/usercenter#messages')
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
    
    // 设置定时检查新消息
    checkMessagesTimer = setInterval(fetchUnreadMessagesCount, 30000) // 每30秒检查一次
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

.message-badge {
  margin-top: 13px;
}

:deep(.el-menu-item) {
  font-weight: bold;
}

:deep(.el-menu--horizontal) {
  border-bottom: 1px solid #dcdfe6;
}

:deep(.el-menu--horizontal > .el-menu-item) {
  height: 50px !important;
  line-height: 50px !important;
}

:deep(.el-menu--horizontal > .el-sub-menu .el-sub-menu__title) {
  height: 50px !important;
  line-height: 50px !important;
}

:deep(.el-icon) {
  vertical-align: middle;
  margin-right: 5px;
}

:deep(.el-badge__content) {
  transform: translateY(-5px);
}

.create-time {
  font-size: 12px;
  color: #909399;
}
</style>