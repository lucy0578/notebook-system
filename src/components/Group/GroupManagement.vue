<template>
    <el-container>
      <el-header style="padding: 0; height: auto;">
        <NavMenu />
      </el-header>
      <el-main>
        <!-- 搜索框部分 -->
        <div class="search-section">
          <el-input
            v-model="searchText"
            placeholder="搜索群组或用户"
            class="search-input"
            clearable
          >
            <template #append>
              <el-select v-model="searchType" style="width: 100px">
                <el-option label="搜索群组" value="group" />
                <el-option label="搜索用户" value="user" />
              </el-select>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>
  
        <!-- 创建群组按钮 -->
        <el-button type="success" @click="showCreateDialog = true" style="margin-bottom: 20px;">
          创建新群组
        </el-button>
  
        <!-- 我的群组列表 -->
        <div class="group-list">
          <h3>我的群组</h3>
          <el-table :data="myGroups" style="width: 100%" v-if="myGroups.length > 0">
            <el-table-column prop="groupName" label="群组名称" />
            <el-table-column prop="userRole" label="角色">
              <template #default="scope">
                <el-tag :type="scope.row.userRole === 'owner' ? 'success' : 'info'">
                  {{ scope.row.userRole === 'owner' ? '群主' : '成员' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <el-button 
                  v-if="scope.row.userRole === 'owner'"
                  type="danger" 
                  size="small" 
                  @click="handleDeleteGroup(scope.row)"
                >
                  解散群组
                </el-button>
                <el-button 
                  v-if="scope.row.userRole === 'owner'"
                  type="primary" 
                  size="small" 
                  @click="openInviteDialog(scope.row)"
                >
                  邀请成员
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else>
            暂无群组数据
          </div>
        </div>
  
        <!-- 搜索结果列表 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <h3>搜索结果</h3>
          <el-table :data="searchResults" style="width: 100%">
            <el-table-column prop="groupName" label="名称" v-if="searchType === 'group'" />
            <el-table-column prop="userName" label="用户名" v-if="searchType === 'user'" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="handleJoinRequest(scope.row)"
                  v-if="searchType === 'group'"
                >
                  申请加入
                </el-button>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="handleInvite(scope.row)"
                  v-if="searchType === 'user' && currentGroup"
                >
                  邀请加入
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
  
        <!-- 创建群组对话框 -->
        <el-dialog
          v-model="showCreateDialog"
          title="创建新群组"
          width="30%"
        >
          <el-form :model="createForm" :rules="rules" ref="createFormRef">
            <el-form-item label="群组名称" prop="groupName">
              <el-input v-model="createForm.groupName" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showCreateDialog = false">取消</el-button>
            <el-button type="primary" @click="handleCreateGroup">确定</el-button>
          </template>
        </el-dialog>

        <!-- 邀请用户对话框 -->
        <el-dialog
          v-model="showInviteDialog"
          title="邀请用户加入群组"
          width="30%"
        >
          <div class="search-section">
            <el-input
              v-model="inviteSearchText"
              placeholder="搜索用户名"
              class="search-input"
              clearable
            >
            </el-input>
            <el-button type="primary" @click="searchUsers">搜索</el-button>
          </div>
          
          <div v-if="inviteSearchResults.length > 0" class="search-results">
            <el-table :data="inviteSearchResults" style="width: 100%">
              <el-table-column prop="userName" label="用户名" />
              <el-table-column label="操作">
                <template #default="scope">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="handleInvite(scope.row)"
                  >
                    邀请
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else-if="inviteSearchText">
            没有找到匹配的用户
          </div>
          
          <template #footer>
            <el-button @click="closeInviteDialog">关闭</el-button>
          </template>
        </el-dialog>
      </el-main>
    </el-container>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import axios from 'axios'
  import NavMenu from '../common/NavMenu.vue'
  

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
    ElMessage.warning('请输入用户名')
    return
  }
  
  try {
    const response = await axios.post('/search_group_user', {
      groupName: '',
      userName: inviteSearchText.value
    })
    
    if (response.data.data && response.data.data.length > 0) {
      inviteSearchResults.value = response.data.data
    } else {
      inviteSearchResults.value = []
      ElMessage.info('未找到相关用户')
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    ElMessage.error('搜索用户失败')
  }
}

 /**第二步  调用接口 接口拿到数据 将数据存到 searchResults*/
/**搜索群组 */
const handleSearch = async () => {
    try {
      const response = await axios.post('/search_group_user', {
        groupName: searchType.value === 'group' ? searchText.value : '',
        userName: searchType.value === 'user' ? searchText.value : ''
      })
      if (response.data.data.length > 0) {
        searchResults.value = response.data.data
      }else{
        searchResults.value = []
      }
    } catch (error) {
      console.error('搜索失败:', error)
      ElMessage.error('搜索失败')
    }
  }
  /**获取群组列表 */
  const fetchMyGroups = async () => {
    try {
      const response = await axios.get(`/group_show/${userId}`)
      if (response.data.data.length > 0) {
        myGroups.value = response.data.data
      }else{
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
        ElMessage.warning('请输入群组名称')
        return
      }
      
      const response = await axios.post('/group_create', {
        groupId: '',  // 新建群组时不需要 groupId
        groupName: createForm.value.groupName,
        userId: userId  // 使用当前登录用户的 ID
      })
      
      if (response.data.code === 1) {
        ElMessage.success('创建成功')
        showCreateDialog.value = false  // 关闭对话框
        createForm.value.groupName = '' // 清空表单
        await fetchMyGroups()  // 刷新群组列表
      } else {
        ElMessage.error(response.data.msg || '创建失败')
      }
    } catch (error) {
      console.error('创建群组失败:', error)
      ElMessage.error('创建群组失败')
    }
  }

/**解散群组 */
  const handleDeleteGroup = async (group) => {
    try {
      await ElMessageBox.confirm('确定要解散该群组吗？', '提示', {
        type: 'warning'
      })
      
      const response = await axios.delete('/group_delete', {
        data: {
          groupId: group.id,
        userId: userId
        }
      })
      
      if (response.data.code === 1) {
        ElMessage.success('群组已解散')
        fetchMyGroups()
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('解散群组失败:', error)
        ElMessage.error('解散群组失败')
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
        ElMessage.success('申请已发送')
      }
    } catch (error) {
      console.error('发送申请失败:', error)
      ElMessage.error('发送申请失败')
    }
  }
  
  /**邀请用户加入群组 */
  const handleInvite = async (user) => {
    if (!currentGroup.value) {
      ElMessage.warning('请先选择要邀请加入的群组')
      return
    }
    
    try {
      const response = await axios.post('/apply_to_group', {
        fromUserId: userId,
        groupId: currentGroup.value.id,
        toUserId: user.id,
        id: '',
        status: '',
        type: ''
      })
      
      if (response.data.code === 1) {
        ElMessage.success('邀请已发送')
        if (showInviteDialog.value) {
          closeInviteDialog()
        }
      }
    } catch (error) {
      console.error('发送邀请失败:', error)
      ElMessage.error('发送邀请失败')
    }
  }
  
  // 生命周期钩子
  onMounted(() => {
    fetchMyGroups()
  })

// 状态变量
const searchText = ref('')
const searchType = ref('group')
const showCreateDialog = ref(false)

  
  // 表单相关
  const createForm = ref({
    groupName: '',
    userId: userId
  })
  
  const rules = {
    groupName: [
      { required: true, message: '请输入群组名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ]
  }
  
  </script>
  
  <style scoped>
  .search-section {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .search-input {
    width: 300px;
  }
  
  .group-list {
    margin-top: 20px;
  }
  
  .search-results {
    margin-top: 20px;
  }
  
  .el-main {
    padding: 20px;
  }
  </style>