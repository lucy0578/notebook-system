<template>
  <el-container>
    <el-header style="padding: 0; height: auto;">
      <NavMenu />
    </el-header>
    <el-main>
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="个人信息" name="profile">
          <div class="container">
            <el-card class="form-body">
              <template #header>
                <span>个人信息</span>
              </template>
              <el-form ref="formRef" :model="userForm" label-width="0px">
                <!-- 头像上传 -->
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :http-request="uploadFile"
                  :show-file-list="false"
                  :on-success="handleAvatarSuccess"
                  :before-upload="beforeAvatarUpload">
                  <img v-if="userForm.image" :src="userForm.image" class="avatar">
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                </el-upload>
        
                <!-- 用户名 -->
                <el-form-item>
                  <el-input placeholder="请输入用户名" v-model="userForm.username"></el-input>
                </el-form-item>
        
                <!-- 性别 -->
                <el-form-item>
                  <el-select placeholder="请选择性别" v-model="userForm.gender" style="width: 100%">
                    <el-option label="男" value="1"></el-option>
                    <el-option label="女" value="0"></el-option>
                  </el-select>
                </el-form-item>
        
                <!-- 邮箱 -->
                <el-form-item>
                  <el-input placeholder="请输入邮箱" v-model="userForm.email"></el-input>
                </el-form-item>
        
                <!-- 修改密码 -->
                <el-form-item>
                  <el-input v-model="userForm.oldPassword" placeholder="旧密码" show-password></el-input>
                </el-form-item>
                <el-form-item>
                  <el-input v-model="userForm.newPassword" placeholder="新密码" show-password></el-input>
                </el-form-item>
                <el-form-item>
                  <el-input v-model="userForm.confirmPassword" placeholder="确认密码" show-password></el-input>
                </el-form-item>
        
                <el-form-item>
                  <el-button type="primary" @click="submitForm">保存修改</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-tab-pane>
        <el-tab-pane label="消息中心" name="messages">
          <MessageCenter />
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import NavMenu from '../common/NavMenu.vue'
import MessageCenter from './MessageCenter.vue'
import { useRouter } from 'vue-router'

const store = useStore()
const formRef = ref(null)
const router = useRouter()
const activeTab = ref('profile')

const userForm = reactive({
  id: '',
  username: '',
  email: '',
  gender: '',
  image: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleTabClick = (tab) => {
  console.log('Tab clicked:', tab.props.name)
}

const uploadHeaders = {
  token: localStorage.getItem('token'),
  'Content-Type': 'multipart/form-data'
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('未找到用户信息，请重新登录')
      router.push('/login')
      return
    }

    const userData = JSON.parse(userStr)
    const userId = userData.id
    
    if (!userId) {
      ElMessage.error('用户ID无效，请重新登录')
      router.push('/login')
      return
    }

    const response = await axios.get(`/user/${userId}`)
    if (response.data && response.data.code === 1) {
      Object.assign(userForm, response.data.data)
    } else {
      ElMessage.error(response.data?.msg || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    if (error.response?.status === 400) {
      ElMessage.error('用户信息获取失败，请确保已登录')
      router.push('/login')
    } else {
      ElMessage.error('获取用户信息失败，请稍后重试')
    }
  }
}

// 保存修改
const submitForm = async () => {
  if (userForm.oldPassword && userForm.oldPassword === userForm.newPassword) {
    ElMessage.error('新密码不能和旧密码相同!')
    return
  }
  if (userForm.newPassword !== userForm.confirmPassword) {
    ElMessage.error('新密码与确认密码不一致!')
    return
  }
  try {
    const params = {
      email: userForm.email,
      gender: userForm.gender,
      id: userForm.id,
      image: userForm.image,
      password: userForm.newPassword,
      username: userForm.username,
    }
    const response = await axios.put('/user', params)
    if (response.data && response.data.code === 1) {
      ElMessage.success('修改成功')
    } else {
      ElMessage.error(response.data?.msg || '修改失败')
    }
  } catch (error) {
    console.error('修改失败:', error)
    ElMessage.error(`修改失败: ${error.message}`)
  }
}

const uploadFile = async (params) => {
  const formData = new FormData()
  formData.append('file', params.file)
    
  // 获取用户信息
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    ElMessage.error('未找到用户信息，请重新登录')
    router.push('/login')
    return
  }
  const userData = JSON.parse(userStr)
    
  // 添加用户ID到请求
  formData.append('userId', userData.id)

  try {
    const response = await axios.post('/common/upload', formData)
    if (response.data && response.data.code === 1) {
      params.onSuccess(response.data)
      userForm.image = response.data.data
      ElMessage.success('头像上传成功')
    } else {
      throw new Error(response.data?.msg || '上传失败')
    }
  } catch (error) {
    console.error('Upload error:', error)
    ElMessage.error(error.message || '上传失败')
    params.onError(error)
  }
}

const handleAvatarSuccess = (response) => {
  // 已在uploadFile中处理
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isLt2M = file.size / 1024 / 1024 < 2

  console.log('Validating file:', {
    type: file.type,
    size: file.size,
    name: file.name
  })

  if (!isJPG) {
    ElMessage.error('上传头像图片只能是 JPG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 生命周期钩子
onMounted(() => {
  getUserInfo()
  
  // 检查URL是否包含消息中心的标记
  if (window.location.hash.includes('messages')) {
    activeTab.value = 'messages'
  }
})
</script>

<style scoped>
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
}

.form-body {
  width: 35%;
  min-width: 350px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-input),
:deep(.el-select) {
  width: 100%;
}
</style>
  