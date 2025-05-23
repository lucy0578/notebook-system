<template>
  <div class="editor-wrapper">
    <el-form v-if="note" :model="note" label-width="100px" class="edit-form">
      
      <div class="form-info">
        <el-form-item label="Note ID">
          <el-input v-model="note.notebookId" disabled class="id-input" />
        </el-form-item>
        <el-form-item label="Version">
          <el-input v-model="note.version" disabled class="version-input" />
        </el-form-item>
      </div>
      
      <el-form-item label="Content">
        <div class="editor-container">
          <CustomQuillEditor
            v-model:content="note.content"
            ref="quillEditor"
          />
        </div>
      </el-form-item>
      
      <el-form-item class="form-actions">
        <el-tooltip content="Save" placement="top">
          <el-button type="primary" size="small" @click="saveNote">
            <el-icon><Check /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="Reload" placement="top">
          <el-button size="small" @click="fetchNote">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="Download Word" placement="top">
          <el-button type="success" size="small" @click="downloadAsWord">
            <el-icon><Download /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="Polish" placement="top">
          <el-button type="warning" size="small" @click="polishText" :loading="polishing">
            <el-icon><MagicStick /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="Summarize" placement="top">
          <el-button type="info" size="small" @click="summarizeText" :loading="summarizing">
            <el-icon><Document /></el-icon>
          </el-button>
        </el-tooltip>
        <span v-if="lastWsMsg" class="update-notice">
          <i class="el-icon-warning"></i> {{ lastWsMsg }}
        </span>
      </el-form-item>
    </el-form>
    
    <div v-else class="loading-container">
      <el-icon class="loading-icon"><svg class="is-loading" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.3 0L376.8 331.5a32 32 0 0 1-45.3 45.3L195.2 240.5a32 32 0 0 1 0-45.3zm452.3 452.3a32 32 0 0 1 45.3 0l136.3 136.3a32 32 0 1 1-45.3 45.3L647.5 692.8a32 32 0 0 1 0-45.3zM828.8 195.2a32 32 0 0 1 0 45.3L692.8 376.8a32 32 0 0 1-45.3-45.3l136.3-136.3a32 32 0 0 1 45.3 0zm-452.3 452.3a32 32 0 0 1 0 45.3L240.5 828.8a32 32 0 0 1-45.3-45.3l136.3-136.3a32 32 0 0 1 45.3 0z"/></svg></el-icon>
      <p>Loading editor...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import CustomQuillEditor from './CustomQuillEditor.vue'
import { Check, Refresh, Download, MagicStick, Document } from '@element-plus/icons-vue'

const props = defineProps({
  notebookId: [String, Number]
})

const note = ref({
  notebookId: props.notebookId,
  version: 1,
  content: ''
})
const quillEditor = ref(null)
let websocket = null
const clientId = Math.random().toString(36).substr(2)
const lastWsMsg = ref('')
const editorReady = ref(false)
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_INTERVAL = 3000 // 3 seconds

// Wait for editor to be ready
const waitForEditor = async () => {
  // Simplified logic, just check if editor instance exists
  if (!quillEditor.value) {
    console.warn('Editor instance not initialized yet');
    return null;
  }
  return quillEditor.value;
};

