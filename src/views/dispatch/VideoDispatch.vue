<template>
  <div class="video-dispatch-container large-screen-container">
    <el-row :gutter="24">
      <!-- 左侧设备选择区 -->
      <el-col :span="6">
        <!-- 设备列表卡片 -->
        <el-card class="device-list-card large-screen-card">
          <template #header>
            <div class="device-list-header">
              <h3 class="section-title large-screen-text-primary">设备列表</h3>
              <div class="device-search">
                <el-input v-model="deviceSearch" placeholder="搜索设备" clearable :prefix-icon="Search" size="small" />
              </div>
              <div class="device-filter">
                <el-radio-group v-model="statusFilter" class="device-filter-group" size="small">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="online">在线</el-radio-button>
                  <el-radio-button label="offline">离线</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <el-scrollbar class="device-tree-container">
            <el-tree
              :data="filteredDeviceTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              highlight-current
              default-expand-all
              :filter-node-method="filterNode"
              :expand-on-click-node="false"
              :default-expanded-keys="expandedKeys"
              @node-click="handleDeviceClick"
              @current-change="handleCurrentChange"
            >
              <template #default="{ data, node }">
                <div class="device-item" :class="{ 'selected': currentDevice && currentDevice.id === data.id, 'category-node': node.isLeaf === false }">
                  <template v-if="node.isLeaf === false">
                    <span class="device-group-title">{{ data.name }}</span>
                  </template>
                  <template v-else>
                    <div class="device-info" :class="{ 'device-offline': data.status === 'offline' }">
                      <div class="device-status-indicator">
                        <div class="status-dot large-screen-status-dot" :class="data.status"></div>
                        <span class="device-name-text large-screen-text-secondary" v-html="highlightKeyword(data.name)"></span>
                      </div>
                      <div class="device-actions">
                        <el-button
                          v-if="!isInView(data)"
                          type="primary"
                          class="large-screen-button"
                          :icon="Plus"
                          :disabled="data.status === 'offline'"
                          @click.stop="addToView(data)"
                        >添加</el-button>
                        <el-button
                          v-else
                          type="danger"
                          class="large-screen-button"
                          :icon="Minus"
                          @click.stop="removeFromView(data)"
                        >移除</el-button>
                      </div>
                    </div>
                  </template>
                </div>
              </template>
            </el-tree>
          </el-scrollbar>
        </el-card>
          
        <!-- 云台控制卡片，与设备列表同级 -->
        <el-card class="ptz-control-card large-screen-card" :class="{ 'ptz-disabled': !canControlCurrentDevice }">
          <template #header>
            <div class="card-header">
              <span class="section-title large-screen-text-primary">云台控制</span>
              <span class="device-name large-screen-text-info">
                {{ activeStream?.name || '未选择设备' }}
                <el-tag v-if="activeStream && !canControlCurrentDevice" type="info" size="small" style="margin-left: 8px;">
                  不支持云台控制
                </el-tag>
              </span>
            </div>
          </template>
          <div class="ptz-control-content">
            <div class="ptz-joystick">
              <!-- 优化云台控制按钮排布 -->
              <div class="ptz-direction-grid">
                <el-button class="ptz-btn upleft large-screen-button" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('upleft', activeStream)">
                  <el-icon><TopLeft /></el-icon>
                </el-button>
                <el-button class="ptz-btn up large-screen-button" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('up', activeStream)">
                  <el-icon><ArrowUp /></el-icon>
                </el-button>
                <el-button class="ptz-btn upright large-screen-button" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('upright', activeStream)">
                  <el-icon><TopRight /></el-icon>
                </el-button>
                <el-button class="ptz-btn left large-screen-button" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('left', activeStream)">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <el-button class="ptz-btn center large-screen-button" type="primary" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('reset', activeStream)">
                  <el-icon><Refresh /></el-icon>
                </el-button>
                <el-button class="ptz-btn right large-screen-button" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('right', activeStream)">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
                <el-button class="ptz-btn downleft large-screen-button" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('downleft', activeStream)">
                  <el-icon><BottomLeft /></el-icon>
                </el-button>
                <el-button class="ptz-btn down large-screen-button" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('down', activeStream)">
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <el-button class="ptz-btn downright large-screen-button" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('downright', activeStream)">
                  <el-icon><BottomRight /></el-icon>
                </el-button>
              </div>
            </div>
            
            <div class="ptz-controls-container">
              <div class="ptz-slider-row">
                <span class="ptz-label large-screen-text-primary">云台速度：</span>
                <el-slider
                  :model-value="getPtzSpeed(activeStream?.id)"
                  @update:model-value="updatePtzSpeed(activeStream?.id, $event)"
                  :min="1"
                  :max="10"
                  :disabled="!canControlCurrentDevice"
                  style="width: 120px;"
                />
                <span class="ptz-speed-value large-screen-text-info">{{ getPtzSpeed(activeStream?.id) }}</span>
              </div>

              <div class="ptz-buttons-group">
                <div class="ptz-focus-row">
                  <span class="ptz-label large-screen-text-primary">调焦：</span>
                  <div class="ptz-buttons">
                    <el-button class="ptz-func-btn large-screen-button" type="success" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('zoomIn', activeStream)">
                      <el-icon><Plus /></el-icon>
                    </el-button>
                    <el-button class="ptz-func-btn large-screen-button" type="warning" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('zoomOut', activeStream)">
                      <el-icon><Minus /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="ptz-focus-row">
                  <span class="ptz-label large-screen-text-primary">聚焦：</span>
                  <div class="ptz-buttons">
                    <el-button class="ptz-func-btn large-screen-button" type="success" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('focusIn', activeStream)">
                      <el-icon><Plus /></el-icon>
                    </el-button>
                    <el-button class="ptz-func-btn large-screen-button" type="warning" :disabled="!canControlCurrentDevice" @click.stop="ptzControl('focusOut', activeStream)">
                      <el-icon><Minus /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧多画面视频区 -->
      <el-col :span="18">
        <el-card class="video-content-card large-screen-card">
          <template #header>
            <div class="video-header">
              <h3 class="section-title large-screen-text-primary">视频调度</h3>
              <div class="video-toolbar">
                <el-form :inline="true" :model="searchForm" class="video-search-form">
                  <el-form-item label="视图布局" class="large-screen-text-primary">
                    <el-radio-group v-model="viewMode" class="view-mode-group">
                      <el-radio-button label="1">单画面</el-radio-button>
                      <el-radio-button label="4">四画面</el-radio-button>
                      <el-radio-button label="9">九画面</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </template>
          
          <div class="video-grid-container">
            <div class="video-grid" :class="'view-' + viewMode">
              <div
                v-for="(stream, idx) in currentStreams"
                :key="stream.id"
                class="video-cell"
                :class="{ active: idx === activeIndex, fullscreen: fullscreenIndex === idx }"
                @click="setActiveStream(idx)"
                @contextmenu.prevent="openContextMenu($event, idx)"
                @dblclick="toggleFullscreen(idx)"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent
                @drop="onDrop(idx)"
              >
                <div class="video-controls">
                  <div class="video-title">{{ stream.name }}</div>
                  <div class="video-actions">
                    <el-button circle size="small" @click.stop="toggleFullscreen(idx)"><el-icon><FullScreen /></el-icon></el-button>
                    <el-button circle size="small" type="danger" @click.stop="removeFromView(stream)"><el-icon><Close /></el-icon></el-button>
                  </div>
                </div>
                <div class="video-player">
                  <video :src="stream.url" controls autoplay muted style="width: 100%; height: 100%; object-fit: cover; background: #000;" />
                </div>
                <div class="video-status-bar">
                  <el-tag size="small" :type="stream.status === 'online' ? 'success' : 'info'">{{ stream.status === 'online' ? '在线' : '离线' }}</el-tag>
                  <span v-if="stream.type === 'ptz' || stream.type === 'deploy_ball'" class="ptz-indicator">
                    <el-icon><VideoCamera /></el-icon>
                    <span>支持云台控制</span>
                  </span>
                </div>
              </div>
              
              <!-- 空画面占位 -->
              <div
                v-for="n in emptySlots"
                :key="'empty-' + n"
                class="video-cell empty-cell"
              >
                <div class="empty-tip">
                  <el-icon :size="36" style="opacity: 0.4;"><VideoCamera /></el-icon>
                  <div>未添加设备</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 右键菜单 -->
    <el-dropdown v-if="contextMenu.visible" :style="contextMenuStyle" trigger="manual" @command="handleContextMenuCommand">
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="fullscreen">全屏</el-dropdown-item>
        <el-dropdown-item command="close">关闭</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  TopRight, TopLeft, BottomRight, BottomLeft, 
  Plus, Minus, Refresh, Search, FullScreen, Close,
  VideoCamera, Setting
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const deviceSearch = ref('');
const statusFilter = ref('all');
const viewMode = ref<'1' | '4' | '9'>('4');
const activeIndex = ref(0);
const fullscreenIndex = ref(-1);
const searchForm = reactive({});
const expandedKeys = ref(['g1', 'g2', 'g3']);
const ptzSpeeds = ref<Record<string, number>>({});
const currentDevice = ref<any>(null);

