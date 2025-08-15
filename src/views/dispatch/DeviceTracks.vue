<template>
  <div class="device-tracks-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">设备轨迹</h1>
        <p class="page-description">查看和回放设备运动轨迹，支持多维度筛选和轨迹分析</p>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-left">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          size="default"
          @change="handleDateChange"
        />
        <el-select
          v-model="selectedDeviceTypes"
          multiple
          placeholder="选择设备类型"
          size="default"
          style="width: 200px"
          @change="handleDeviceTypeChange"
        >
          <el-option
            v-for="type in deviceTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
        <el-select
          v-model="selectedDevices"
          multiple
          placeholder="选择设备"
          size="default"
          style="width: 250px"
          filterable
          @change="handleDeviceChange"
        >
          <el-option
            v-for="device in availableDevices"
            :key="device.id"
            :label="device.name"
            :value="device.id"
          />
        </el-select>
      </div>
      <div class="filter-right">
        <el-button @click="clearFilters">
          <el-icon><RefreshLeft /></el-icon>
          清空筛选
        </el-button>
        <el-button type="primary" @click="searchTracks">
          <el-icon><Search /></el-icon>
          查询轨迹
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">总轨迹数:</span>
        <span class="stat-value">{{ filteredTracks.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">设备数:</span>
        <span class="stat-value">{{ uniqueDeviceCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总距离:</span>
        <span class="stat-value">{{ totalDistance }}</span>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="tracks-main-content">
      <!-- 左侧轨迹列表 -->
      <div class="left-panel">
        <el-card class="tracks-card">
          <template #header>
            <div class="tracks-header">
              <span>轨迹列表</span>
              <el-tag size="small">{{ filteredTracks.length }} 条</el-tag>
            </div>
          </template>

          <div v-if="filteredTracks.length === 0" class="empty-state">
            <el-icon size="48" color="#ccc"><Location /></el-icon>
            <p>暂无轨迹数据</p>
            <p class="hint">请调整筛选条件后查询</p>
          </div>

          <div v-else class="tracks-list">
            <div
              v-for="track in filteredTracks"
              :key="track.id"
              class="track-item"
              :class="{ active: selectedTrack?.id === track.id }"
              @click="selectTrack(track)"
            >
              <div class="track-header">
                <div class="device-info">
                  <el-icon class="device-icon">
                    <component :is="getDeviceIcon(track.deviceType)" />
                  </el-icon>
                  <span class="device-name">{{ track.deviceName }}</span>
                </div>
                <el-tag :type="getStatusType(track.status)" size="small">
                  {{ getStatusText(track.status) }}
                </el-tag>
              </div>
              <div class="track-summary">
                <div class="summary-item">
                  <span class="label">时间:</span>
                  <span class="value">{{ formatDateOnly(track.startTime) }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">距离:</span>
                  <span class="value">{{ formatDistance(track.totalDistance || 0) }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">最高速度:</span>
                  <span class="value">{{ track.maxSpeed || 0 }} km/h</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧内容区域 -->
      <div class="right-panel">
        <div v-if="!selectedTrack" class="empty-selection">
          <el-card>
            <div class="empty-content">
              <el-icon size="64" color="#ccc"><Location /></el-icon>
              <h3>请选择轨迹</h3>
              <p>从左侧列表中选择一条轨迹进行查看和回放</p>
            </div>
          </el-card>
        </div>

        <div v-else class="track-workspace">
          <!-- 轨迹信息栏 -->
          <div class="info-bar">
            <el-card class="info-card">
              <div class="track-info">
                <div class="info-left">
                  <h4>{{ selectedTrack.deviceName }}</h4>
                  <p>{{ formatTimeRange(selectedTrack.startTime, selectedTrack.endTime) }}</p>
                </div>
                <div class="info-right">
                  <div class="info-stats">
                    <div class="stat-item">
                      <span class="stat-value">{{ formatDistance(selectedTrack.totalDistance || 0) }}</span>
                      <span class="stat-label">总距离</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ selectedTrack.maxSpeed || 0 }} km/h</span>
                      <span class="stat-label">最高速度</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ keyPointsCount }}</span>
                      <span class="stat-label">关键节点</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 地图区域 -->
          <div class="map-section">
            <el-card class="map-card">
              <template #header>
                <div class="map-header">
                  <span>轨迹地图</span>
                  <div class="map-options">
                    <el-checkbox v-model="showKeyPoints" size="small">关键节点</el-checkbox>
                    <el-checkbox v-model="showSpeed" size="small">速度标注</el-checkbox>
                  </div>
                </div>
              </template>
              <div class="map-container">
                <TrackMap
                  :track="selectedTrack"
                  :show-key-points="showKeyPoints"
                  :show-speed="showSpeed"
                  :playback-progress="playbackProgress"
                  :is-playing="isPlaying"
                />
              </div>
            </el-card>
          </div>

          <!-- 控制面板 -->
          <div class="control-section">
            <el-card class="control-card">
              <template #header>
                <span>回放控制</span>
              </template>
              <div class="playback-controls">
                <div class="control-row">
                  <el-button-group>
                    <el-button @click="playbackControl('start')" :disabled="isPlaying" size="small">
                      <el-icon><VideoPlay /></el-icon>
                      播放
                    </el-button>
                    <el-button @click="playbackControl('pause')" :disabled="!isPlaying" size="small">
                      <el-icon><VideoPause /></el-icon>
                      暂停
                    </el-button>
                    <el-button @click="playbackControl('stop')" size="small">
                      <el-icon><VideoCamera /></el-icon>
                      停止
                    </el-button>
                  </el-button-group>

                  <div class="speed-selector">
                    <span>速度:</span>
                    <el-select v-model="playbackSpeed" size="small" style="width: 70px">
                      <el-option label="0.5x" :value="0.5" />
                      <el-option label="1x" :value="1" />
                      <el-option label="2x" :value="2" />
                      <el-option label="4x" :value="4" />
                      <el-option label="8x" :value="8" />
                    </el-select>
                  </div>
                </div>

                <div class="progress-row">
                  <el-slider
                    v-model="playbackProgress"
                    :min="0"
                    :max="100"
                    :format-tooltip="formatProgressTooltip"
                    @change="handleProgressChange"
                  />
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Search,
  RefreshLeft,
  Location,
  Monitor,
  Phone,
  Camera,
  User,
  VideoPlay,
  VideoPause,
  VideoCamera
} from '@element-plus/icons-vue';
import { trackService } from '@/services/trackService';
import TrackMap from '@/components/TrackMap.vue';
import type { DeviceTrack } from '@/types';

// 响应式数据
const dateRange = ref<[string, string]>(['', '']);
const selectedDeviceTypes = ref<string[]>([]);
const selectedDevices = ref<string[]>([]);
const filteredTracks = ref<DeviceTrack[]>([]);
const selectedTrack = ref<DeviceTrack | null>(null);
const availableDevices = ref(trackService.getDevices());

// 地图显示选项
const showKeyPoints = ref(true);
const showSpeed = ref(false);

// 回放控制
const isPlaying = ref(false);
const playbackProgress = ref(0);
const playbackSpeed = ref(1);
const playbackTimer = ref<number | null>(null);

// 设备类型选项
const deviceTypes = [
  { label: '网状电台', value: 'mesh_radio' },
  { label: '基站', value: 'base_station' },
  { label: '执法记录仪', value: 'body_camera' },
  { label: '车载设备', value: 'vehicle' },
  { label: '人员设备', value: 'personnel' },
  { label: '其他', value: 'other' }
];

// 计算属性
const uniqueDeviceCount = computed(() => {
  const deviceIds = new Set(filteredTracks.value.map(track => track.deviceId));
  return deviceIds.size;
});

const totalDistance = computed(() => {
  const total = filteredTracks.value.reduce((sum, track) => sum + (track.totalDistance || 0), 0);
  return formatDistance(total);
});

const keyPointsCount = computed(() => {
  if (!selectedTrack.value) return 0;
  return selectedTrack.value.trackPoints.filter(point => point.isKeyPoint).length;
});

const keyPoints = computed(() => {
  if (!selectedTrack.value) return [];
  return selectedTrack.value.trackPoints.filter(point => point.isKeyPoint);
});

// 方法
const handleDateChange = (value: [string, string]) => {
  console.log('日期范围变化:', value);
  applyFilters();
};

const handleDeviceTypeChange = (value: string[]) => {
  console.log('设备类型变化:', value);
  // 当设备类型改变时，更新可用设备列表
  if (value.length > 0) {
    availableDevices.value = trackService.getDevices().filter(device =>
      value.includes(device.type)
    );
    // 清空已选择的设备（如果它们不在新的类型中）
    selectedDevices.value = selectedDevices.value.filter(deviceId =>
      availableDevices.value.some(device => device.id === deviceId)
    );
  } else {
    availableDevices.value = trackService.getDevices();
  }
  applyFilters();
};

const handleDeviceChange = (value: string[]) => {
  console.log('设备选择变化:', value);
  applyFilters();
};

const clearFilters = () => {
  dateRange.value = ['', ''];
  selectedDeviceTypes.value = [];
  selectedDevices.value = [];
  selectedTrack.value = null;
  availableDevices.value = trackService.getDevices();
  filteredTracks.value = [];
  ElMessage.success('筛选条件已清空');
};

const searchTracks = () => {
  applyFilters();
  ElMessage.success(`查询完成，找到 ${filteredTracks.value.length} 条轨迹`);
};

const applyFilters = () => {
  const filter: any = {};

  if (selectedDevices.value.length > 0) {
    filter.deviceIds = selectedDevices.value;
  }

  if (selectedDeviceTypes.value.length > 0) {
    filter.deviceTypes = selectedDeviceTypes.value;
  }

  if (dateRange.value[0] && dateRange.value[1]) {
    filter.startTime = new Date(dateRange.value[0]);
    filter.endTime = new Date(dateRange.value[1]);
  }

  filteredTracks.value = trackService.getFilteredTracks(filter);
};

const formatTimeRange = (start: Date, end: Date) => {
  const startStr = start.toLocaleDateString() + ' ' + start.toLocaleTimeString().slice(0, 5);
  const endStr = end.toLocaleDateString() + ' ' + end.toLocaleTimeString().slice(0, 5);
  return `${startStr} - ${endStr}`;
};

const selectTrack = (track: DeviceTrack) => {
  selectedTrack.value = track;
  // 重置回放状态
  stopPlayback();
  playbackProgress.value = 0;
  ElMessage.info(`已选择轨迹: ${track.deviceName}`);
};

const formatDistance = (distance: number) => {
  if (distance < 1000) {
    return `${distance.toFixed(0)}m`;
  }
  return `${(distance / 1000).toFixed(2)}km`;
};

const formatDateOnly = (date: Date) => {
  return date.toLocaleDateString();
};

const formatDateTime = (date: Date) => {
  return date.toLocaleString();
};

const formatDuration = (start: Date, end: Date) => {
  const duration = end.getTime() - start.getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}小时${minutes}分钟`;
};

const getDeviceIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    mesh_radio: Phone,
    base_station: Monitor,
    body_camera: Camera,
    vehicle: Monitor, // 使用Monitor图标代替车辆
    personnel: User,
    other: Monitor
  };
  return iconMap[type] || Monitor;
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    recording: 'warning',
    completed: 'success',
    interrupted: 'danger'
  };
  return typeMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    recording: '记录中',
    completed: '已完成',
    interrupted: '已中断'
  };
  return textMap[status] || '未知';
};

const getDeviceTypeLabel = (type: string) => {
  const device = deviceTypes.find(d => d.value === type);
  return device ? device.label : type;
};

// 回放控制方法
const playbackControl = (action: 'start' | 'pause' | 'stop') => {
  switch (action) {
    case 'start':
      startPlayback();
      break;
    case 'pause':
      pausePlayback();
      break;
    case 'stop':
      stopPlayback();
      break;
  }
};

const startPlayback = () => {
  if (!selectedTrack.value || selectedTrack.value.trackPoints.length === 0) return;

  isPlaying.value = true;

  // 如果已经到达终点，从头开始
  if (playbackProgress.value >= 100) {
    playbackProgress.value = 0;
  }

  // 启动定时器
  playbackTimer.value = window.setInterval(() => {
    playbackProgress.value += playbackSpeed.value * 0.5; // 每100ms增加0.5%

    if (playbackProgress.value >= 100) {
      stopPlayback();
      ElMessage.success('轨迹回放完成');
    }
  }, 100);

  ElMessage.success('开始播放轨迹');
};

const pausePlayback = () => {
  isPlaying.value = false;
  if (playbackTimer.value) {
    clearInterval(playbackTimer.value);
    playbackTimer.value = null;
  }
  ElMessage.info('暂停播放');
};

const stopPlayback = () => {
  isPlaying.value = false;
  playbackProgress.value = 0;
  if (playbackTimer.value) {
    clearInterval(playbackTimer.value);
    playbackTimer.value = null;
  }
};

const handleProgressChange = (value: number) => {
  playbackProgress.value = value;
  // 如果正在播放，暂停后重新开始
  if (isPlaying.value) {
    pausePlayback();
    startPlayback();
  }
};

const formatProgressTooltip = (value: number) => {
  if (!selectedTrack.value) return '';

  const totalDuration = selectedTrack.value.endTime.getTime() - selectedTrack.value.startTime.getTime();
  const currentTime = new Date(selectedTrack.value.startTime.getTime() + (totalDuration * value / 100));

  return currentTime.toLocaleString();
};

// 关键节点相关方法
const getKeyPointType = (type?: string) => {
  const typeMap: Record<string, string> = {
    task_start: 'success',
    task_end: 'info',
    abnormal_stay: 'warning',
    emergency: 'danger',
    checkpoint: 'primary'
  };
  return typeMap[type || ''] || 'info';
};

const getKeyPointTypeLabel = (type?: string) => {
  const labelMap: Record<string, string> = {
    task_start: '任务开始',
    task_end: '任务结束',
    abnormal_stay: '异常停留',
    emergency: '紧急事件',
    checkpoint: '检查点'
  };
  return labelMap[type || ''] || '未知';
};

const jumpToKeyPoint = (point: any) => {
  if (!selectedTrack.value) return;

  // 找到关键节点在轨迹中的位置
  const pointIndex = selectedTrack.value.trackPoints.findIndex(p => p.id === point.id);
  if (pointIndex >= 0) {
    const progress = (pointIndex / (selectedTrack.value.trackPoints.length - 1)) * 100;
    playbackProgress.value = progress;

    // 如果正在播放，暂停后重新开始
    if (isPlaying.value) {
      pausePlayback();
      startPlayback();
    }

    ElMessage.info(`跳转到关键节点: ${getKeyPointTypeLabel(point.keyPointType)}`);
  }
};

onMounted(() => {
  console.log('设备轨迹页面已加载');
  // 初始加载所有轨迹
  filteredTracks.value = trackService.getAllTracks();
});

onUnmounted(() => {
  // 清理定时器
  stopPlayback();
});
</script>

<style scoped>
.device-tracks-page {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 允许页面整体滚动，避免底部内容被截断 */
}

/* 页面头部 */
.page-header {
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.page-description {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0;
}

/* 筛选工具栏 */
.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 6px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  gap: 8px;
}

/* 统计信息栏 */
.stats-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  color: #409EFF;
  font-weight: 600;
  font-size: 16px;
}

.tracks-main-content {
  display: flex;
  gap: 20px;
  min-height: 800px;
}

.left-panel {
  width: 300px;
  flex-shrink: 0;
  height: 800px;
}

.tracks-card {
  height: 800px;
  display: flex;
  flex-direction: column;
}

.tracks-card :deep(.el-card__body) {
  flex: 1; /* 让内容区自适应撑满卡片剩余空间 */
  min-height: 0; /* 关键：允许内部滚动容器收缩，避免把父容器撑高 */
  height: auto;
  padding: 0;
  overflow: hidden; /* 外层不滚动，由内部列表滚动 */
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tracks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.empty-state p {
  margin: 8px 0;
}

.hint {
  font-size: 12px;
  color: #ccc;
}

.tracks-list {
  height: 100%;
  max-height: 100%;
  overflow-y: auto; /* 列表内部滚动 */
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  padding: 12px;
}

/* 滚动条样式 */
.tracks-list::-webkit-scrollbar {
  width: 6px;
}

.tracks-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.tracks-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.tracks-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.track-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.track-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.track-item.active {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-icon {
  color: #409EFF;
}

.device-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.track-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.summary-item .label {
  font-weight: 500;
}

.summary-item .value {
  color: #333;
}

.empty-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  padding: 60px 40px;
  color: #999;
}

.empty-content h3 {
  margin: 20px 0 8px 0;
  color: #666;
}

.empty-content p {
  margin: 8px 0;
}

.track-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 800px;
}

.info-bar {
  flex-shrink: 0;
}

.info-card .el-card__body {
  padding: 16px;
}

.track-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-left h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.info-left p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.info-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.map-section {
  flex: 1;
  min-height: 550px;
}

.map-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.map-card :deep(.el-card__body) {
  flex: 1;           /* 占满剩余空间 */
  min-height: 0;     /* 允许内部滚动容器收缩 */
  height: auto;
  padding: 0;
  overflow: visible; /* 确保地图内的悬浮控件不被裁剪 */
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-options {
  display: flex;
  gap: 16px;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 550px;
  position: relative; /* 让绝对定位的图例/控件定位基准更稳定 */
  overflow: visible;
}

.control-section {
  flex-shrink: 0;
}

.control-card .el-card__body {
  padding: 16px;
}

.playback-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.speed-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.progress-row {
  width: 100%;
}



/* 响应式设计 */
@media (max-width: 1200px) {
  .tracks-main-content {
    flex-direction: column;
    min-height: auto;
  }

  .left-panel {
    width: 100%;
    height: auto;
  }

  .tracks-card {
    height: 500px;
  }

  .track-workspace {
    height: auto;
    min-height: 600px;
  }

  .map-section {
    min-height: 450px;
  }

  .map-container {
    min-height: 400px;
  }

  .info-stats {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .device-tracks-page {
    padding: 12px;
  }

  .filter-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .filter-left {
    justify-content: center;
    flex-wrap: wrap;
  }

  .stats-bar {
    flex-wrap: wrap;
    gap: 12px;
  }

  .track-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .info-stats {
    gap: 12px;
  }

  .control-row {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .speed-selector {
    justify-content: center;
  }

  .map-options {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

