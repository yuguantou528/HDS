<template>
  <div class="location-dispatch-page">
    <!-- 全屏地图容器 -->
    <div class="fullscreen-map-container">
      <div id="location-map" class="leaflet-map"></div>

      <!-- 顶部标题栏 -->
      <div class="top-header">
        <div class="header-left">
          <h1 class="page-title">位置调度大屏</h1>
          <p class="page-description">实时监控终端位置，支持轨迹跟踪和点对点调度</p>
        </div>
        <div class="header-right">
          <el-button @click="toggleTerminalPanel" type="primary" size="small">
            <el-icon><Menu /></el-icon>
            设备列表
          </el-button>
          <el-button @click="refreshTerminals" type="success" size="small">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button @click="toggleFullscreen" type="warning" size="small">
            <el-icon><FullScreen /></el-icon>
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </div>
      </div>



      <!-- 设备类型分布面板 -->
      <div class="type-distribution-panel">
        <div class="panel-title">设备分布</div>
        <div class="type-stats">
          <div v-for="type in terminalTypes" :key="type.value" class="type-stat">
            <div class="type-icon" :style="{ background: getTypeColor(type.value) }"></div>
            <span class="type-label">{{ type.label }}</span>
            <span class="type-count">{{ getTypeCount(type.value) }}</span>
          </div>
        </div>
      </div>

      <!-- 左上角大屏风格的设备列表面板 -->
      <div class="terminal-panel big-screen" :class="{ 'panel-open': showTerminalPanel }">
        <div class="device-stats-header">
          <div class="stat-item">
            <div class="stat-icon online">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ onlineTerminals.length }}</div>
              <div class="stat-label">在线</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ terminals.length }}</div>
              <div class="stat-label">总数</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ offlineTerminals.length }}</div>
              <div class="stat-label">离线</div>
            </div>
          </div>
        </div>

        <!-- 筛选工具栏 -->
        <div class="filter-toolbar">
          <el-select
            v-model="selectedTerminalTypes"
            multiple
            placeholder="筛选设备类型"
            size="small"
            style="width: 100%"
            @change="handleTerminalTypeChange"
          >
            <el-option
              v-for="type in terminalTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </div>

        <!-- 设备列表 -->
        <div class="terminal-list">
          <div
            v-for="terminal in filteredTerminals"
            :key="terminal.id"
            class="terminal-item"
            :class="{
              active: selectedTerminal?.id === terminal.id,
              offline: terminal.status === 'offline'
            }"
            @click="selectTerminal(terminal)"
          >
            <div class="terminal-header">
              <div class="terminal-info">
                <el-icon class="terminal-icon">
                  <component :is="getTerminalIcon(terminal.type)" />
                </el-icon>
                <span class="terminal-name">{{ terminal.name }}</span>
              </div>
              <el-tag
                :type="getStatusType(terminal.status)"
                size="small"
              >
                {{ getStatusText(terminal.status) }}
              </el-tag>
            </div>

            <div class="terminal-details">
              <div class="detail-item">
                <span class="label">类型:</span>
                <span class="value">{{ getTerminalTypeLabel(terminal.type) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">位置:</span>
                <span class="value">{{ formatLocation(terminal.location) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">更新:</span>
                <span class="value">{{ formatTime(terminal.lastUpdate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 地图工具栏 - 移动到右下角缩放按钮上方 -->
      <div class="map-tools-panel">
        <el-button @click="centerMap" title="居中地图" size="small" circle>
          <el-icon><Aim /></el-icon>
        </el-button>
        <el-button @click="toggleMeasure" title="测距工具" :type="measureMode ? 'primary' : 'default'" size="small" circle>
          <el-icon><Compass /></el-icon>
        </el-button>
        <el-button @click="toggleAreaMeasure" title="测面积工具" :type="areaMeasureMode ? 'primary' : 'default'" size="small" circle>
          <el-icon><MapLocation /></el-icon>
        </el-button>
        <el-button @click="toggleLayers" title="图层切换" size="small" circle>
          <el-icon><Operation /></el-icon>
        </el-button>
      </div>

      <!-- 地图图例 -->
      <div class="map-legend">
        <div class="legend-title">设备图例</div>
        <div class="legend-item">
          <div class="legend-color" style="background: #67C23A;"></div>
          <span>监控设备</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #409EFF;"></div>
          <span>无人机</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #E6A23C;"></div>
          <span>单兵设备</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #F56C6C;"></div>
          <span>手持终端</span>
        </div>
      </div>

      <!-- 浮动操作工具栏 -->
      <div class="floating-toolbar" v-show="selectedTerminal">
        <div class="toolbar-header">
          <span class="terminal-name">{{ selectedTerminal?.name }}</span>
          <el-tag :type="getStatusType(selectedTerminal?.status)" size="small">
            {{ getStatusText(selectedTerminal?.status) }}
          </el-tag>
          <el-button @click="closeToolbar" size="small" text>
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="toolbar-buttons">
          <el-button @click="handlePointCall" :disabled="selectedTerminal?.status !== 'online'" size="small">
            <el-icon><Phone /></el-icon>
            点呼
          </el-button>
          <el-button @click="handleVoiceCall" :disabled="selectedTerminal?.status !== 'online'" size="small">
            <el-icon><Microphone /></el-icon>
            语音呼叫
          </el-button>
          <el-button @click="handleVideoMonitor" :disabled="selectedTerminal?.status !== 'online'" size="small">
            <el-icon><VideoCamera /></el-icon>
            视频监控
          </el-button>
          <el-button @click="handleVideoCall" :disabled="selectedTerminal?.status !== 'online'" size="small">
            <el-icon><VideoCameraFilled /></el-icon>
            视频点呼
          </el-button>
          <el-button
            @click="handleTrackFollow"
            :disabled="selectedTerminal?.status !== 'online'"
            :type="trackingMode ? 'primary' : 'default'"
            size="small"
          >
            <el-icon><Location /></el-icon>
            {{ trackingMode ? '停止跟踪' : '轨迹跟踪' }}
          </el-button>
          <el-button
            @click="handleTrackPlayback"
            :type="playbackMode ? 'primary' : 'default'"
            size="small"
          >
            <el-icon><VideoPlay /></el-icon>
            {{ playbackMode ? '停止回放' : '轨迹回放' }}
          </el-button>
        </div>

        <!-- 轨迹回放进度条 -->
        <div v-if="playbackMode" class="playback-progress">
          <div class="progress-label">回放进度</div>
          <el-slider
            v-model="playbackProgress"
            :min="0"
            :max="100"
            :show-tooltip="false"
            size="small"
          />
          <div class="progress-info">{{ Math.round(playbackProgress) }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
  FullScreen,
  Aim,
  Refresh,
  Phone,
  Microphone,
  VideoCamera,
  VideoCameraFilled,
  Location,
  VideoPlay,
  Monitor,
  User,
  Camera,
  Menu,
  Connection,
  Warning,
  ArrowRight,
  Close,
  Grid,
  Operation,
  Compass,
  MapLocation
} from '@element-plus/icons-vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 响应式数据
const selectedTerminalTypes = ref<string[]>([]);
const selectedTerminal = ref<any>(null);
const showTerminalPanel = ref(true);
const measureMode = ref(false);
const areaMeasureMode = ref(false);
const trackingMode = ref(false);
const playbackMode = ref(false);
const playbackProgress = ref(0);
const isFullscreen = ref(false);
let map: L.Map | null = null;
const terminalMarkers = ref<Map<string, L.Marker>>(new Map());
const trackLines = ref<Map<string, L.Polyline>>(new Map());
let measureControl: any = null;
let areaMeasureControl: any = null;
let trackingInterval: number | null = null;
let playbackInterval: number | null = null;

// 终端类型配置
const terminalTypes = [
  { label: '监控设备', value: 'monitor' },
  { label: '无人机', value: 'drone' },
  { label: '单兵设备', value: 'soldier' },
  { label: '手持终端', value: 'handheld' }
];

// 模拟终端数据
const terminals = ref([
  {
    id: '1',
    name: '监控点001',
    type: 'monitor',
    status: 'online',
    location: { lat: 39.9042, lng: 116.4074 },
    lastUpdate: new Date()
  },
  {
    id: '2',
    name: '无人机Alpha',
    type: 'drone',
    status: 'online',
    location: { lat: 39.9142, lng: 116.4174 },
    lastUpdate: new Date()
  },
  {
    id: '3',
    name: '单兵003',
    type: 'soldier',
    status: 'offline',
    location: { lat: 39.8942, lng: 116.3974 },
    lastUpdate: new Date(Date.now() - 300000)
  },
  {
    id: '4',
    name: '手持终端H01',
    type: 'handheld',
    status: 'online',
    location: { lat: 39.9242, lng: 116.4274 },
    lastUpdate: new Date()
  },
  {
    id: '5',
    name: '监控点002',
    type: 'monitor',
    status: 'online',
    location: { lat: 39.8842, lng: 116.3874 },
    lastUpdate: new Date()
  },
  {
    id: '6',
    name: '无人机Beta',
    type: 'drone',
    status: 'warning',
    location: { lat: 39.9342, lng: 116.4374 },
    lastUpdate: new Date()
  },
  {
    id: '7',
    name: '单兵007',
    type: 'soldier',
    status: 'online',
    location: { lat: 39.8742, lng: 116.3774 },
    lastUpdate: new Date()
  },
  {
    id: '8',
    name: '手持终端H02',
    type: 'handheld',
    status: 'offline',
    location: { lat: 39.9442, lng: 116.4474 },
    lastUpdate: new Date(Date.now() - 600000)
  },
  {
    id: '9',
    name: '监控点003',
    type: 'monitor',
    status: 'warning',
    location: { lat: 39.8642, lng: 116.3674 },
    lastUpdate: new Date()
  },
  {
    id: '10',
    name: '单兵010',
    type: 'soldier',
    status: 'online',
    location: { lat: 39.9542, lng: 116.4574 },
    lastUpdate: new Date()
  }
]);

// 计算属性
const filteredTerminals = computed(() => {
  if (selectedTerminalTypes.value.length === 0) {
    return terminals.value;
  }
  return terminals.value.filter(terminal =>
    selectedTerminalTypes.value.includes(terminal.type)
  );
});

const onlineTerminals = computed(() => {
  return terminals.value.filter(terminal => terminal.status === 'online');
});

const offlineTerminals = computed(() => {
  return terminals.value.filter(terminal => terminal.status === 'offline');
});

// 生成模拟轨迹数据
const generateTrackData = (terminal: any) => {
  const tracks = [];
  const baseTime = new Date().getTime() - 3600000; // 1小时前开始
  const { lat, lng } = terminal.location;

  for (let i = 0; i < 20; i++) {
    const time = baseTime + (i * 180000); // 每3分钟一个点
    const deltaLat = (Math.random() - 0.5) * 0.01; // 随机偏移
    const deltaLng = (Math.random() - 0.5) * 0.01;

    tracks.push({
      time: new Date(time),
      location: {
        lat: lat + deltaLat,
        lng: lng + deltaLng
      },
      speed: Math.random() * 60, // 0-60 km/h
      direction: Math.random() * 360 // 0-360度
    });
  }

  return tracks;
};

// 方法
const toggleTerminalPanel = () => {
  showTerminalPanel.value = !showTerminalPanel.value;
};

const closeToolbar = () => {
  selectedTerminal.value = null;
};

const handleTerminalTypeChange = () => {
  // 筛选变化时的处理逻辑
};

const selectTerminal = (terminal: any) => {
  selectedTerminal.value = terminal;
  // 地图定位到选中终端
  if (map && terminal.location) {
    map.setView([terminal.location.lat, terminal.location.lng], 15);

    // 高亮选中的标记
    terminalMarkers.value.forEach((marker, id) => {
      if (id === terminal.id) {
        marker.setIcon(createTerminalIcon(terminal.type, true));
      } else {
        const terminalData = terminals.value.find(t => t.id === id);
        if (terminalData) {
          marker.setIcon(createTerminalIcon(terminalData.type, false));
        }
      }
    });
  }
};

const refreshTerminals = () => {
  ElMessage.success('终端数据已刷新');
};

// 内容全屏切换方法
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;

  if (isFullscreen.value) {
    // 进入内容全屏模式
    document.body.classList.add('content-fullscreen');
    ElMessage.success('已进入全屏模式');
  } else {
    // 退出内容全屏模式
    document.body.classList.remove('content-fullscreen');
    ElMessage.success('已退出全屏模式');
  }
};

const centerMap = () => {
  if (map) {
    map.setView([39.9042, 116.4074], 12);
  }
};

// 移除重复的缩放和复位功能，使用Leaflet内置的缩放控件

// 终端操作方法
const handlePointCall = () => {
  ElMessage.info(`正在点呼 ${selectedTerminal.value?.name}`);
};

const handleVoiceCall = () => {
  ElMessage.info(`正在语音呼叫 ${selectedTerminal.value?.name}`);
};

const handleVideoMonitor = () => {
  ElMessage.info(`正在打开视频监控 ${selectedTerminal.value?.name}`);
};

const handleVideoCall = () => {
  ElMessage.info(`正在视频点呼 ${selectedTerminal.value?.name}`);
};

const handleTrackFollow = () => {
  if (!selectedTerminal.value) return;

  trackingMode.value = !trackingMode.value;

  if (trackingMode.value) {
    ElMessage.success(`开始跟踪 ${selectedTerminal.value.name} 的实时轨迹`);
    startTracking();
  } else {
    ElMessage.info(`停止跟踪 ${selectedTerminal.value.name} 的轨迹`);
    stopTracking();
  }
};

const handleTrackPlayback = () => {
  if (!selectedTerminal.value) return;

  playbackMode.value = !playbackMode.value;

  if (playbackMode.value) {
    ElMessage.success(`开始回放 ${selectedTerminal.value.name} 的历史轨迹`);
    startPlayback();
  } else {
    ElMessage.info(`停止回放 ${selectedTerminal.value.name} 的轨迹`);
    stopPlayback();
  }
};

// 开始轨迹跟踪
const startTracking = () => {
  if (!selectedTerminal.value || !map) return;

  const terminal = selectedTerminal.value;
  const trackData = generateTrackData(terminal);

  // 绘制轨迹线
  const trackPoints = trackData.map(point => [point.location.lat, point.location.lng]);
  const trackLine = L.polyline(trackPoints, {
    color: '#409EFF',
    weight: 3,
    opacity: 0.8
  }).addTo(map);

  trackLines.value.set(terminal.id, trackLine);

  // 模拟实时更新
  trackingInterval = window.setInterval(() => {
    // 这里可以添加实时位置更新逻辑
    console.log(`更新 ${terminal.name} 的位置`);
  }, 5000);
};

// 停止轨迹跟踪
const stopTracking = () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  // 清除轨迹线
  trackLines.value.forEach(line => {
    if (map) {
      map.removeLayer(line);
    }
  });
  trackLines.value.clear();
};

// 开始轨迹回放
const startPlayback = () => {
  if (!selectedTerminal.value || !map) return;

  const terminal = selectedTerminal.value;
  const trackData = generateTrackData(terminal);
  playbackProgress.value = 0;

  let currentIndex = 0;
  const playbackMarker = L.marker([trackData[0].location.lat, trackData[0].location.lng], {
    icon: createTerminalIcon(terminal.type, true)
  }).addTo(map);

  // 绘制完整轨迹线（半透明）
  const trackPoints = trackData.map(point => [point.location.lat, point.location.lng]);
  const trackLine = L.polyline(trackPoints, {
    color: '#E6A23C',
    weight: 2,
    opacity: 0.5,
    dashArray: '5, 5'
  }).addTo(map);

  playbackInterval = window.setInterval(() => {
    if (currentIndex < trackData.length - 1) {
      currentIndex++;
      const point = trackData[currentIndex];
      playbackMarker.setLatLng([point.location.lat, point.location.lng]);
      playbackProgress.value = (currentIndex / (trackData.length - 1)) * 100;

      // 地图跟随
      map!.setView([point.location.lat, point.location.lng], map!.getZoom());
    } else {
      // 回放完成
      stopPlayback();
      ElMessage.success('轨迹回放完成');
    }
  }, 500); // 每500ms移动一次
};

// 停止轨迹回放
const stopPlayback = () => {
  playbackMode.value = false;
  playbackProgress.value = 0;

  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }

  // 清除回放相关的图层
  if (map) {
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer !== terminalMarkers.value.get(selectedTerminal.value?.id)) {
        map!.removeLayer(layer);
      }
      if (layer instanceof L.Polyline) {
        map!.removeLayer(layer);
      }
    });
  }
};

const toggleMeasure = () => {
  measureMode.value = !measureMode.value;
  if (measureMode.value) {
    ElMessage.info('测距模式已开启，点击地图开始测距');
    enableMeasureMode();
  } else {
    ElMessage.info('测距模式已关闭');
    disableMeasureMode();
  }
};

const toggleAreaMeasure = () => {
  areaMeasureMode.value = !areaMeasureMode.value;
  if (areaMeasureMode.value) {
    ElMessage.info('测面积模式已开启，点击地图开始测面积');
    enableAreaMeasureMode();
  } else {
    ElMessage.info('测面积模式已关闭');
    disableAreaMeasureMode();
  }
};

const toggleLayers = () => {
  ElMessage.info('图层切换功能 - 可切换卫星图、地形图等');
  // 这里可以添加图层切换逻辑
  switchMapLayer();
};

// 启用测距模式
const enableMeasureMode = () => {
  if (!map) return;

  let measurePoints: L.LatLng[] = [];
  let measureLine: L.Polyline | null = null;
  let measureMarkers: L.Marker[] = [];

  const onMapClick = (e: L.LeafletMouseEvent) => {
    measurePoints.push(e.latlng);

    // 添加标记
    const marker = L.marker(e.latlng).addTo(map!);
    measureMarkers.push(marker);

    if (measurePoints.length > 1) {
      // 绘制或更新线条
      if (measureLine) {
        map!.removeLayer(measureLine);
      }
      measureLine = L.polyline(measurePoints, { color: '#FF6B6B', weight: 3 }).addTo(map!);

      // 计算距离
      const distance = calculateDistance(measurePoints);
      ElMessage.info(`当前距离: ${distance.toFixed(2)} 米`);
    }
  };

  map.on('click', onMapClick);

  // 保存清理函数
  measureControl = () => {
    map!.off('click', onMapClick);
    if (measureLine) map!.removeLayer(measureLine);
    measureMarkers.forEach(marker => map!.removeLayer(marker));
    measurePoints = [];
    measureMarkers = [];
    measureLine = null;
  };
};

// 禁用测距模式
const disableMeasureMode = () => {
  if (measureControl) {
    measureControl();
    measureControl = null;
  }
};

// 启用测面积模式
const enableAreaMeasureMode = () => {
  if (!map) return;

  let areaPoints: L.LatLng[] = [];
  let areaPolygon: L.Polygon | null = null;
  let areaMarkers: L.Marker[] = [];

  const onMapClick = (e: L.LeafletMouseEvent) => {
    areaPoints.push(e.latlng);

    // 添加标记
    const marker = L.marker(e.latlng).addTo(map!);
    areaMarkers.push(marker);

    if (areaPoints.length > 2) {
      // 绘制或更新多边形
      if (areaPolygon) {
        map!.removeLayer(areaPolygon);
      }
      areaPolygon = L.polygon(areaPoints, {
        color: '#67C23A',
        fillColor: '#67C23A',
        fillOpacity: 0.3,
        weight: 2
      }).addTo(map!);

      // 计算面积
      const area = calculateArea(areaPoints);
      ElMessage.info(`当前面积: ${area.toFixed(2)} 平方米`);
    }
  };

  map.on('click', onMapClick);

  // 保存清理函数
  areaMeasureControl = () => {
    map!.off('click', onMapClick);
    if (areaPolygon) map!.removeLayer(areaPolygon);
    areaMarkers.forEach(marker => map!.removeLayer(marker));
    areaPoints = [];
    areaMarkers = [];
    areaPolygon = null;
  };
};

// 禁用测面积模式
const disableAreaMeasureMode = () => {
  if (areaMeasureControl) {
    areaMeasureControl();
    areaMeasureControl = null;
  }
};

// 切换地图图层
const switchMapLayer = () => {
  if (!map) return;

  // 这里可以添加不同图层的切换逻辑
  // 例如：卫星图、地形图、街道图等
  ElMessage.success('图层已切换（演示功能）');
};

// 计算距离（简单的球面距离计算）
const calculateDistance = (points: L.LatLng[]): number => {
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += points[i-1].distanceTo(points[i]);
  }
  return totalDistance;
};

