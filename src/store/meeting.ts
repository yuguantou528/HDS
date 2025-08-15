import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import wsService, { MeetingInvite, InviteResponse } from '@/services/websocket';

// 会议成员状态
export interface MeetingMember {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'connecting';
  speaking?: boolean;
  muted?: boolean;
  silenced?: boolean;
  avatar?: string;
}

// 会议信息
export interface Meeting {
  id: string;
  topic: string;
  host: string;
  hostId: string;
  status: '进行中' | '已结束' | '等待中';
  members: MeetingMember[];
  startTime: string;
  endTime?: string;
  duration?: number;
  muted: boolean;
  hasRecording?: boolean;
  recordingUrl?: string;
  fileSize?: number;
  resolution?: string;
  frameRate?: string;
  codec?: string;
}

// 邀请状态
export interface InviteStatus {
  meetingId: string;
  userId: string;
  userName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout';
  inviteTime: string;
  responseTime?: string;
}

export const useMeetingStore = defineStore('meeting', () => {
  // 状态定义
  const meetings = ref<Meeting[]>([
    {
      id: 'm1',
      topic: '应急指挥会商',
      host: '张三',
      hostId: 'u1',
      status: '进行中',
      members: [ 
        { id: 'u1', name: '张三', status: 'online', speaking: true }, 
        { id: 'u2', name: '李四', status: 'online' } 
      ],
      startTime: '2023-07-17 10:00',
      muted: false
    },
    {
      id: 'm2',
      topic: '日常调度会',
      host: '王五',
      hostId: 'u3',
      status: '已结束',
      members: [
        { id: 'u3', name: '王五', status: 'online' },
        { id: 'u4', name: '赵六', status: 'offline' }
      ],
      startTime: '2024-01-16 15:00',
      endTime: '2024-01-16 16:30',
      duration: 90,
      muted: true,
      hasRecording: true,
      recordingUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      fileSize: 1048576,
      resolution: '1920x1080',
      frameRate: '30fps',
      codec: 'H.264'
    },
    {
      id: 'm3',
      topic: '紧急事故处置会议',
      host: '张三',
      hostId: 'u1',
      status: '已结束',
      members: [
        { id: 'u1', name: '张三', status: 'online' },
        { id: 'u2', name: '李四', status: 'online' },
        { id: 'u5', name: '陈七', status: 'online' }
      ],
      startTime: '2024-01-15 09:30',
      endTime: '2024-01-15 11:15',
      duration: 105,
      muted: false,
      hasRecording: true,
      recordingUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      fileSize: 2097152,
      resolution: '1920x1080',
      frameRate: '30fps',
      codec: 'H.264'
    },
    {
      id: 'm4',
      topic: '月度工作总结会',
      host: '李四',
      hostId: 'u2',
      status: '已结束',
      members: [
        { id: 'u2', name: '李四', status: 'online' },
        { id: 'u3', name: '王五', status: 'online' },
        { id: 'u4', name: '赵六', status: 'online' },
        { id: 'u6', name: '孙八', status: 'online' }
      ],
      startTime: '2024-01-14 14:00',
      endTime: '2024-01-14 15:45',
      duration: 105,
      muted: false,
      hasRecording: false
    },
    {
      id: 'm5',
      topic: '设备维护协调会',
      host: '陈七',
      hostId: 'u5',
      status: '已结束',
      members: [
        { id: 'u5', name: '陈七', status: 'online' },
        { id: 'u1', name: '张三', status: 'online' },
        { id: 'u3', name: '王五', status: 'online' }
      ],
      startTime: '2024-01-13 10:00',
      endTime: '2024-01-13 11:30',
      duration: 90,
      muted: false,
      hasRecording: true,
      recordingUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      fileSize: 1572864,
      resolution: '1280x720',
      frameRate: '25fps',
      codec: 'H.264'
    }
  ]);

  const activeMeetingId = ref(meetings.value[0]?.id || '');
  const pendingInvites = ref<MeetingInvite[]>([]);
  const inviteStatuses = ref<InviteStatus[]>([]);
  const showInviteDialog = ref(false);
  const currentInvite = ref<MeetingInvite | null>(null);

  // 聊天消息
  const chatMessages = ref<any[]>([]);

  // 加入会议状态
  const joinMeetingStatus = ref({
    isJoining: false,
    hasJoined: false,
    currentMeetingId: null as string | null
  });

  // 计算属性
  const activeMeeting = computed(() =>
    meetings.value.find(m => m.id === activeMeetingId.value) || {} as Meeting
  );

  const ongoingMeetings = computed(() =>
    meetings.value.filter(m => m.status === '进行中')
  );

  const completedMeetings = computed(() =>
    meetings.value.filter(m => m.status === '已结束')
  );

  // 初始化WebSocket监听
  function initWebSocketListeners() {
    console.log('初始化WebSocket监听器');
    // 暂时简化，避免复杂的回调导致问题
    // 后续可以逐步添加功能
  }

  // 创建新会议
  function createMeeting(meetingData: {
    topic: string;
    host: string;
    hostId: string;
    members: string[];
  }) {
    const newId = 'm' + Date.now();
    const newMeeting: Meeting = {
      id: newId,
      topic: meetingData.topic,
      host: meetingData.host,
      hostId: meetingData.hostId,
      status: '进行中',
      members: meetingData.members.map(id => ({
        id,
        name: getUserNameById(id),
        status: 'online'
      })),
      startTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      muted: false
    };

    meetings.value.unshift(newMeeting);
    activeMeetingId.value = newId;
    
    return newMeeting;
  }

  // 发送会议邀请
  function sendMeetingInvite(meetingId: string, userIds: string[]) {
    const meeting = meetings.value.find(m => m.id === meetingId);
    if (!meeting) return;

    const invite: MeetingInvite = {
      meetingId,
      meetingTopic: meeting.topic,
      hostName: meeting.host,
      hostId: meeting.hostId,
      inviteTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      members: userIds.map(id => ({
        id,
        name: getUserNameById(id)
      }))
    };

    // 记录邀请状态
    userIds.forEach(userId => {
      inviteStatuses.value.push({
        meetingId,
        userId,
        userName: getUserNameById(userId),
        status: 'pending',
        inviteTime: invite.inviteTime
      });
    });

    // 发送WebSocket邀请
    wsService.sendInvite(invite);
    
    ElMessage.success('邀请已发送');
  }

  // 响应会议邀请
  function respondToInvite(meetingId: string, response: 'accepted' | 'rejected') {
    const invite = pendingInvites.value.find(inv => inv.meetingId === meetingId);
    if (!invite) return;

    const responseData: InviteResponse = {
      meetingId,
      userId: getCurrentUserId(),
      userName: getCurrentUserName(),
      response,
      timestamp: Date.now()
    };

    // 发送响应
    wsService.sendResponse(responseData);

    // 如果接受邀请，加入会议
    if (response === 'accepted') {
      joinMeeting(meetingId);
    }

    // 从待处理列表中移除
    pendingInvites.value = pendingInvites.value.filter(inv => inv.meetingId !== meetingId);
    showInviteDialog.value = false;
    currentInvite.value = null;
  }

  // 从邀请数据创建会议
  function createMeetingFromInvitation(invitation: {
    id: string;
    meetingTopic: string;
    hostName: string;
    inviteTime: string;
    participants: string[];
    meetingId: string;
  }): Meeting {
    return {
      id: invitation.meetingId,
      topic: invitation.meetingTopic,
      host: invitation.hostName,
      hostId: 'host-' + invitation.meetingId,
      status: '进行中',
      members: [
        { id: 'current-user', name: '我', status: 'online' },
        ...invitation.participants.map((name, index) => ({
          id: `user-${index}`,
          name,
          status: 'online' as const
        }))
      ],
      startTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      muted: false
    };
  }

  // 加入会议（支持邀请数据）
  function joinMeeting(meetingId: string) {
    // 切换到对应会议
    activeMeetingId.value = meetingId;

    // 这里应该建立WebRTC连接等
    // 暂时只是切换界面
    ElMessage.success('已加入会议');
  }

  // 从邀请加入会议（完整流程）
  function joinMeetingFromInvitation(invitation: {
    id: string;
    meetingTopic: string;
    hostName: string;
    inviteTime: string;
    participants: string[];
    meetingId: string;
  }): Promise<void> {
    return new Promise((resolve) => {
      // 设置加入状态
      joinMeetingStatus.value.isJoining = true;

      setTimeout(() => {
        // 检查会议是否已存在
        const existingMeeting = meetings.value.find(m => m.id === invitation.meetingId);

        if (!existingMeeting) {
          // 创建新会议
          const newMeeting = createMeetingFromInvitation(invitation);
          meetings.value.unshift(newMeeting);
        }

        // 切换到新会议
        activeMeetingId.value = invitation.meetingId;

        // 更新加入状态
        joinMeetingStatus.value.isJoining = false;
        joinMeetingStatus.value.hasJoined = true;
        joinMeetingStatus.value.currentMeetingId = invitation.meetingId;

        // 添加系统消息
        addChatMessage({
          id: Date.now(),
          user: '系统',
          text: `您已成功加入会议：${invitation.meetingTopic}`,
          time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
        });

        resolve();
      }, 2000); // 模拟2秒加入过程
    });
  }

  // 更新邀请状态
  function updateInviteStatus(response: InviteResponse) {
    const status = inviteStatuses.value.find(
      s => s.meetingId === response.meetingId && s.userId === response.userId
    );
    
    if (status) {
      status.status = response.response;
      status.responseTime = new Date().toLocaleString('zh-CN', { hour12: false });
    }
  }

  // 添加成员到会议
  function addMemberToMeeting(meetingId: string, member: MeetingMember) {
    const meeting = meetings.value.find(m => m.id === meetingId);
    if (meeting && !meeting.members.find(m => m.id === member.id)) {
      meeting.members.push(member);
    }
  }

  // 移除会议成员
  function removeMemberFromMeeting(meetingId: string, memberId: string) {
    const meeting = meetings.value.find(m => m.id === meetingId);
    if (meeting) {
      meeting.members = meeting.members.filter(m => m.id !== memberId);
    }
  }

  // 结束会议
  function endMeeting(meetingId: string) {
    const meeting = meetings.value.find(m => m.id === meetingId);
    if (meeting) {
      meeting.status = '已结束';
      meeting.endTime = new Date().toLocaleString('zh-CN', { hour12: false });
    }
  }

  // 添加聊天消息
  function addChatMessage(message: any) {
    chatMessages.value.push(message);
  }

  // 重置加入状态
  function resetJoinStatus() {
    joinMeetingStatus.value = {
      isJoining: false,
      hasJoined: false,
      currentMeetingId: null
    };
  }

  // 辅助函数
  function getUserNameById(id: string): string {
    // 这里应该从用户数据中获取，暂时返回模拟数据
    const userMap: Record<string, string> = {
      'u1': '张三',
      'u2': '李四',
      'u3': '王五',
      'u4': '赵六',
      'u5': '钱七',
      'u6': '孙八'
    };
    return userMap[id] || `用户${id}`;
  }

  function getCurrentUserId(): string {
    // 从auth store获取当前用户ID
    return 'u2'; // 模拟当前用户
  }

  function getCurrentUserName(): string {
    // 从auth store获取当前用户名
    return '李四'; // 模拟当前用户
  }

  return {
    // 状态
    meetings,
    activeMeetingId,
    pendingInvites,
    inviteStatuses,
    showInviteDialog,
    currentInvite,
    chatMessages,
    joinMeetingStatus,

    // 计算属性
    activeMeeting,
    ongoingMeetings,
    completedMeetings,

    // 方法
    initWebSocketListeners,
    createMeeting,
    createMeetingFromInvitation,
    sendMeetingInvite,
    respondToInvite,
    joinMeeting,
    joinMeetingFromInvitation,
    addMemberToMeeting,
    removeMemberFromMeeting,
    endMeeting,
    addChatMessage,
    resetJoinStatus
  };
});
