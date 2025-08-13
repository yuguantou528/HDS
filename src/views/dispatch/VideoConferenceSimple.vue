<template>
  <div class="video-conference-simple">
    <el-card header="视频会商系统">
      <div class="conference-content">
        <h2>视频会商功能测试</h2>
        
        <!-- 通知权限 -->
        <div class="section">
          <h3>通知权限</h3>
          <el-button @click="requestNotificationPermission" type="primary">
            请求通知权限
          </el-button>
          <el-tag :type="notificationStatusType" style="margin-left: 10px;">
            {{ notificationStatusText }}
          </el-tag>
        </div>

        <!-- WebSocket连接状态 -->
        <div class="section">
          <h3>WebSocket连接</h3>
          <el-button @click="connectWebSocket" :disabled="isConnected">
            连接WebSocket
          </el-button>
          <el-button @click="disconnectWebSocket" :disabled="!isConnected">
            断开连接
          </el-button>
          <el-tag :type="isConnected ? 'success' : 'danger'" style="margin-left: 10px;">
            {{ isConnected ? '已连接' : '未连接' }}
          </el-tag>
        </div>

        <!-- 会议邀请测试 -->
        <div class="section">
          <h3>会议邀请测试</h3>
          <el-form :model="inviteForm" inline>
            <el-form-item label="会议主题">
              <el-input v-model="inviteForm.topic" placeholder="输入会议主题" />
            </el-form-item>
            <el-form-item label="主持人">
              <el-input v-model="inviteForm.host" placeholder="输入主持人" />
            </el-form-item>
            <el-form-item>
              <el-button @click="sendTestInvite" type="primary">
                发送测试邀请
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 待处理邀请 -->
        <div class="section" v-if="pendingInvites.length > 0">
          <h3>待处理邀请 ({{ pendingInvites.length }})</h3>
          <div class="invite-list">
            <el-card 
              v-for="invite in pendingInvites" 
              :key="invite.meetingId"
              class="invite-card"
            >
              <div class="invite-info">
                <h4>{{ invite.meetingTopic }}</h4>
                <p>主持人：{{ invite.hostName }}</p>
                <p>时间：{{ invite.inviteTime }}</p>
              </div>
              <div class="invite-actions">
                <el-button 
                  size="small" 
                  type="success" 
                  @click="acceptInvite(invite.meetingId)"
                >
                  接受
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="rejectInvite(invite.meetingId)"
                >
                  拒绝
                </el-button>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 会议列表 -->
        <div class="section">
          <h3>会议列表</h3>
          <el-table :data="meetings" style="width: 100%">
            <el-table-column prop="topic" label="会议主题" />
            <el-table-column prop="host" label="主持人" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="scope.row.status === '进行中' ? 'success' : 'info'">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" />
            <el-table-column label="成员数量">
              <template #default="scope">
                {{ scope.row.members?.length || 0 }}人
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';

// 模拟数据
const meetings = ref([
  {
    id: 'm1',
    topic: '应急指挥会商',
    host: '张三',
    status: '进行中',
    startTime: '2023-07-17 10:00',
    members: [
      { id: 'u1', name: '张三' },
      { id: 'u2', name: '李四' }
    ]
  },
  {
    id: 'm2',
    topic: '日常调度会',
    host: '王五',
    status: '已结束',
    startTime: '2023-07-16 15:00',
    members: [
      { id: 'u3', name: '王五' },
      { id: 'u4', name: '赵六' }
    ]
  }
]);

const pendingInvites = ref<any[]>([]);
const isConnected = ref(false);
const notificationPermission = ref<NotificationPermission>('default');

const inviteForm = reactive({
  topic: '紧急会议',
  host: '系统管理员'
});

// 计算属性
const notificationStatusType = computed(() => {
  switch (notificationPermission.value) {
    case 'granted': return 'success';
    case 'denied': return 'danger';
    default: return 'warning';
  }
});

const notificationStatusText = computed(() => {
  switch (notificationPermission.value) {
    case 'granted': return '已授权';
    case 'denied': return '已拒绝';
    default: return '未授权';
  }
});

// 方法
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    ElMessage.error('您的浏览器不支持通知功能');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    notificationPermission.value = permission;
    
    if (permission === 'granted') {
      ElMessage.success('通知权限已启用');
      
      // 发送测试通知
      setTimeout(() => {
        new Notification('通知测试', {
          body: '通知功能已成功启用！',
          icon: '/favicon.ico'
        });
      }, 500);
    } else {
      ElMessage.warning('通知权限被拒绝');
    }
  } catch (error) {
    ElMessage.error('请求通知权限失败');
  }
}

function connectWebSocket() {
  // 模拟连接
  setTimeout(() => {
    isConnected.value = true;
    ElMessage.success('WebSocket连接成功（模拟）');
  }, 1000);
}

function disconnectWebSocket() {
  isConnected.value = false;
  ElMessage.info('WebSocket已断开连接');
}

function sendTestInvite() {
  if (!inviteForm.topic || !inviteForm.host) {
    ElMessage.warning('请填写完整信息');
    return;
  }

  const testInvite = {
    meetingId: 'test-' + Date.now(),
    meetingTopic: inviteForm.topic,
    hostName: inviteForm.host,
    inviteTime: new Date().toLocaleString('zh-CN', { hour12: false })
  };

  pendingInvites.value.push(testInvite);
  
  // 显示通知
  if (notificationPermission.value === 'granted') {
    new Notification(`会议邀请：${testInvite.meetingTopic}`, {
      body: `${testInvite.hostName} 邀请您参加会议`,
      icon: '/favicon.ico'
    });
  }

  ElMessage.success('测试邀请已发送');
}

function acceptInvite(meetingId: string) {
  pendingInvites.value = pendingInvites.value.filter(inv => inv.meetingId !== meetingId);
  ElMessage.success('已接受邀请');
}

function rejectInvite(meetingId: string) {
  pendingInvites.value = pendingInvites.value.filter(inv => inv.meetingId !== meetingId);
  ElMessage.info('已拒绝邀请');
}

// 组件挂载时检查通知权限
onMounted(() => {
  if ('Notification' in window) {
    notificationPermission.value = Notification.permission;
  }
});
</script>

<style scoped>
.video-conference-simple {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.conference-content {
  padding: 20px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.section h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invite-card {
  border-radius: 8px;
}

.invite-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
}

.invite-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.invite-info p {
  margin: 0 0 3px 0;
  color: #606266;
  font-size: 14px;
}

.invite-actions {
  display: flex;
  gap: 8px;
}
</style>