// Save note
const saveNote = async () => {
  if (!note.value) return;
  
  try {
    // Get editor content
    let content = '';
    if (quillEditor.value) {
      content = quillEditor.value.getContent() || '';
    } else {
      content = note.value.content || '';
    }
    
    // Build save data - use content field to save content
    const payload = {
      notebookId: parseInt(note.value.notebookId),
      version: note.value.version,
      content: content,
      // Keep delta as empty object
      delta: {}
    };

    console.log('Sending data:', payload);

    const res = await axios.post('/noteContent_create', payload);
    
    if (res.data?.code === 1) {
      // Successfully updated
      ElMessage.success('Saved successfully');
      
      // Set just saved flag to avoid handling own WebSocket notification
      justSaved = true;
      
      // Reset flag after 5 seconds
      setTimeout(() => {
        justSaved = false;
      }, 5000);

      // Get latest content immediately after saving
      await fetchLatestNote();

      // Send WebSocket update notification to other clients
      sendNoteContentUpdate();
    } else {
      // Handle different error cases
      if (res.data?.msg?.includes('Notebook has been updated')) {
        ElMessage.error('Note has been updated by someone else. Please reload');
        lastWsMsg.value = 'Note has been updated by someone else. Please reload to get the latest content';
      } else if (res.data?.msg?.includes('No change!')) {
        ElMessage.info('Content has not changed');
      } else {
        ElMessage.warning(res.data?.msg || 'Save failed');
      }
    }
  } catch (error) {
    ElMessage.error('Save failed: ' + (error.response?.data?.msg || error.message));
  }
};

// Get latest note content and render to page
const fetchLatestNote = async () => {
  try {
    console.log('Getting latest note content...');
    const res = await axios.get(`/noteContent/${props.notebookId}`);
    
    if (res.data?.code === 1 && res.data.data) {
      // Get old version number for logging
      const oldVersion = note.value.version;
      
      // Update note values
      Object.assign(note.value, res.data.data);
      
      // Ensure data structure is complete
      if (!note.value.content) note.value.content = '';
      
      console.log(`Note version updated: ${oldVersion} -> ${note.value.version}`);
      
      // Clear notification message
      lastWsMsg.value = '';
      
      // If editor exists and content is different, update editor content
      if (quillEditor.value && quillEditor.value.getContent() !== note.value.content) {
        quillEditor.value.setContent?.(note.value.content);
        console.log('Editor content updated');
      }
      
      return true;
    } else {
      console.warn('Failed to get latest note:', res.data?.msg);
      return false;
    }
  } catch (error) {
    console.error('Failed to get latest note:', error);
    return false;
  }
};

// Get note content
const fetchNote = async () => {
  try {
    const result = await fetchLatestNote();
    
    if (result) {
      // Notify success
      ElMessage.success('Latest content loaded');
    } else {
      ElMessage.error('Failed to get note');
    }
  } catch (error) {
    ElMessage.error('Failed to get note: ' + (error.response?.data?.msg || error.message));
  }
};

// WebSocket related
const setupWebSocket = () => {
  try {
    // Close existing connection
    if (websocket) {
      websocket.close();
      websocket = null;
    }
    
    // Get the current host and protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use backend server port instead of Vite dev server port
    const host = 'localhost:8080'; // 或者你的后端服务地址
    
    // Establish WebSocket connection with full URL
    websocket = new WebSocket(`${protocol}//${host}/ws/${clientId}`);
    
    // When connection is established
    websocket.onopen = () => {
      console.log('WebSocket connection established, client ID:', clientId);
      reconnectAttempts = 0;
      lastWsMsg.value = '';
    };
    
    // Receive messages
    websocket.onmessage = (event) => {
      try {
        const message = event.data;
        console.log('Received WebSocket message:', message);
        
        // Handle messages sent by backend
        if (message.includes('新版本笔记保存，请更新') || 
            message === '新版本笔记保存，请更新') {
          // Check if it's our own update notification
          if (justSaved) {
            console.log('Ignoring own update notification');
            justSaved = false;
            return;
          }
          
          // Update notification from other clients
          lastWsMsg.value = 'Note has been updated by someone else. Please reload to get the latest content';
          ElMessage.warning(lastWsMsg.value);
        }
      } catch (error) {
        console.error('Failed to process WebSocket message:', error);
      }
    };
    
    // Connection error
    websocket.onerror = (error) => {
      console.error('WebSocket connection error:', error);
      console.error('WebSocket readyState:', websocket.readyState);
      console.error('WebSocket URL:', websocket.url);
      // Don't increment reconnectAttempts here as onclose will handle it
    };
    
    // Connection closed
    websocket.onclose = (event) => {
      console.log('WebSocket connection closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      
      // Don't attempt to reconnect if the connection was closed normally
      if (event.code === 1000) {
        console.log('WebSocket connection closed normally');
        return;
      }
      
      // Attempt to reconnect if not at max attempts
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(setupWebSocket, RECONNECT_INTERVAL);
      } else {
        console.warn('Max reconnection attempts reached');
        // Don't show error message for every failed attempt
        if (reconnectAttempts === MAX_RECONNECT_ATTEMPTS) {
          ElMessage.warning('Real-time collaboration feature is temporarily unavailable');
        }
      }
    };
  } catch (error) {
    console.error('WebSocket connection failed:', error);
    // Don't show error message for every failed attempt
    if (reconnectAttempts === 0) {
      ElMessage.error('Failed to establish real-time connection');
    }
  }
};

