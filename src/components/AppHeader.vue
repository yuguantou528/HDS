<template>
  <header class="app-header">
    <div class="header-left">
      <el-icon class="mobile-menu-toggle" @click="toggleMobileMenu">
        <Menu />
      </el-icon>
      <div class="logo">
        <div class="logo-color" style="background-color: #409EFF;"></div>
      </div>
      <h1 class="system-title">应急指挥调度系统</h1>
      <AppBreadcrumb />
    </div>
    <div class="header-right">
      <el-badge
        :value="pendingInvitationsCount"
        :hidden="pendingInvitationsCount === 0"
        class="notification-badge"
      >
        <el-icon class="notification-icon" @click="handleNotificationClick"><Bell /></el-icon>
      </el-badge>
      <div class="user-info" @click="toggleUserMenu">
        <el-avatar :size="32" class="user-avatar">{{ userInitials }}</el-avatar>
        <span class="username">{{ username }}</span>
        <el-icon><CaretBottom /></el-icon>
      </div>
      <div v-if="showUserMenu" class="user-dropdown">
        <div class="dropdown-item" @click="goToProfile">
          <el-icon><User /></el-icon>
          <span>个人信息</span>
        </div>
        <div class="divider"></div>
        <div class="dropdown-item" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span>退出登录</span>
        </div>
      </div>
    </div>

    <!-- 会议邀请弹窗 - 使用Teleport传送到body -->
    <Teleport to="body">
      <el-dialog
        v-model="showInvitationDialog"
        title="会议邀请"
        width="500px"
        :append-to-body="true"
        :close-on-click-modal="true"
        :close-on-press-escape="true"
        center
        class="meeting-invitation-dialog"
      >
      <div class="invitation-dialog-content" v-if="currentInvitation">
        <!-- 会议信息 -->
        <div class="meeting-info">
          <div class="meeting-icon">
            <el-icon :size="48" color="#409EFF">
              <VideoCamera />
            </el-icon>
          </div>

          <div class="meeting-details">
            <h3 class="meeting-title">{{ currentInvitation.meetingTopic }}</h3>
            <div class="meeting-meta">
              <div class="meta-item">
                <el-icon><UserFilled /></el-icon>
                <span>主持人：{{ currentInvitation.hostName }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Timer /></el-icon>
                <span>邀请时间：{{ currentInvitation.inviteTime }}</span>
              </div>
              <div class="meta-item" v-if="currentInvitation.participants && currentInvitation.participants.length > 0">
                <el-icon><UserFilled /></el-icon>
                <span>参会人员：{{ currentInvitation.participants.join('、') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 邀请提示 -->
        <div class="invitation-message">
          <el-alert
            title="您收到了一个会议邀请"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <span>{{ currentInvitation.hostName }} 邀请您参加会议，请选择您的响应。</span>
            </template>
          </el-alert>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="rejectInvitationDialog" class="reject-btn">
            <el-icon><Close /></el-icon>
            拒绝
          </el-button>
          <el-button type="primary" @click="acceptInvitationDialog" class="accept-btn">
            <el-icon><VideoCamera /></el-icon>
            接受并加入
          </el-button>
        </div>
      </template>
      </el-dialog>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useMeetingStore } from '@/store/meeting';
import { Bell, CaretBottom, User, SwitchButton, Menu, VideoCamera, UserFilled, Timer, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import AppBreadcrumb from './AppBreadcrumb.vue';

const router = useRouter();
const authStore = useAuthStore();
const meetingStore = useMeetingStore();

const username = ref('管理员');
const showUserMenu = ref(false);

// 会议邀请相关数据
const showInvitationDialog = ref(false);
const currentInvitation = ref(null);
const pendingInvitationsCount = ref(1); // 模拟有1个待处理邀请

const userInitials = computed(() => {
  return username.value.charAt(0).toUpperCase();
});

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const goToProfile = () => {
  router.push('/profile');
  showUserMenu.value = false;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
  showUserMenu.value = false;
};

const toggleMobileMenu = () => {
  const sidebar = document.querySelector('.app-sidebar') as HTMLElement;
  if (sidebar) {
    const isHidden = sidebar.style.transform === 'translateX(-100%)' ||
                    getComputedStyle(sidebar).transform === 'matrix(1, 0, 0, 1, -200, 0)';
    sidebar.style.transform = isHidden ? 'translateX(0)' : 'translateX(-100%)';
  }
};

// 处理通知图标点击
const handleNotificationClick = () => {
  console.log('铃铛图标被点击了！');
  console.log('待处理邀请数量:', pendingInvitationsCount.value);



  if (pendingInvitationsCount.value > 0) {
    // 模拟会议邀请数据
    currentInvitation.value = {
      id: 'inv' + Date.now(),
      meetingTopic: '紧急应急指挥会商',
      hostName: '王主任',
      inviteTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      participants: ['张三', '李四', '王五'],
      meetingId: 'm' + Date.now()
    };
    console.log('设置邀请数据:', currentInvitation.value);
    showInvitationDialog.value = true;
    console.log('弹窗状态:', showInvitationDialog.value);

    // 延迟一下再次检查状态，如果弹窗没显示就用MessageBox
    setTimeout(() => {
      console.log('延迟检查弹窗状态:', showInvitationDialog.value);
      if (showInvitationDialog.value && !document.querySelector('.el-dialog')) {
        console.log('弹窗未显示，使用MessageBox备用方案');
        showInvitationDialog.value = false;
        showMessageBoxInvitation();
      }
    }, 500);
  } else {
    ElMessage.info('暂无新的会议邀请');
  }
};

// 接受邀请
const acceptInvitationDialog = async () => {
  if (!currentInvitation.value) return;

  const invitation = currentInvitation.value;

  // 关闭弹窗
  showInvitationDialog.value = false;

  // 减少待处理邀请数量
  pendingInvitationsCount.value = Math.max(0, pendingInvitationsCount.value - 1);

  ElMessage.info('正在加入会议...');

  try {
    // 使用meeting store的完整加入流程
    await meetingStore.joinMeetingFromInvitation(invitation);

    ElMessage.success(`已成功加入会议：${invitation.meetingTopic}`);

    // 跳转到视频会商页面
    router.push('/dispatch/conference');
  } catch (error) {
    console.error('加入会议失败:', error);
    ElMessage.error('加入会议失败，请重试');
  } finally {
    // 清空当前邀请
    currentInvitation.value = null;
  }
};

// 拒绝邀请
const rejectInvitationDialog = () => {
  if (!currentInvitation.value) return;

  const invitation = currentInvitation.value;

  // 关闭弹窗
  showInvitationDialog.value = false;

  // 减少待处理邀请数量
  pendingInvitationsCount.value = Math.max(0, pendingInvitationsCount.value - 1);

  ElMessage.info(`已拒绝会议邀请：${invitation.meetingTopic}`);

  // 清空当前邀请
  currentInvitation.value = null;
};

// MessageBox备用方案
const showMessageBoxInvitation = async () => {
  if (!currentInvitation.value) return;

  const invitation = currentInvitation.value;

  try {
    await ElMessageBox.confirm(
      `会议主题：${invitation.meetingTopic}\n主持人：${invitation.hostName}\n邀请时间：${invitation.inviteTime}\n参会人员：${invitation.participants.join('、')}\n\n是否接受会议邀请？`,
      '会议邀请',
      {
        confirmButtonText: '接受并加入',
        cancelButtonText: '拒绝',
        type: 'info',
        center: true
      }
    );

    // 用户点击了确认（接受）
    acceptInvitationDialog();
  } catch {
    // 用户点击了取消（拒绝）
    rejectInvitationDialog();
  }
};

// 点击外部关闭用户菜单
const handleClickOutside = (event: MouseEvent) => {
  const userInfo = document.querySelector('.user-info');
  const userDropdown = document.querySelector('.user-dropdown');
  
  if (userInfo && userDropdown && 
      !userInfo.contains(event.target as Node) && 
      !userDropdown.contains(event.target as Node)) {
    showUserMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.mobile-menu-toggle {
  display: none;
  font-size: 20px;
  margin-right: 12px;
  cursor: pointer;
  color: var(--text-color);
  transition: color 0.2s ease;
}

.mobile-menu-toggle:hover {
  color: var(--primary-color);
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.logo-color {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.system-title {
  font-size: 18px;
  font-weight: 600;
  margin-right: 24px;
}

.header-right {
  display: flex;
  align-items: center;
  position: relative;
}

.notification-badge {
  margin-right: 24px;
  cursor: pointer;
}

.notification-icon {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.notification-icon:hover {
  color: #409EFF;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  margin-right: 8px;
  background-color: var(--primary-color);
}

.username {
  font-size: 14px;
  margin-right: 4px;
}

.user-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 160px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 110;
  animation: dropdown 0.2s ease-in-out;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.dropdown-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 4px 0;
}

@keyframes dropdown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: block;
  }

  .system-title {
    font-size: 16px;
    margin-right: 16px;
  }

  .header-left {
    flex: 1;
    overflow: hidden;
  }

  .header-right {
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  .system-title {
    display: none; /* 在很小的屏幕上隐藏标题 */
  }

  .notification-badge {
    margin-right: 16px;
  }
}

/* 会议邀请弹窗样式 */
.meeting-invitation-dialog {
  --el-dialog-border-radius: 12px;
  z-index: 9999 !important;
}

.meeting-invitation-dialog :deep(.el-overlay) {
  z-index: 9999 !important;
}

.meeting-invitation-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.meeting-invitation-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 20px 24px;
  margin: 0;
}

.meeting-invitation-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.meeting-invitation-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 18px;
}

.meeting-invitation-dialog :deep(.el-dialog__headerbtn .el-dialog__close:hover) {
  color: #e5e7eb;
}

.invitation-dialog-content {
  padding: 20px 0;
}

.meeting-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
}

.meeting-icon {
  flex-shrink: 0;
  padding: 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 2px solid #bae6fd;
}

.meeting-details {
  flex: 1;
}

.meeting-title {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.meeting-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.meta-item .el-icon {
  color: #9ca3af;
  font-size: 16px;
}

.invitation-message {
  margin-top: 20px;
}

.invitation-message :deep(.el-alert) {
  border-radius: 8px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 0 24px 24px;
}

.dialog-footer .reject-btn {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #6b7280;
  font-weight: 500;
}

.dialog-footer .reject-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #4b5563;
}

.dialog-footer .accept-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.dialog-footer .accept-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* 弹窗动画效果 */
.meeting-invitation-dialog :deep(.el-dialog) {
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>