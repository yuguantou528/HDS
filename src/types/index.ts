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
  callerSource: 'dispatch_center' | 'device'; // 发起方来源：调度中心 或 设备
  callerDisplayName?: string; // 发起方显示名称
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

// 设备轨迹相关类型定义

// 地理位置坐标
export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
}

// 轨迹点
export interface TrackPoint {
  id: string;
  deviceId: string;
  location: GeoLocation;
  timestamp: Date;
  speed?: number; // 速度 km/h
  direction?: number; // 方向角度 0-360
  accuracy?: number; // 定位精度 米
  isKeyPoint?: boolean; // 是否为关键节点
  keyPointType?: 'task_start' | 'task_end' | 'abnormal_stay' | 'emergency' | 'checkpoint'; // 关键节点类型
  description?: string; // 节点描述
}

// 设备轨迹
export interface DeviceTrack {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'mesh_radio' | 'base_station' | 'body_camera' | 'vehicle' | 'personnel' | 'other';
  startTime: Date;
  endTime: Date;
  totalDistance?: number; // 总距离 米
  maxSpeed?: number; // 最大速度 km/h
  avgSpeed?: number; // 平均速度 km/h
  trackPoints: TrackPoint[];
  status: 'recording' | 'completed' | 'interrupted';
}

// 轨迹筛选条件
export interface TrackFilter {
  deviceIds?: string[]; // 设备ID列表
  deviceTypes?: string[]; // 设备类型列表
  startTime?: Date; // 开始时间
  endTime?: Date; // 结束时间
  area?: {
    // 区域筛选
    type: 'circle' | 'rectangle' | 'polygon';
    center?: GeoLocation; // 圆形区域中心点
    radius?: number; // 圆形区域半径 米
    bounds?: {
      // 矩形区域边界
      northeast: GeoLocation;
      southwest: GeoLocation;
    };
    polygon?: GeoLocation[]; // 多边形区域顶点
  };
  minSpeed?: number; // 最小速度筛选
  maxSpeed?: number; // 最大速度筛选
  hasKeyPoints?: boolean; // 是否包含关键节点
  keyPointTypes?: string[]; // 关键节点类型筛选
}

// 轨迹回放控制
export interface TrackPlayback {
  isPlaying: boolean;
  currentTime: Date;
  playSpeed: number; // 播放速度倍数 0.5, 1, 2, 4, 8
  showTrail: boolean; // 是否显示轨迹尾迹
  trailLength: number; // 尾迹长度（点数）
  showSpeed: boolean; // 是否显示速度标注
  showKeyPoints: boolean; // 是否显示关键节点
}

// 位置调度相关类型定义

// 终端设备类型
export type TerminalType = 'monitor' | 'drone' | 'soldier' | 'handheld';

// 终端状态
export type TerminalStatus = 'online' | 'offline' | 'warning' | 'emergency';

// 终端设备
export interface Terminal {
  id: string;
  name: string;
  type: TerminalType;
  status: TerminalStatus;
  location: GeoLocation;
  lastUpdate: Date;
  batteryLevel?: number; // 电池电量 0-100
  signalStrength?: number; // 信号强度 0-100
  speed?: number; // 当前速度 km/h
  direction?: number; // 移动方向 0-360度
  description?: string; // 设备描述
  groupId?: string; // 所属组ID
  isTracking?: boolean; // 是否正在跟踪
}

// 地图图层类型
export type MapLayerType = 'street' | 'satellite' | 'terrain' | 'hybrid';

// 地图控制选项
export interface MapControlOptions {
  showZoomControl: boolean;
  showScaleControl: boolean;
  showFullscreenControl: boolean;
  showLayerControl: boolean;
  showMeasureControl: boolean;
  showDrawControl: boolean;
}

// 测量工具类型
export type MeasureToolType = 'distance' | 'area' | 'none';

// 测量结果
export interface MeasureResult {
  type: MeasureToolType;
  value: number;
  unit: string;
  coordinates: GeoLocation[];
}

// 点对点业务类型
export type PointToPointBusinessType =
  | 'point_call'      // 点呼
  | 'voice_call'      // 语音呼叫
  | 'video_monitor'   // 视频监控
  | 'video_call'      // 视频点呼
  | 'track_follow'    // 轨迹跟踪
  | 'track_playback'; // 轨迹回放

// 点对点业务操作
export interface PointToPointOperation {
  id: string;
  type: PointToPointBusinessType;
  sourceTerminalId: string;
  targetTerminalId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  description?: string;
}

// 实时跟踪配置
export interface RealTimeTrackingConfig {
  terminalId: string;
  isEnabled: boolean;
  updateInterval: number; // 更新间隔（秒）
  showTrail: boolean; // 显示轨迹尾迹
  trailLength: number; // 尾迹长度（点数）
  showDirection: boolean; // 显示方向箭头
  showSpeed: boolean; // 显示速度信息
}

// 地图视图状态
export interface MapViewState {
  center: GeoLocation;
  zoom: number;
  bounds?: {
    northeast: GeoLocation;
    southwest: GeoLocation;
  };
  selectedTerminalId?: string;
  activeLayer: MapLayerType;
  measureTool: MeasureToolType;
  isFullscreen: boolean;
}