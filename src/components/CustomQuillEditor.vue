<template>
  <div class="custom-quill-editor" ref="editorContainer"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, nextTick } from 'vue';
import Quill from 'quill';
import QuillDelta from 'quill-delta';
import 'quill/dist/quill.snow.css';

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  readOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:content', 'text-change', 'editor-ready']);

const editorContainer = ref(null);
const quill = ref(null);
let isInternalChange = false;

// 确保使用正确版本的Delta
const Delta = QuillDelta;

// 初始化Quill编辑器
const initQuill = () => {
  if (!editorContainer.value) return;

  console.log('===== 初始化Quill编辑器 =====');
  console.log('Quill版本:', Quill.version);
  
  // 创建编辑器工具栏
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
    [{ 'font': ['Sans Serif', 'Arial', 'Times New Roman', '宋体', '黑体', '微软雅黑'] }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ];

  // 初始内容 - 先准备好初始内容，这样可以避免初始化后的内容变化事件
  let initialContent = '';
  if (props.content) {
    initialContent = props.content;
    console.log('准备初始内容:', initialContent.substring(0, 100) + (initialContent.length > 100 ? '...' : ''));
  }

  // 初始化Quill实例
  quill.value = new Quill(editorContainer.value, {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow',
    placeholder: props.placeholder,
    readOnly: props.readOnly
  });
  
  console.log('Quill实例创建成功');

  // 设置初始内容 - 使用内部标记避免触发变更事件
  if (initialContent) {
    // 标记为内部变更，这样不会触发事件循环
    isInternalChange = true;
    
    // 设置内容
    quill.value.root.innerHTML = initialContent;
    
    console.log('设置初始内容完成');
    
    // 重置内部变更标记
    isInternalChange = false;
  }

  // 监听文本变化
  quill.value.on('text-change', (delta, oldContents, source) => {
    // 忽略程序内部引起的变更
    if (isInternalChange) {
      console.log('忽略内部变更');
      return;
    }
    
    // 忽略非用户引起的变更
    if (source !== 'user') {
      console.log('忽略非用户变更, 来源:', source);
      return;
    }
    
    // 获取新内容
    const newHtml = quill.value.root.innerHTML;
    
    // 更新内容
    emit('update:content', newHtml);
    
    // 发送变更事件
    emit('text-change', {
      delta: delta,
      html: newHtml
    });
  });

  // 等到初始化完全完成后再通知编辑器准备好
  nextTick(() => {
    console.log('编辑器初始化完成，准备发送editor-ready事件');
    
    // 通知编辑器已准备好
    emit('editor-ready', quill.value);
  });
};

// 监听内容变化
watch(() => props.content, (newContent) => {
  if (isInternalChange || !quill.value) return;
  
  // 外部内容变化，更新编辑器
  if (newContent !== quill.value.root.innerHTML) {
    isInternalChange = true;
    quill.value.root.innerHTML = newContent || '';
    isInternalChange = false;
  }
});

// 组件挂载时初始化
onMounted(() => {
  nextTick(() => {
    initQuill();
  });
});

// 组件卸载前清理
onBeforeUnmount(() => {
  if (quill.value) {
    quill.value = null;
  }
});

// 暴露方法给父组件
defineExpose({
  // 获取编辑器内容
  getContent: () => {
    try {
      if (!quill.value) return '';
      return quill.value.root.innerHTML || '';
    } catch (error) {
      console.error('获取内容失败:', error);
      return '';
    }
  },
  
  // 获取纯文本内容
  getText: () => {
    try {
      if (!quill.value) return '';
      return quill.value.getText() || '';
    } catch (error) {
      console.error('获取文本失败:', error);
      return '';
    }
  },
  
  // 设置编辑器内容
  setContent: (content) => {
    try {
      if (!quill.value) {
        console.error('编辑器未初始化，无法设置内容');
        return;
      }
      
      console.log('设置编辑器内容...');
      isInternalChange = true;
      quill.value.root.innerHTML = content;
      isInternalChange = false;
      console.log('编辑器内容已设置');
    } catch (error) {
      console.error('设置编辑器内容失败:', error);
    }
  },
  
  // 获取Quill实例
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
  padding: 12px 15px;
  overflow-y: auto;
}
</style> 