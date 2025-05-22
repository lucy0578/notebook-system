<template>
  <el-container>
    <el-header style="padding: 0; height: auto;">
      <NavMenu />
    </el-header>
    <el-main>
      <div class="container">
        <el-card class="form-body">
          <template #header>
            <span>Profile</span>
          </template>
          <el-form ref="formRef" :model="userForm" label-width="0px">
            <!-- Avatar upload -->
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
    
            <!-- Username -->
            <el-form-item>
              <el-input placeholder="Username" v-model="userForm.username"></el-input>
            </el-form-item>
    
            <!-- Gender -->
            <el-form-item>
              <el-select placeholder="Gender" v-model="userForm.gender" style="width: 100%">
                <el-option label="Male" value="1"></el-option>
                <el-option label="Female" value="0"></el-option>
              </el-select>
            </el-form-item>
    
            <!-- Email -->
            <el-form-item>
              <el-input placeholder="Email" v-model="userForm.email"></el-input>
            </el-form-item>
    
            <!-- Change password -->
            <el-form-item>
              <el-input v-model="userForm.oldPassword" placeholder="Old password" show-password></el-input>
            </el-form-item>
            <el-form-item>
              <el-input v-model="userForm.newPassword" placeholder="New password" show-password></el-input>
            </el-form-item>
            <el-form-item>
              <el-input v-model="userForm.confirmPassword" placeholder="Confirm password" show-password></el-input>
            </el-form-item>
    
            <el-form-item class="button-container">
              <el-button type="primary" @click="submitForm">Save</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
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
import { useRouter } from 'vue-router'

const store = useStore()
const formRef = ref(null)
const router = useRouter()

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

// Get user information
const getUserInfo = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('User information not found, please login again')
      router.push('/login')
      return
    }

    const userData = JSON.parse(userStr)
    const userId = userData.id
    
    if (!userId) {
      ElMessage.error('Invalid user ID, please login again')
      router.push('/login')
      return
    }

    const response = await axios.get(`/user/${userId}`)
    if (response.data && response.data.code === 1) {
      Object.assign(userForm, response.data.data)
    } else {
      ElMessage.error(response.data?.msg || 'Failed to get user information')
    }
  } catch (error) {
    console.error('Failed to get user information:', error)
    if (error.response?.status === 400) {
      ElMessage.error('Failed to get user information, please ensure you are logged in')
      router.push('/login')
    } else {
      ElMessage.error('Failed to get user information, please try again later')
    }
  }
}

// Save changes
const submitForm = async () => {
  if (userForm.oldPassword && userForm.oldPassword === userForm.newPassword) {
    ElMessage.error('New password cannot be the same as the old password!')
    return
  }
  if (userForm.newPassword !== userForm.confirmPassword) {
    ElMessage.error('New password and confirm password do not match!')
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
      ElMessage.success('Changes saved successfully')
    } else {
      ElMessage.error(response.data?.msg || 'Failed to save changes')
    }
  } catch (error) {
    console.error('Failed to save changes:', error)
    ElMessage.error(`Failed to save changes: ${error.message}`)
  }
}

const uploadFile = async (params) => {
  const formData = new FormData()
  formData.append('file', params.file)
    
  // Get user information
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    ElMessage.error('User information not found, please login again')
    router.push('/login')
    return
  }
  const userData = JSON.parse(userStr)
    
  // Add user ID to request
  formData.append('userId', userData.id)

  try {
    const response = await axios.post('/common/upload', formData)
    if (response.data && response.data.code === 1) {
      params.onSuccess(response.data)
      userForm.image = response.data.data
      ElMessage.success('Avatar uploaded successfully')
    } else {
      throw new Error(response.data?.msg || 'Upload failed')
    }
  } catch (error) {
    console.error('Upload error:', error)
    ElMessage.error(error.message || 'Upload failed')
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
    ElMessage.error('Avatar must be in JPG format!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('Avatar size cannot exceed 2MB!')
    return false
  }
  return true
}

// 生命周期钩子
onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 1200px;
  padding: 20px;
}

.form-body {
  width: 40%;
  min-width: 350px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
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
  