<template>
  <div class="container">
    <el-row class="form-body">
      <h2>注册</h2>
      <el-form
        ref="formRef"
        :model="registerForm"
        :rules="rules"
        label-width="0"
      >
        <el-form-item prop="username" class="form-item">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
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
            注册
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="form-confirm"
            @click="toLogin"
          >
            返回登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()

// Template refs
const formRef = ref(null)

// State
const loading = ref(false)
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Email validation
const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  if (value === '') {
    callback(new Error('请输入邮箱'))
  } else if (!emailRegex.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

// Form validation rules
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (registerForm.confirmPassword !== '') {
      formRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }
  ],
  password: [
    { validator: validatePass, trigger: 'blur' },
    { min: 3, max: 30, message: '长度在 3 到 30 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass2, trigger: 'blur' }
  ]
}

// Methods
const onSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const response = await axios.post('/api/register', {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })
    
    if (response.data.code === 1) {
      ElMessage.success('注册成功')
      router.replace('/login')
    } else {
      ElMessage.error(response.data.message || '注册失败')
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
    console.error('Registration failed:', error)
  } finally {
    loading.value = false
  }
}

const toLogin = () => {
  router.replace('/login')
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



