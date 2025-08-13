<template>
  <div class="conference-main large-screen-container">
    <!-- 左侧会议列表 -->
    <div class="conference-list large-screen-card">
      <div class="meeting-list-header">
        <span class="meeting-list-title large-screen-text-primary">会商会议</span>
        <el-button type="primary" class="large-screen-button" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>发起会议
        </el-button>
      </div>
      <el-tabs v-model="meetingTab" class="meeting-tabs" stretch>
        <el-tab-pane label="进行中" name="active">
          <el-scrollbar style="height: 580px;">
            <el-card
              v-for="meeting in meetings.filter(m => m.status === '进行中')"
              :key="meeting.id"
              :class="['meeting-card', 'meeting-card-shadow', 'large-screen-card', { active: meeting.id === meetingStore.activeMeetingId } ]"
              @click="selectMeeting(meeting.id)"
            >
              <div class="meeting-topic large-screen-text-primary">{{ meeting.topic }}</div>
              <div class="meeting-meta">
                <el-tag :type="meeting.status === '进行中' ? 'success' : 'info'" class="large-screen-tag">{{ meeting.status }}</el-tag>
                <span class="host large-screen-text-secondary">主持: {{ meeting.host }}</span>
              </div>
              <div class="meeting-time large-screen-text-tertiary">
                <el-icon><Calendar /></el-icon>
                {{ meeting.startTime }}
              </div>
              <div class="meeting-members">
                <el-avatar v-for="m in meeting.members" :key="m.id" :size="16" class="large-screen-avatar" :style="getMemberAvatarStyle(m)">{{ m.name[0] }}</el-avatar>
                <span class="member-count large-screen-text-info">{{ meeting.members.length }}人</span>
              </div>
            </el-card>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="已结束" name="ended">
          <el-scrollbar style="height: 580px;">
            <el-card
              v-for="meeting in meetings.filter(m => m.status === '已结束')"
              :key="meeting.id"
              :class="['meeting-card', 'meeting-card-shadow', 'large-screen-card', { active: meeting.id === meetingStore.activeMeetingId } ]"
              @click="selectMeeting(meeting.id)"
            >
              <div class="meeting-topic large-screen-text-primary">{{ meeting.topic }}</div>
              <div class="meeting-meta">
                <el-tag :type="meeting.status === '进行中' ? 'success' : 'info'" class="large-screen-tag">{{ meeting.status }}</el-tag>
                <span class="host large-screen-text-secondary">主持: {{ meeting.host }}</span>
              </div>
              <div class="meeting-time large-screen-text-tertiary">
                <el-icon><Calendar /></el-icon>
                {{ meeting.startTime }}
              </div>
              <div class="meeting-duration large-screen-text-tertiary">
                <el-icon><Timer /></el-icon>
                会议时长：{{ meeting.duration || calcMeetingDuration(meeting) }}
              </div>
              <div class="meeting-members">
                <el-avatar v-for="m in meeting.members" :key="m.id" :size="16" class="large-screen-avatar" :style="getMemberAvatarStyle(m)">{{ m.name[0] }}</el-avatar>
                <span class="member-count large-screen-text-info">{{ meeting.members.length }}人</span>
              </div>
              <div class="meeting-actions">
                <el-button type="danger" class="large-screen-button" @click.stop="deleteMeeting(meeting)">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </el-card>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 中间主画面+成员列表 -->
    <div class="conference-center large-screen-card">
      <div class="meeting-detail">
        <div class="detail-header">
          <div class="detail-title">
            <span class="title-text large-screen-text-primary">{{ meetingStore.activeMeeting.topic || '未选择会议' }}</span>
            <el-tag v-if="meetingStore.activeMeeting.topic" :type="meetingStore.activeMeeting.status === '进行中' ? 'success' : 'info'" class="large-screen-tag">{{ meetingStore.activeMeeting.status }}</el-tag>
          </div>
          <div class="detail-ops">
            <el-button-group v-if="meetingStore.activeMeeting.topic">
              <el-button class="large-screen-button" @click="openInviteDialog" :disabled="meetingStore.activeMeeting.status !== '进行中'">
                <el-icon><UserFilled /></el-icon>邀请成员
                <!-- 暂时移除邀请状态徽章 -->
                <!-- <el-badge
                  v-if="getPendingInviteCount(meetingStore.activeMeeting.id) > 0"
                  :value="getPendingInviteCount(meetingStore.activeMeeting.id)"
                  class="invite-badge"
                /> -->
              </el-button>
              <el-button type="warning" class="large-screen-button" @click="toggleMuteAll(meetingStore.activeMeeting)" :disabled="meetingStore.activeMeeting.status !== '进行中'">
                <el-icon><Microphone /></el-icon>{{ meetingStore.activeMeeting.muted ? '解除全体禁言' : '全体禁言' }}
              </el-button>
              <el-button type="danger" class="large-screen-button" @click="endMeeting(meetingStore.activeMeeting)" :disabled="meetingStore.activeMeeting.status !== '进行中'">
                <el-icon><CircleClose /></el-icon>结束会议
              </el-button>
            </el-button-group>
          </div>
        </div>
        <div class="video-area">
          <div class="main-video">
            <div v-if="!meetingStore.activeMeeting.topic" class="no-meeting-selected">
              <el-icon :size="48"><VideoCamera /></el-icon>
              <div>请从左侧选择或创建一个会议</div>
            </div>
            <div v-else class="video-placeholder">
              <el-icon :size="48"><VideoCamera /></el-icon>
              <div>主画面（无视频，仅占位）</div>
            </div>
          </div>
        </div>
        <!-- 成员列表美化 -->
        <div class="member-list beautified" v-if="meetingStore.activeMeeting.topic">
          <div class="member-list-header">
            <div class="member-list-title large-screen-text-primary">成员列表</div>
            <div class="member-count-badge large-screen-tag">{{ meetingStore.activeMeeting.members?.length || 0 }}人</div>
          </div>
          <div class="member-list-table">
            <div class="member-row member-header">
              <div class="member-col name large-screen-text-primary">成员</div>
              <div class="member-col status large-screen-text-primary">状态</div>
              <div class="member-col ops large-screen-text-primary">操作</div>
            </div>
            <div v-for="m in meetingStore.activeMeeting.members" :key="m.id" class="member-row">
              <div class="member-col name">
                <el-avatar :size="18" class="large-screen-avatar" :style="getMemberAvatarStyle(m)">{{ m.name[0] }}</el-avatar>
                <span class="large-screen-text-secondary">{{ m.name }}</span>
                <span v-if="m.id === meetingStore.activeMeeting.hostId" class="host-badge large-screen-tag">主持</span>
              </div>
              <div class="member-col status">
                <el-tag :type="m.status === 'online' ? 'success' : 'info'" class="large-screen-tag">{{ m.status === 'online' ? '在线' : '离线' }}</el-tag>
                <el-tag v-if="m.speaking" type="warning" class="large-screen-tag">发言中</el-tag>
                <el-tag v-if="m.muted" type="info" class="large-screen-tag">禁言</el-tag>
              </div>
              <div class="member-col ops">
                <el-button-group>
                  <el-button type="primary" class="large-screen-button member-action-btn" @click="toggleMuteMember(m)" :disabled="meetingStore.activeMeeting.status !== '进行中'">
                    <el-icon><Microphone /></el-icon>{{ m.muted ? '解禁' : '禁言' }}
                  </el-button>
                  <el-button type="warning" class="large-screen-button member-action-btn" @click="toggleSilenceMember(m)" :disabled="meetingStore.activeMeeting.status !== '进行中'">
                    <el-icon><Mute /></el-icon>{{ m.silenced ? '解音' : '静音' }}
                  </el-button>
                  <el-button type="success" class="large-screen-button member-action-btn" @click="setHost(m)" :disabled="meetingStore.activeMeeting.status !== '进行中' || m.id === meetingStore.activeMeeting.hostId">
                    <el-icon><TopRight /></el-icon>转主持
                  </el-button>
                  <el-button type="danger" class="large-screen-button member-action-btn" @click="removeMember(m)" :disabled="meetingStore.activeMeeting.status !== '进行中'">
                    <el-icon><Delete /></el-icon>移除
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>

          <!-- 邀请状态列表 - 暂时移除 -->
          <!-- <div class="invite-status-list" v-if="activeMeeting.topic && getInviteStatuses(activeMeeting.id).length > 0">
            ...
          </div> -->
        </div>
      </div>
    </div>
    <!-- 右侧会议聊天 -->
    <div class="conference-chat large-screen-card">
      <div class="chat-area">
        <div class="chat-header">
          <div class="chat-title large-screen-text-primary">会议聊天</div>
          <el-button @click="clearChat" type="info" class="large-screen-button" plain>清空</el-button>
        </div>
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-if="chatMessages.length === 0" class="no-messages">
            <el-icon :size="40"><ChatDotRound /></el-icon>
            <div class="large-screen-text-tertiary">暂无消息</div>
          </div>
          <div v-for="msg in chatMessages" :key="msg.id" :class="['chat-msg', { 'chat-msg-self': msg.user === '我' }]">
            <div class="chat-msg-header">
              <span class="chat-user large-screen-text-primary">{{ msg.user }}</span>
              <span class="chat-time large-screen-text-tertiary">{{ msg.time }}</span>
            </div>
            <div class="chat-msg-content large-screen-text-secondary">{{ msg.text }}</div>
          </div>
        </div>
        <div class="chat-input-container">
          <div class="chat-input-row">
            <el-input
              v-model="chatInput"
              placeholder="输入消息..."
              :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
              @keyup.enter="sendChat"
            />
            <el-button
              type="primary"
              class="large-screen-button"
              @click="sendChat"
              :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
            >发送</el-button>
          </div>
          <div class="chat-tools">
            <el-tooltip content="发送图片" placement="top">
              <el-button
                class="large-screen-button"
                circle
                :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
              >
                <el-icon><PictureFilled /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="发送文件" placement="top">
              <el-button
                size="small"
                circle
                :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
              >
                <el-icon><Document /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="发送表情" placement="top">
              <el-button
                size="small"
                circle
                :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
              >
                <el-icon><Promotion /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 发起会议对话框 -->
    <el-dialog v-model="createDialogVisible" title="发起会议" width="400px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="会议主题">
          <el-input v-model="createForm.topic" placeholder="请输入会议主题" />
        </el-form-item>
        <el-form-item label="主持人">
          <el-input v-model="createForm.host" placeholder="请输入主持人" />
        </el-form-item>
        <el-form-item label="选择成员">
          <el-select v-model="createForm.members" multiple filterable placeholder="请选择成员" style="width: 100%">
            <el-option v-for="u in allUsers" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreate">确定</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 邀请成员对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="邀请成员" width="400px">
      <el-select v-model="inviteMembers" multiple filterable placeholder="请选择成员" style="width: 100%">
        <el-option v-for="u in allUsers" :key="u.id" :label="u.name" :value="u.id" />
      </el-select>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="inviteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="doInviteMembers">邀请</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 会议邀请弹窗已移至AppHeader组件中 -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useMeetingStore } from '@/store/meeting';
