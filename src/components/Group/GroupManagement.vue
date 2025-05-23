<template>
  <el-container class="group-management-container">
    <el-header style="padding: 0; height: auto; z-index: 1000;">
      <NavMenu />
    </el-header>
    <el-container>
      <el-header class="content-header">
        <h2>Group Management</h2>
        <div class="header-actions">
          <el-button type="primary" @click="showCreateDialog = true">New Group</el-button>
        </div>
      </el-header>
      <el-main class="main-content">
        <!-- 搜索框部分 -->
        <div class="search-section">
          <el-input
            v-model="searchText"
            placeholder="Enter group name to search"
            class="search-input"
            clearable
            :prefix-icon="User"
          />
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            Search
          </el-button>
        </div>

        <!-- 我的群组列表 -->
        <div class="group-list">
          <!-- <h3>My Group</h3> -->
          <el-table :data="myGroups" style="width: 100%" v-if="myGroups.length > 0">
            <el-table-column prop="groupName" label="Group Name" />
            <el-table-column prop="userRole" label="Subject">
              <template #default="scope">
                <el-tag :type="scope.row.userRole === 'owner' ? 'success' : 'info'">
                  {{ scope.row.userRole === 'owner' ? 'Owner' : 'Member' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Operation">
              <template #default="scope">
                <el-button 
                  v-if="scope.row.userRole === 'owner'"
                  type="primary" 
                  size="small" 
                  @click="openInviteDialog(scope.row)"
                >
                  Invite
                </el-button>
                <el-button 
                  v-if="scope.row.userRole === 'owner'"
                  type="danger" 
                  size="small" 
                  @click="handleDeleteGroup(scope.row)"
                >
                  Ungroup
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="no-data">
            No groups found. Try searching by group or user ID
          </div>
        </div>

        <!-- 搜索结果列表 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <el-table :data="searchResults" style="width: 100%" class="result-table">
            <el-table-column prop="groupName" label="Group Name" />
            <el-table-column label="Operation" width="640" align="center">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="handleJoinRequest(scope.row)"
                >
                  Apply to join
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-main>
    </el-container>
  </el-container>

  <!-- 创建群组对话框 -->
  <el-dialog
    v-model="showCreateDialog"
    title="New Group"
    width="30%"
  >
    <el-form :model="createForm" :rules="rules" ref="createFormRef">
      <el-form-item label="Name" prop="groupName">
        <el-input v-model="createForm.groupName" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showCreateDialog = false">Cancle</el-button>
      <el-button type="primary" @click="handleCreateGroup">Confirm</el-button>
    </template>
  </el-dialog>

  <!-- 邀请用户对话框 -->
  <el-dialog
    v-model="showInviteDialog"
    title="Invite User"
    width="30%"
  >
    <div class="search-section">
      <el-input
        v-model="inviteSearchText"
        placeholder="Search username"
        class="search-input"
        clearable
      >
      </el-input>
      <el-button type="primary" @click="searchUsers">Search</el-button>
    </div>
    
    <div v-if="inviteSearchResults.length > 0" class="search-results">
      <el-table :data="inviteSearchResults" style="width: 100%">
        <el-table-column prop="userName" label="Username" />
        <el-table-column label="Operation">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleInvite(scope.row)"
            >
              Invite
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else-if="inviteSearchText" class="no-data">
      No matching users found
    </div>
    
    <template #footer>
      <el-button @click="closeInviteDialog">Close</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import NavMenu from '../common/NavMenu.vue'
import { User, Search } from '@element-plus/icons-vue'

/**最开始要先获取用户id  如果接口需要*/
const currentUser = ref(localStorage.getItem('user')) 
const user = JSON.parse(currentUser.value)
const userId = user.id // 直接使用 user.id 而不是 user.data.id

/*第一步 创建一个数组来渲染数据   通过出来搜索群组的列表*/
const searchResults = ref([])
/**我的群组列表 */
const myGroups = ref([])
/**当前选中的群组 - 用于邀请功能 */
const currentGroup = ref(null)
/**邀请对话框相关 */
const showInviteDialog = ref(false)
const inviteSearchText = ref('')
const inviteSearchResults = ref([])

// 打开邀请对话框
const openInviteDialog = (group) => {
  currentGroup.value = group
  showInviteDialog.value = true
  inviteSearchText.value = ''
  inviteSearchResults.value = []
}

// 关闭邀请对话框
const closeInviteDialog = () => {
  showInviteDialog.value = false
  currentGroup.value = null
  inviteSearchText.value = ''
  inviteSearchResults.value = []
}

// 搜索用户
const searchUsers = async () => {
  if (!inviteSearchText.value) {
    ElMessage.warning('Please enter username')
    return
  }
  
  try {
    const response = await axios.post('/search_group_user', {
      groupName: '',  // 保持空字符串
      userName: inviteSearchText.value
    })
    
    if (response.data.code === 1 && response.data.data) {
      inviteSearchResults.value = [response.data.data]
    } else {
      inviteSearchResults.value = []
      ElMessage.info(response.data.msg || 'No matching users found')
    }
  } catch (error) {
    console.error('Failed to search users:', error)
    ElMessage.error('Failed to search users')
  }
}

/**第二步  调用接口 接口拿到数据 将数据存到 searchResults*/
/**搜索群组 */
const handleSearch = async () => {
  try {
    const response = await axios.post('/search_group_user', {
      groupName: searchText.value,
      userName: ''
    })
    
    if (response.data.code === 1) {
      const result = response.data.data
      if (result && result.groupName) {
        searchResults.value = [result]
      } else {
        searchResults.value = []
        ElMessage.info(response.data.msg || 'No results found')
      }
    } else {
      searchResults.value = []
      ElMessage.warning(response.data.msg || 'Search failed')
    }
  } catch (error) {
    console.error('Search failed:', error)
    ElMessage.error('Search failed: ' + (error.response?.data?.msg || error.message))
    searchResults.value = []
  }
}
/**获取群组列表 */
const fetchMyGroups = async () => {
  try {
    const response = await axios.get(`/group_show/${userId}`)
    if (response.data.data.length > 0) {
      // 按创建时间降序排序
      myGroups.value = response.data.data.sort((a, b) => {
        return new Date(b.createTime) - new Date(a.createTime)
      })
    } else {
      console.log('无数据')
      myGroups.value = []
    }
  } catch (error) {
    console.error('获取群组列表失败:', error)
    ElMessage.error('获取群组列表失败')
  }
}
/**创建群组 */
const handleCreateGroup = async () => {
  try {
    // 表单验证
    if (!createForm.value.groupName) {
      ElMessage.warning('Please enter group name')
      return
    }
    
    const response = await axios.post('/group_create', {
      groupId: '',
      groupName: createForm.value.groupName,
      userId: userId
    })
    
    if (response.data.code === 1) {
      ElMessage.success('Group created successfully')
      showCreateDialog.value = false
      createForm.value.groupName = ''
      await fetchMyGroups()
    } else {
      ElMessage.error(response.data.msg || 'Failed to create group')
    }
  } catch (error) {
    console.error('Failed to create group:', error)
    ElMessage.error('Failed to create group')
  }
}

/**解散群组 */
const handleDeleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this group?', 'Warning', {
      type: 'warning'
    })
    
    const response = await axios.delete('/group_delete', {
      data: {
        groupId: group.id,
      userId: userId
      }
    })
    
    if (response.data.code === 1) {
      ElMessage.success('Group deleted successfully')
      fetchMyGroups()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete group:', error)
      ElMessage.error('Failed to delete group')
    }
  }
}

