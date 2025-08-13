import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import wsService from './websocket';

// WebRTC连接状态
export interface RTCConnectionState {
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  iceConnectionState: 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
  localStream?: MediaStream;
  remoteStreams: Map<string, MediaStream>;
}

// 媒体设备状态
export interface MediaDeviceState {
  video: boolean;
  audio: boolean;
  screen: boolean;
}

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // 响应式状态
  public connectionState = ref<RTCConnectionState>({
    connectionState: 'new',
    iceConnectionState: 'new',
    remoteStreams: new Map()
  });

  public mediaState = reactive<MediaDeviceState>({
    video: false,
    audio: false,
    screen: false
  });

  public localVideoRef = ref<HTMLVideoElement | null>(null);
  public remoteVideoRefs = reactive<Map<string, HTMLVideoElement>>(new Map());

  constructor() {
    this.initWebSocketHandlers();
  }

  // 初始化WebSocket信令处理
  private initWebSocketHandlers() {
    // 监听WebRTC信令消息
    wsService.ws?.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type.startsWith('webrtc_')) {
          this.handleSignalingMessage(message);
        }
      } catch (error) {
        console.error('处理WebRTC信令消息失败:', error);
      }
    });
  }

  // 处理信令消息
  private async handleSignalingMessage(message: any) {
    const { type, data, from } = message;

    switch (type) {
      case 'webrtc_offer':
        await this.handleOffer(data, from);
        break;
      case 'webrtc_answer':
        await this.handleAnswer(data, from);
        break;
      case 'webrtc_ice_candidate':
        await this.handleIceCandidate(data, from);
        break;
    }
  }

  // 获取本地媒体流
  async getLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 更新媒体状态
      this.mediaState.video = constraints.video as boolean;
      this.mediaState.audio = constraints.audio as boolean;
      
      // 设置本地视频元素
      if (this.localVideoRef.value && this.localStream) {
        this.localVideoRef.value.srcObject = this.localStream;
      }

      this.connectionState.value.localStream = this.localStream;
      return this.localStream;
    } catch (error) {
      console.error('获取本地媒体流失败:', error);
      ElMessage.error('无法访问摄像头或麦克风');
      throw error;
    }
  }

  // 创建点对点连接
  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(this.configuration);
    this.peerConnections.set(peerId, peerConnection);

    // 添加本地流到连接
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // 处理远程流
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.connectionState.value.remoteStreams.set(peerId, remoteStream);
      
      // 设置远程视频元素
      const remoteVideo = this.remoteVideoRefs.get(peerId);
      if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
      }
    };

    // 处理ICE候选
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage('webrtc_ice_candidate', event.candidate, peerId);
      }
    };

    // 监听连接状态变化
    peerConnection.onconnectionstatechange = () => {
      this.connectionState.value.connectionState = peerConnection.connectionState;
      console.log(`与${peerId}的连接状态:`, peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      this.connectionState.value.iceConnectionState = peerConnection.iceConnectionState;
      console.log(`与${peerId}的ICE连接状态:`, peerConnection.iceConnectionState);
    };

    return peerConnection;
  }

  // 发起呼叫
  async makeCall(peerId: string) {
    try {
      // 确保有本地流
      if (!this.localStream) {
        await this.getLocalStream();
      }

      const peerConnection = await this.createPeerConnection(peerId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      this.sendSignalingMessage('webrtc_offer', offer, peerId);
    } catch (error) {
      console.error('发起呼叫失败:', error);
      ElMessage.error('发起视频通话失败');
    }
  }

  // 处理收到的offer
  private async handleOffer(offer: RTCSessionDescriptionInit, from: string) {
    try {
      // 确保有本地流
      if (!this.localStream) {
        await this.getLocalStream();
      }

      const peerConnection = await this.createPeerConnection(from);
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.sendSignalingMessage('webrtc_answer', answer, from);
    } catch (error) {
      console.error('处理offer失败:', error);
    }
  }

  // 处理收到的answer
  private async handleAnswer(answer: RTCSessionDescriptionInit, from: string) {
    try {
      const peerConnection = this.peerConnections.get(from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('处理answer失败:', error);
    }
  }

  // 处理ICE候选
  private async handleIceCandidate(candidate: RTCIceCandidateInit, from: string) {
    try {
      const peerConnection = this.peerConnections.get(from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('处理ICE候选失败:', error);
    }
  }

  // 发送信令消息
  private sendSignalingMessage(type: string, data: any, to: string) {
    const message = {
      type,
      data,
      to,
      from: 'current_user_id', // 应该从auth store获取
      timestamp: Date.now()
    };

    if (wsService.ws && wsService.isConnected.value) {
      wsService.ws.send(JSON.stringify(message));
    }
  }

  // 切换视频
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.mediaState.video = videoTrack.enabled;
      }
    }
  }

  // 切换音频
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.mediaState.audio = audioTrack.enabled;
      }
    }
  }

  // 开始屏幕共享
  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // 替换视频轨道
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack && this.localStream) {
        const sender = Array.from(this.peerConnections.values())
          .map(pc => pc.getSenders().find(s => s.track?.kind === 'video'))
          .find(Boolean);

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // 更新本地视频显示
        if (this.localVideoRef.value) {
          this.localVideoRef.value.srcObject = screenStream;
        }
      }

      this.mediaState.screen = true;

      // 监听屏幕共享结束
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

    } catch (error) {
      console.error('开始屏幕共享失败:', error);
      ElMessage.error('无法开始屏幕共享');
    }
  }

  // 停止屏幕共享
  async stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const sender = Array.from(this.peerConnections.values())
          .map(pc => pc.getSenders().find(s => s.track?.kind === 'video'))
          .find(Boolean);

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // 恢复本地视频显示
        if (this.localVideoRef.value) {
          this.localVideoRef.value.srcObject = this.localStream;
        }
      }
    }

    this.mediaState.screen = false;
  }

  // 挂断连接
  hangup(peerId?: string) {
    if (peerId) {
      const peerConnection = this.peerConnections.get(peerId);
      if (peerConnection) {
        peerConnection.close();
        this.peerConnections.delete(peerId);
        this.connectionState.value.remoteStreams.delete(peerId);
      }
    } else {
      // 挂断所有连接
      this.peerConnections.forEach((pc, id) => {
        pc.close();
        this.connectionState.value.remoteStreams.delete(id);
      });
      this.peerConnections.clear();
    }
  }

  // 停止本地流
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.connectionState.value.localStream = undefined;
      
      if (this.localVideoRef.value) {
        this.localVideoRef.value.srcObject = null;
      }
    }

    this.mediaState.video = false;
    this.mediaState.audio = false;
    this.mediaState.screen = false;
  }

  // 清理资源
  cleanup() {
    this.hangup();
    this.stopLocalStream();
  }
}

// 创建单例实例
export const webrtcService = new WebRTCService();
export default webrtcService;