import {
  Plus, Calendar, Delete, UserFilled, Microphone, CircleClose,
  VideoCamera, ChatDotRound, Timer, TopRight, Mute,
  PictureFilled, Document, Promotion, Refresh, Close
} from '@element-plus/icons-vue';
// 暂时移除所有新添加的导入
// import { useMeetingStore } from '@/store/meeting';
// import MeetingInviteDialog from '@/components/MeetingInviteDialog.vue';
// import NotificationPermission from '@/components/NotificationPermission.vue';
// import wsService from '@/services/websocket';
// import webrtcService from '@/services/webrtc';

// 使用meeting store
const meetingStore = useMeetingStore();

const allUsers = [
  { id: 'u1', name: '张三' },
  { id: 'u2', name: '李四' },
  { id: 'u3', name: '王五' },
  { id: 'u4', name: '赵六' },
  { id: 'u5', name: '陈七' },
  { id: 'u6', name: '孙八' }
];
const createDialogVisible = ref(false);
const inviteDialogVisible = ref(false);
const inviteMembers = ref([]);
// 使用meeting store的聊天消息
const chatMessages = meetingStore.chatMessages;
const chatInput = ref('');
const chatMessagesRef = ref<HTMLElement | null>(null);
const createForm = reactive({ topic: '', host: '', members: [] as string[] });

