# 后端差分传输实现示例

以下是使用 Java Spring Boot 和 diff-match-patch 库实现差分传输的示例代码。

## 依赖

在 `pom.xml` 中添加依赖：

```xml
<dependency>
    <groupId>name.fraser.neil.plaintext</groupId>
    <artifactId>diff-match-patch</artifactId>
    <version>0.1</version>
</dependency>
<!-- JSON处理 -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

## 控制器实现

```java
@RestController
public class NoteContentController {

    @Autowired
    private NoteContentService noteContentService;
    
    @Autowired
    private WebSocketHandler webSocketHandler;
    
    @GetMapping("/noteContent/{notebookId}")
    public ApiResponse<NoteContent> getNoteContent(@PathVariable String notebookId) {
        NoteContent noteContent = noteContentService.findByNotebookId(notebookId);
        if (noteContent != null) {
            return ApiResponse.success(noteContent);
        } else {
            return ApiResponse.success(null);
        }
    }
    
    @PostMapping("/noteContent_create")
    public ApiResponse<NoteContentUpdateResponse> createNoteContent(@RequestBody NoteContentRequest request) {
        try {
            // 处理 Quill 的 Delta 格式变更
            if (request.getDelta() != null) {
                return handleDeltaUpdate(request);
            } 
            // 向下兼容：检查是否包含差分补丁
            else if (StringUtils.isNotEmpty(request.getDiffPatch())) {
                return handleDiffUpdate(request);
            } else {
                // 向下兼容，处理完整内容更新
                return handleFullContentUpdate(request);
            }
        } catch (VersionConflictException e) {
            return ApiResponse.error("笔记已被更新，请获取最新版本");
        } catch (PatchApplyFailedException e) {
            return ApiResponse.error("更新失败，补丁无法应用");
        } catch (DeltaApplyFailedException e) {
            return ApiResponse.error("更新失败，Delta变更无法应用");
        } catch (Exception e) {
            return ApiResponse.error("保存失败: " + e.getMessage());
        }
    }
    
    /**
     * 处理 Quill Delta 格式的更新
     */
    private ApiResponse<NoteContentUpdateResponse> handleDeltaUpdate(NoteContentRequest request) {
        // 1. 获取当前最新版本
        NoteContent currentContent = noteContentService.findByNotebookId(request.getNotebookId());
        
        // 2. 检查版本
        if (currentContent != null && currentContent.getVersion() > request.getVersion()) {
            throw new VersionConflictException();
        }
        
        // 3. 应用Delta变更
        String newContent;
        try {
            // 如果没有当前内容，则直接使用请求中的完整内容
            if (currentContent == null || StringUtils.isEmpty(currentContent.getContent())) {
                newContent = request.getContent();
            } else {
                // 应用Delta变更到当前内容
                newContent = applyDelta(currentContent.getContent(), request.getDelta());
            }
        } catch (Exception e) {
            throw new DeltaApplyFailedException(e);
        }
        
        // 4. 检查内容是否有变化
        if (currentContent != null && currentContent.getContent().equals(newContent)) {
            NoteContentUpdateResponse response = new NoteContentUpdateResponse();
            response.setId(currentContent.getId());
            response.setVersion(currentContent.getVersion());
            return ApiResponse.success(response, "笔记没有修改");
        }
        
        // 5. 保存新内容
        NoteContent updatedContent;
        if (currentContent == null) {
            updatedContent = new NoteContent();
            updatedContent.setNotebookId(request.getNotebookId());
            updatedContent.setContent(newContent);
            updatedContent.setVersion(1);
            
            // 保存Delta历史（如需要）
            if (request.getDelta() != null) {
                updatedContent.setLastDelta(objectToJsonString(request.getDelta()));
            }
        } else {
            updatedContent = currentContent;
            updatedContent.setContent(newContent);
            updatedContent.setVersion(currentContent.getVersion() + 1);
            
            // 保存Delta历史（如需要）
            if (request.getDelta() != null) {
                updatedContent.setLastDelta(objectToJsonString(request.getDelta()));
            }
        }
        
        NoteContent saved = noteContentService.save(updatedContent);
        
        // 6. 返回结果
        NoteContentUpdateResponse response = new NoteContentUpdateResponse();
        response.setId(saved.getId());
        response.setVersion(saved.getVersion());
        
        return ApiResponse.success(response);
    }
    