// Flag to indicate if we just saved a note, used to avoid handling our own WebSocket notification
let justSaved = false;

// Download note as Word document
const downloadAsWord = async () => {
  try {
    ElMessage.info('Preparing download...')
    
    // Ensure editor is loaded
    if (!quillEditor.value) {
      ElMessage.error('Editor not ready, please try again later')
      return
    }
    
    // Get current note content
    const content = quillEditor.value.getContent() || note.value.content || ''
    
    if (!content) {
      ElMessage.warning('Note content is empty')
      return
    }
    
    // Create a complete HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Notebook ${note.value.notebookId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .ql-editor { width: 100%; }
            .ql-editor img { max-width: 100%; }
          </style>
        </head>
        <body>
          <h1>Notebook ${note.value.notebookId}</h1>
          <div class="ql-editor">${content}</div>
        </body>
      </html>
    `
    
    // Create Blob object
    const blob = new Blob([htmlContent], { type: 'application/msword' })
    
    // Create download link
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Notebook${note.value.notebookId}.doc` // .doc extension
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
    ElMessage.success('Download successful')
  } catch (error) {
    console.error('Failed to download note:', error)
    ElMessage.error('Download failed, please try again later')
  }
}

// Send note content update via WebSocket
const sendNoteContentUpdate = () => {
  try {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket connection not open, trying to reconnect');
      setupWebSocket();
      // Don't retry sending the message immediately
      return;
    }

    // Prepare NoteContentTransform object expected by backend
    const noteContentTransform = {
      notebookId: parseInt(note.value.notebookId),
      version: note.value.version,
      content: note.value.content,
      delta: {},
      clientId: clientId
    };

    // Send message
    websocket.send(JSON.stringify(noteContentTransform));
    console.log('Note update sent via WebSocket:', noteContentTransform);
  } catch (error) {
    console.error('Failed to send WebSocket note update:', error);
    // Don't show error message for every failed attempt
    if (reconnectAttempts === 0) {
      ElMessage.error('Failed to send update');
    }
  }
};

// Initialize when component is mounted
onMounted(async () => {
  try {
    // Wait for DOM rendering to complete
    await nextTick();
    
    // Set up WebSocket - initialize WebSocket connection first
    setupWebSocket();
    
    // Short delay to ensure component is fully mounted
    setTimeout(async () => {
      try {
        // Get note content
        await fetchNote();
      } catch (error) {
        console.error('Failed to get data:', error);
        ElMessage.error('Failed to get data: ' + error.message);
      }
    }, 100);
  } catch (error) {
    console.error('Initialization failed:', error);
    ElMessage.error('Initialization failed: ' + error.message);
  }
});

// Clean up when component is unmounted
onBeforeUnmount(() => {
  // Close WebSocket connection
  if (websocket) {
    websocket.close();
    websocket = null;
  }
});

// Add new state for polishing
const polishing = ref(false)
const summarizing = ref(false)

// Add new function for getting plain text
const getPlainText = () => {
  if (!quillEditor.value) return ''
  const content = quillEditor.value.getContent() || ''
  // 创建临时 div 来去除 HTML 标签
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = content
  return tempDiv.textContent || tempDiv.innerText || ''
}