// 使用meeting store的数据（保持响应式）
const meetings = meetingStore.meetings;
// 直接使用store中的响应式数据，在模板中通过meetingStore访问
const showInviteDialog = ref(false);
const currentInvite = ref(null);
const pendingInvites = ref([]);
const inviteStatuses = ref([]);

const meetingTab = ref('active');

// 会议邀请相关数据（弹窗模式不需要列表）
// const pendingInvitations = ref([]);

// 使用meeting store的加入会议状态
const joinMeetingStatus = meetingStore.joinMeetingStatus;

// 移除弹窗相关状态，现在在AppHeader中处理
// const showInvitationDialog = ref(false);
// const currentInvitation = ref(null);

// 初始化聊天消息
onMounted(async () => {
  // 暂时移除WebSocket相关初始化
  // meetingStore.initWebSocketListeners();
  // await wsService.requestNotificationPermission();

  // 初始化一些示例聊天消息
  if (meetingStore.activeMeeting && meetingStore.activeMeeting.status === '进行中' && chatMessages.length === 0) {
    meetingStore.addChatMessage({
      id: Date.now() - 1000,
      user: '张三',
      text: '大家好，会议开始了',
      time: '10:00'
    });
    meetingStore.addChatMessage({
      id: Date.now() - 500,
      user: '李四',
      text: '收到，我已准备好',
      time: '10:01'
    });
  }
});

