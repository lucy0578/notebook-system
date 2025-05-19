# 笔记应用前端

这是一个基于 Vue 3 的笔记应用，使用 Quill 编辑器和 Delta 格式实现高效的差分传输。

## 功能特点

1. **高效的差分传输**: 使用 Quill Delta 格式，只传输修改的部分，而不是整个文档内容
2. **实时协作**: 通过 WebSocket 实现多用户实时协作编辑
3. **版本控制**: 自动处理版本冲突，确保数据一致性
4. **富文本编辑**: 支持各种文本格式化功能

## 技术栈

- Vue 3
- Element Plus UI
- Vue Quill 编辑器
- WebSocket 实时通信
- Axios HTTP 客户端

## 差分传输说明

本应用使用 Quill Delta 格式进行高效的差分传输。每次编辑时，只会将变更的内容发送到服务器，而不是整个文档。

例如，如果用户在文本末尾添加一个感叹号，发送的数据格式如下：

```json
{
  "id": "note123",
  "notebookId": 1,
  "version": 5,
  "delta": {
    "ops": [
      { "retain": 11 },
      { "insert": "!" }
    ]
  }
}
```

其中：
- `retain: 11` 表示保持前 11 个字符不变
- `insert: "!"` 表示在第 11 个字符后插入一个感叹号

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 后端 API

详细的 API 文档请参见 `API.md`。
