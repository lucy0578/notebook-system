<template>
    <div class="container">
      <el-row class="form-body">
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
    console.log('开始登录表单验证')
    await formRef.value.validate()
    loading.value = true
    console.log('表单验证通过，发起登录请求')
    
    // 在登录之前确保没有正在进行的请求
    if (window.cancelLoginRequest) {
      console.log('取消之前的登录请求')
      window.cancelLoginRequest('用户发起了新的登录请求')
    }
    
    const success = await store.dispatch('login', {
      username: loginForm.username,
      password: loginForm.password
    })
    
    if (success) {
      console.log('登录成功，准备跳转')
      ElMessage.success('登录成功')
      const path = route.query.redirect || '/home'
      console.log('即将跳转到:', path)
      // 添加延迟确保登录状态完全更新
      setTimeout(() => {
        router.push(path)
      }, 100)
    } else {
      console.log('登录返回失败状态')
    }
  } catch (error) {
    console.error('登录过程出错:', error)
    if (error.message) {
      ElMessage.error(`登录错误: ${error.message}`)
    } else {
      ElMessage.error('登录过程发生未知错误')
    }
  } finally {
    loading.value = false
    console.log('登录请求处理完成')
  }
}

const toRegister = () => {
  router.replace('/register')
      }
  </script>
  
  <style scoped>
.container {
  height: 100vh;
  width: 100vw;
  background-image: url("@/assets/homeMask.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-body {
  border-radius: 10px;
  width: 20%;
  min-width: 250px;
  padding: 25px;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 确保表单和表单项居中 */
:deep(.el-form) {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:deep(.el-form-item) {
  width: 80%;  /* 让输入框比容器稍窄一些 */
  margin-bottom: 20px;
}

/* 确保输入框和按钮的宽度一致 */
:deep(.el-input) {
  width: 100%;
}

.form-body h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-confirm {
  width: 100%;
  background-color: #585858;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 12px;
  margin-top: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.form-confirm:hover {
  background-color: #484848;
}

:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-form-item__error) {
  color: #ff4757;
}
  </style>