// 设备树数据（可分组）
const deviceTree = [
  {
    id: 'g1',
    name: '执法仪',
    children: [
      { id: '1', name: '执法仪#A01', type: 'body_camera', status: 'online', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: '4', name: '执法仪#A02', type: 'body_camera', status: 'offline', url: 'https://www.w3schools.com/html/movie.mp4' },
      { id: '6', name: '执法仪#A03', type: 'body_camera', status: 'online', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
    ]
  },
  {
    id: 'g2',
    name: '布控球',
    children: [
      { id: '2', name: '布控球#B01', type: 'deploy_ball', status: 'online', url: 'https://www.w3schools.com/html/movie.mp4' },
      { id: '5', name: '布控球#B02', type: 'deploy_ball', status: 'online', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: '7', name: '布控球#B03', type: 'deploy_ball', status: 'offline', url: 'https://www.w3schools.com/html/movie.mp4' }
    ]
  },
  {
    id: 'g3',
    name: '光电云台',
    children: [
      { id: '3', name: '光电云台#C01', type: 'ptz', status: 'online', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: '8', name: '光电云台#C02', type: 'ptz', status: 'online', url: 'https://www.w3schools.com/html/movie.mp4' }
    ]
  }
];

// 展示区已选设备流
const selectedStreams = ref<any[]>([]);
const dragIndex = ref(-1);

const allDevicesFlat = computed(() => deviceTree.flatMap(g => g.children));

function isInView(device: any) {
  return selectedStreams.value.some(s => s.id === device.id);
}

function addToView(device: any) {
  // 检查设备是否在线
  if (device.status === 'offline') {
    ElMessage({
      message: '离线设备无法添加到监控视图',
      type: 'warning'
    });
    return;
  }

  if (!isInView(device) && selectedStreams.value.length < parseInt(viewMode.value)) {
    selectedStreams.value.push(device);
    // 设置默认的云台速度
    if (device.type === 'ptz' || device.type === 'deploy_ball') {
      ptzSpeeds.value[device.id] = 5;
    }
    // 自动选中新添加的设备
    nextTick(() => {
      const newIndex = selectedStreams.value.length - 1;
      setActiveStream(newIndex);
    });
  } else if (selectedStreams.value.length >= parseInt(viewMode.value)) {
    ElMessage({
      message: `当前布局最多显示${viewMode.value}个视频，请先移除其他设备或更改布局`,
      type: 'warning'
    });
  }
}

function removeFromView(device: any) {
  const idx = selectedStreams.value.findIndex(s => s.id === device.id);
  if (idx !== -1) {
    selectedStreams.value.splice(idx, 1);

    // 调整当前活跃索引
    if (activeIndex.value >= selectedStreams.value.length) {
      const newIndex = Math.max(0, selectedStreams.value.length - 1);
      if (selectedStreams.value.length > 0) {
        setActiveStream(newIndex);
      } else {
        activeIndex.value = 0;
      }
    } else if (selectedStreams.value.length > 0) {
      // 如果当前索引仍然有效，重新设置活动流
      setActiveStream(activeIndex.value);
    }
  }
}

const currentStreams = computed(() => {
  // 保证数量与viewMode一致
  return selectedStreams.value.slice(0, parseInt(viewMode.value));
});

const emptySlots = computed(() => {
  return Array.from({ length: parseInt(viewMode.value) - currentStreams.value.length }, (_, i) => i + 1);
});

const activeStream = computed(() => currentStreams.value[activeIndex.value] || null);

function handleDeviceClick(data: any, node: any) {
  // 只有叶子节点且设备在线才可添加
  if (node.isLeaf && !isInView(data) && data.status === 'online') {
    addToView(data);
  } else if (node.isLeaf && data.status === 'offline') {
    ElMessage({
      message: '离线设备无法添加到监控视图',
      type: 'warning'
    });
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'online': return '在线';
    case 'offline': return '离线';
    default: return '--';
  }
}

function getStatusTagType(status: string) {
  switch (status) {
    case 'online': return 'success';
    case 'offline': return 'info';
    default: return 'info';
  }
}

// 设备树过滤
const filteredDeviceTree = computed(() => {
  function filterGroup(group: any) {
    const children = group.children.filter((d: any) => {
      const matchStatus = statusFilter.value === 'all' || d.status === statusFilter.value;
      const matchKeyword = !deviceSearch.value || d.name.toLowerCase().includes(deviceSearch.value.toLowerCase());
      return matchStatus && matchKeyword;
    });
    // 只有当有匹配的子设备时才显示分组
    if (children.length > 0) {
      return { ...group, children };
    }
    return null;
  }
  return deviceTree.map(filterGroup).filter(Boolean);
});

function filterNode(value: string, data: any) {
  if (!value) return true;
  return data.name.toLowerCase().includes(value.toLowerCase());
}

function highlightKeyword(name: string) {
  if (!deviceSearch.value) return name;
  const regex = new RegExp(`(${deviceSearch.value})`, 'gi');
  return name.replace(regex, '<span style="color:#409EFF;font-weight:bold;">$1</span>');
}

// 拖拽排序
function onDragStart(idx: number) {
  dragIndex.value = idx;
}

function onDrop(idx: number) {
  if (dragIndex.value === -1 || dragIndex.value === idx) return;
  
  const arr = [...selectedStreams.value];
  const [moved] = arr.splice(dragIndex.value, 1);
  arr.splice(idx, 0, moved);
  
  selectedStreams.value = arr;
  activeIndex.value = idx;
  dragIndex.value = -1;
}

// 右键菜单
const contextMenu = reactive({ visible: false, x: 0, y: 0, idx: -1 });

function openContextMenu(e: MouseEvent, idx: number) {
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.idx = idx;
  
  nextTick(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
  });
}