// 计算面积（简单的多边形面积计算）
const calculateArea = (points: L.LatLng[]): number => {
  if (points.length < 3) return 0;

  // 使用鞋带公式计算多边形面积（近似）
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].lat * points[j].lng;
    area -= points[j].lat * points[i].lng;
  }

  area = Math.abs(area) / 2;

  // 转换为平方米（粗略估算）
  return area * 111000 * 111000 * Math.cos(points[0].lat * Math.PI / 180);
};

// 工具方法
const getTerminalIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    monitor: VideoCamera,
    drone: Monitor,
    soldier: User,
    handheld: Camera
  };
  return iconMap[type] || Monitor;
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    online: 'success',
    offline: 'danger',
    warning: 'warning'
  };
  return typeMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    warning: '告警'
  };
  return textMap[status] || '未知';
};

const getTerminalTypeLabel = (type: string) => {
  const terminal = terminalTypes.find(t => t.value === type);
  return terminal ? terminal.label : type;
};

const formatLocation = (location: any) => {
  if (!location) return '未知';
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
};

const formatTime = (time: Date) => {
  const now = new Date();
  const diff = now.getTime() - time.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
  return time.toLocaleDateString();
};

const getTypeColor = (type: string) => {
  const colors = {
    monitor: '#67C23A',
    drone: '#409EFF',
    soldier: '#E6A23C',
    handheld: '#F56C6C'
  };
  return colors[type as keyof typeof colors] || '#909399';
};