/**加入群组 */
const handleJoinRequest = async (group) => {
  try {
    const response = await axios.post('/apply_to_group', {
      fromUserId: userId,
      groupId: group.id,
      toUserId: group.userId,
      id: '',
      status: '',
      type: ''
    })
    
    if (response.data.code === 1) {
      ElMessage.success('Application sent successfully')
    }
  } catch (error) {
    console.error('Failed to send application:', error)
    ElMessage.error('Failed to send application')
  }
}

/**邀请用户加入群组 */
const handleInvite = async (user) => {
  if (!currentGroup.value) {
    ElMessage.warning('Please select a group first')
    return
  }
  try {
    const response = await axios.post('/invite_to_group', {
      fromUserId: userId,
      groupId: currentGroup.value.id,
      toUserId: user.userId,
      id: 0,
      status: '',
      type: '',
      createTime: ''
    })
    if (response.data.code === 1) {
      ElMessage.success('Invitation sent successfully')
      if (showInviteDialog.value) {
        closeInviteDialog()
      }
    } else {
      ElMessage.error(response.data.msg || 'Failed to send invitation')
    }
  } catch (error) {
    console.error('Failed to send invitation:', error)
    ElMessage.error('Failed to send invitation: ' + (error.response?.data?.msg || error.message))
  }
}

// 生命周期钩子
onMounted(() => {
  fetchMyGroups()
})

// 状态变量
const searchText = ref('')
const showCreateDialog = ref(false)

  
// 表单相关
const createForm = ref({
  groupName: '',
  userId: userId
})
  
const rules = {
  groupName: [
    { required: true, message: 'Please enter group name', trigger: 'blur' },
    { min: 2, max: 20, message: 'Length should be 2 to 20 characters', trigger: 'blur' }
  ]
}
  
</script>

<style scoped>
.group-management-container {
  padding-top: 60px;
  width: 1200px;
}
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: white;
  border-bottom: 1px solid #eee;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  height: 60px;
  margin-top: 1px;
}

.main-content {
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
  padding-right: 20px;
}

h2, h3 {
  margin: 20px;
  color: #409EFF;
  font-weight: 500;
}

h3 {
  margin-bottom: 20px;
  font-size: 18px;
}

:deep(.el-main) {
  padding: 20px;
  background-color: #f5f7fa;
}

.search-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-input {
  width: 230px;
}

.group-list, .search-results {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-header) {
  padding: 0;
}

:deep(.el-menu--horizontal) {
  border-bottom: none;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}

.search-results {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.result-table {
  width: calc(100% - 20px);
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-table th) {
  background: #f2f6fc !important;
  color: #222;
  font-weight: 600;
  font-size: 16px;
}

:deep(.el-table td) {
  padding: 12px 0;
}

.result-title {
  margin: 0 0 20px 20px;
  color: #409EFF;
  font-weight: 500;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-button .el-icon) {
  margin-right: 4px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF inset;
}
</style>