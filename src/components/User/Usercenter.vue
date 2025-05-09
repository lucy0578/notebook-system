<template>
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
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useStore } from 'vuex'
  import { ElMessage } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import axios from 'axios'
  
  const store = useStore()
  const formRef = ref(null)
  
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
  
  const uploadHeaders = {
    token: localStorage.getItem('token')
  }
  
  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const userId = localStorage.getItem('userId') || store.state.currentUser?.id
      const response = await axios.get(`/user/${userId}`)
      Object.assign(userForm, response.data.data)
    } catch (error) {
      ElMessage.error('获取用户信息失败')
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
      await axios.put('/user', params)
      ElMessage.success('修改成功')
    } catch (error) {
      ElMessage.error(`修改失败: ${error.message}`)
    }
  }
  
  const handleAvatarSuccess = (res, file) => {
    userForm.image = URL.createObjectURL(file.raw)
  }
  
  const beforeAvatarUpload = (file) => {
    const isJPG = file.type === 'image/jpeg'
    const isLt2M = file.size / 1024 / 1024 < 2
  
    if (!isJPG) {
      ElMessage.error('上传头像图片只能是 JPG 格式!')
    }
    if (!isLt2M) {
      ElMessage.error('上传头像图片大小不能超过 2MB!')
    }
    return isJPG && isLt2M
  }
  
  const uploadFile = (file) => {
    const formData = new FormData()
    formData.append('file', file.file)
  
    axios.post('/common/upload', formData)
      .then(response => {
        file.onSuccess(response.data)
      })
      .catch(error => {
        file.onError(error)
      })
  }
  
  // 生命周期钩子
  onMounted(() => {
    getUserInfo()
  })
  </script>
  
  <style>
  .container {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 80px;
    padding-bottom: 50px;
  }
  .form-body {
    border-radius: 10px;
    padding: 20px;
    width: 35%;
    min-width: 350px;
    box-shadow: 5px 3px 10px rgba(0,0,0,0.9);
  }
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
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
  </style>
  