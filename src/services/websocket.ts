import { ref, computed } from 'vue';
import { useWebSocket } from '@vueuse/core';
import { ElNotification } from 'element-plus';

// WebSocket消息类型定义
export interface WSMessage {
  type: 'meeting_invite' | 'meeting_response' | 'meeting_update' | 'member_status';
  data: any;
  timestamp: number;
  from?: string;
  to?: string;
}

// 会议邀请数据结构
export interface MeetingInvite {
  meetingId: string;
  meetingTopic: string;
  hostName: string;
  hostId: string;
  inviteTime: string;
  members: Array<{
    id: string;
    name: string;
  }>;
}

// 邀请响应数据结构
export interface InviteResponse {
  meetingId: string;
  userId: string;
  userName: string;
  response: 'accepted' | 'rejected';
  timestamp: number;
}

class WebSocketService {
  private ws: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  
  // 响应式状态
  public isConnected = ref(false);
  public pendingInvites = ref<MeetingInvite[]>([]);
  public connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  // 事件回调
  private onInviteReceived?: (invite: MeetingInvite) => void;
  private onResponseReceived?: (response: InviteResponse) => void;
  private onMeetingUpdate?: (update: any) => void;
  
  constructor() {
    this.connect();
  }
  
  // 连接WebSocket
  connect() {
    // 模拟WebSocket连接，由于没有真实的WebSocket服务器，我们使用模拟连接
    this.connectionStatus.value = 'connecting';

    console.log('模拟WebSocket连接...');

    // 模拟连接成功
    setTimeout(() => {
      console.log('WebSocket连接成功（模拟）');
      this.isConnected.value = true;
      this.connectionStatus.value = 'connected';
      this.reconnectAttempts = 0;
    }, 1000);

    // 注意：在实际项目中，应该使用真实的WebSocket连接
    // const wsUrl = 'ws://localhost:8080/ws';
    // this.ws = useWebSocket(wsUrl, { ... });
  }
  
  // 处理接收到的消息
  private handleMessage(message: WSMessage) {
    console.log('收到WebSocket消息:', message);
    
    switch (message.type) {
      case 'meeting_invite':
        this.handleInviteMessage(message.data);
        break;
      case 'meeting_response':
        this.handleResponseMessage(message.data);
        break;
      case 'meeting_update':
        this.handleMeetingUpdate(message.data);
        break;
      case 'member_status':
        // 处理成员状态更新
        break;
    }
  }
  
  // 处理会议邀请消息
  private handleInviteMessage(invite: MeetingInvite) {
    // 添加到待处理邀请列表
    this.pendingInvites.value.push(invite);
    
    // 显示浏览器通知
    this.showBrowserNotification(invite);
    
    // 触发回调
    if (this.onInviteReceived) {
      this.onInviteReceived(invite);
    }
  }
  
  // 处理邀请响应消息
  private handleResponseMessage(response: InviteResponse) {
    if (this.onResponseReceived) {
      this.onResponseReceived(response);
    }
  }
  
  // 处理会议更新消息
  private handleMeetingUpdate(update: any) {
    if (this.onMeetingUpdate) {
      this.onMeetingUpdate(update);
    }
  }
  
  // 显示浏览器通知
  private showBrowserNotification(invite: MeetingInvite) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`会议邀请：${invite.meetingTopic}`, {
        body: `${invite.hostName} 邀请您参加会议`,
        icon: '/favicon.ico',
        tag: `meeting-invite-${invite.meetingId}`,
        requireInteraction: true
      });
      
      notification.onclick = () => {
        // 点击通知时聚焦到窗口
        window.focus();
        notification.close();
      };
    }
  }
  
  // 发送会议邀请
  sendInvite(invite: MeetingInvite) {
    const message: WSMessage = {
      type: 'meeting_invite',
      data: invite,
      timestamp: Date.now()
    };
    
    this.sendMessage(message);
  }
  
  // 发送邀请响应
  sendResponse(response: InviteResponse) {
    const message: WSMessage = {
      type: 'meeting_response',
      data: response,
      timestamp: Date.now()
    };
    
    this.sendMessage(message);
    
    // 从待处理列表中移除
    this.pendingInvites.value = this.pendingInvites.value.filter(
      invite => invite.meetingId !== response.meetingId
    );
  }
  
  // 发送消息
  private sendMessage(message: WSMessage) {
    if (this.isConnected.value) {
      console.log('发送WebSocket消息（模拟）:', message);
      // 在实际项目中，这里应该通过真实的WebSocket发送消息
      // this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，消息发送失败');
    }
  }
  
  // 重连处理
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('WebSocket重连失败，已达到最大重连次数');
      ElNotification.error({
        title: '连接失败',
        message: '无法连接到服务器，请检查网络连接'
      });
    }
  }
  
  // 设置事件监听器
  onInvite(callback: (invite: MeetingInvite) => void) {
    this.onInviteReceived = callback;
  }
  
  onResponse(callback: (response: InviteResponse) => void) {
    this.onResponseReceived = callback;
  }
  
  onUpdate(callback: (update: any) => void) {
    this.onMeetingUpdate = callback;
  }
  
  // 请求通知权限
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
  
  // 断开连接
  disconnect() {
    console.log('断开WebSocket连接（模拟）');
    this.isConnected.value = false;
    this.connectionStatus.value = 'disconnected';
    // 在实际项目中，这里应该关闭真实的WebSocket连接
    // if (this.ws) {
    //   this.ws.close();
    // }
  }
}

// 创建单例实例
export const wsService = new WebSocketService();
export default wsService;