function closeContextMenu() {
  contextMenu.visible = false;
}

const contextMenuStyle = computed(() => ({ position: 'fixed', left: contextMenu.x + 'px', top: contextMenu.y + 'px', zIndex: 9999 }));

const canControlPtz = computed(() => {
  if (contextMenu.idx < 0 || contextMenu.idx >= currentStreams.value.length) return false;
  const stream = currentStreams.value[contextMenu.idx];
  return stream && (stream.type === 'ptz' || stream.type === 'deploy_ball');
});

function handleContextMenuCommand(cmd: string) {
  if (cmd === 'fullscreen') toggleFullscreen(contextMenu.idx);
  if (cmd === 'close' && contextMenu.idx >= 0) removeFromView(currentStreams.value[contextMenu.idx]);
  closeContextMenu();
}

function toggleFullscreen(idx: number) {
  fullscreenIndex.value = fullscreenIndex.value === idx ? -1 : idx;
}

function handleCurrentChange(data: any, node: any) {
  if (data && node.isLeaf) currentDevice.value = data;
}

// 添加视图布局改变处理
function handleViewModeChange() {
  // 如果当前活跃索引超过了新布局可容纳的数量，调整它
  if (activeIndex.value >= parseInt(viewMode.value)) {
    const newIndex = Math.max(0, parseInt(viewMode.value) - 1);
    if (currentStreams.value.length > 0) {
      setActiveStream(newIndex);
    } else {
      activeIndex.value = newIndex;
    }
  } else if (currentStreams.value.length > 0) {
    // 重新设置当前活动流
    setActiveStream(activeIndex.value);
  }

  // 确保全屏状态被退出
  fullscreenIndex.value = -1;
}

