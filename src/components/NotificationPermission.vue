<template>
  <el-alert
    v-if="showPermissionAlert"
    title="通知权限"
    type="warning"
    :closable="false"
    class="notification-permission-alert"
  >
    <template #default>
      <div class="permission-content">
        <div class="permission-text">
          <p>为了及时接收会议邀请通知，请允许浏览器发送通知。</p>
          <p class="permission-note">即使您不在当前页面，也能收到重要的会议邀请。</p>
        </div>
        <div class="permission-actions">
          <el-button size="small" @click="requestPermission" :loading="requesting">
            允许通知
          </el-button>
          <el-button size="small" type="text" @click="dismissAlert">
            稍后提醒
          </el-button>
        </div>
      </div>
    </template>
  </el-alert>

  <!-- 通知状态指示器 -->
  <div class="notification-status" v-if="showStatusIndicator">
    <el-tooltip :content="notificationStatusText" placement="top">
      <span :class="['notification-icon', notificationStatusClass]">
        {{ notificationPermission === 'granted' ? '🔔' : '🔕' }}
      </span>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
// 使用emoji图标，避免导入问题

interface Props {
  showAlert?: boolean;
  showStatusIndicator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAlert: true,
  showStatusIndicator: true
});

// 响应式状态
const notificationPermission = ref<NotificationPermission>('default');
const requesting = ref(false);
const alertDismissed = ref(false);

// 计算属性
const showPermissionAlert = computed(() => {
  return props.showAlert && 
         notificationPermission.value !== 'granted' && 
         !alertDismissed.value &&
         'Notification' in window;
});

const notificationStatusText = computed(() => {
  switch (notificationPermission.value) {
    case 'granted':
      return '通知已启用，您将收到会议邀请通知';
    case 'denied':
      return '通知已被拒绝，您可能错过重要的会议邀请';
    default:
      return '点击启用通知，及时接收会议邀请';
  }
});

const notificationStatusClass = computed(() => {
  switch (notificationPermission.value) {
    case 'granted':
      return 'notification-granted';
    case 'denied':
      return 'notification-denied';
    default:
      return 'notification-default';
  }
});

// 检查通知权限
function checkNotificationPermission() {
  if ('Notification' in window) {
    notificationPermission.value = Notification.permission;
  }
}

// 请求通知权限
async function requestPermission() {
  if (!('Notification' in window)) {
    ElMessage.error('您的浏览器不支持通知功能');
    return;
  }

  requesting.value = true;
  
  try {
    const permission = await Notification.requestPermission();
    notificationPermission.value = permission;
    
    if (permission === 'granted') {
      ElMessage.success('通知权限已启用');
      
      // 发送测试通知
      setTimeout(() => {
        new Notification('会议通知已启用', {
          body: '您现在可以接收会议邀请通知了',
          icon: '/favicon.ico',
          tag: 'permission-granted'
        });
      }, 500);
      
    } else if (permission === 'denied') {
      ElMessage.warning('通知权限被拒绝，您可能错过重要的会议邀请');
    }
  } catch (error) {
    console.error('请求通知权限失败:', error);
    ElMessage.error('请求通知权限失败');
  } finally {
    requesting.value = false;
  }
}

// 关闭提醒
function dismissAlert() {
  alertDismissed.value = true;
  ElMessage.info('您可以随时在设置中启用通知');
}

// 重置提醒状态
function resetAlert() {
  alertDismissed.value = false;
}

// 组件挂载时检查权限
onMounted(() => {
  checkNotificationPermission();
  
  // 监听权限变化
  if ('permissions' in navigator) {
    navigator.permissions.query({ name: 'notifications' as PermissionName })
      .then(permissionStatus => {
        permissionStatus.onchange = () => {
          checkNotificationPermission();
        };
      })
      .catch(error => {
        console.warn('无法监听通知权限变化:', error);
      });
  }
});

// 暴露方法给父组件
defineExpose({
  requestPermission,
  resetAlert,
  checkNotificationPermission
});
</script>

<style scoped>
.notification-permission-alert {
  margin-bottom: 16px;
  border-radius: 8px;
}

.permission-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.permission-text {
  flex: 1;
}

.permission-text p {
  margin: 0;
  line-height: 1.5;
}

.permission-note {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.permission-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.notification-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-icon {
  transition: all 0.2s;
}

.notification-granted {
  color: #10b981;
}

.notification-denied {
  color: #ef4444;
}

.notification-default {
  color: #f59e0b;
}

.notification-status:hover {
  background: rgba(0, 0, 0, 0.05);
}

.notification-status:hover .notification-granted {
  color: #059669;
}

.notification-status:hover .notification-denied {
  color: #dc2626;
}

.notification-status:hover .notification-default {
  color: #d97706;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .permission-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .permission-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
