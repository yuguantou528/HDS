import { ref, reactive, computed } from 'vue';
import type { 
  Terminal, 
  TerminalType, 
  TerminalStatus, 
  GeoLocation, 
  PointToPointOperation,
  PointToPointBusinessType,
  RealTimeTrackingConfig,
  MapViewState,
  MeasureResult,
  MeasureToolType
} from '@/types';

// 位置调度服务类
class LocationDispatchService {
  // 响应式数据
  private terminals = ref<Terminal[]>([]);
  private selectedTerminal = ref<Terminal | null>(null);
  private trackingConfigs = ref<Map<string, RealTimeTrackingConfig>>(new Map());
  private activeOperations = ref<Map<string, PointToPointOperation>>(new Map());
  private mapViewState = reactive<MapViewState>({
    center: { latitude: 39.9042, longitude: 116.4074 },
    zoom: 12,
    activeLayer: 'street',
    measureTool: 'none',
    isFullscreen: false
  });

  // 终端类型配置
  private terminalTypeConfig = {
    monitor: { label: '监控设备', color: '#67C23A', icon: 'VideoCamera' },
    drone: { label: '无人机', color: '#409EFF', icon: 'Monitor' },
    soldier: { label: '单兵设备', color: '#E6A23C', icon: 'User' },
    handheld: { label: '手持终端', color: '#F56C6C', icon: 'Camera' }
  };

  constructor() {
    this.initMockData();
    this.startRealTimeUpdates();
  }

  // 初始化模拟数据
  private initMockData() {
    const mockTerminals: Terminal[] = [
      {
        id: '1',
        name: '监控点001',
        type: 'monitor',
        status: 'online',
        location: { latitude: 39.9042, longitude: 116.4074 },
        lastUpdate: new Date(),
        batteryLevel: 85,
        signalStrength: 92
      },
      {
        id: '2',
        name: '无人机Alpha',
        type: 'drone',
        status: 'online',
        location: { latitude: 39.9142, longitude: 116.4174 },
        lastUpdate: new Date(),
        batteryLevel: 67,
        signalStrength: 88,
        speed: 15.5,
        direction: 45
      },
      {
        id: '3',
        name: '单兵003',
        type: 'soldier',
        status: 'offline',
        location: { latitude: 39.8942, longitude: 116.3974 },
        lastUpdate: new Date(Date.now() - 300000),
        batteryLevel: 23,
        signalStrength: 0
      },
      {
        id: '4',
        name: '手持终端H01',
        type: 'handheld',
        status: 'online',
        location: { latitude: 39.9242, longitude: 116.4274 },
        lastUpdate: new Date(),
        batteryLevel: 91,
        signalStrength: 95,
        speed: 3.2,
        direction: 180
      },
      {
        id: '5',
        name: '监控点002',
        type: 'monitor',
        status: 'warning',
        location: { latitude: 39.8842, longitude: 116.3874 },
        lastUpdate: new Date(),
        batteryLevel: 15,
        signalStrength: 78
      }
    ];

    this.terminals.value = mockTerminals;
  }

  // 开始实时更新
  private startRealTimeUpdates() {
    setInterval(() => {
      this.updateTerminalPositions();
    }, 5000); // 每5秒更新一次
  }

  // 更新终端位置（模拟实时数据）
  private updateTerminalPositions() {
    this.terminals.value.forEach(terminal => {
      if (terminal.status === 'online' && (terminal.type === 'drone' || terminal.type === 'soldier' || terminal.type === 'handheld')) {
        // 模拟移动设备的位置变化
        const deltaLat = (Math.random() - 0.5) * 0.001; // 约100米范围内随机移动
        const deltaLng = (Math.random() - 0.5) * 0.001;
        
        terminal.location.latitude += deltaLat;
        terminal.location.longitude += deltaLng;
        terminal.lastUpdate = new Date();
        
        // 更新速度和方向
        if (terminal.type === 'drone') {
          terminal.speed = Math.random() * 30 + 10; // 10-40 km/h
          terminal.direction = Math.random() * 360;
        } else if (terminal.type === 'soldier' || terminal.type === 'handheld') {
          terminal.speed = Math.random() * 8 + 1; // 1-9 km/h
          terminal.direction = Math.random() * 360;
        }
        
        // 模拟电池消耗
        if (terminal.batteryLevel && terminal.batteryLevel > 0) {
          terminal.batteryLevel = Math.max(0, terminal.batteryLevel - Math.random() * 0.5);
        }
      }
    });
  }

  // 获取所有终端
  getTerminals() {
    return computed(() => this.terminals.value);
  }

  // 获取在线终端
  getOnlineTerminals() {
    return computed(() => this.terminals.value.filter(t => t.status === 'online'));
  }