// 监听视图模式变化
watch(viewMode, () => {
  handleViewModeChange();
});

// 云台控制相关函数
function togglePtzControl(idx: number) {
  // This function is no longer used
}

function getPtzSpeed(id: string): number {
  return ptzSpeeds.value[id] || 5;
}

function updatePtzSpeed(id: string, value: number) {
  ptzSpeeds.value[id] = value;
}

// 云台控制
function ptzControl(cmd: string, device: any) {
  if (!device) return;
  
  // 实际项目中，这里应该调用云台控制API
  console.log('云台控制:', cmd, '设备:', device.name, '速度:', ptzSpeeds.value[device.id] || 5);
  
  // 模拟控制成功的提示
  ElMessage({
    message: `控制 ${device.name} ${cmd} 成功`,
    type: 'success',
    duration: 1000
  });
}

// 设置当前活动的视频流
function setActiveStream(idx: number) {
  activeIndex.value = idx;
  // 云台控制面板始终显示，但根据设备类型启用/禁用控制
}

// 判断当前设备是否支持云台控制
const canControlCurrentDevice = computed(() => {
  const stream = activeStream.value;
  return stream && (stream.type === 'ptz' || stream.type === 'deploy_ball');
});

// 默认选中第一个设备
onMounted(() => {
  // 预先添加一些设备到视图中作为演示
  const firstDevice = deviceTree.flatMap(g => g.children).find(d => d.type === 'ptz');
  const secondDevice = deviceTree.flatMap(g => g.children).find(d => d.type === 'deploy_ball');

  if (firstDevice) {
    addToView(firstDevice);
  }

  if (secondDevice) {
    addToView(secondDevice);
  }

  // 初始化云台速度
  selectedStreams.value.forEach(stream => {
    if (stream.type === 'ptz' || stream.type === 'deploy_ball') {
      ptzSpeeds.value[stream.id] = 5;
    }
  });

  // 模拟设备状态变化
  setInterval(() => {
    deviceTree.forEach(g => g.children.forEach(d => {
      if (Math.random() < 0.05) d.status = d.status === 'online' ? 'offline' : 'online';
    }));
  }, 8000);
});
</script>

