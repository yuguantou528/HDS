// 用户类型定义
export interface User {
  id: string;
  username: string;
  avatar?: string;
  roles: string[];
}

// 路由元信息类型定义
export interface RouteMeta {
  title: string;
  icon?: string;
  requiresAuth?: boolean;
  requiresLayout?: boolean;
}

// 菜单项类型定义
export interface MenuItem {
  title: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
}

// 产品类型定义
export interface Product {
  id: string;
  name: string;
  model: string;
  type: 'mesh_radio' | 'base_station' | 'body_camera' | 'other';
  status: 'active' | 'inactive';
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// 子设备类型定义
export interface SubDevice {
  id: string;
  productId: string;
  name: string;
  serialNumber: string;
  type: 'mesh_radio' | 'base_station' | 'body_camera' | 'other';
  status: 'online' | 'offline' | 'maintenance';
  batteryLevel?: number;
  signalStrength?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  lastActiveTime?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// 调度设备类型定义
export interface DispatchDevice {
  id: string;
  name: string;
  type: 'intercom' | 'radio' | 'phone' | 'other';
  status: 'online' | 'offline' | 'busy';
  groupId?: string;
  groupName?: string;
}

// 调度组类型定义
export interface DispatchGroup {
  id: string;
  name: string;
  type: 'static' | 'dynamic' | 'mixed';
  devices: string[]; // 设备ID数组
}

// 通话记录类型定义
export interface CallRecord {
  id: string;
  type: 'individual' | 'group' | 'dynamic' | 'mixed' | 'emergency';
  caller: string;
  receivers: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'ongoing' | 'completed' | 'failed';
  hasRecording?: boolean; // 是否有录音文件
}

// 录音文件类型定义
export interface RecordingFile {
  id: string;
  name: string;
  createdAt: Date;
  duration: number;
  url: string;
  callId?: string; // 关联的通话ID
} 