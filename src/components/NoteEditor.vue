<template>
  <NavMenu />
  <div class="noteeditor-root"> 
    <!-- Back Button -->
    <div class="back-button">
      <el-tooltip content="Back to Bookshelf" placement="left">
        <el-button type="text" size="large" @click="goBack" class="back-btn">
          <el-icon :size="20"><Close /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
    
    <div class="editor-wrapper">
      <div class="editor-container" :class="{ 'with-ai-panel': showAIPanel }">
        <div class="main-content">
          <template v-if="note">
            <el-form :model="note" label-width="100px" class="edit-form">
              <div class="form-info">
                <el-form-item label="Note ID">
                  <el-input v-model="note.notebookId" disabled class="id-input" />
                </el-form-item>
                <el-form-item label="Version">
                  <el-input v-model="note.version" disabled class="version-input" />
                </el-form-item>
              </div>
              
              <el-form-item label="Content" class="content-form-item">
                <div class="quill-editor-container">
                  <CustomQuillEditor
                    v-model:content="note.content"
                    ref="quillEditor"
                  />
                </div>
              </el-form-item>
              
              <el-form-item class="form-actions">
                <!-- <el-tooltip content="Test WebSocket" placement="top">
                  <el-button type="warning" size="small" @click="testWebSocket" :loading="testingWS">
                    <el-icon><MagicStick /></el-icon>
                  </el-button>
                </el-tooltip> -->
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
                    <template v-if="!polishing">
                      <el-icon><MagicStick /></el-icon>
                    </template>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="Summarize" placement="top">
                  <el-button type="info" size="small" @click="summarizeText" :loading="summarizing">
                    <template v-if="!summarizing">
                      <el-icon><Document /></el-icon>
                    </template>
                  </el-button>
                </el-tooltip>
                <span v-if="lastWsMsg" class="update-notice">
                  <i class="el-icon-warning"></i> {{ lastWsMsg }}
                </span>
              </el-form-item>
            </el-form>
          </template>
          <template v-else>
            <div class="loading-container">
              <el-icon class="loading-icon"><svg class="is-loading" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.3 0L376.8 331.5a32 32 0 0 1-45.3 45.3L195.2 240.5a32 32 0 0 1 0-45.3zm452.3 452.3a32 32 0 0 1 45.3 0l136.3 136.3a32 32 0 1 1-45.3 45.3L647.5 692.8a32 32 0 0 1 0-45.3zM828.8 195.2a32 32 0 0 1 0 45.3L692.8 376.8a32 32 0 0 1-45.3-45.3l136.3-136.3a32 32 0 0 1 45.3 0zm-452.3 452.3a32 32 0 0 1 0 45.3L240.5 828.8a32 32 0 0 1-45.3-45.3l136.3-136.3a32 32 0 0 1 45.3 0z"/></svg></el-icon>
              <p>Loading editor...</p>
            </div>
          </template>
        </div>

        <!-- AI Panel -->
        <div v-if="showAIPanel" class="ai-panel">
          <div class="panel-header">
            <div class="panel-title">
              <h3>{{ comparisonType === 'polish' ? '✨ AI Polish Result' : '📝 AI Summary Result' }}</h3>
              <p class="panel-subtitle">{{ comparisonType === 'polish' ? 'Enhanced version of your content' : 'Condensed summary of your content' }}</p>
            </div>
            <div class="panel-actions">
              <el-button type="text" size="small" @click="closeAIPanel" class="close-btn">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="panel-content">
            <div class="text-content">{{ processedText }}</div>
          </div>
          <div class="panel-footer">
            <div class="panel-buttons">
              <el-tooltip content="Accept" placement="top">
                <el-button type="primary" size="small" @click="acceptChanges" class="accept-btn">
                  <el-icon><Check /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Reject" placement="top">
                <el-button size="small" @click="rejectChanges" class="reject-btn">
                  <el-icon><Close /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Copy" placement="top">
                <el-button type="text" size="small" @click="copyToClipboard(processedText)" class="copy-btn">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import CustomQuillEditor from './CustomQuillEditor.vue'
import { Check, Refresh, Download, MagicStick, Document, CopyDocument, Close, ArrowLeft } from '@element-plus/icons-vue'
import NavMenu from './common/NavMenu.vue'
import { testWebSocketConnection } from '@/utils/websocket-test.js'

