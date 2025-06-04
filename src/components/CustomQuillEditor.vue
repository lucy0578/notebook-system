<template>
  <div class="custom-quill-editor">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import QuillDelta from 'quill-delta';

// Props
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Please enter content...'
  },
  readOnly: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:content', 'text-change', 'editor-ready']);

// Refs
const editorContainer = ref(null);
const quill = ref(null);

// Internal change flag to prevent event loops
let isInternalChange = false;

// Ensure using correct version of Delta
const Delta = QuillDelta;

// Initialize Quill editor
const initQuill = () => {
  if (!editorContainer.value) return;
  
  // Create editor toolbar
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': ['Sans Serif', 'Arial', 'Times New Roman', 'SimSun', 'SimHei', 'Microsoft YaHei'] }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ];

  // Initial content - prepare initial content first to avoid content change events after initialization
  let initialContent = '';
  if (props.content) {
    initialContent = props.content;
  }

  // Initialize Quill instance
  quill.value = new Quill(editorContainer.value, {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow',
    placeholder: props.placeholder,
    readOnly: props.readOnly
  });

  // Set initial content - use internal marker to avoid triggering change events
  if (initialContent) {
    // Mark as internal change to avoid event loops
    isInternalChange = true;
    
    // Set content
    quill.value.root.innerHTML = initialContent;
    
    // Reset internal change marker
    isInternalChange = false;
  }

  // Listen for text changes
  quill.value.on('text-change', (delta, oldContents, source) => {
    // Ignore changes caused by internal programs
    if (isInternalChange) {
      return;
    }
    
    // Ignore changes not caused by user
    if (source !== 'user') {
      return;
    }
    
    // Get new content
    const newHtml = quill.value.root.innerHTML;
    
    // Update content
    emit('update:content', newHtml);
    
    // Send change event
    emit('text-change', {
      delta: delta,
      html: newHtml
    });
  });

  // Wait until initialization is completely finished before notifying editor is ready
  nextTick(() => {
    // Notify editor is ready
    emit('editor-ready', quill.value);
  });
};

// Listen for content changes
watch(() => props.content, (newContent) => {
  if (isInternalChange || !quill.value) return;
  
  // External content change, update editor
  if (newContent !== quill.value.root.innerHTML) {
    isInternalChange = true;
    quill.value.root.innerHTML = newContent || '';
    isInternalChange = false;
  }
});

// Initialize when component mounts
onMounted(() => {
  nextTick(() => {
    initQuill();
  });
});

// Cleanup before component unmounts
onBeforeUnmount(() => {
  if (quill.value) {
    quill.value = null;
  }
});

// Expose methods to parent component
defineExpose({
  // Get editor content
  getContent: () => {
    try {
      if (!quill.value) return '';
      return quill.value.root.innerHTML || '';
    } catch (error) {
      console.error('Failed to get content:', error);
      return '';
    }
  },
  
  // Get plain text content
  getText: () => {
    try {
      if (!quill.value) return '';
      return quill.value.getText() || '';
    } catch (error) {
      console.error('Failed to get text:', error);
      return '';
    }
  },
  
  // Set editor content
  setContent: (content) => {
    try {
      if (!quill.value) {
        console.error('Editor not initialized, cannot set content');
        return;
      }
      
      isInternalChange = true;
      quill.value.root.innerHTML = content;
      isInternalChange = false;
    } catch (error) {
      console.error('Failed to set editor content:', error);
    }
  },
  
  // Get Quill instance
  getQuill: () => quill.value
});
</script>

<style scoped>
.custom-quill-editor {
  width: 100%;
  height: 100%;
}

:deep(.ql-toolbar.ql-snow) {
  border: none !important;
  border-bottom: 1px solid #e2e2e2 !important;
  background-color: #f8f9fa;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

:deep(.ql-toolbar.ql-snow .ql-formats) {
  margin-right: 12px;
}

:deep(.ql-container.ql-snow) {
  border: none !important;
  height: calc(100% - 42px);
}

:deep(.ql-editor) {
  height: 100%;
  min-height: 400px;
  font-family: "Microsoft YaHei", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  padding: 16px;
}

:deep(.ql-editor.ql-blank::before) {
  left: 16px;
  font-style: normal;
  color: #999;
}

:deep(.ql-snow .ql-tooltip) {
  z-index: 1000;
}
</style> 