// 聊天消息自动滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

function openCreateDialog() {
  createForm.topic = '';
  createForm.host = '';
  createForm.members = [];
  createDialogVisible.value = true;
}

function submitCreate() {
  if (!createForm.topic || !createForm.host) {
    ElMessage.error('请填写完整信息');
    return;
  }
  const hostUser = allUsers.find(u => u.name === createForm.host);
  const memberIds = Array.from(new Set([hostUser?.id, ...createForm.members]));
  const members = memberIds.map(id => {
    const u = allUsers.find(x => x.id === id);
    return u ? { ...u, status: 'online' } : null;
  }).filter(Boolean);
  const newId = 'm' + Date.now();
  const newMeeting = {
    id: newId,
    topic: createForm.topic,
    host: createForm.host,
    hostId: hostUser?.id,
    status: '进行中' as const,
    members,
    startTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    muted: false
  };

  meetings.unshift(newMeeting);
  meetingStore.activeMeetingId = newId;
  createDialogVisible.value = false;
  ElMessage.success('会议发起成功');

  // 清空聊天记录
  chatMessages.length = 0;
}

function selectMeeting(id: string) {
  // 使用meeting store的方法设置活动会议
  meetingStore.activeMeetingId = id;

  // 如果是已结束会议，显示历史聊天记录
  const meeting = meetings.find(m => m.id === id);
  if (meeting && meeting.status === '已结束') {
    // 清空当前聊天记录
    chatMessages.length = 0;

    // 添加历史聊天记录
    meetingStore.addChatMessage({
      id: Date.now() - 3000,
      user: meeting.host,
      text: '会议开始',
      time: meeting.startTime.split(' ')[1]
    });
    meetingStore.addChatMessage({
      id: Date.now() - 2000,
      user: '系统',
      text: '会议已结束',
      time: meeting.endTime ? meeting.endTime.split(' ')[1] : '--:--'
    });
  } else if (meeting && meeting.status === '进行中') {
    // 如果是进行中的会议，初始化一些示例消息
    if (chatMessages.length === 0) {
      meetingStore.addChatMessage({
        id: Date.now() - 1000,
        user: meeting.host,
        text: '大家好，会议开始了',
        time: '10:00'
      });
    }
  }
  
  scrollToBottom();
}

function deleteMeeting(row: any) {
  const index = meetings.findIndex(m => m.id === row.id);
  if (index > -1) {
    meetings.splice(index, 1);
  }

  if (meetingStore.activeMeetingId === row.id) {
    meetingStore.activeMeetingId = meetings[0]?.id || '';
    chatMessages.length = 0; // 清空聊天记录
  }
  ElMessage.success('会议已删除');
}

function openInviteDialog() {
  inviteMembers.value = [];
  inviteDialogVisible.value = true;
}

function doInviteMembers() {
  if (!meetingStore.activeMeeting) return;

  // 过滤出新成员（未在会议中的成员）
  const newMemberIds = inviteMembers.value
    .filter((id: string) => !meetingStore.activeMeeting.members.some((m: any) => m.id === id));

  if (newMemberIds.length === 0) {
    ElMessage.warning('所选成员已在会议中');
    return;
  }

  // 暂时移除WebSocket邀请发送
  // meetingStore.sendMeetingInvite(meetingStore.activeMeeting.id, newMemberIds);

  // 直接添加成员到会议（临时方案）
  const newMembers = newMemberIds
    .map((id: string) => {
      const u = allUsers.find(x => x.id === id);
      return u ? { ...u, status: 'online' } : null;
    }).filter(Boolean);
  meetingStore.activeMeeting.members.push(...newMembers);

  inviteDialogVisible.value = false;
  inviteMembers.value = [];

  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  const memberNames = newMemberIds.map(id => {
    const user = allUsers.find(u => u.id === id);
    return user ? user.name : `用户${id}`;
  });

  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `已向 ${memberNames.join('、')} 发送会议邀请`,
    time
  });
  scrollToBottom();

  ElMessage.success(`已向 ${memberNames.length} 位成员发送邀请`);
}