    /**
     * 将Delta对象应用到HTML内容上
     * 注意: 这里是一个简化实现，实际应用中可能需要更复杂的处理
     */
    private String applyDelta(String currentHtml, Object deltaObj) {
        try {
            // 解析Delta操作
            Map<String, Object> delta = (Map<String, Object>) deltaObj;
            List<Map<String, Object>> ops = (List<Map<String, Object>>) delta.get("ops");
            
            if (ops == null || ops.isEmpty()) {
                return currentHtml; // 没有操作，返回原内容
            }
            
            // 这里实现Delta操作应用的逻辑
            // 示例处理: 'retain'和'insert'操作
            StringBuilder newHtml = new StringBuilder(currentHtml);
            int currentPosition = 0;
            
            for (Map<String, Object> op : ops) {
                if (op.containsKey("retain")) {
                    // 保留一定数量的字符
                    int retainCount = ((Number) op.get("retain")).intValue();
                    currentPosition += retainCount;
                } else if (op.containsKey("insert")) {
                    // 在当前位置插入字符
                    String insertText = op.get("insert").toString();
                    newHtml.insert(currentPosition, insertText);
                    currentPosition += insertText.length();
                } else if (op.containsKey("delete")) {
                    // 删除一定数量的字符
                    int deleteCount = ((Number) op.get("delete")).intValue();
                    newHtml.delete(currentPosition, currentPosition + deleteCount);
                }
            }
            
            return newHtml.toString();
        } catch (Exception e) {
            throw new RuntimeException("应用Delta失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 将对象转换为JSON字符串
     */
    private String objectToJsonString(Object obj) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
    
    private ApiResponse<NoteContentUpdateResponse> handleDiffUpdate(NoteContentRequest request) {
        // 1. 获取当前最新版本
        NoteContent currentContent = noteContentService.findByNotebookId(request.getNotebookId());
        
        // 2. 检查版本
        if (currentContent != null && currentContent.getVersion() > request.getVersion()) {
            throw new VersionConflictException();
        }
        
        // 3. 应用补丁
        DiffMatchPatch dmp = new DiffMatchPatch();
        String currentText = currentContent != null ? currentContent.getContent() : "";
        LinkedList<DiffMatchPatch.Patch> patches = dmp.patch_fromText(request.getDiffPatch());
        Object[] patchResult = dmp.patch_apply(patches, currentText);
        
        String newContent = (String) patchResult[0];
        boolean[] patchStatus = (boolean[]) patchResult[1];
        
        // 4. 检查补丁是否全部应用成功
        for (boolean status : patchStatus) {
            if (!status) {
                throw new PatchApplyFailedException();
            }
        }
        
        // 5. 检查内容是否有变化
        if (currentText.equals(newContent)) {
            NoteContentUpdateResponse response = new NoteContentUpdateResponse();
            response.setId(currentContent.getId());
            response.setVersion(currentContent.getVersion());
            return ApiResponse.success(response, "笔记没有修改");
        }
        
        // 6. 保存新内容
        NoteContent updatedContent;
        if (currentContent == null) {
            updatedContent = new NoteContent();
            updatedContent.setNotebookId(request.getNotebookId());
            updatedContent.setContent(newContent);
            updatedContent.setVersion(1);
        } else {
            updatedContent = currentContent;
            updatedContent.setContent(newContent);
            updatedContent.setVersion(currentContent.getVersion() + 1);
        }
        
        NoteContent saved = noteContentService.save(updatedContent);
        
        // 7. 返回结果
        NoteContentUpdateResponse response = new NoteContentUpdateResponse();
        response.setId(saved.getId());
        response.setVersion(saved.getVersion());
        
        return ApiResponse.success(response);
    }
    
    private ApiResponse<NoteContentUpdateResponse> handleFullContentUpdate(NoteContentRequest request) {
        // 向下兼容的完整内容更新逻辑
        // ...
    }
}
```

## WebSocket 实现

```java
@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private static final Map<String, Set<String>> notebookSubscriptions = new ConcurrentHashMap<>();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String clientId = extractClientId(session);
        sessions.put(clientId, session);
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String clientId = extractClientId(session);
        sessions.remove(clientId);
        
        // 清理订阅
        for (Map.Entry<String, Set<String>> entry : notebookSubscriptions.entrySet()) {
            entry.getValue().remove(clientId);
        }
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String payload = message.getPayload();
            JSONObject jsonObject = new JSONObject(payload);
            
            String notebookId = jsonObject.getString("notebookId");
            String clientId = jsonObject.getString("clientId");
            String msg = jsonObject.getString("msg");
            
            // 添加当前客户端到笔记本的订阅列表
            notebookSubscriptions
                .computeIfAbsent(notebookId, k -> new HashSet<>())
                .add(clientId);
            
            // 广播消息给其他订阅同一笔记本的客户端
            broadcastToNotebook(notebookId, payload, clientId);
        } catch (Exception e) {
            // 处理异常
        }
    }
    
