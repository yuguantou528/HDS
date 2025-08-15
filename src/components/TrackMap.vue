<template>
  <div class="track-map" ref="mapContainer">
    <!-- 简化的地图显示区域 -->
    <div class="map-content" ref="mapContent">
      <!-- 轨迹路径显示 -->
      <div v-if="track && track.trackPoints.length > 0" class="track-display">
        <svg class="track-svg" :width="mapWidth" :height="mapHeight">
          <!-- 轨迹线 -->
          <polyline
            :points="trackPathPoints"
            fill="none"
            stroke="#409EFF"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- 起点 -->
          <circle
            v-if="startPoint"
            :cx="startPoint.x"
            :cy="startPoint.y"
            r="8"
            fill="#67C23A"
          />

          <!-- 终点 -->
          <circle
            v-if="endPoint"
            :cx="endPoint.x"
            :cy="endPoint.y"
            r="8"
            fill="#F56C6C"
          />

          <!-- 当前位置（回放时） -->
          <circle
            v-if="currentPoint && playbackProgress > 0"
            :cx="currentPoint.x"
            :cy="currentPoint.y"
            r="10"
            fill="#409EFF"
            opacity="0.8"
          >
            <animate
              v-if="isPlaying"
              attributeName="r"
              values="10;15;10"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>

          <!-- 关键节点 -->
          <circle
            v-for="(point, index) in keyPoints"
            :key="`key-${index}`"
            :cx="point.x"
            :cy="point.y"
            r="6"
            fill="#E6A23C"
          />
        </svg>
      </div>

      <!-- 无轨迹时的提示 -->
      <div v-else class="no-track">
        <el-icon size="48" color="#ccc"><Location /></el-icon>
        <p>暂无轨迹数据</p>
      </div>
    </div>

    <!-- 地图控制按钮 -->
    <div class="map-controls">
      <el-button-group size="small">
        <el-button @click="zoomIn" :disabled="!track">
          <el-icon><Plus /></el-icon>
        </el-button>
        <el-button @click="zoomOut" :disabled="!track">
          <el-icon><Minus /></el-icon>
        </el-button>
        <el-button @click="resetView" :disabled="!track">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-button-group>
    </div>

    <!-- 图例 -->
    <div class="map-legend">
      <div class="legend-item">
        <div class="legend-color" style="background: #409EFF;"></div>
        <span>轨迹路径</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #67C23A;"></div>
        <span>起点</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #F56C6C;"></div>
        <span>终点</span>
      </div>
      <div class="legend-item" v-if="showKeyPoints">
        <div class="legend-color" style="background: #E6A23C;"></div>
        <span>关键节点</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Plus, Minus, Refresh, Location } from '@element-plus/icons-vue';
import type { DeviceTrack, TrackPoint } from '@/types';

interface Props {
  track?: DeviceTrack | null;
  showKeyPoints?: boolean;
  showSpeed?: boolean;
  playbackProgress?: number;
  isPlaying?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  track: null,
  showKeyPoints: true,
  showSpeed: false,
  playbackProgress: 0,
  isPlaying: false
});

const mapContainer = ref<HTMLElement>();
const mapContent = ref<HTMLElement>();
const mapWidth = ref(800);
const mapHeight = ref(400);
const zoom = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

