<template>
    <div class="container">
      <el-row class="form-body">
        <h2>登录</h2>
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        label-width="0"
      >
        <el-form-item prop="username" class="form-item">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
          </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="Lock"
          />
          </el-form-item>
          <el-form-item>
          <el-button
            type="primary"
            class="form-confirm"
            :loading="loading"
            @click="onSubmit"
          >
            登录
          </el-button>
          </el-form-item>
          <el-form-item>
          <el-button
            type="primary"
            class="form-confirm"
            @click="toRegister"
          >
            去注册
          </el-button>
          </el-form-item>
        </el-form>
      </el-row>
    </div>
  </template>
  
<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const store = useStore()

// Template refs
const formRef = ref(null)

// State
const loading = ref(false)
const loginForm = reactive({
  username: 'leo',
  password: '123'
})

// Form validation rules
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 3, max: 30, message: '长度在 3 到 30 个字符', trigger: 'blur' }
  ]
}

// Methods
const onSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const response = await axios.post('/api/login', {
      username: loginForm.username,
      password: loginForm.password
            })
    
    if (response.data.code === 1) {
      store.commit('login', response.data.data)
      ElMessage.success('登录成功')
      
      const path = route.query.redirect || '/'
      await router.replace(path)
    } else {
      ElMessage.error('账号或密码错误')
              }
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
    console.error('Login failed:', error)
  } finally {
    loading.value = false
  }
}

const toRegister = () => {
  router.replace('/register')
      }
  </script>
  
  <style scoped>
.container {
      height: 100%;
      width: 100%;
  background-image: url("@/assets/homeMask.png");
      background-size: cover;
      position: fixed;
  left: 0;
  top: 0;
      padding-top: 30px;
    }

.form-body {
      position: absolute;
      top: 50%;
      left: 50%;
  transform: translate(-50%, -50%);
      border-radius: 10px;
      margin: 0 auto;
      width: 25%;
      min-width: 300px;
  padding: 30px 30px 15px;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 5px 3px 10px rgba(0, 0, 0, 0.9);
    }

.form-confirm {
      width: 100%;
      background-color: #585858;
      border: 2px solid #484848;
      border-radius: 4px;
    }

:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
}

:deep(.el-form-item__error) {
  color: #ff4757;
}
  </style>