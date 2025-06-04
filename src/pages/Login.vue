<template>
    <div class="container">
      <div id="particles-js" class="particles-background"></div>
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
            placeholder="Username"
            :prefix-icon="User"
          />
          </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Password"
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
            Login
          </el-button>
          </el-form-item>
          <el-form-item>
          <el-button
            type="primary"
            class="form-confirm"
            @click="toRegister"
          >
            Register
          </el-button>
          </el-form-item>
        </el-form>
      </el-row>
    </div>
  </template>
  
<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

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

// Particles configuration
const particlesConfig = {
  particles: {
    number: {
      value: 160,
      density: {
        enable: true,
        value_area: 800
      }
    },
    color: {
      value: "#ffffff"
    },
    shape: {
      type: "circle"
    },
    opacity: {
      value: 1,
      random: true,
      anim: {
        enable: true,
        speed: 1,
        opacity_min: 0,
        sync: false
      }
    },
    size: {
      value: 3,
      random: true,
      anim: {
        enable: false,
        speed: 4,
        size_min: 0.3,
        sync: false
      }
    },
    line_linked: {
      enable: false
    },
    move: {
      enable: true,
      speed: 1,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "bubble"
      },
      onclick: {
        enable: true,
        mode: "repulse"
      },
      resize: true
    },
    modes: {
      bubble: {
        distance: 100,
        size: 10,
        duration: 2,
        opacity: 0.7,
        speed: 3
      },
      repulse: {
        distance: 200,
        duration: 0.4
      }
    }
  },
  retina_detect: true
}

// Form validation rules
const rules = {
  username: [
    { required: true, message: 'Please enter username', trigger: 'blur' },
    { min: 2, max: 20, message: 'Length should be 2 to 20 characters', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter password', trigger: 'blur' },
    { min: 3, max: 30, message: 'Length should be 3 to 30 characters', trigger: 'blur' }
  ]
}

// Initialize particles
const initParticles = async () => {
  try {
    // Ensure DOM element exists
    const particlesContainer = document.getElementById('particles-js')
    if (!particlesContainer) {
      console.error('Particles container not found')
      return
    }
    
    // Check if particles.js is already loaded globally
    if (window.particlesJS) {
      console.log('Using global particlesJS')
      window.particlesJS('particles-js', particlesConfig)
      return
    }
    
    // Try to import particles.js from node_modules
    try {
      // Import particles.js
      await import('particles.js')
      
      // After import, check if particlesJS is available globally
      if (window.particlesJS) {
        console.log('particlesJS loaded successfully')
        window.particlesJS('particles-js', particlesConfig)
      } else {
        console.warn('particlesJS not found after import, trying CDN')
        loadParticlesFromCDN()
      }
    } catch (importError) {
      console.warn('Failed to import particles.js:', importError)
      loadParticlesFromCDN()
    }
  } catch (error) {
    console.error('Error initializing particles:', error)
    loadParticlesFromCDN()
  }
}

// Fallback: load from CDN
const loadParticlesFromCDN = () => {
  // Check if script is already loaded
  if (document.querySelector('script[src*="particles"]')) {
    return
  }
  
  console.log('Loading particles.js from CDN')
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
  script.onload = () => {
    console.log('particles.js loaded from CDN')
    if (window.particlesJS) {
      window.particlesJS('particles-js', particlesConfig)
    } else {
      console.error('particlesJS still not available after CDN load')
    }
  }
  script.onerror = () => {
    console.error('Failed to load particles.js from CDN')
  }
  document.head.appendChild(script)
}

// Methods
const onSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // Cancel any previous login request before starting new one
    if (window.cancelLoginRequest) {
      window.cancelLoginRequest('New login request initiated')
    }
    
    const success = await store.dispatch('login', {
      username: loginForm.username,
      password: loginForm.password
    })
    
    if (success) {
      ElMessage.success('Login successful')
      const path = route.query.redirect || '/home'
      // Add delay to ensure login state is fully updated
      setTimeout(() => {
        router.push(path)
      }, 100)
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error(`Login error: ${error.message}`)
    } else {
      ElMessage.error('Unknown error occurred during login')
    }
  } finally {
    loading.value = false
  }
}

const toRegister = () => {
  router.replace('/register')
}

onMounted(() => {
  // 延迟初始化，确保DOM完全渲染
  setTimeout(() => {
    initParticles()
  }, 100)
})
  </script>
  
  <style scoped>
.container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #cce4fc 0%, #404142 100%);
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* 防止滚动条影响粒子显示 */
}

.particles-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none; /* 确保不会阻止其他元素的交互 */
}

.form-body {
  border-radius: 10px;
  width: 30%;
  min-width: 250px;
  padding: 25px;
  background-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
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