<style scoped>
.video-dispatch-container {
  padding: 20px;
  height: calc(100vh - var(--header-height) - 40px); /* 使用相对高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-row) {
  flex: 1;
  height: 100%; /* 使用100%而不是vh */
  min-height: 0; /* 确保flex子项可以收缩 */
}

:deep(.el-col) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 通用卡片样式 */
:deep(.el-card) {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;
  overflow: hidden;
  margin-bottom: 16px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
  background: #fafafa;
  flex-shrink: 0;
}

:deep(.el-card__body) {
  padding: 16px;
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

/* 左侧设备列表卡片 */
.device-list-card {
  height: 55%; /* 减少高度以适应总体布局 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 16px;
}

.device-list-header {
  display: flex;
  flex-direction: column;
  gap: 8px; /* 减少间距从12px到8px */
}

.section-title {
  margin: 0 0 4px 0; /* 减少底部边距从8px到4px */
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: #409EFF;
  border-radius: 2px;
}

.device-search {
  margin-bottom: 4px; /* 减少底部边距从8px到4px */
}

.device-tree-container {
  flex: 1;
  height: 0; /* 重要：确保滚动正常工作 */
  min-height: 0;
  margin-bottom: 0;
  border-radius: 8px;
  background: #f9f9f9;
  overflow-y: auto;
}

/* 设备树样式 */
.device-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  margin: 2px 0;
}