const getTypeCount = (type: string) => {
  return terminals.value.filter(terminal => terminal.type === type).length;
};

// 创建终端图标
const createTerminalIcon = (type: string, isSelected: boolean = false) => {
  const colors = {
    monitor: '#67C23A',
    drone: '#409EFF',
    soldier: '#E6A23C',
    handheld: '#F56C6C'
  };

  const color = colors[type as keyof typeof colors] || '#909399';
  const size = isSelected ? 30 : 24;

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ${isSelected ? 'animation: pulse 1s infinite;' : ''}
    "></div>`,
    className: 'terminal-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// 初始化地图
const initMap = () => {
  // 创建地图
  map = L.map('location-map', {
    zoomControl: false // 禁用默认缩放控件
  }).setView([39.9042, 116.4074], 12);

  // 添加瓦片图层
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // 添加自定义缩放控件到右下角
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);

  // 添加终端标记
  updateTerminalMarkers();
};

// 更新终端标记
const updateTerminalMarkers = () => {
  if (!map) return;

  // 清除现有标记
  terminalMarkers.value.forEach(marker => {
    map!.removeLayer(marker);
  });
  terminalMarkers.value.clear();

  // 添加新标记
  terminals.value.forEach(terminal => {
    if (terminal.location) {
      const marker = L.marker([terminal.location.lat, terminal.location.lng], {
        icon: createTerminalIcon(terminal.type, selectedTerminal.value?.id === terminal.id)
      }).addTo(map!);

      // 添加弹窗
      marker.bindPopup(`
        <div style="text-align: center;">
          <h4 style="margin: 0 0 8px 0;">${terminal.name}</h4>
          <p style="margin: 0 0 4px 0;">类型: ${getTerminalTypeLabel(terminal.type)}</p>
          <p style="margin: 0 0 4px 0;">状态: ${getStatusText(terminal.status)}</p>
          <p style="margin: 0;">更新: ${formatTime(terminal.lastUpdate)}</p>
        </div>
      `);

      // 点击标记选中终端
      marker.on('click', () => {
        selectTerminal(terminal);
      });

      terminalMarkers.value.set(terminal.id, marker);
    }
  });
};