const router = useRouter()

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
    const res = await axios.get(`/noteContent/${props.notebookId}`);
    
    if (res.data?.code === 1 && res.data.data) {
      // Get old version number for logging
      const oldVersion = note.value.version;
      
      // Update note values
      Object.assign(note.value, res.data.data);
      
      // Ensure data structure is complete
      if (!note.value.content) note.value.content = '';
      
      // Clear notification message
      lastWsMsg.value = '';
      
      // If editor exists and content is different, update editor content
      if (quillEditor.value && quillEditor.value.getContent() !== note.value.content) {
        quillEditor.value.setContent?.(note.value.content);
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
    
    // In development, use the Vite proxy, in production use the actual backend
    const isDev = import.meta.env.DEV;
    let wsUrl;
    
    if (isDev) {
      // Use Vite dev server proxy for WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host; // Use current host (Vite dev server)
      wsUrl = `${protocol}//${host}/ws/${clientId}`;
    } else {
      // Production: use the actual backend server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = 'localhost:8080'; // Adjust this for production
      wsUrl = `${protocol}//${host}/ws/${clientId}`;
    }
    
    // Establish WebSocket connection
    websocket = new WebSocket(wsUrl);
    
    // When connection is established
    websocket.onopen = () => {
      reconnectAttempts = 0;
      lastWsMsg.value = '';
      console.log('WebSocket connected successfully:', wsUrl);
    };
    
    // Receive messages
    websocket.onmessage = (event) => {
      try {
        const message = event.data;
        
        // Handle messages sent by backend
        if (message.includes('New version note saved, please update') || 
            message === 'New version note saved, please update') {
          // Check if it's our own update notification
          if (justSaved) {
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
      console.log('WebSocket connection closed:', event.code, event.reason);
      
      // Don't attempt to reconnect if the connection was closed normally
      if (event.code === 1000) {
        return;
      }
      
      // Attempt to reconnect if not at max attempts
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(setupWebSocket, RECONNECT_INTERVAL);
      } else {
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
const testingWS = ref(false)

// Add WebSocket test function
const testWebSocket = async () => {
  try {
    testingWS.value = true
    const result = await testWebSocketConnection()
    ElMessage.success('WebSocket 连接测试成功: ' + result)
  } catch (error) {
    ElMessage.error('WebSocket 连接测试失败: ' + error.message)
    console.error('WebSocket test failed:', error)
  } finally {
    testingWS.value = false
  }
}

// Add new function for getting plain text
const getPlainText = () => {
  if (!quillEditor.value) return ''
  const content = quillEditor.value.getContent() || ''
  // Create temporary div to remove HTML tags
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = content
  return tempDiv.textContent || tempDiv.innerText || ''
}

// Replace dialog refs with panel refs
const showAIPanel = ref(false)
const comparisonType = ref('')
const processedText = ref('')

// Add close panel function
const closeAIPanel = () => {
  showAIPanel.value = false
  comparisonType.value = ''
  processedText.value = ''
}

// Add reject changes function
const rejectChanges = () => {
  closeAIPanel()
  ElMessage.info('Changes rejected, original content preserved')
}

// Modify accept changes function
const acceptChanges = () => {
  if (quillEditor.value && processedText.value) {
    quillEditor.value.setContent(processedText.value)
    closeAIPanel()
    ElMessage.success('AI suggestions applied successfully')
  }
}

// Modify polishText function
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

    let retryCount = 0
    const maxRetries = 3
    let lastError = null

    while (retryCount < maxRetries) {
      try {
        const response = await axios.post('/polish', {
          userId: userData.id,
          text: text
        }, {
          timeout: 300000,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        })

        if (response.data.code === 1) {
          const result = response.data.data?.result || response.data.data
          // Remove leading newlines and whitespace
          processedText.value = result.replace(/^\n+/, '').trim()
          comparisonType.value = 'polish'
          showAIPanel.value = true
          return
        } else {
          throw new Error(response.data.msg || 'Failed to polish text')
        }
      } catch (error) {
        lastError = error
        
        if (error.code === 'ECONNABORTED') {
          ElMessage.warning('Request timeout, retrying...')
        } else if (error.response) {
          throw error
        } else if (error.request) {
          ElMessage.warning('Network error, retrying...')
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          const waitTime = 2000 * retryCount
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    throw lastError || new Error('Failed to polish text after multiple attempts')
  } catch (error) {
    let errorMessage = 'Failed to polish text'
    
    if (error.response) {
      errorMessage = error.response.data?.msg || `Server error: ${error.response.status}`
    } else if (error.request) {
      errorMessage = 'Network error: Could not connect to the server'
    } else {
      errorMessage = error.message || 'Unknown error occurred'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    polishing.value = false
  }
}

// Modify summarizeText function
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

    let retryCount = 0
    const maxRetries = 3
    let lastError = null

    while (retryCount < maxRetries) {
      try {
        const response = await axios.post('/summarize', {
          text: text,
          userId: userData.id
        }, {
          timeout: 300000,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        })

        if (response.data.code === 1) {
          const result = response.data.data?.result || response.data.data
          // Remove leading newlines and whitespace
          processedText.value = result.replace(/^\n+/, '').trim()
          comparisonType.value = 'summarize'
          showAIPanel.value = true
          return
        } else {
          throw new Error(response.data.msg || 'Failed to summarize text')
        }
      } catch (error) {
        lastError = error
        
        if (error.code === 'ECONNABORTED') {
          ElMessage.warning('Request timeout, retrying...')
        } else if (error.response) {
          throw error
        } else if (error.request) {
          ElMessage.warning('Network error, retrying...')
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          const waitTime = 2000 * retryCount
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    throw lastError || new Error('Failed to summarize text after multiple attempts')
  } catch (error) {
    let errorMessage = 'Failed to summarize text'
    
    if (error.response) {
      errorMessage = error.response.data?.msg || `Server error: ${error.response.status}`
    } else if (error.request) {
      errorMessage = 'Network error: Could not connect to the server'
    } else {
      errorMessage = error.message || 'Unknown error occurred'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    summarizing.value = false
  }
}

// Add copy to clipboard function
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('Copied to clipboard')
  } catch (err) {
    ElMessage.error('Failed to copy text')
  }
}

// Add goBack function
const goBack = () => {
  // Check if there's a previous page in history
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    // If no history, go to bookshelf
    router.push('/bookshelf')
  }
}
</script>

<style scoped>
.noteeditor-root {
  padding-top: 60px;
  background: #fff;
  width: 100%;
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 0;
}

.editor-wrapper {
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 100%;
  margin: 0 auto;
  min-height: calc(130vh - 100px);
  box-sizing: border-box;
}

.editor-container {
  display: flex;
  gap: 0;
  min-height: calc(100vh - 140px);
  transition: all 0.3s ease;
  width: 100%;
  align-items: flex-start;
}

.editor-container.with-ai-panel .main-content {
  width: 60%;
  flex: 0 0 60%;
}

.main-content {
  flex: 1;
  transition: all 0.3s ease;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ai-panel {
  height: 100%;
  width: 40%;
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  overflow: hidden;
  align-self: stretch;
  margin-right: 20px;
}

.panel-header {
  margin-top: 85px;
  padding: 16px 20px;
  background: #484848;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.panel-title h3 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.panel-subtitle {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.8);
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.close-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  padding: 4px !important;
}

.close-btn:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #fafbfc;
  border-left: 3px solid #e1e8ed;
}

.text-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #2c3e50;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e1e8ed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: left;
}

.panel-footer {
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.panel-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
}

.accept-btn {
  background-color: #28a745 !important;
  border-color: #28a745 !important;
  font-weight: 500;
  padding: 8px !important;
  min-width: auto !important;
}

.accept-btn:hover {
  background-color: #218838 !important;
  border-color: #1e7e34 !important;
}

.reject-btn {
  background-color: #6c757d !important;
  border-color: #6c757d !important;
  color: white !important;
  font-weight: 500;
  padding: 8px !important;
  min-width: auto !important;
}

.reject-btn:hover {
  background-color: #5a6268 !important;
  border-color: #545b62 !important;
}

.copy-btn {
  color: #6c757d !important;
  font-weight: 500;
  padding: 8px !important;
  min-width: auto !important;
}

.copy-btn:hover {
  color: #495057 !important;
  background-color: rgba(108, 117, 125, 0.1) !important;
}

/* Scrollbar styles */
.panel-content::-webkit-scrollbar {
  width: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Existing styles */
.edit-form {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
}

.form-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px 15px 0 15px;
}

.id-input, .version-input {
  width: 150px;
}

.quill-editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-height: 400px;
  margin: 0 15px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  padding: 15px 35px 15px 15px;
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

.content-form-item {
  flex: 1;
  margin-bottom: 0;
}

.content-form-item :deep(.el-form-item__label) {
  padding-left: 15px;
}

.content-form-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
}

.back-button {
  position: absolute;
  top: 65px;
  right: 15px;
  z-index: 10;
}

.back-btn {
  color: #6c757d !important;
  font-weight: 500;
  padding: 8px !important;
  min-width: auto !important;
  border-radius: 50% !important;
}

.back-btn:hover {
  color: #495057 !important;
  background-color: rgba(108, 117, 125, 0.1) !important;
}
</style>