.device-item:not(.category-node):hover {
  background: #f0f7ff;
}

.device-item.selected:not(.category-node) {
  background: #e6f1fc;
  border-left: 3px solid #409EFF;
}

.category-node {
  padding: 12px 8px 8px;
}

.device-group-title {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
  margin-left: 2px;
}

.device-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.device-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 2px;
}

.status-dot.online {
  background: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.status-dot.offline {
  background: #909399;
  box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.2);
}

.device-actions {
  display: flex;
  gap: 6px;
}

/* 离线设备样式 */
.device-info.device-offline {
  opacity: 0.6;
}

.device-info.device-offline .device-name-text {
  color: #c0c4cc !important;
}

.device-info.device-offline .status-dot {
  opacity: 0.8;
}

:deep(.el-button) {
  border-radius: 20px;
}

:deep(.el-button--small) {
  padding: 8px 15px;
  font-size: 12px;
}

/* 云台控制卡片 */
.ptz-control-card {
  background: #f7fafd;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 0;
  height: calc(45% - 16px); /* 保持当前高度，总计100% */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 隐藏溢出内容 */
  transition: all 0.3s ease;
}

/* 云台控制禁用状态 */
.ptz-control-card.ptz-disabled {
  background: #f8f9fa;
  opacity: 0.7;
}

.ptz-control-card.ptz-disabled .card-header .section-title {
  color: #909399 !important;
}

.ptz-control-card.ptz-disabled .device-name {
  color: #c0c4cc !important;
}

:deep(.ptz-control-card .el-card__body) {
  padding: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.device-name {
  color: #606266;
  font-size: 14px;
  background: #ecf5ff;
  padding: 2px 10px;
  border-radius: 12px;
}

.ptz-control-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0; /* 减少内边距 */
  overflow: hidden; /* 隐藏溢出内容 */
  flex: 1;
  gap: 6px; /* 减少间距 */
}

.ptz-joystick {
  width: 100%;
  margin-bottom: 4px; /* 进一步减少底部间距 */
  padding: 0 10px;
}

.ptz-direction-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px; /* 减少间距 */
  width: 100%;
  max-width: 160px; /* 减小整体尺寸 */
  aspect-ratio: 1/1;
  margin: 0 auto;
}

.ptz-btn {
  width: 100%;
  height: 100%;
  min-height: 26px; /* 减小最小高度 */
  background: #fff;
  color: #409EFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e6ed;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px; /* 减小圆角 */
  padding: 0;
  margin: 0;
}

.ptz-btn:hover, .ptz-btn:focus {
  background: #ecf5ff;
  color: #409EFF;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.ptz-btn.center {
  background: #ecf5ff;
  color: #409EFF;
  border-color: #a0cfff;
}

.ptz-controls-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.ptz-buttons-group {
  display: flex;
  flex-direction: row;
  gap: 6px; /* 减少间距 */
  width: 100%;
  margin-top: 4px; /* 添加顶部间距 */
}

