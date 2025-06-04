<template>
  <div class="container">
    <div id="particles-js-welcome" class="particles-background"></div>
    <svg viewBox="0 0 1000 300" class="background-svg">
      <symbol id="line-text">
        <text text-anchor="middle" x="50%" y="50%" dy="0.4em">
          OmniNote
        </text>
      </symbol>
      <use xlink:href="#line-text" class="text"></use>
      <use xlink:href="#line-text" class="text"></use>
      <use xlink:href="#line-text" class="text"></use>
      <use xlink:href="#line-text" class="text"></use>
    </svg>
    <div class="button-container">
      <el-button
        type="primary"
        size="large" 
        class="custom-button"
        @click="handleLogin"
      >
        Login
      </el-button>
      <el-button
        type="primary"
        size="large"
        class="custom-button"
        @click="handleRegister"
      >
        Register
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

// Initialize particles
const initParticles = async () => {
  try {
    // Ensure DOM element exists
    const particlesContainer = document.getElementById('particles-js-welcome')
    if (!particlesContainer) {
      console.error('Particles container not found')
      return
    }
    
    // Check if particles.js is already loaded globally
    if (window.particlesJS) {
      console.log('Using global particlesJS')
      window.particlesJS('particles-js-welcome', particlesConfig)
      return
    }
    
    // Try to import particles.js from node_modules
    try {
      // Import particles.js
      await import('particles.js')
      
      // After import, check if particlesJS is available globally
      if (window.particlesJS) {
        console.log('particlesJS loaded successfully')
        window.particlesJS('particles-js-welcome', particlesConfig)
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
      window.particlesJS('particles-js-welcome', particlesConfig)
    } else {
      console.error('particlesJS still not available after CDN load')
    }
  }
  script.onerror = () => {
    console.error('Failed to load particles.js from CDN')
  }
  document.head.appendChild(script)
}

const handleLogin = async () => {
  try {
    await router.push('/login')
  } catch (error) {
    console.error('Navigation failed:', error)
  }
}

const handleRegister = async () => {
  try {
    await router.push('/register')
  } catch (error) {
    console.error('Navigation failed:', error)
  }
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
  width: 100%;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: linear-gradient(135deg, #cce4fc 0%, #494c4c 100%);
  font-size: 120px;
  font-weight: bolder;
  text-transform: uppercase;
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

.background-svg {
  position: fixed;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.button-container {
  position: fixed;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 30px;
  z-index: 3;
}

/* Custom button styles, reference Login.vue */
.custom-button {
  background-color: #585858;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 12px 24px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 16px;
  min-width: 100px;
}

:deep(.custom-button) {
  background-color: #585858 !important;
  border-color: #585858 !important;
}

:deep(.custom-button:hover) {
  background-color: #484848 !important;
  border-color: #484848 !important;
}

:deep(.custom-button:focus) {
  background-color: #585858 !important;
  border-color: #585858 !important;
}

.text {
  fill: none;
  stroke-width: 5;
  stroke-dasharray: 0 240;
  stroke-dashoffset: 0;
}

.text:nth-child(4n+1) {
  stroke: #FFFFFF;
  animation: text1 4s ease-in-out forwards;
}

.text:nth-child(4n+2) {
  stroke: #E0E0E0;
  animation: text2 4s ease-in-out forwards;
}

.text:nth-child(4n+3) {
  stroke: #A8A8A8;
  animation: text3 4s ease-in-out forwards;
}

.text:nth-child(4n+4) {
  stroke: #787878;
  animation: text4 4s ease-in-out forwards;
}

@keyframes text1 {
  100% {
    stroke-dasharray: 60 180;
    stroke-dashoffset: 1000;
  }
}

@keyframes text2 {
  100% {
    stroke-dasharray: 60 180;
    stroke-dashoffset: 1060;
  }
}

@keyframes text3 {
  100% {
    stroke-dasharray: 60 180;
    stroke-dashoffset: 1120;
  }
}

@keyframes text4 {
  100% {
    stroke-dasharray: 60 180;
    stroke-dashoffset: 1180;
  }
}
</style> 