function toggleMuteAll(meeting: any) {
  meeting.muted = !meeting.muted;
  meeting.members.forEach((m: any) => m.muted = meeting.muted);
  
  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: meeting.muted ? '主持人开启了全体禁言' : '主持人解除了全体禁言',
    time
  });
  scrollToBottom();
  
  ElMessage.success(meeting.muted ? '已全体禁言' : '已解除全体禁言');
}

function toggleMuteMember(member: any) {
  member.muted = !member.muted;
  
  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `${member.name} 被${member.muted ? '禁言' : '解除禁言'}`,
    time
  });
  scrollToBottom();
  
  ElMessage.success(member.muted ? '已禁言' : '已解除禁言');
}

function toggleSilenceMember(member: any) {
  member.silenced = !member.silenced;
  ElMessage.success(member.silenced ? '已静音' : '已解除静音');
}

function endMeeting(meeting: any) {
  meeting.status = '已结束';
  meeting.endTime = new Date().toLocaleString('zh-CN', { hour12: false });
  
  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: '会议已结束',
    time
  });
  scrollToBottom();
  
  ElMessage.success('会议已结束');
}

function removeMember(member: any) {
  if (!meetingStore.activeMeeting) return;
  meetingStore.activeMeeting.members = meetingStore.activeMeeting.members.filter((m: any) => m.id !== member.id);
  
  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `${member.name} 被移出会议`,
    time
  });
  scrollToBottom();
  
  ElMessage.success('成员已移除');
}

function setHost(member: any) {
  if (!meetingStore.activeMeeting) return;
  const oldHost = meetingStore.activeMeeting.host;
  meetingStore.activeMeeting.host = member.name;
  meetingStore.activeMeeting.hostId = member.id;
  
  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `${oldHost} 将主持人转让给 ${member.name}`,
    time
  });
  scrollToBottom();
  
  ElMessage.success('已转为主持人');
}

function getMemberAvatarStyle(m: any) {
  if (m.id === meetingStore.activeMeeting?.hostId) {
    return 'border:2px solid #409EFF;';
  }
  if (m.speaking) {
    return 'border:2px solid #e6a23c;';
  }
  return '';
}

// 聊天功能
function sendChat() {
  if (!chatInput.value.trim() || !meetingStore.activeMeeting || meetingStore.activeMeeting.status !== '进行中') return;
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '我',
    text: chatInput.value.trim(),
    time
  });
  chatInput.value = '';
  scrollToBottom();
}

function clearChat() {
  chatMessages.value.length = 0; // 清空数组但保持响应式
  ElMessage.success('聊天记录已清空');
}

function calcMeetingDuration(meeting: any) {
  // 假设startTime/endTime为'YYYY-MM-DD HH:mm'字符串
  if (!meeting.startTime || !meeting.endTime) return '--';
  const start = new Date(meeting.startTime.replace(/-/g, '/'));
  const end = new Date(meeting.endTime.replace(/-/g, '/'));
  const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return '--';
  
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  
  if (h > 0) {
    return `${h}小时${m}分钟`;
  } else {
    return `${m}分钟${s}秒`;
  }
}

// 移除演示相关方法，现在通过头部铃铛图标触发
// function simulateInvitation() { ... }
// function showJoinMeetingDemo() { ... }

// 弹窗处理方法已移至AppHeader组件中
// function acceptInvitationDialog() { ... }
// function rejectInvitationDialog() { ... }

// 暂时移除邀请处理函数
// async function handleAcceptInvite(meetingId: string) { ... }
// function handleRejectInvite(meetingId: string) { ... }

// 暂时移除邀请状态相关函数
// function getPendingInviteCount(meetingId: string) { ... }
// function getInviteStatuses(meetingId: string) { ... }
// function getInviteStatusType(status: string) { ... }
// function getInviteStatusText(status: string) { ... }
// function refreshInviteStatus() { ... }
</script>

<style scoped>
.conference-main {
  display: flex;
  height: calc(100vh - var(--header-height) - 40px); /* 使用相对高度 */
  background: #f5f7fa;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.conference-list {
  width: 280px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px 0 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conference-center {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conference-chat {
  width: 320px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  overflow: hidden;
}

.meeting-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 15px 20px;
}

.meeting-list-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.meeting-list-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: #409EFF;
  border-radius: 2px;
}

