import type { DeviceTrack, TrackPoint, GeoLocation } from '@/types';

// 模拟设备列表
export const mockDevices = [
  { id: '1', name: '巡逻车001', type: 'vehicle' },
  { id: '2', name: '执法记录仪A01', type: 'body_camera' },
  { id: '3', name: '网状电台B02', type: 'mesh_radio' },
  { id: '4', name: '人员终端C03', type: 'personnel' },
  { id: '5', name: '基站设备D01', type: 'base_station' },
  { id: '6', name: '巡逻车002', type: 'vehicle' },
  { id: '7', name: '执法记录仪A02', type: 'body_camera' },
  { id: '8', name: '人员终端C04', type: 'personnel' }
];

// 生成模拟轨迹点
function generateTrackPoints(deviceId: string, startTime: Date, endTime: Date, startLocation: GeoLocation): TrackPoint[] {
  const points: TrackPoint[] = [];
  const duration = endTime.getTime() - startTime.getTime();
  const pointCount = Math.floor(duration / (5 * 60 * 1000)); // 每5分钟一个点
  
  let currentLat = startLocation.latitude;
  let currentLng = startLocation.longitude;
  
  for (let i = 0; i <= pointCount; i++) {
    const timestamp = new Date(startTime.getTime() + (i * 5 * 60 * 1000));
    
    // 模拟移动轨迹
    const deltaLat = (Math.random() - 0.5) * 0.001; // 约100米范围内随机移动
    const deltaLng = (Math.random() - 0.5) * 0.001;
    currentLat += deltaLat;
    currentLng += deltaLng;
    
    // 模拟速度和方向
    const speed = Math.random() * 60; // 0-60 km/h
    const direction = Math.random() * 360; // 0-360度
    
    // 随机生成关键节点
    const isKeyPoint = Math.random() < 0.1; // 10%概率为关键节点
    let keyPointType: any = undefined;
    if (isKeyPoint) {
      const types = ['task_start', 'task_end', 'abnormal_stay', 'checkpoint'];
      keyPointType = types[Math.floor(Math.random() * types.length)];
    }
    
    points.push({
      id: `${deviceId}-${i}`,
      deviceId,
      location: {
        latitude: currentLat,
        longitude: currentLng,
        altitude: 50 + Math.random() * 100 // 50-150米海拔
      },
      timestamp,
      speed,
      direction,
      accuracy: 5 + Math.random() * 10, // 5-15米精度
      isKeyPoint,
      keyPointType,
      description: isKeyPoint ? `关键节点 - ${keyPointType}` : undefined
    });
  }
  
  return points;
}

// 计算轨迹统计信息
function calculateTrackStats(points: TrackPoint[]) {
  if (points.length === 0) return { totalDistance: 0, maxSpeed: 0, avgSpeed: 0 };
  
  let totalDistance = 0;
  let maxSpeed = 0;
  let totalSpeed = 0;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    // 简化的距离计算（实际应使用更精确的地理距离公式）
    const latDiff = curr.location.latitude - prev.location.latitude;
    const lngDiff = curr.location.longitude - prev.location.longitude;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // 转换为米
    totalDistance += distance;
    
    if (curr.speed && curr.speed > maxSpeed) {
      maxSpeed = curr.speed;
    }
    
    if (curr.speed) {
      totalSpeed += curr.speed;
    }
  }
  
  const avgSpeed = totalSpeed / points.length;
  
  return {
    totalDistance: Math.round(totalDistance),
    maxSpeed: Math.round(maxSpeed),
    avgSpeed: Math.round(avgSpeed)
  };
}

// 生成模拟轨迹数据
export function generateMockTracks(): DeviceTrack[] {
  const tracks: DeviceTrack[] = [];
  
  // 为每个设备生成1-3条轨迹
  mockDevices.forEach(device => {
    const trackCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < trackCount; i++) {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 7)); // 最近7天内
      startTime.setHours(8 + Math.floor(Math.random() * 10)); // 8-18点开始
      startTime.setMinutes(Math.floor(Math.random() * 60));
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + Math.floor(Math.random() * 8) + 1); // 持续1-8小时
      
      // 模拟起始位置（以北京为中心）
      const startLocation: GeoLocation = {
        latitude: 39.9042 + (Math.random() - 0.5) * 0.1,
        longitude: 116.4074 + (Math.random() - 0.5) * 0.1
      };
      
      const trackPoints = generateTrackPoints(device.id, startTime, endTime, startLocation);
      const stats = calculateTrackStats(trackPoints);
      
      const track: DeviceTrack = {
        id: `track-${device.id}-${i}`,
        deviceId: device.id,
        deviceName: device.name,
        deviceType: device.type as any,
        startTime,
        endTime,
        totalDistance: stats.totalDistance,
        maxSpeed: stats.maxSpeed,
        avgSpeed: stats.avgSpeed,
        trackPoints,
        status: Math.random() > 0.1 ? 'completed' : 'interrupted' // 90%完成，10%中断
      };
      
      tracks.push(track);
    }
  });
  
  return tracks.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // 按时间倒序
}

// 轨迹服务类
export class TrackService {
  private tracks: DeviceTrack[] = [];
  
  constructor() {
    this.tracks = generateMockTracks();
  }
  
  // 获取所有轨迹
  getAllTracks(): DeviceTrack[] {
    return this.tracks;
  }
  
  // 根据筛选条件获取轨迹
  getFilteredTracks(filter: {
    deviceIds?: string[];
    deviceTypes?: string[];
    startTime?: Date;
    endTime?: Date;
  }): DeviceTrack[] {
    let filteredTracks = this.tracks;
    
    if (filter.deviceIds && filter.deviceIds.length > 0) {
      filteredTracks = filteredTracks.filter(track => 
        filter.deviceIds!.includes(track.deviceId)
      );
    }
    
    if (filter.deviceTypes && filter.deviceTypes.length > 0) {
      filteredTracks = filteredTracks.filter(track => 
        filter.deviceTypes!.includes(track.deviceType)
      );
    }
    
    if (filter.startTime) {
      filteredTracks = filteredTracks.filter(track => 
        track.startTime >= filter.startTime!
      );
    }
    
    if (filter.endTime) {
      filteredTracks = filteredTracks.filter(track => 
        track.endTime <= filter.endTime!
      );
    }
    
    return filteredTracks;
  }
  
  // 根据ID获取轨迹
  getTrackById(id: string): DeviceTrack | undefined {
    return this.tracks.find(track => track.id === id);
  }
  
  // 获取设备列表
  getDevices() {
    return mockDevices;
  }
}

// 导出单例实例
export const trackService = new TrackService();
