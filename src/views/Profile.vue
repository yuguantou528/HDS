<template>
  <div class="profile-container">
    <div class="page-header">
      <h2>个人中心</h2>
    </div>

    <div class="profile-content">
      <!-- 个人信息卡片 -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <el-avatar :size="80" class="user-avatar">{{ userInfo.name.charAt(0) }}</el-avatar>
            <el-button type="primary" size="small" class="change-avatar-btn">更换头像</el-button>
          </div>
          <div class="user-basic-info">
            <h3>{{ userInfo.name }}</h3>
            <p class="user-role">{{ userInfo.role }}</p>
            <p class="user-department">{{ userInfo.department }}</p>
            <el-tag :type="userInfo.status === 'active' ? 'success' : 'danger'" size="small">
              {{ userInfo.status === 'active' ? '在线' : '离线' }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="info-sections">
        <!-- 基本信息 -->
        <div class="info-section">
          <div class="section-header">
            <h4><el-icon><User /></el-icon>基本信息</h4>
            <el-button type="primary" size="small" @click="editBasicInfo">编辑</el-button>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <label>用户名：</label>
              <span>{{ userInfo.username }}</span>
            </div>
            <div class="info-item">
              <label>姓名：</label>
              <span>{{ userInfo.name }}</span>
            </div>
            <div class="info-item">
              <label>邮箱：</label>
              <span>{{ userInfo.email }}</span>
            </div>
            <div class="info-item">
              <label>手机号：</label>
              <span>{{ userInfo.phone }}</span>
            </div>
            <div class="info-item">
              <label>部门：</label>
              <span>{{ userInfo.department }}</span>
            </div>
            <div class="info-item">
              <label>角色：</label>
              <span>{{ userInfo.role }}</span>
            </div>
            <div class="info-item">
              <label>注册时间：</label>
              <span>{{ userInfo.createTime }}</span>
            </div>
            <div class="info-item">
              <label>最后登录：</label>
              <span>{{ userInfo.lastLoginTime }}</span>
            </div>
          </div>
        </div>

        <!-- 安全设置 -->
        <div class="info-section">
          <div class="section-header">
            <h4><el-icon><Lock /></el-icon>安全设置</h4>
          </div>
          <div class="security-items">
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">登录密码</div>
                <div class="security-desc">用于登录系统的密码</div>
              </div>
              <el-button type="primary" size="small" @click="changePassword">修改密码</el-button>
            </div>
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">绑定邮箱</div>
                <div class="security-desc">{{ userInfo.email }}</div>
              </div>
              <el-button size="small" @click="changeEmail">修改邮箱</el-button>
            </div>
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">绑定手机</div>
                <div class="security-desc">{{ userInfo.phone }}</div>
              </div>
              <el-button size="small" @click="changePhone">修改手机</el-button>
            </div>
          </div>
        </div>

        <!-- 系统偏好 -->
        <div class="info-section">
          <div class="section-header">
            <h4><el-icon><Setting /></el-icon>系统偏好</h4>
          </div>
          <div class="preference-items">
            <div class="preference-item">
              <label>主题模式：</label>
              <el-radio-group v-model="preferences.theme">
                <el-radio label="light">浅色模式</el-radio>
                <el-radio label="dark">深色模式</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </div>
            <div class="preference-item">
              <label>语言设置：</label>
              <el-select v-model="preferences.language" style="width: 150px;">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </div>
            <div class="preference-item">
              <label>消息通知：</label>
              <el-switch v-model="preferences.notifications" />
            </div>
            <div class="preference-item">
              <label>声音提醒：</label>
              <el-switch v-model="preferences.soundAlerts" />
            </div>
          </div>
          <div class="preference-actions">
            <el-button type="primary" @click="savePreferences">保存设置</el-button>
            <el-button @click="resetPreferences">重置</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑基本信息对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑基本信息" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBasicInfo">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePassword">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Lock, Setting } from '@element-plus/icons-vue';

// 响应式数据
const editDialogVisible = ref(false);
const passwordDialogVisible = ref(false);
const editFormRef = ref();
const passwordFormRef = ref();

// 用户信息
const userInfo = reactive({
  username: 'admin',
  name: '系统管理员',
  email: 'admin@example.com',
  phone: '13800138000',
  department: '技术部',
  role: '系统管理员',
  status: 'active',
  createTime: '2023-01-01 10:00:00',
  lastLoginTime: '2024-01-21 09:30:00'
});

// 编辑表单
const editForm = reactive({
  name: '',
  email: '',
  phone: ''
});

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 系统偏好设置
const preferences = reactive({
  theme: 'light',
  language: 'zh-CN',
  notifications: true,
  soundAlerts: true
});

// 表单验证规则
const editRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
};

const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 方法
const editBasicInfo = () => {
  Object.assign(editForm, {
    name: userInfo.name,
    email: userInfo.email,
    phone: userInfo.phone
  });
  editDialogVisible.value = true;
};

const saveBasicInfo = async () => {
  if (!editFormRef.value) return;
  
  try {
    await editFormRef.value.validate();
    Object.assign(userInfo, editForm);
    ElMessage.success('基本信息更新成功');
    editDialogVisible.value = false;
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

const changePassword = () => {
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  passwordDialogVisible.value = true;
};

const savePassword = async () => {
  if (!passwordFormRef.value) return;
  
  try {
    await passwordFormRef.value.validate();
    // 这里应该调用API修改密码
    ElMessage.success('密码修改成功');
    passwordDialogVisible.value = false;
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

const changeEmail = () => {
  ElMessage.info('邮箱修改功能开发中...');
};

const changePhone = () => {
  ElMessage.info('手机号修改功能开发中...');
};

const savePreferences = () => {
  // 这里应该调用API保存偏好设置
  ElMessage.success('偏好设置保存成功');
};

const resetPreferences = () => {
  Object.assign(preferences, {
    theme: 'light',
    language: 'zh-CN',
    notifications: true,
    soundAlerts: true
  });
  ElMessage.success('偏好设置已重置');
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 30px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  background: linear-gradient(135deg, #409EFF, #67C23A);
  color: white;
  font-size: 32px;
  font-weight: 600;
}

.change-avatar-btn {
  font-size: 12px;
}

.user-basic-info h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.user-role {
  margin: 0 0 4px 0;
  color: #409EFF;
  font-weight: 600;
}

.user-department {
  margin: 0 0 10px 0;
  color: #606266;
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section {
  background: #fff;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f2f5;
}

.section-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-size: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item label {
  min-width: 80px;
  color: #606266;
  font-weight: 600;
}

.info-item span {
  color: #303133;
}

.security-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.security-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.security-desc {
  color: #606266;
  font-size: 14px;
}

.preference-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 25px;
}

.preference-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.preference-item label {
  min-width: 100px;
  color: #606266;
  font-weight: 600;
}

.preference-actions {
  display: flex;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