.meeting-tabs {
  margin-bottom: 0;
}

:deep(.el-tabs__header) {
  margin-bottom: 12px;
}

:deep(.el-tabs__nav) {
  width: 100%;
}

:deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  font-size: 15px;
}

.meeting-card {
  margin: 0 12px 12px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
  padding: 15px;
  position: relative;
}

.meeting-card.active {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.meeting-card.meeting-card-shadow {
  box-shadow: 0 4px 16px 0 rgba(64, 158, 255, 0.15);
}

.meeting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08);
}

.meeting-topic {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}

.meeting-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 8px;
}

.meeting-time {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.meeting-duration {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.meeting-members {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.member-count {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.meeting-actions {
  position: absolute;
  top: 10px;
  right: 10px;
}

.host {
  color: #606266;
}

.meeting-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f2f5;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-text {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.detail-ops {
  display: flex;
  align-items: center;
  gap: 10px;
}

.video-area {
  flex: 1;
  margin-bottom: 20px;
  min-height: 300px;
}

.main-video {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: #222;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  overflow: hidden;
}

.video-placeholder, .no-meeting-selected {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: #909399;
}

.member-list.beautified {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.member-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.member-list-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.member-count-badge {
  background: #f2f6fc;
  color: #409EFF;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 10px;
}

.member-list-table {
  width: 100%;
  border-radius: 8px;
  background: #fafbfc;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.member-row {
  display: flex;
  align-items: center;
  min-height: 50px;
  border-bottom: 1px solid #f0f2f5;
  padding: 0 12px;
}

.member-row:last-child {
  border-bottom: none;
}

.member-header {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
  height: 40px;
  min-height: 40px;
}

.member-col {
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 0 6px;
}

.member-col.name {
  flex: 2;
}

.member-col.status {
  flex: 1;
  justify-content: center;
}

.member-col.ops {
  flex: 3;
  gap: 5px;
  justify-content: flex-start;
}

:deep(.el-button-group .el-button) {
  min-width: auto;
  font-size: 12px;
  padding: 6px 8px;
}

:deep(.el-tag) {
  border-radius: 4px;
  font-size: 12px;
  margin-right: 4px;
}

.host-badge {
  background: #409EFF;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  padding: 1px 6px;
  margin-left: 6px;
}

.chat-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.chat-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: #409EFF;
  border-radius: 2px;
}

.chat-messages {
  flex: 1;
  height: calc(100vh - 280px);
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.no-messages {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #909399;
  font-size: 14px;
}

.chat-msg {
  margin-bottom: 15px;
  max-width: 85%;
}

.chat-msg-self {
  margin-left: auto;
}

.chat-msg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.chat-user {
  color: #409EFF;
  font-weight: 500;
  font-size: 13px;
}

.chat-time {
  color: #909399;
  font-size: 12px;
}

.chat-msg-content {
  background: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  word-break: break-word;
}

.chat-msg-self .chat-msg-content {
  background: #ecf5ff;
  color: #409EFF;
}

.chat-input-container {
  margin-top: auto;
}

.chat-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.chat-tools {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

:deep(.el-avatar) {
  background: #409EFF;
  color: #fff;
}

:deep(.el-button--small) {
  padding: 8px 15px;
}

:deep(.el-button.is-circle) {
  padding: 8px;
}

@media (max-width: 1400px) {
  .conference-main {
    padding: 15px;
    gap: 15px;
  }
  
  .conference-list {
    width: 260px;
  }
  
  .conference-chat {
    width: 300px;
  }
}

@media (max-width: 1200px) {
  .conference-main {
    flex-direction: column;
    height: auto;
  }
  
  .conference-list, .conference-center, .conference-chat {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .chat-messages {
    height: 400px;
  }
}

/* 邀请状态相关样式 */
.invite-badge {
  margin-left: 8px;
}

.invite-status-list {
  margin-top: 20px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.invite-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.invite-status-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.invite-status-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invite-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.invite-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-col.name {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.invite-col.status {
  flex-shrink: 0;
}

.invite-col.time {
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.invite-time {
  font-size: 12px;
  color: #6b7280;
}

.response-time {
  font-size: 11px;
  color: #9ca3af;
}

.invite-row:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* 移除旧的邀请通知样式，现在使用弹窗模式 */

/* 演示控制按钮样式 */
.demo-controls {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.demo-controls .el-button {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .invitation-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .invitation-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .demo-controls {
    flex-direction: column;
  }
}

/* 弹窗样式已移至AppHeader组件中 */
</style>