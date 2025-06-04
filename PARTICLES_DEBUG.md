# 粒子特效调试指南

## 问题解决步骤

### 1. 检查控制台日志
打开浏览器开发者工具（F12），查看Console标签页中的日志信息：

- ✅ `Using global particlesJS` - 表示粒子库已加载
- ✅ `particlesJS loaded successfully` - 表示动态导入成功
- ✅ `particles.js loaded from CDN` - 表示CDN加载成功
- ❌ `Particles container not found` - DOM元素未找到
- ❌ `Failed to import particles.js` - 导入失败
- ❌ `Failed to load particles.js from CDN` - CDN加载失败

### 2. 检查网络连接
如果看到CDN加载失败，检查：
- 网络连接是否正常
- 是否有防火墙阻止CDN访问
- 尝试手动访问: https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js

### 3. 清除缓存
尝试以下操作：
```bash
# 清除npm缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重启开发服务器
npm run dev
```

### 4. 手动测试粒子
在浏览器控制台中运行以下代码测试：
```javascript
// 检查particles.js是否加载
console.log('particlesJS available:', typeof window.particlesJS)

// 检查DOM元素是否存在
console.log('Welcome container:', document.getElementById('particles-js-welcome'))
console.log('Login container:', document.getElementById('particles-js'))
console.log('Register container:', document.getElementById('particles-js-register'))

// 手动初始化粒子（以Welcome页面为例）
if (window.particlesJS && document.getElementById('particles-js-welcome')) {
  window.particlesJS('particles-js-welcome', {
    particles: {
      number: { value: 80 },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      size: { value: 3 },
      move: { enable: true, speed: 1 }
    }
  })
  console.log('Manual particles initialized')
}
```

## 已修复的问题

### ✅ 改进了粒子库加载机制
- 优先使用已加载的全局particles.js
- 动态导入失败时自动回退到CDN
- 添加了详细的错误日志

### ✅ 优化了CSS样式
- 添加了 `pointer-events: none` 避免交互冲突
- 添加了 `overflow: hidden` 防止滚动条影响
- 确保z-index层级正确

### ✅ 增强了错误处理
- 检查DOM元素是否存在
- 防止重复加载CDN脚本
- 提供详细的调试信息

## 测试方法

1. **Welcome页面**: 访问 `/` 或 `/welcome`
2. **Login页面**: 访问 `/login`  
3. **Register页面**: 访问 `/register`

在每个页面上，你应该能看到白色的动态粒子效果。

## 如果仍然无法显示

请检查：
1. 浏览器是否支持Canvas（现代浏览器都支持）
2. 是否有浏览器扩展阻止了JavaScript执行
3. 控制台是否有其他JavaScript错误影响页面加载
4. 尝试在其他浏览器中测试

如果问题持续存在，请提供控制台的完整错误日志。 