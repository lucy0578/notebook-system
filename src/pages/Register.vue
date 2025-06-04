<template>
  <div class="container">
    <div id="particles-js-register" class="particles-background"></div>
    <el-row class="form-body">
      <el-form
        ref="formRef"
        :model="registerForm"
        :rules="rules"
        label-width="0"
      >
        <el-form-item prop="username" class="form-item">
          <el-input
            v-model="registerForm.username"
            placeholder="Username"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="Email"
            :prefix-icon="Message"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="Password"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item prop="passwordConfirm">
          <el-input
            v-model="registerForm.passwordConfirm"
            type="password"
            placeholder="Confirm password"
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
            Register
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="form-confirm"
            @click="toLogin"
          >
            Login
          </el-button>
        </el-form-item>
      </el-form>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  passwordConfirm: ''
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

const rules = {
  username: [
    { required: true, message: 'Please enter username', trigger: 'blur' },
    { min: 2, max: 20, message: 'Length should be 2 to 20 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please enter email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter password', trigger: 'blur' },
    { min: 3, max: 30, message: 'Length should be 3 to 30 characters', trigger: 'blur' }
  ],
  passwordConfirm: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('Passwords do not match'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const onSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    await axios.post('/register', {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })
    ElMessage.success('Registration successful')
    router.replace('/login')
  } catch (error) {
    ElMessage.error('Registration failed, please try again')
  } finally {
    loading.value = false
  }
}

const toLogin = () => {
  router.replace('/login')
}

// Initialize particles
const initParticles = async () => {
  try {
    // Ensure DOM element exists
    const particlesContainer = document.getElementById('particles-js-register')
    if (!particlesContainer) {
      console.error('Particles container not found')
      return
    }
    
    // Check if particles.js is already loaded globally
    if (window.particlesJS) {
      console.log('Using global particlesJS')
      window.particlesJS('particles-js-register', particlesConfig)
      return
    }
    
    // Try to import particles.js from node_modules
    try {
      // Import particles.js
      await import('particles.js')
      
      // After import, check if particlesJS is available globally
      if (window.particlesJS) {
        console.log('particlesJS loaded successfully')
        window.particlesJS('particles-js-register', particlesConfig)
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
      window.particlesJS('particles-js-register', particlesConfig)
    } else {
      console.error('particlesJS still not available after CDN load')
    }
  }
  script.onerror = () => {
    console.error('Failed to load particles.js from CDN')
  }
  document.head.appendChild(script)
}

onMounted(() => {
  // Delay initialization to ensure DOM is fully rendered
  setTimeout(() => {
    initParticles()
  }, 100)
})
</script>

<style scoped>
.container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #cce4fc 0%, #494c4c 100%);
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.particles-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
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

:deep(.el-form) {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:deep(.el-form-item) {
  width: 80%;
  margin-bottom: 20px;
}

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
