<template>
  <div class="container">
    <el-card class="form-body">
      <div slot="header">
        <span>个人信息</span>
      </div>
      <el-form ref="form" :model="userForm" label-width="0px">
        <!-- 头像上传 -->
        <el-upload
          class="avatar-uploader"
          action="#"
          :http-request="uploadFile"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload">
          <img v-if="userForm.image" :src="userForm.image" class="avatar">
          <i v-else class="el-icon-plus avatar-uploader-icon"></i>
        </el-upload>

        <!-- 用户名 -->
        <el-form-item>
          <el-input placeholder="请输入用户名" v-model="userForm.username"></el-input>
        </el-form-item>

        <!-- 性别 -->
        <el-form-item>
          <el-select placeholder="请选择性别" v-model="userForm.gender" style="width: 100%">
            <el-option label="男" value="1"></el-option>
            <el-option label="女" value="0"></el-option>
          </el-select>
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item>
          <el-input placeholder="请输入邮箱" v-model="userForm.email"></el-input>
        </el-form-item>

        <!-- 修改密码 -->
        <el-form-item>
          <el-input v-model="userForm.oldPassword" placeholder="旧密码" show-password></el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="userForm.newPassword" placeholder="新密码" show-password></el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="userForm.confirmPassword" placeholder="确认密码" show-password></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'UserCenter',
  data() {
    return {
      userForm: {
        id: '',
        username: '',
        email: '',
        gender: '',
        image: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      uploadHeaders: {
        token: localStorage.getItem('token')
      }
    }
  },
  mounted() {
    // 获取当前用户信息
    this.getUserInfo()
  },
  methods: {
    async getUserInfo() {
      try {
        const userId = localStorage.getItem('userId') || (this.$store.state.currentUser && this.$store.state.currentUser.id);
        const response = await this.$axios.get(`/user/${userId}`);
        // console.log('接口返回数据:', response.data.data);
        this.userForm = response.data.data;
      } catch (error) {
        this.$message.error('获取用户信息失败');
      }
    },

    // 保存修改
    async submitForm() {
      if (this.userForm.oldPassword && this.userForm.oldPassword === this.userForm.newPassword) {
        this.$message.error('新密码不能和旧密码相同!');
        return;
      }
      if (this.userForm.newPassword !== this.userForm.confirmPassword) {
        this.$message.error('新密码与确认密码不一致!');
        return;
      }
      try {
        const params = {
          email: this.userForm.email,
          gender: this.userForm.gender,
          id: this.userForm.id,
          image: this.userForm.image,
          password: this.userForm.newPassword,
          username: this.userForm.username,
        }
        await this.$axios.put('/user', params)
        this.$message.success('修改成功')
      } catch (error) {
        this.$message.error(`修改失败: ${error.message}`)
      }
    },

    handleAvatarSuccess(res, file) {
      this.userForm.image = URL.createObjectURL(file.raw);
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      return isJPG && isLt2M;
    },
    uploadFile(file) {
      const formData = new FormData();
      formData.append('file', file.file);

      this.$axios.post('/common/upload', formData)
        .then(response => {
          file.onSuccess(response.data);
        })
        .catch(error => {
          file.onError(error);
        });
    }
  }
}
</script>

<style>
.container {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 80px;
  padding-bottom: 50px;
}
.form-body {
  border-radius: 10px;
  padding: 20px;
  width: 35%;
  min-width: 350px;
  box-shadow: 5px 3px 10px rgba(0,0,0,0.9);
}
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>
