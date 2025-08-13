<template>
  <div class="meeting-invite-test">
    <el-card header="会议邀请功能测试">
      <div class="test-section">
        <h4>模拟发送邀请</h4>
        <el-form :model="testForm" label-width="100px">
          <el-form-item label="会议主题">
            <el-input v-model="testForm.topic" placeholder="请输入会议主题" />
          </el-form-item>
          <el-form-item label="主持人">
            <el-input v-model="testForm.host" placeholder="请输入主持人姓名" />
          </el-form-item>
          <el-form-item label="邀请成员">
            <el-select v-model="testForm.members" multiple placeholder="选择邀请成员">
              <el-option 
                v-for="user in testUsers" 
                :key="user.id" 
                :label="user.name" 
                :value="user.id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="sendTestInvite">发送测试邀请</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-divider />

      <div class="test-section">
        <h4>WebSocket连接状态</h4>
        <div class="status-info">
          <el-tag :type="wsStatusType">{{ wsStatusText }}</el-tag>
          <el-button size="small" @click="reconnectWS" :disabled="wsService.isConnected.value">
            重新连接
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h4>通知权限状态</h4>
        <div class="notification-info">
          <el-tag :type="notificationStatusType">{{ notificationStatusText }}</el-tag>
          <el-button size="small" @click="testNotification" :disabled="!notificationEnabled">
            测试通知
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h4>待处理邀请</h4>
        <div v-if="pendingInvites.length === 0" class="no-invites">
          <el-empty description="暂无待处理邀请" :image-size="80" />
        </div>
        <div v-else class="invite-list">
          <el-card 
            v-for="invite in pendingInvites" 
            :key="invite.meetingId" 
            class="invite-card"
            shadow="hover"
          >
            <div class="invite-info">
              <h5>{{ invite.meetingTopic }}</h5>
              <p>主持人：{{ invite.hostName }}</p>
              <p>邀请时间：{{ invite.inviteTime }}</p>
            </div>
            <div class="invite-actions">
              <el-button size="small" type="success" @click="acceptInvite(invite.meetingId)">
                接受
              </el-button>
              <el-button size="small" type="danger" @click="rejectInvite(invite.meetingId)">
                拒绝
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useMeetingStore } from '@/store/meeting';
import wsService, { MeetingInvite } from '@/services/websocket';

// 测试数据
const testUsers = [
  { id: 'u1', name: '张三' },
  { id: 'u2', name: '李四' },
  { id: 'u3', name: '王五' },
  { id: 'u4', name: '赵六' },
  { id: 'u5', name: '钱七' }
];

const testForm = reactive({
  topic: '紧急会议测试',
  host: '系统管理员',
  members: [] as string[]
});

// 使用store
const meetingStore = useMeetingStore();
const { pendingInvites } = meetingStore;

// 计算属性
const wsStatusType = computed(() => {
  return wsService.isConnected.value ? 'success' : 'danger';
});

const wsStatusText = computed(() => {
  return wsService.isConnected.value ? '已连接' : '未连接';
});

const notificationEnabled = computed(() => {
  return 'Notification' in window && Notification.permission === 'granted';
});

const notificationStatusType = computed(() => {
  if (!('Notification' in window)) return 'info';
  switch (Notification.permission) {
    case 'granted': return 'success';
    case 'denied': return 'danger';
    default: return 'warning';
  }
});

const notificationStatusText = computed(() => {
  if (!('Notification' in window)) return '不支持通知';
  switch (Notification.permission) {
    case 'granted': return '已授权';
    case 'denied': return '已拒绝';
    default: return '未授权';
  }
});

// 发送测试邀请
function sendTestInvite() {
  if (!testForm.topic || !testForm.host || testForm.members.length === 0) {
    ElMessage.warning('请填写完整信息');
    return;
  }

  const testInvite: MeetingInvite = {
    meetingId: 'test-' + Date.now(),
    meetingTopic: testForm.topic,
    hostName: testForm.host,
    hostId: 'test-host',
    inviteTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    members: testForm.members.map(id => {
      const user = testUsers.find(u => u.id === id);
      return { id, name: user?.name || `用户${id}` };
    })
  };

  // 模拟接收邀请（实际应该通过WebSocket发送）
  pendingInvites.value.push(testInvite);
  
  // 显示浏览器通知
  if (notificationEnabled.value) {
    new Notification(`会议邀请：${testInvite.meetingTopic}`, {
      body: `${testInvite.hostName} 邀请您参加会议`,
      icon: '/favicon.ico',
      tag: `test-invite-${testInvite.meetingId}`
    });
  }

  ElMessage.success('测试邀请已发送');
}

// 重置表单
function resetForm() {
  testForm.topic = '紧急会议测试';
  testForm.host = '系统管理员';
  testForm.members = [];
}

// 重新连接WebSocket
function reconnectWS() {
  wsService.connect();
  ElMessage.info('正在重新连接...');
}

// 测试通知
function testNotification() {
  if (notificationEnabled.value) {
    new Notification('测试通知', {
      body: '这是一个测试通知，用于验证通知功能是否正常工作',
      icon: '/favicon.ico',
      tag: 'test-notification'
    });
    ElMessage.success('测试通知已发送');
  } else {
    ElMessage.warning('通知功能未启用');
  }
}

// 接受邀请
function acceptInvite(meetingId: string) {
  meetingStore.respondToInvite(meetingId, 'accepted');
  ElMessage.success('已接受邀请');
}

// 拒绝邀请
function rejectInvite(meetingId: string) {
  meetingStore.respondToInvite(meetingId, 'rejected');
  ElMessage.info('已拒绝邀请');
}

// 组件挂载
onMounted(() => {
  // 初始化WebSocket监听器
  meetingStore.initWebSocketListeners();
});
</script>

<style scoped>
.meeting-invite-test {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.test-section {
  margin-bottom: 20px;
}

.test-section h4 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.status-info,
.notification-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.no-invites {
  text-align: center;
  padding: 20px;
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-card {
  border-radius: 8px;
}

.invite-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.invite-info h5 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.invite-info p {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 14px;
}

.invite-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