  // 获取离线终端
  getOfflineTerminals() {
    return computed(() => this.terminals.value.filter(t => t.status === 'offline'));
  }

  // 按类型筛选终端
  getTerminalsByType(types: TerminalType[]) {
    return computed(() => 
      this.terminals.value.filter(t => types.length === 0 || types.includes(t.type))
    );
  }

  // 获取终端类型统计
  getTerminalTypeStats() {
    return computed(() => {
      const stats: Record<TerminalType, number> = {
        monitor: 0,
        drone: 0,
        soldier: 0,
        handheld: 0
      };
      
      this.terminals.value.forEach(terminal => {
        stats[terminal.type]++;
      });
      
      return stats;
    });
  }

  // 获取选中的终端
  getSelectedTerminal() {
    return computed(() => this.selectedTerminal.value);
  }

  // 选择终端
  selectTerminal(terminal: Terminal | null) {
    this.selectedTerminal.value = terminal;
    if (terminal) {
      this.mapViewState.selectedTerminalId = terminal.id;
    } else {
      this.mapViewState.selectedTerminalId = undefined;
    }
  }

  // 根据ID获取终端
  getTerminalById(id: string): Terminal | undefined {
    return this.terminals.value.find(t => t.id === id);
  }

  // 获取终端类型配置
  getTerminalTypeConfig(type: TerminalType) {
    return this.terminalTypeConfig[type];
  }

  // 获取所有终端类型配置
  getAllTerminalTypeConfigs() {
    return this.terminalTypeConfig;
  }

  // 获取地图视图状态
  getMapViewState() {
    return this.mapViewState;
  }

  // 更新地图视图状态
  updateMapViewState(updates: Partial<MapViewState>) {
    Object.assign(this.mapViewState, updates);
  }

  // 执行点对点业务
  async executePointToPointBusiness(
    type: PointToPointBusinessType,
    targetTerminalId: string
  ): Promise<PointToPointOperation> {
    const operation: PointToPointOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      sourceTerminalId: 'dispatch_center',
      targetTerminalId,
      startTime: new Date(),
      status: 'pending',
      description: `执行${this.getBusinessTypeLabel(type)}操作`
    };

    this.activeOperations.value.set(operation.id, operation);

    // 模拟业务执行
    setTimeout(() => {
      operation.status = 'active';
    }, 1000);

    return operation;
  }

  // 获取业务类型标签
  private getBusinessTypeLabel(type: PointToPointBusinessType): string {
    const labels = {
      point_call: '点呼',
      voice_call: '语音呼叫',
      video_monitor: '视频监控',
      video_call: '视频点呼',
      track_follow: '轨迹跟踪',
      track_playback: '轨迹回放'
    };
    return labels[type];
  }

  // 停止点对点业务
  stopPointToPointBusiness(operationId: string) {
    const operation = this.activeOperations.value.get(operationId);
    if (operation) {
      operation.status = 'completed';
      operation.endTime = new Date();
    }
  }

  // 获取活动的操作
  getActiveOperations() {
    return computed(() => Array.from(this.activeOperations.value.values()));
  }

  // 开始实时跟踪
  startRealTimeTracking(terminalId: string, config?: Partial<RealTimeTrackingConfig>) {
    const defaultConfig: RealTimeTrackingConfig = {
      terminalId,
      isEnabled: true,
      updateInterval: 5,
      showTrail: true,
      trailLength: 10,
      showDirection: true,
      showSpeed: true,
      ...config
    };

    this.trackingConfigs.value.set(terminalId, defaultConfig);
    
    const terminal = this.getTerminalById(terminalId);
    if (terminal) {
      terminal.isTracking = true;
    }
  }

  // 停止实时跟踪
  stopRealTimeTracking(terminalId: string) {
    this.trackingConfigs.value.delete(terminalId);
    
    const terminal = this.getTerminalById(terminalId);
    if (terminal) {
      terminal.isTracking = false;
    }
  }

  // 获取跟踪配置
  getTrackingConfig(terminalId: string): RealTimeTrackingConfig | undefined {
    return this.trackingConfigs.value.get(terminalId);
  }

  // 刷新终端数据
  refreshTerminals() {
    // 模拟数据刷新
    this.terminals.value.forEach(terminal => {
      terminal.lastUpdate = new Date();
      // 随机更新信号强度
      if (terminal.status === 'online') {
        terminal.signalStrength = Math.max(50, Math.min(100, (terminal.signalStrength || 80) + (Math.random() - 0.5) * 20));
      }
    });
  }
}

// 创建单例实例
export const locationDispatchService = new LocationDispatchService();
export default locationDispatchService;