    private String extractClientId(WebSocketSession session) {
        String path = session.getUri().getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }
    
    public void broadcastToNotebook(String notebookId, String message, String excludeClientId) {
        Set<String> subscribers = notebookSubscriptions.get(notebookId);
        if (subscribers == null) {
            return;
        }
        
        for (String clientId : subscribers) {
            // 不发送给触发更新的客户端
            if (!clientId.equals(excludeClientId)) {
                WebSocketSession session = sessions.get(clientId);
                if (session != null && session.isOpen()) {
                    try {
                        session.sendMessage(new TextMessage(message));
                    } catch (IOException e) {
                        // 处理发送失败
                    }
                }
            }
        }
    }
}
```

## 模型类

```java
// 请求模型
public class NoteContentRequest {
    private String id;
    private String notebookId;
    private Integer version;
    private String content;
    private String diffPatch;
    private Object delta; // Quill的Delta变更对象
    
    // getter 和 setter 方法
}

// 响应模型
public class NoteContentUpdateResponse {
    private String id;
    private Integer version;
    
    // getter 和 setter 方法
}

// API 通用响应
public class ApiResponse<T> {
    private int code;
    private T data;
    private String msg;
    
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "操作成功");
    }
    
    public static <T> ApiResponse<T> success(T data, String msg) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(1);
        response.setData(data);
        response.setMsg(msg);
        return response;
    }
    
    public static <T> ApiResponse<T> error(String msg) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(0);
        response.setMsg(msg);
        return response;
    }
    
    // getter 和 setter 方法
}

// 实体模型
@Entity
public class NoteContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id;
    
    private String notebookId;
    private String content;
    private Integer version;
    
    @Column(columnDefinition = "TEXT")
    private String lastDelta; // 存储最后一次应用的Delta，可选字段
    
    // getter 和 setter 方法
}

// 异常类
public class VersionConflictException extends RuntimeException {
    public VersionConflictException() {
        super("笔记版本已更新，请先获取最新版本");
    }
}

public class PatchApplyFailedException extends RuntimeException {
    public PatchApplyFailedException() {
        super("补丁应用失败");
    }
}

public class DeltaApplyFailedException extends RuntimeException {
    public DeltaApplyFailedException(Throwable cause) {
        super("Delta变更应用失败", cause);
    }
}
```

## 配置 WebSocket

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private WebSocketHandler webSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler, "/ws/{clientId}")
                .setAllowedOrigins("*"); // 生产环境应该限制来源
    }
}
```

## 注意事项

1. 错误处理：代码包含了版本冲突和补丁应用失败的处理。
2. 性能考虑：对于大型文档，考虑存储部分历史版本以加速补丁应用。
3. 安全性：生产环境中应限制 WebSocket 连接来源和添加认证机制。
4. 存储：非常大的文档可能需要考虑分段存储和处理。
5. 并发控制：示例使用版本号做简单并发控制，实际应用可能需要更复杂的锁机制。 