onMounted(() => {
  console.log('位置调度页面已加载');
  nextTick(() => {
    initMap();
  });
});

onUnmounted(() => {
  // 清理定时器
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
  if (playbackInterval) {
    clearInterval(playbackInterval);
  }

  // 清理测量工具
  if (measureControl) {
    measureControl();
  }
  if (areaMeasureControl) {
    areaMeasureControl();
  }

  // 清理地图资源
  if (map) {
    map.remove();
    map = null;
  }

  // 清理内容全屏状态
  document.body.classList.remove('content-fullscreen');
});
</script>

<style scoped>
.location-dispatch-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0a0e1a;
  overflow: hidden;
}

/* 全屏地图容器 */
.fullscreen-map-container {
  position: relative;
  width: 100%;
  height: 100vh;
  z-index: 1;
}

.leaflet-map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 顶部标题栏 */
.top-header {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 1001;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(15px);
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.page-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}


/* 设备统计头部 */
.device-stats-header {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item .stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.stat-item .stat-icon.online {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.stat-item .stat-icon.total {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.stat-item .stat-icon.warning {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
}

.stat-item .stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-item .stat-value {
  font-size: 20px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
}

.stat-item .stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

/* 设备类型分布面板 */
.type-distribution-panel {
  position: absolute;
  top: 100px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 200px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16px;
}

.type-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-stat {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-label {
  flex: 1;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.type-count {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

/* 筛选工具栏（面板内） */
.filter-toolbar {
  padding: 0 16px 12px 16px;
}

/* 左上角大屏风格设备列表面板 */
.terminal-panel.big-screen {
  position: fixed;
  top: 100px;
  left: 20px;
  z-index: 1001;
  width: 420px;
  max-height: 70vh;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  overflow: hidden;
  transform: translateX(0);
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.terminal-panel.big-screen:not(.panel-open) {
  transform: translateX(-460px);
  opacity: 0.8;
}

/* 统计头保持边框与背景 */
.device-stats-header {
  display: flex;
  justify-content: space-around;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

/* 设备列表（面板内） */
.terminal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 16px 16px;
  max-height: calc(70vh - 120px);
  overflow-y: auto;
}

.terminal-item {
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
}

.terminal-item:hover {
  border-color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.terminal-item.active {
  border-color: #409EFF;
  background: rgba(64, 158, 255, 0.2);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.terminal-item.offline {
  opacity: 0.6;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.terminal-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal-icon {
  color: #409EFF;
}

.terminal-name {
  font-weight: 500;
  color: #ffffff;
}

.terminal-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.detail-item .label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.detail-item .value {
  color: rgba(255, 255, 255, 0.9);
}

/* 地图工具面板 - 位于右下角缩放按钮上方 */
.map-tools-panel {
  position: fixed;
  bottom: 140px; /* 在缩放按钮上方留出适当间距，考虑新的按钮高度 */
  right: 20px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-tools-panel .el-button {
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.map-tools-panel .el-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.map-tools-panel .el-button.el-button--primary {
  background: rgba(64, 158, 255, 0.8);
  border-color: rgba(64, 158, 255, 0.8);
}

/* 自定义Leaflet缩放按钮样式，与地图工具按钮保持一致 */
.leaflet-control-zoom {
  border: none !important;
  box-shadow: none !important;
}

.leaflet-control-zoom a {
  width: 32px !important;
  height: 32px !important;
  line-height: 30px !important;
  background: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 50% !important;
  color: rgba(255, 255, 255, 0.9) !important;
  text-decoration: none !important;
  font-size: 16px !important;
  font-weight: bold !important;
  margin-bottom: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.3s ease !important;
}

.leaflet-control-zoom a:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
}

.leaflet-control-zoom a:first-child {
  border-radius: 50% !important;
}

.leaflet-control-zoom a:last-child {
  border-radius: 50% !important;
  margin-bottom: 0 !important;
}

/* 浮动操作工具栏 */
.floating-toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(15px);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 600px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.toolbar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-header .terminal-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.toolbar-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 轨迹回放进度条 */
.playback-progress {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  text-align: center;
}

.progress-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-top: 4px;
}

.map-legend {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.legend-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 底部操作面板 */
.bottom-panel {
  margin-top: 20px;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-buttons {
  display: flex;
  justify-content: center;
}

/* 地图标记动画 */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 终端标记样式 */
:deep(.terminal-marker) {
  background: transparent !important;
  border: none !important;
}

/* Leaflet 弹窗样式优化 */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-popup-content) {
  margin: 12px 16px;
  font-size: 13px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 1200px) {


  .type-distribution-panel {
    top: 200px;
    right: 20px;
    left: 20px;
  }

  .type-stats {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
  }

  .map-tools-panel {
    right: 10px;
    gap: 6px;
  }

  .floating-toolbar {
    min-width: 500px;
    padding: 16px;
  }

  .toolbar-buttons {
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .top-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-right {
    justify-content: center;
  }



  .type-distribution-panel {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    margin: 20px;
  }



  .map-tools-panel {
    position: fixed;
    bottom: 120px; /* 为移动端缩放按钮留出空间 */
    right: 10px;
    flex-direction: row;
    gap: 6px;
  }

  .map-tools-panel .el-button {
    width: 28px;
    height: 28px;
  }

  /* 移动端缩放按钮样式调整 */
  .leaflet-control-zoom a {
    width: 28px !important;
    height: 28px !important;
    line-height: 26px !important;
    font-size: 14px !important;
  }

  .floating-toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    transform: none;
    border-radius: 16px 16px 0 0;
    min-width: auto;
    max-height: 50vh;
    overflow-y: auto;
  }

  .toolbar-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .toolbar-buttons .el-button {
    width: 100%;
    justify-content: flex-start;
  }
}

/* 动画效果 */
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromBottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.floating-toolbar {
  animation: slideInFromBottom 0.3s ease-out;
}



/* 地图标记脉冲动画增强 */
@keyframes pulse-enhanced {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

:deep(.terminal-marker div) {
  animation: pulse-enhanced 2s infinite;
}
</style>

<style>
/* 内容全屏模式的全局样式 */
body.content-fullscreen .app-container {
  margin-left: 0 !important;
}

body.content-fullscreen .app-sidebar {
  display: none !important;
}

body.content-fullscreen .app-header {
  display: none !important;
}

body.content-fullscreen .main-content {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  z-index: 9999 !important;
}

body.content-fullscreen .location-dispatch-page {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 10000 !important;
}

body.content-fullscreen .fullscreen-map-container {
  width: 100vw !important;
  height: 100vh !important;
}

body.content-fullscreen .leaflet-map {
  width: 100vw !important;
  height: 100vh !important;
}
</style>
