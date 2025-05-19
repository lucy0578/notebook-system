<template>
  <div class="container">
    <div class="form-body">
      <el-form ref="formRef" :model="registerForm" label-width="0px">
        <el-form-item class="form-item">
          <el-input
            placeholder="请输入用户名"
            v-model="registerForm.username"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            placeholder="请输入邮箱"
            v-model="registerForm.email"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            placeholder="请输入密码"
            v-model="registerForm.password"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-input
            placeholder="请确认密码"
            v-model="registerForm.passwordConfirm"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="onSubmit"
            class="form-confirm"
          >
            注册
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="toLogin"
            class="form-confirm"
          >
            去登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const formRef = ref(null)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  passwordConfirm: ''
})

const onSubmit = async () => {
  if (registerForm.password !== registerForm.passwordConfirm) {
    ElMessage({
      message: '两次输入的密码不一致',
      type: 'error'
    })
    return
  }

  try {
    await axios.post('/register', {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })
    ElMessage.success('注册成功')
    router.replace('/login')
  } catch (error) {
    console.error(error)
    ElMessage.error('注册失败，请重试')
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
  left: 0px;
  top: 0px;
}

.form-body {
  border-radius: 10px;
  margin: 100px auto auto;
  width: 25%;
  min-width: 200px;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 5px 3px 10px rgba(0, 0, 0, 0.9);
}

.form-confirm {
  width: 100%;
  background-color: #585858;
  border: 2px solid #484848;
  border-radius: 4px;
}
</style>
