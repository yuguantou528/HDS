<template>
  <el-dialog
    v-model="visible"
    title="会议邀请"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
    class="meeting-invite-dialog"
  >
    <div class="invite-content" v-if="invite">
      <!-- 会议信息 -->
      <div class="meeting-info">
        <div class="meeting-icon">
          <el-icon :size="48" color="#409EFF">
            <VideoCamera />
          </el-icon>
        </div>
        
        <div class="meeting-details">
          <h3 class="meeting-title">{{ invite.meetingTopic }}</h3>
          <div class="meeting-meta">
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>主持人：{{ invite.hostName }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>邀请时间：{{ invite.inviteTime }}</span>
            </div>
            <div class="meta-item" v-if="invite.members.length > 0">
              <el-icon><UserFilled /></el-icon>
              <span>参会人员：{{ invite.members.map(m => m.name).join('、') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 倒计时 -->
      <div class="countdown-section" v-if="countdown > 0">
        <el-progress
          :percentage="countdownPercentage"
          :stroke-width="8"
          :show-text="false"
          status="warning"
        />
        <div class="countdown-text">
          <el-icon><Timer /></el-icon>
          <span>{{ countdown }}秒后自动拒绝</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          size="large"
          @click="handleReject"
          :loading="responding"
          class="reject-btn"
        >
          <el-icon><Close /></el-icon>
          拒绝
        </el-button>
        
        <el-button
          type="primary"
          size="large"
          @click="handleAccept"
          :loading="responding"
          class="accept-btn"
        >
          <el-icon><VideoCamera /></el-icon>
          接受并加入
        </el-button>
      </div>

      <!-- 快速回复选项 -->
      <div class="quick-reply" v-if="!responding">
        <el-divider>快速回复</el-divider>
        <div class="reply-options">
          <el-tag
            v-for="option in quickReplyOptions"
            :key="option.value"
            @click="handleQuickReply(option.value)"
            class="reply-option"
            :type="option.type"
          >
            {{ option.label }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 响应中状态 -->
    <div class="responding-state" v-if="responding">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>{{ responseAction === 'accept' ? '正在加入会议...' : '正在发送响应...' }}</span>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  VideoCamera, 
  User, 
  Clock, 
  UserFilled, 
  Timer, 
  Close, 
  Loading 
} from '@element-plus/icons-vue';
import type { MeetingInvite } from '@/services/websocket';

interface Props {
  modelValue: boolean;
  invite: MeetingInvite | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'accept', meetingId: string): void;
  (e: 'reject', meetingId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式状态
const responding = ref(false);
const responseAction = ref<'accept' | 'reject'>('accept');
const countdown = ref(60); // 60秒倒计时
const countdownTimer = ref<NodeJS.Timeout | null>(null);

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const countdownPercentage = computed(() => {
  return ((60 - countdown.value) / 60) * 100;
});

// 快速回复选项
const quickReplyOptions = [
  { label: '稍后加入', value: 'later', type: 'info' },
  { label: '正在忙碌', value: 'busy', type: 'warning' },
  { label: '网络问题', value: 'network', type: 'danger' }
];

// 监听弹窗显示状态
watch(visible, (newVal) => {
  if (newVal && props.invite) {
    startCountdown();
  } else {
    stopCountdown();
  }
});

// 开始倒计时
function startCountdown() {
  countdown.value = 60;
  countdownTimer.value = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      handleTimeout();
    }
  }, 1000);
}

// 停止倒计时
function stopCountdown() {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
}

// 处理超时
function handleTimeout() {
  stopCountdown();
  ElMessage.warning('邀请已超时，自动拒绝');
  handleReject();
}

// 处理接受邀请
async function handleAccept() {
  if (!props.invite) return;
  
  responding.value = true;
  responseAction.value = 'accept';
  
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    emit('accept', props.invite.meetingId);
    ElMessage.success('已接受邀请，正在加入会议...');
    
    stopCountdown();
    visible.value = false;
  } catch (error) {
    ElMessage.error('加入会议失败，请重试');
  } finally {
    responding.value = false;
  }
}

// 处理拒绝邀请
async function handleReject() {
  if (!props.invite) return;
  
  responding.value = true;
  responseAction.value = 'reject';
  
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    emit('reject', props.invite.meetingId);
    ElMessage.info('已拒绝会议邀请');
    
    stopCountdown();
    visible.value = false;
  } catch (error) {
    ElMessage.error('操作失败，请重试');
  } finally {
    responding.value = false;
  }
}

// 处理快速回复
function handleQuickReply(replyType: string) {
  const messages = {
    later: '我稍后会加入会议',
    busy: '我现在正在忙碌，无法参加',
    network: '网络连接有问题，无法加入'
  };
  
  ElMessage.info(messages[replyType as keyof typeof messages]);
  // 这里可以发送自定义消息给主持人
  handleReject();
}

// 组件卸载时清理定时器
onUnmounted(() => {
  stopCountdown();
});
</script>

<style scoped>
.meeting-invite-dialog {
  --el-dialog-border-radius: 12px;
}

.invite-content {
  padding: 20px 0;
}

.meeting-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;
}

.meeting-icon {
  flex-shrink: 0;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 12px;
  border: 2px solid #e1f5fe;
}

.meeting-details {
  flex: 1;
}

.meeting-title {
  margin: 0 0 15px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.meeting-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
}

.countdown-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #fef3cd;
  border-radius: 8px;
  border: 1px solid #fde68a;
}

.countdown-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  color: #92400e;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.reject-btn,
.accept-btn {
  flex: 1;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.reject-btn {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #6b7280;
}

.reject-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #4b5563;
}

.accept-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.accept-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.quick-reply {
  text-align: center;
}

.reply-options {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.reply-option {
  cursor: pointer;
  transition: all 0.2s;
}

.reply-option:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.responding-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #6b7280;
  font-size: 16px;
}

.responding-state .el-icon {
  font-size: 20px;
  color: #3b82f6;
}

/* 动画效果 */
.meeting-invite-dialog :deep(.el-dialog) {
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
