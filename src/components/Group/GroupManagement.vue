<template>
  <el-container class="group-management-container">
    <el-header style="padding: 0; height: auto; z-index: 1000;">
      <NavMenu />
    </el-header>
    <el-container>
      <Categories
        ref="categoriesRef"
        v-model:activeCategory="activeCategory"
        @categoryChange="handleCategoryChange"
        @showRecycleBin="showRecycleBinDialog = true"
        @categoryDeleted="() => {}"
      />
      
      <el-container>
        <el-header class="content-header">
          <h2>Group Management</h2>
          <div class="header-actions">
            <el-input
              v-model="searchText"
              placeholder="Enter group name to search"
              class="search-input"
              clearable
              :prefix-icon="User"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="showCreateDialog = true" style="margin-left: 20px;">
              <el-icon class="button-icon"><Plus /></el-icon>
              <span class="button-text">New Group</span>
            </el-button>
          </div>
        </el-header>
        <el-main class="main-content">
          <!-- 我的群组列表 -->
          <div class="group-list">
            <el-table :data="myGroups" style="width: 100%" v-if="myGroups.length > 0">
              <el-table-column prop="groupName" label="Group Name" />
              <el-table-column prop="userRole" label="Role">
                <template #default="scope">
                  <el-tag :type="scope.row.userRole === 'owner' ? 'success' : 'info'">
                    {{ scope.row.userRole === 'owner' ? 'Owner' : 'Member' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Operation">
                <template #default="scope">
                  <el-button 
                    type="default" 
                    size="small" 
                    @click="openMemberDialog(scope.row)"
                  >
                    Member
                  </el-button>
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
              No group found. Please create or join a group first.
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
    <el-dialog v-model="showRecycleBinDialog" title="Recycle Bin" width="900px">
      <div class="table-container">
        <el-table
          :data="recycleNotebooks"
          style="width: 100%"
          border
          stripe
          highlight-current-row
          :empty-text="recycleEmptyTableMessage"
          class="notebook-table"
        >
          <el-table-column prop="notebookId" label="ID" width="80" align="center" />
          <el-table-column prop="title" label="Title" min-width="120" align="left" />
          <el-table-column prop="category" label="Category" width="120" align="center" />
          <el-table-column label="Actions" width="260" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <el-button size="small" type="success" @click="recoverNotebook(scope.row.notebookId)">Recover</el-button>
                <el-button size="small" type="danger" @click="deleteNotebookPermanently(scope.row.notebookId)">Delete Permanently</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </el-container>

  <!-- 创建群组对话框 -->
  <el-dialog
    v-model="showCreateDialog"
    title="Create New Group"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="createForm" label-width="120px">
      <el-form-item label="Group Name" required>
        <el-input v-model="createForm.groupName" placeholder="Enter group name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleCreateGroup">Create</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 邀请用户对话框 -->
  <el-dialog
    v-model="showInviteDialog"
    title="Invite Users"
    width="400px"
    :close-on-click-modal="false"
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

  <!-- 成员列表对话框 -->
  <el-dialog
    v-model="showMemberDialog"
    title="Group Members"
    width="40%"
  >
    <el-table :data="currentGroupMembers" style="width: 100%">
      <el-table-column prop="userName" label="Username" />
      <el-table-column prop="userRole" label="Role">
        <template #default="scope">
          <el-tag :type="scope.row.userRole === 'owner' ? 'success' : 'info'">
            {{ scope.row.userRole === 'owner' ? 'Owner' : 'Member' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Operations" width="120" align="center">
        <template #default="scope">
          <!-- 如果当前用户是群主，显示移除按钮（但不对自己显示） -->
          <el-button 
            v-if="isCurrentUserOwner && scope.row.userRole !== 'owner'"
            type="danger" 
            size="small" 
            @click="handleRemoveMember(scope.row)"
          >
            Remove
          </el-button>
          <!-- 如果当前用户是组员，只对自己显示退出按钮 -->
          <el-button 
            v-if="!isCurrentUserOwner && scope.row.userName === currentUserName"
            type="warning" 
            size="small" 
            @click="handleQuitGroup(scope.row)"
          >
            Quit
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import NavMenu from '../common/NavMenu.vue'
import Categories from '../common/Categories.vue'
import { User, Search, Plus, Delete, Right } from '@element-plus/icons-vue'

const currentUser = ref(localStorage.getItem('user')) 
const user = JSON.parse(currentUser.value)
const userId = user.id
const currentUserName = user.userName || user.username || user.name // 尝试不同的用户名字段

const searchResults = ref([])
const myGroups = ref([])
const currentGroup = ref(null)
const showInviteDialog = ref(false)
const inviteSearchText = ref('')
const inviteSearchResults = ref([])
const showMemberDialog = ref(false)
const currentGroupMembers = ref([])
const searchText = ref('')
const showCreateDialog = ref(false)
const activeCategory = ref('all')
const showRecycleBinDialog = ref(false)
const recycleNotebooks = ref([])
const recycleLoading = ref(false)
const categoriesRef = ref(null)

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

const handleCategoryChange = (category) => {
  activeCategory.value = category
}

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
    const response = await axios.post('search_group_user', {
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
    ElMessage.error('Failed to search users')
  }
}

/**Second step: call API to get data and store in searchResults
 * Search groups */
const handleSearch = async () => {
  try {
    const response = await axios.post('search_group_user', {
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
    ElMessage.error('Search failed: ' + (error.response?.data?.msg || error.message))
    searchResults.value = []
  }
}

/**Get group list */
const fetchMyGroups = async () => {
  try {
    const response = await axios.get(`group_show/${userId}`)
    if (response.data.data && response.data.data.length > 0) {
      // 根据groupId去重，防止同一个群组显示多次
      const uniqueGroups = response.data.data.filter((group, index, self) => 
        index === self.findIndex(g => g.groupId === group.groupId)
      )
      
      // Sort by creation time in descending order
      myGroups.value = uniqueGroups.sort((a, b) => {
        return new Date(b.createTime) - new Date(a.createTime)
      })
    } else {
      myGroups.value = []
    }
  } catch (error) {
    ElMessage.error('Failed to get group list')
    myGroups.value = []
  }
}

/**Create group */
const handleCreateGroup = async () => {
  try {
    // Form validation
    if (!createForm.value.groupName) {
      ElMessage.warning('Please enter group name')
      return
    }
    
    const response = await axios.post('group_create', {
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
    ElMessage.error('Failed to create group')
  }
}

/**Dissolve group */
const handleDeleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this group?', 'Warning', {
      type: 'warning'
    })
    
    const response = await axios.delete('group_delete', {
      data: {
        groupId: group.groupId,  // 修复：使用groupId而不是id
        userId: userId
      }
    })
    
    if (response.data.code === 1) {
      ElMessage.success('Group deleted successfully')
      fetchMyGroups()
    } else {
      ElMessage.error(response.data.msg || 'Failed to delete group')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete group: ' + (error.response?.data?.msg || error.message))
    }
  }
}

/**Join group */
const handleJoinRequest = async (group) => {
  try {
    const requestPayload = {
      fromUserId: userId,         // Applicant's ID
      groupId: group.groupId,     // Target group's ID (assuming group.groupId is correct)
      toUserId: group.userId,     // Owner's ID (assuming group.userId from search result is the owner's ID)
      id: 0,                      // Placeholder for new request ID, backend should assign
      status: 'pending',          // Explicitly set status
      type: 'join'              // Changed from 'apply' to 'join' to match backend
    }
    
    const response = await axios.post('apply_to_group', requestPayload)
    
    if (response.data.code === 1) {
      ElMessage.success('Application sent successfully')
    } else {
      ElMessage.error(response.data.msg || 'Failed to send application')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || 'Failed to send application')
  }
}

/**Invite user to join group */
const handleInvite = async (user) => {
  if (!currentGroup.value) {
    ElMessage.warning('Please select a group first')
    return
  }
  
  try {
    const response = await axios.post('invite_to_group', {
      fromUserId: userId, // Current user (group owner)
      groupId: currentGroup.value.groupId,
      toUserId: user.userId, // The user being invited
      id: 0, // Placeholder for new request ID
      status: 'pending', // Explicitly set status
      type: 'invite',   // Explicitly set type
      createTime: '' // As per API example, though backend likely handles this
    })
    
    if (response.data.code === 1) {
      ElMessage.success('Invitation sent successfully')
      if (showInviteDialog.value) {
        closeInviteDialog()
      }
      // 注意：邀请成功后不刷新群组列表
      // 因为群组本身没有变化，只是成员可能会增加
      // 成员变化会在查看成员列表时重新获取
    } else {
      ElMessage.error(response.data.msg || 'Failed to send invitation')
    }
  } catch (error) {
    ElMessage.error('Failed to send invitation: ' + (error.response?.data?.msg || error.message))
  }
}

// Open member list dialog
const openMemberDialog = async (group) => {
  try {
    // 设置当前群组信息
    currentGroup.value = group
    
    const response = await axios.get(`group_show_user/${group.groupId}`)
    
    if (response.data.code === 1) {
      if (Array.isArray(response.data.data) && response.data.data.length > 0) {
        currentGroupMembers.value = response.data.data
        showMemberDialog.value = true
      } else {
        ElMessage.warning('No members found in this group')
        currentGroupMembers.value = []
      }
    } else {
      ElMessage.error(response.data.msg || 'Failed to get group members')
      currentGroupMembers.value = []
    }
  } catch (error) {
    ElMessage.error('Failed to get group members: ' + (error.response?.data?.msg || error.message))
    currentGroupMembers.value = []
  }
}

const recycleEmptyTableMessage = computed(() => {
  if (recycleLoading.value) return 'Loading...'
  return 'Recycle bin is empty.'
})

const fetchRecycleNotes = async () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return
  const userId = JSON.parse(userStr).id
  try {
    recycleLoading.value = true
    const url = `notebook_list/${userId}`
    const res = await axios.get(url)
    if (res.data && res.data.code === 1) {
      recycleNotebooks.value = res.data.data || []
    } else {
      recycleNotebooks.value = []
    }
  } catch (error) {
    recycleNotebooks.value = []
    ElMessage.error('Failed to fetch recycle bin notes')
  } finally {
    recycleLoading.value = false
  }
}

const recoverNotebook = async (notebookId) => {
  try {
    await axios.put(`notebook_recover/${notebookId}`)
    ElMessage.success('Notebook recovered successfully')
    fetchRecycleNotes()
    categoriesRef.value?.refreshCategories()
  } catch (error) {
    ElMessage.error('Failed to recover notebook')
  }
}

const deleteNotebookPermanently = async (notebookId) => {
  try {
    await axios.delete(`notebook_delete/${notebookId}`)
    ElMessage.success('Notebook deleted permanently')
    fetchRecycleNotes()
  } catch (error) {
    ElMessage.error('Failed to delete notebook')
  }
}

watch(showRecycleBinDialog, (val) => {
  if (val) fetchRecycleNotes()
})

// Life cycle hook
onMounted(() => {
  fetchMyGroups()
  
  // 添加页面焦点监听，避免不必要的刷新
  const handleFocus = () => {
    // 可选：只在需要时刷新，比如从其他页面返回时
    // fetchMyGroups()
  }
  
  const handleVisibilityChange = () => {
    // 页面变为可见时可以选择性刷新，但通常不需要
    if (!document.hidden) {
      // fetchMyGroups()
    }
  }
  
  window.addEventListener('focus', handleFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 在组件卸载时清理事件监听器
  onBeforeUnmount(() => {
    window.removeEventListener('focus', handleFocus)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
})

// 计算当前用户是否为群主
const isCurrentUserOwner = computed(() => {
  if (!currentGroupMembers.value || currentGroupMembers.value.length === 0) {
    return false
  }
  
  return currentGroupMembers.value.some(member => 
    member.userName === currentUserName && member.userRole === 'owner'
  )
})

// 移除群组成员
const handleRemoveMember = async (member) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to remove ${member.userName} from the group?`, 
      'Confirm Remove', 
      {
        type: 'warning'
      }
    )
    
    const response = await axios.delete('user_delete', {
      data: {
        groupName: currentGroup.value ? currentGroup.value.groupName : '',
        userName: member.userName
      }
    })
    
    if (response.data.code === 1) {
      ElMessage.success('Member removed successfully')
      // 刷新成员列表
      await openMemberDialog(currentGroup.value)
    } else {
      ElMessage.error(response.data.msg || 'Failed to remove member')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to remove member: ' + (error.response?.data?.msg || error.message))
    }
  }
}

// 退出群组
const handleQuitGroup = async (member) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to quit this group?', 
      'Confirm Quit', 
      {
        type: 'warning'
      }
    )
    
    const response = await axios.delete('user_delete', {
      data: {
        groupName: currentGroup.value ? currentGroup.value.groupName : '',
        userName: member.userName
      }
    })
    
    if (response.data.code === 1) {
      ElMessage.success('You have quit the group successfully')
      showMemberDialog.value = false
      // 重新获取用户的群组列表，因为用户已退出该群组
      await fetchMyGroups()
    } else {
      ElMessage.error(response.data.msg || 'Failed to quit group')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to quit group: ' + (error.response?.data?.msg || error.message))
    }
  }
}
</script>

<style scoped>
.group-management-container {
  padding-top: 130px;
  width: 100vw;
  background: #fff;
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 0;
}

.content-header {
  position: fixed;
  top: 60px;
  left: 250px;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: white;
  border-bottom: 1px solid #eee;
  height: 67px;
  margin-top: 1px;
  width: calc(100% - 250px);
}

.main-content {
  margin-left: 250px;
  padding-top: 67px;
  background: #fff;
  min-height: calc(100vh - 60px);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0;
  padding-right: 20px;
}

.button-icon {
  margin-right: 8px;
}

h2, h3 {
  margin: 15px;
  padding: 20px 0;
  color: #409EFF;
}

h3 {
  margin-bottom: 20px;
  font-size: 18px;
}

:deep(.el-main) {
  padding: 20px;
  background-color: #fff;
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

.header-search {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 230px;
}

.table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  justify-content: center;
  min-height: 220px;
  width: 800px;
  margin: 0 auto;
}
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>