// 坐标转换函数 - 自适应缩放版本
const latLngToPixel = (lat: number, lng: number) => {
  if (!props.track || props.track.trackPoints.length === 0) {
    return { x: mapWidth.value / 2, y: mapHeight.value / 2 };
  }

  // 获取轨迹边界
  const points = props.track.trackPoints;
  const lats = points.map(p => p.location.latitude);
  const lngs = points.map(p => p.location.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // 计算轨迹范围
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  // 留出更多边距，确保轨迹完全在容器内
  const padding = 80;
  const availableWidth = mapWidth.value - padding * 2;
  const availableHeight = mapHeight.value - padding * 2;

  // 计算缩放比例，选择较小的比例确保完全适配
  const scaleX = availableWidth / lngRange;
  const scaleY = availableHeight / latRange;
  const baseScale = Math.min(scaleX, scaleY) * 0.8; // 再缩小20%确保安全边距
  const finalScale = baseScale * zoom.value;

  // 计算轨迹中心点
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // 计算地图中心点
  const mapCenterX = mapWidth.value / 2;
  const mapCenterY = mapHeight.value / 2;

  // 转换坐标，以地图中心为基准
  const x = mapCenterX + (lng - centerLng) * finalScale + offsetX.value;
  const y = mapCenterY - (lat - centerLat) * finalScale + offsetY.value; // Y轴翻转

  return { x, y };
};

// 计算轨迹路径点字符串
const trackPathPoints = computed(() => {
  if (!props.track || props.track.trackPoints.length === 0) return '';

  // 如果没有开始回放（进度为0），显示完整轨迹
  if (props.playbackProgress === 0) {
    return props.track.trackPoints
      .map(point => {
        const pixel = latLngToPixel(point.location.latitude, point.location.longitude);
        return `${pixel.x},${pixel.y}`;
      })
      .join(' ');
  }

  // 回放时只显示已走过的部分
  const currentIndex = Math.floor((props.playbackProgress / 100) * (props.track.trackPoints.length - 1));
  const visiblePoints = props.track.trackPoints.slice(0, Math.max(1, currentIndex + 1));

  return visiblePoints
    .map(point => {
      const pixel = latLngToPixel(point.location.latitude, point.location.longitude);
      return `${pixel.x},${pixel.y}`;
    })
    .join(' ');
});

// 计算起点位置
const startPoint = computed(() => {
  if (!props.track || props.track.trackPoints.length === 0) return null;
  const point = props.track.trackPoints[0];
  return latLngToPixel(point.location.latitude, point.location.longitude);
});

// 计算终点位置
const endPoint = computed(() => {
  if (!props.track || props.track.trackPoints.length === 0) return null;
  const point = props.track.trackPoints[props.track.trackPoints.length - 1];
  return latLngToPixel(point.location.latitude, point.location.longitude);
});

// 计算当前位置
const currentPoint = computed(() => {
  // 只有在回放进度大于0时才显示当前位置
  if (!props.track || props.track.trackPoints.length === 0 || props.playbackProgress <= 0) return null;

  const currentIndex = Math.floor((props.playbackProgress / 100) * (props.track.trackPoints.length - 1));
  if (currentIndex >= props.track.trackPoints.length) return null;

  const point = props.track.trackPoints[currentIndex];
  return latLngToPixel(point.location.latitude, point.location.longitude);
});

// 计算关键节点位置
const keyPoints = computed(() => {
  if (!props.track || !props.showKeyPoints) return [];

  return props.track.trackPoints
    .filter(point => point.isKeyPoint)
    .map(point => latLngToPixel(point.location.latitude, point.location.longitude));
});

// 地图控制方法
const zoomIn = () => {
  zoom.value = Math.min(zoom.value * 1.2, 3);
};

const zoomOut = () => {
  zoom.value = Math.max(zoom.value / 1.2, 0.5);
};

const resetView = () => {
  zoom.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
};

// 更新地图尺寸
const updateMapSize = () => {
  if (!mapContainer.value) return;

  const rect = mapContainer.value.getBoundingClientRect();
  mapWidth.value = Math.max(400, rect.width);
  mapHeight.value = Math.max(300, rect.height);
};

// 监听轨迹变化
watch(() => props.track, () => {
  resetView();
}, { immediate: true });

onMounted(() => {
  updateMapSize();
  window.addEventListener('resize', updateMapSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateMapSize);
});
</script>

<style scoped>
.track-map {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: visible;
  border: 1px solid #e0e0e0;
}

.map-content {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.track-display {
  width: 100%;
  height: 100%;
  position: relative;
}

.track-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.no-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
}

.no-track p {
  margin: 12px 0 0 0;
  font-size: 14px;
}

.map-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-legend {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  max-width: 120px;
  min-width: 100px;
  white-space: nowrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  color: #333;
  font-size: 12px;
  line-height: 1.2;
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
</style>