// Add new function for summarizing
const summarizeText = async () => {
  if (!quillEditor.value) {
    ElMessage.warning('Editor not ready')
    return
  }

  const text = getPlainText()
  if (!text.trim()) {
    ElMessage.warning('Please enter some text to summarize')
    return
  }

  try {
    summarizing.value = true
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('User not found, please login again')
      return
    }
    const userData = JSON.parse(userStr)

    const response = await axios.post('/summarize', {
      text: text,
      userId: userData.id
    })

    if (response.data.code === 1) {
      quillEditor.value.setContent(response.data.data)
      ElMessage.success('Text summarized successfully')
    } else {
      ElMessage.error(response.data.msg || 'Failed to summarize text')
    }
  } catch (error) {
    console.error('Failed to summarize text:', error)
    ElMessage.error('Failed to summarize text: ' + (error.response?.data?.msg || error.message))
  } finally {
    summarizing.value = false
  }
}

const polishText = async () => {
  if (!quillEditor.value) {
    ElMessage.warning('Editor not ready')
    return
  }

  const text = getPlainText()
  if (!text.trim()) {
    ElMessage.warning('Please enter some text to polish')
    return
  }

  try {
    polishing.value = true
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      ElMessage.error('User not found, please login again')
      return
    }
    const userData = JSON.parse(userStr)

    // 添加重试机制
    let retryCount = 0
    const maxRetries = 3
    let lastError = null

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting to polish text (attempt ${retryCount + 1}/${maxRetries})`)
        const response = await axios.post('/polish', {
          text: text,
          userId: userData.id
        }, {
          timeout: 120000, // 2min超时
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        })

        if (response.data.code === 1) {
          quillEditor.value.setContent(response.data.data)
          ElMessage.success('Text polished successfully')
          return
        } else {
          throw new Error(response.data.msg || 'Failed to polish text')
        }
      } catch (error) {
        lastError = error
        console.error(`Attempt ${retryCount + 1} failed:`, error)
        
        if (error.code === 'ECONNABORTED') {
          console.log('Request timeout, retrying...')
        } else if (error.response) {
          // 如果是服务器错误，立即抛出
          throw error
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        }
      }
    }

    // 所有重试都失败
    throw lastError || new Error('Failed to polish text after multiple attempts')
  } catch (error) {
    console.error('Failed to polish text:', error)
    let errorMessage = 'Failed to polish text'
    
    if (error.response) {
      // 服务器响应错误
      errorMessage = error.response.data?.msg || `Server error: ${error.response.status}`
    } else if (error.request) {
      // 请求发送失败
      errorMessage = 'Network error: Could not connect to the server'
    } else {
      // 其他错误
      errorMessage = error.message || 'Unknown error occurred'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    polishing.value = false
  }
}
</script>

<style scoped>
.editor-wrapper {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 0 auto;
}

.edit-form {
  width: 100%;
}

.form-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #e6e6e6;
  padding-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-header h2 {
  color: #409EFF;
  margin: 0;
  font-weight: 500;
}

.form-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.id-input, .version-input {
  width: 150px;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-actions {
  margin-top: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  padding-right: 20px;
}

.update-notice {
  margin-left: 15px;
  color: #E6A23C;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background-color: #fdf6ec;
  border-radius: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
  gap: 20px;
}

.loading-icon {
  font-size: 48px;
  color: #409EFF;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:deep(.ql-toolbar.ql-snow) {
  background-color: #f8f9fa;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  border-bottom: 1px solid #e6e6e6 !important;
}

:deep(.ql-container.ql-snow) {
  border: none !important;
  height: calc(100% - 42px);
}

:deep(.ql-editor) {
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333333;
}

:deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

:deep(.el-button .el-icon) {
  font-size: 16px;
}

:deep(.el-button span) {
  line-height: 1;
  font-size: 12px;
}

:deep(.el-button.is-loading) {
  opacity: 0.8;
}

:deep(.el-button.is-loading .el-icon) {
  animation: rotating 2s linear infinite;
}
</style>
