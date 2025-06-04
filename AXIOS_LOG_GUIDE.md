# Axios请求日志配置指南

## 功能概述

现在每次向后端发送请求时，都会在浏览器控制台中打印详细的请求和响应信息，包括：

- 🚀 **请求信息**：HTTP方法、URL、参数、数据
- ✅ **成功响应**：状态码、响应数据、请求耗时
- ❌ **错误响应**：错误状态码、错误信息、请求耗时

## 日志配置选项

在 `src/main.js` 文件中，你可以通过 `AXIOS_LOG_CONFIG` 对象来控制日志的行为：

```javascript
const AXIOS_LOG_CONFIG = {
  enabled: true,           // 是否启用日志
  logRequest: true,        // 是否记录请求
  logResponse: true,       // 是否记录响应
  logError: true,          // 是否记录错误
  logHeaders: false,       // 是否记录请求头（可能包含敏感信息）
  logData: true,           // 是否记录请求/响应数据
  logDuration: true        // 是否记录请求耗时
}
```

## 控制台输出示例

### 请求日志示例：
```
🚀 [REQUEST] GET /api/show_group_request/123
{
  method: "GET",
  url: "show_group_request/123",
  fullUrl: "/api/show_group_request/123",
  timestamp: "2024/1/15 下午2:30:45"
}
```

### 成功响应日志示例：
```
✅ [RESPONSE] GET show_group_request/123 - 200 OK
{
  status: 200,
  statusText: "OK",
  url: "show_group_request/123",
  method: "GET",
  data: { code: 1, data: [...] },
  duration: "245ms",
  timestamp: "2024/1/15 下午2:30:45"
}
```

### 错误响应日志示例：
```
❌ [RESPONSE ERROR] POST accept_request/456 - 500 Internal Server Error
{
  url: "accept_request/456",
  method: "POST",
  status: 500,
  statusText: "Internal Server Error",
  message: "Request failed with status code 500",
  data: { error: "Database connection failed" },
  duration: "1200ms",
  timestamp: "2024/1/15 下午2:30:45"
}
```

## 如何使用

1. **开启日志**：确保 `enabled: true`
2. **生产环境关闭**：在生产环境中，建议设置 `enabled: false` 以提高性能
3. **安全考虑**：`logHeaders: false` 可以防止敏感的认证信息被记录
4. **调试模式**：需要详细调试时，可以开启所有选项

## 快速切换配置

你可以根据不同环境快速切换配置：

```javascript
// 开发环境 - 详细日志
const AXIOS_LOG_CONFIG = {
  enabled: true,
  logRequest: true,
  logResponse: true,
  logError: true,
  logHeaders: false,  // 安全考虑
  logData: true,
  logDuration: true
}

// 生产环境 - 仅错误日志
const AXIOS_LOG_CONFIG = {
  enabled: true,
  logRequest: false,
  logResponse: false,
  logError: true,      // 生产环境仍记录错误
  logHeaders: false,
  logData: false,
  logDuration: false
}

// 完全关闭日志
const AXIOS_LOG_CONFIG = {
  enabled: false,
  // 其他选项会被忽略
}
```

## 注意事项

1. **性能影响**：在高频请求的情况下，日志记录可能会影响性能
2. **敏感信息**：避免在生产环境中记录包含敏感信息的请求头和数据
3. **存储空间**：控制台日志会占用浏览器内存，长时间运行时建议清理控制台
4. **调试便利**：开发阶段建议开启所有日志，便于调试和排查问题

现在你可以打开浏览器的开发者工具（F12），在Console标签页中查看所有的API请求日志了！ 