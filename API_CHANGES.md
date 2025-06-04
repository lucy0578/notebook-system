# API接口变更记录

## 📝 变更说明
为了只显示用户个人笔记本（不包含组内共享的笔记本），将相关接口从 `/notebook/{userId}` 改为 `/personal_notebook/{userId}`。

## 🔄 变更详情

### 修改的文件和接口：

#### 1. `src/components/Bookshelf/Bookshelf.vue`
- **函数**: `fetchNotebooks()`
- **变更**: `/notebook/${userData.id}` → `/personal_notebook/${userData.id}`
- **作用**: 获取用户个人笔记本列表

#### 2. `src/components/common/Categories.vue` 
- **函数**: `fetchCategories()`
- **变更**: `/notebook/${userData.id}` → `/personal_notebook/${userData.id}`
- **作用**: 获取用户个人笔记本的分类列表

- **函数**: `deleteCategory()`
- **变更**: `/notebook/${userData.id}` → `/personal_notebook/${userData.id}`
- **作用**: 删除分类时获取该分类下的个人笔记本数量

## 🎯 变更目的
- **个人化展示**: 只显示用户自己创建的笔记本
- **隔离共享内容**: 不显示来自群组的共享笔记本
- **清晰的界面**: 在Bookshelf页面专注于个人笔记本管理

## 📋 后端要求
后端需要提供 `/personal_notebook/{userId}` 接口，返回格式应与原 `/notebook/{userId}` 接口相同：

```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "notebookId": 1,
      "title": "笔记本标题",
      "category": "分类名称",
      "public": true,
      "createTime": "2024-01-01T00:00:00",
      "updateTime": "2024-01-01T00:00:00",
      "userId": 123
    }
  ]
}
```

## ⚠️ 注意事项
- 如果需要查看群组共享的笔记本，需要在其他页面/功能中实现
- 现有的笔记本创建、删除、编辑等功能不受影响
- 分类功能仍然正常工作，但只基于个人笔记本 