.ptz-slider-row {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 4px; /* 减少底部间距 */
  background: rgba(64, 158, 255, 0.03);
  padding: 4px 6px; /* 减少内边距 */
  border-radius: 6px;
  min-height: 28px; /* 设置最小高度 */
}

.ptz-label {
  font-size: 13px;
  color: #606266;
  margin-right: 6px;
  min-width: 56px;
}

.ptz-speed-value {
  color: #409EFF;
  font-weight: 600;
  margin-left: 6px;
  min-width: 16px;
  font-size: 13px;
}

.ptz-focus-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(64, 158, 255, 0.03);
  padding: 4px 6px; /* 减少内边距 */
  border-radius: 6px;
  width: 48%;
  min-height: 32px; /* 设置最小高度 */
}

.ptz-buttons {
  display: flex;
  gap: 10px;
}

.ptz-func-btn {
  margin: 0;
  background: #fff;
  color: #409EFF;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  width: 24px; /* 减小按钮尺寸 */
  height: 24px;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 12px; /* 减小图标尺寸 */
}

.ptz-func-btn:hover, .ptz-func-btn:focus {
  background: #ecf5ff;
  color: #409EFF;
  transform: scale(1.05);
}

/* 右侧视频区域 */
.video-content-card {
  height: 100%; /* 使用100%高度，与容器高度一致 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.video-toolbar {
  display: flex;
  align-items: center;
}

.video-search-form {
  margin: 0;
  padding: 0;
}

.video-grid-container {
  flex: 1;
  height: 100%;
  display: flex;
  overflow: hidden; /* 禁用滚动条，让视频网格自己处理 */
  min-height: 0; /* 确保弹性盒子正确计算高度 */
}

.video-grid {
  display: grid;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.video-grid.view-1 { 
  grid-template-columns: 1fr; 
}

.video-grid.view-4 { 
  grid-template-columns: 1fr 1fr; 
  grid-template-rows: 1fr 1fr; 
}

.video-grid.view-9 { 
  grid-template-columns: 1fr 1fr 1fr; 
  grid-template-rows: 1fr 1fr 1fr; 
}

.video-cell {
  background: #222;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 220px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-cell.active {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.video-cell.fullscreen {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  z-index: 9999;
  width: 100vw;
  height: 100vh;
  margin: 0;
  border-radius: 0;
  background: #000;
  border: none;
}

.video-cell.empty-cell {
  background: #f5f7fa;
  border: 2px dashed #dcdfe6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #909399;
  font-size: 14px;
}

.video-controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
  z-index: 2;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.video-cell:hover .video-controls {
  opacity: 1;
}

.video-title {
  color: #fff;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.video-actions {
  display: flex;
  gap: 8px;
}

.video-actions .el-button {
  padding: 6px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
}

.video-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.4);
}

.video-player {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
}

/* 视频状态栏 */
.video-status-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
  z-index: 2;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.video-cell:hover .video-status-bar {
  opacity: 1;
}

.ptz-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-size: 12px;
}

.ptz-indicator .el-icon {
  color: #409EFF;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 2px 0;
}

:deep(.el-tree-node__children) {
  padding-left: 18px;
}

:deep(.el-slider__runway) {
  margin: 8px 0;
  background-color: rgba(64, 158, 255, 0.1);
}

:deep(.el-slider__bar) {
  background-color: #409EFF;
  height: 4px;
}

:deep(.el-slider__button) {
  border-color: #409EFF;
  width: 12px;
  height: 12px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .device-list-card {
    height: 50%; /* 在小屏幕下进一步减少设备列表高度 */
  }

  .ptz-control-card {
    height: calc(50% - 16px); /* 相应调整云台控制高度 */
  }
}

/* 视频调度模块按钮悬浮效果优化 */
/* 设备过滤按钮组样式 */
.device-filter-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: #ffffff;
}

.device-filter-group :deep(.el-radio-button) {
  margin: 0;
  border: none;
}

.device-filter-group :deep(.el-radio-button__inner) {
  border: none;
  border-radius: 0;
  background: #ffffff;
  color: #606266;
  padding: 8px 16px; /* 减少内边距从12px 20px到8px 16px */
  font-weight: 500;
  font-size: 13px; /* 减少字体大小从14px到13px */
  transition: all 0.25s ease;
  position: relative;
  min-width: 50px; /* 减少最小宽度从60px到50px */
  text-align: center;
}

/* 未激活状态的悬浮效果 */
.device-filter-group :deep(.el-radio-button:not(.is-active) .el-radio-button__inner):hover {
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f1fc 100%);
  color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

/* 激活状态样式 */
.device-filter-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #409EFF 0%, #5dade2 100%);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

/* 激活状态的悬浮效果 */
.device-filter-group :deep(.el-radio-button.is-active .el-radio-button__inner):hover {
  background: linear-gradient(135deg, #337ecc 0%, #4a90d9 100%);
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

/* 按钮间分隔线 */
.device-filter-group :deep(.el-radio-button:not(:last-child) .el-radio-button__inner)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 1px;
  background: rgba(0, 0, 0, 0.08);
  transition: opacity 0.25s ease;
}

.device-filter-group :deep(.el-radio-button:hover .el-radio-button__inner)::after,
.device-filter-group :deep(.el-radio-button.is-active .el-radio-button__inner)::after {
  opacity: 0;
}

/* 视图模式按钮组样式 */
.view-mode-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: #ffffff;
}

.view-mode-group :deep(.el-radio-button) {
  margin: 0;
  border: none;
}

.view-mode-group :deep(.el-radio-button__inner) {
  border: none;
  border-radius: 0;
  background: #ffffff;
  color: #606266;
  padding: 12px 18px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.25s ease;
  position: relative;
  min-width: 70px;
  text-align: center;
}

/* 未激活状态的悬浮效果 */
.view-mode-group :deep(.el-radio-button:not(.is-active) .el-radio-button__inner):hover {
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f1fc 100%);
  color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

/* 激活状态样式 */
.view-mode-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #409EFF 0%, #5dade2 100%);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

/* 激活状态的悬浮效果 */
.view-mode-group :deep(.el-radio-button.is-active .el-radio-button__inner):hover {
  background: linear-gradient(135deg, #337ecc 0%, #4a90d9 100%);
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

/* 按钮间分隔线 */
.view-mode-group :deep(.el-radio-button:not(:last-child) .el-radio-button__inner)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 1px;
  background: rgba(0, 0, 0, 0.08);
  transition: opacity 0.25s ease;
}

.view-mode-group :deep(.el-radio-button:hover .el-radio-button__inner)::after,
.view-mode-group :deep(.el-radio-button.is-active .el-radio-button__inner)::after {
  opacity: 0;
}

/* 按钮组整体悬浮效果 */
.device-filter:hover .device-filter-group,
.video-toolbar:hover .view-mode-group {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* 点击效果 */
.device-filter-group :deep(.el-radio-button__inner):active,
.view-mode-group :deep(.el-radio-button__inner):active {
  transform: translateY(0) !important;
  transition: transform 0.1s ease;
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .device-filter-group :deep(.el-radio-button__inner),
  .view-mode-group :deep(.el-radio-button__inner) {
    padding: 6px 12px; /* 进一步减少内边距 */
    font-size: 12px; /* 减少字体大小 */
    min-width: 45px; /* 减少最小宽度 */
  }

  .device-list-header {
    gap: 6px; /* 在小屏幕下进一步减少间距 */
  }

  .section-title {
    margin: 0 0 2px 0; /* 进一步减少标题底部边距 */
    font-size: 16px; /* 减少标题字体大小 */
  }
}
</style>