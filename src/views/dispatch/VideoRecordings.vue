<template>
  <div class="video-recordings-container large-screen-container">
    <el-row :gutter="32" class="main-row">
      <!-- 左侧：录像查询+列表+详情 -->
      <el-col :span="8" class="left-column">
        <el-card class="search-card large-screen-card">
          <template #header>
            <div class="card-header">
              <span class="section-title large-screen-text-primary">录像查询</span>
            </div>
          </template>
          <el-form :inline="false" :model="searchForm" class="search-form" label-width="90px">
            <el-form-item label="设备类型" class="large-screen-text-primary">
              <el-select v-model="searchForm.deviceType" placeholder="全部类型" style="width: 100%">
                <el-option label="全部" value="" />
                <el-option label="执法仪" value="body_camera" />
                <el-option label="布控球" value="deploy_ball" />
                <el-option label="光电云台" value="ptz" />
              </el-select>
            </el-form-item>
            <el-form-item label="设备" class="large-screen-text-primary">
              <el-select v-model="searchForm.deviceId" placeholder="全部设备" style="width: 100%">
                <el-option label="全部" value="" />
                <el-option v-for="d in deviceList" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="录像时间" class="large-screen-text-primary">
              <el-date-picker
                v-model="searchForm.datetimeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
            <el-form-item>
              <div class="form-buttons">
                <el-button type="primary" class="large-screen-button" @click="handleSearch">
                  <el-icon><Search /></el-icon>查询
                </el-button>
                <el-button class="large-screen-button" @click="handleReset">
                  <el-icon><Refresh /></el-icon>重置
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
        <el-card class="table-card large-screen-card">
          <template #header>
            <div class="card-header">
              <span class="section-title large-screen-text-primary">录像列表</span>
              <div class="header-actions">
                <el-button class="large-screen-button" @click="handleSearch">
                  <el-icon><Refresh /></el-icon>刷新
                </el-button>
                <el-button type="success" class="large-screen-button" @click="handleExport">
                  <el-icon><Download /></el-icon>导出
                </el-button>
              </div>
            </div>
          </template>
          <el-table
            :data="filteredRecordings"
            style="width: 100%;"
            border
            class="large-screen-table"
            @row-click="handleSelect"
            height="280"
            :row-class-name="tableRowClassName"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="deviceName" label="设备" min-width="120" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="scope">
                <el-tag :type="getDeviceTagType(scope.row.type)" class="large-screen-tag">{{ getDeviceTypeLabel(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" min-width="140">
              <template #default="scope">
                {{ formatDate(scope.row.startTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="时长" width="70">
              <template #default="scope">
                {{ formatDuration(scope.row.duration) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="scope">
                <div class="table-ops">
                  <el-button
                    type="primary"
                    class="large-screen-button table-action-btn"
                    @click.stop="handlePlay(scope.row)"
                    circle
                  >
                    <el-icon><VideoPlay /></el-icon>
                  </el-button>
                  <el-button
                    type="success"
                    class="large-screen-button table-action-btn"
                    @click.stop="handleDownload(scope.row)"
                    circle
                  >
                    <el-icon><Download /></el-icon>
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="10"
              :page-sizes="[10, 20, 30]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalRecordings"
              @current-change="handleCurrentChange"
              @size-change="handleSizeChange"
            />
          </div>
        </el-card>

        <!-- 录像详情卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span class="section-title">录像详情</span>
              <div class="header-actions" v-if="selectedRecording && selectedRecording.url">
                <el-button size="small" type="success" @click="handleDownload(selectedRecording)">
                  <el-icon><Download /></el-icon>下载录像
                </el-button>
              </div>
            </div>
          </template>

          <!-- 有选中录像时显示详情 -->
          <div v-if="selectedRecording && selectedRecording.url">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="设备名称">{{ selectedRecording.deviceName }}</el-descriptions-item>
                  <el-descriptions-item label="设备类型">{{ getDeviceTypeLabel(selectedRecording.type) }}</el-descriptions-item>
                  <el-descriptions-item label="录像时长">{{ formatDuration(selectedRecording.duration) }}</el-descriptions-item>
                  <el-descriptions-item label="文件大小">{{ selectedRecording.size }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
              <el-col :span="12">
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="开始时间">{{ selectedRecording.startTime }}</el-descriptions-item>
                  <el-descriptions-item label="结束时间">{{ selectedRecording.endTime }}</el-descriptions-item>
                  <el-descriptions-item label="录像状态">
                    <el-tag type="success">正常</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="存储位置">本地存储</el-descriptions-item>
                </el-descriptions>
              </el-col>
            </el-row>
          </div>

          <!-- 未选中录像时显示空状态 -->
          <div v-else class="detail-empty">
            <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
            <p class="empty-text">请从录像列表中选择一条录像查看详情</p>
          </div>
        </el-card>
      </el-col>
      <!-- 右侧：录像回放 -->
      <el-col :span="16" class="right-column">
        <el-card class="playback-card large-screen-card">
          <template #header>
            <div class="card-header">
              <span class="section-title large-screen-text-primary">录像回放</span>
              <div class="header-actions">
                <el-button-group>
                  <el-button type="primary" class="large-screen-button" @click="handlePlay(selectedRecording)" :disabled="!selectedRecording.url">
                    <el-icon><VideoPlay /></el-icon>播放
                  </el-button>
                  <el-button type="danger" class="large-screen-button" @click="handleStopPlay" :disabled="!selectedRecording.url">
                    <el-icon><CircleClose /></el-icon>停止
                  </el-button>
                  <el-button class="large-screen-button" :disabled="!selectedRecording.url">
                    <el-icon><Refresh /></el-icon>重载
                  </el-button>
                  <el-button type="success" class="large-screen-button" @click="handleDownload(selectedRecording)" :disabled="!selectedRecording.url">
                    <el-icon><Download /></el-icon>下载
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </template>
          <div class="playback-area">
            <div v-if="selectedRecording.url" class="playback-info">
              <div class="playback-title large-screen-text-primary">
                <el-tag :type="getDeviceTagType(selectedRecording.type)" class="device-tag large-screen-tag">{{ getDeviceTypeLabel(selectedRecording.type) }}</el-tag>
                {{ selectedRecording.deviceName }}
              </div>
              <div class="playback-time">
                <el-icon><Calendar /></el-icon>
                {{ selectedRecording.startTime }} 
                <span v-if="selectedRecording.endTime">- {{ selectedRecording.endTime }}</span>
                <span class="duration-badge">{{ formatDuration(selectedRecording.duration) }}</span>
              </div>
            </div>
            
            <div class="video-container">
              <video 
                v-if="selectedRecording.url" 
                ref="videoRef" 
                :src="selectedRecording.url" 
                controls 
                class="video-player" 
              />
              <div v-else class="playback-empty">
                <el-icon :size="64"><VideoCamera /></el-icon>
                <span>未选择录像，请从左侧列表选择</span>
              </div>
            </div>
            
            <div class="playback-progress" v-if="selectedRecording.url">
              <div class="progress-info">
                <span class="progress-time current">{{ formatDuration(playbackProgress) }}</span>
                <el-slider 
                  v-model="playbackProgress" 
                  :min="0" 
                  :max="selectedRecording.duration || 0" 
                  :show-tooltip="false" 
                  :disabled="!selectedRecording.url" 
                />
                <span class="progress-time total">{{ formatDuration(selectedRecording.duration || 0) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {
  VideoPlay, VideoPause, Refresh, Download, CircleClose,
  Search, Calendar, VideoCamera, Document
} from '@element-plus/icons-vue';
import { ref as vueRef } from 'vue';
import { ElMessage } from 'element-plus';

const currentPage = ref(1);
const pageSize = ref(10);
const totalRecordings = ref(0);
const playDialogVisible = ref(false);
const playUrl = ref('');
const playbackProgress = ref(0);
const selectedRecording = ref<any>({});
const videoRef = vueRef<HTMLVideoElement | null>(null);

const searchForm = reactive({
  deviceType: '',
  deviceId: '',
  datetimeRange: [] as string[], // 合并的日期时间范围
});

const deviceList = [
  { id: '1', name: '执法仪#A01', type: 'body_camera' },
  { id: '2', name: '布控球#B01', type: 'deploy_ball' },
  { id: '3', name: '光电云台#C01', type: 'ptz' },
  { id: '4', name: '执法仪#A02', type: 'body_camera' },
  { id: '5', name: '布控球#B02', type: 'deploy_ball' }
];

const allRecordings = [
  {
    id: 'r1',
    deviceId: '1',
    deviceName: '执法仪#A01',
    type: 'body_camera',
    startTime: '2023-07-15 10:00',
    endTime: '2023-07-15 10:30',
    duration: 1800,
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    size: '186MB'
  },
  {
    id: 'r2',
    deviceId: '2',
    deviceName: '布控球#B01',
    type: 'deploy_ball',
    startTime: '2023-07-15 09:00',
    endTime: '2023-07-15 09:45',
    duration: 2700,
    url: 'https://www.w3schools.com/html/movie.mp4',
    size: '426MB'
  },
  {
    id: 'r3',
    deviceId: '3',
    deviceName: '光电云台#C01',
    type: 'ptz',
    startTime: '2023-07-14 14:00',
    endTime: '2023-07-14 14:20',
    duration: 1200,
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    size: '190MB'
  }
];

const filteredRecordings = computed(() => {
  let filtered = allRecordings;
  if (searchForm.deviceType) {
    filtered = filtered.filter(r => r.type === searchForm.deviceType);
  }
  if (searchForm.deviceId) {
    filtered = filtered.filter(r => r.deviceId === searchForm.deviceId);
  }
  if (searchForm.datetimeRange && searchForm.datetimeRange.length === 2) {
    const [start, end] = searchForm.datetimeRange;
    filtered = filtered.filter(r => {
      // 将录像的开始时间和结束时间转换为可比较的格式
      const recordingStart = new Date(r.startTime.replace(' ', 'T')).getTime();
      const recordingEnd = new Date(r.endTime.replace(' ', 'T')).getTime();
      const searchStart = new Date(start).getTime();
      const searchEnd = new Date(end).getTime();

      // 检查录像时间是否在搜索范围内
      return recordingStart >= searchStart && recordingEnd <= searchEnd;
    });
  }
  totalRecordings.value = filtered.length;
  return filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

const getDeviceTypeLabel = (type: string) => {
  switch (type) {
    case 'body_camera': return '执法仪';
    case 'deploy_ball': return '布控球';
    case 'ptz': return '光电云台';
    default: return '其他';
  }
};

const getDeviceTagType = (type: string) => {
  switch (type) {
    case 'body_camera': return 'success';
    case 'deploy_ball': return 'warning';
    case 'ptz': return 'info';
    default: return 'info';
  }
};

const formatDate = (date: string) => date;
const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
};

function tableRowClassName({row, rowIndex}: {row: any, rowIndex: number}) {
  if (selectedRecording.value && selectedRecording.value.id === row.id) {
    return 'selected-row';
  }
  return '';
}

function handleSearch() {
  currentPage.value = 1;
  ElMessage.success('查询成功');
}

function handleReset() {
  searchForm.deviceType = '';
  searchForm.deviceId = '';
  searchForm.datetimeRange = [];
  currentPage.value = 1;
  ElMessage.info('已重置查询条件');
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}

function handleCurrentChange(page: number) {
  currentPage.value = page;
}

function handlePlay(row: any) {
  if (!row || !row.url) return;
  
  playUrl.value = row.url;
  playDialogVisible.value = true;
  selectedRecording.value = row;
  playbackProgress.value = 0;
  
  // 等待DOM更新后播放视频
  setTimeout(() => {
    if (videoRef.value) {
      videoRef.value.play().catch(err => {
        console.error('视频播放失败:', err);
      });
    }
  }, 100);
}

function handleDownload(row: any) {
  if (!row || !row.url) return;
  window.open(row.url, '_blank');
  ElMessage.success(`正在下载: ${row.deviceName}`);
}

function handleExport() {
  ElMessage.success('录像列表已导出');
}

function handleSelect(row: any) {
  selectedRecording.value = row;
  playbackProgress.value = 0;
}

function handleStopPlay() {
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.currentTime = 0;
    playbackProgress.value = 0;
  }
}

// 更新进度条
onMounted(() => {
  setInterval(() => {
    if (videoRef.value && !videoRef.value.paused) {
      playbackProgress.value = Math.floor(videoRef.value.currentTime);
    }
  }, 1000);
});

// 监听视频播放进度
watch(playbackProgress, (newVal) => {
  if (videoRef.value && Math.abs(videoRef.value.currentTime - newVal) > 1) {
    videoRef.value.currentTime = newVal;
  }
});
</script>

<style scoped>
.video-recordings-container {
  padding: 20px;
  min-height: calc(100vh - var(--header-height) - 40px);
  max-height: calc(100vh - var(--header-height) - 40px);
  background: #f7fafd;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

/* 主行布局 */
.main-row {
  height: 100%;
  margin: 0 !important;
}

/* 左右列布局 */
.left-column, .right-column {
  height: calc(100vh - 140px); /* 设置固定高度与右侧播放区域一致 */
  display: flex;
  flex-direction: column;
}

.left-column {
  padding-right: 12px !important;
}

.right-column {
  padding-left: 12px !important;
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
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: #fafafa;
}

:deep(.el-card__body) {
  padding: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  margin: 0;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 搜索表单 */
.search-card {
  margin-bottom: 12px; /* 减少底部间距 */
  height: auto;
  min-height: 140px; /* 进一步减少最小高度 */
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 日期时间选择器样式优化 */
:deep(.search-form .el-date-editor) {
  width: 100% !important;
}

:deep(.search-form .el-date-editor .el-input__inner) {
  padding-left: 12px;
  padding-right: 12px;
}

:deep(.search-form .el-form-item) {
  margin-bottom: 8px;
}

:deep(.search-form .el-form-item__label) {
  padding: 0 8px 0 0;
  line-height: 32px;
}

:deep(.search-form .el-form-item__content) {
  line-height: 32px;
}

.form-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  width: 100%;
}

/* 确保按钮组的父容器也居中 */
:deep(.search-form .el-form-item:last-child .el-form-item__content) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

/* 确保查询和重置按钮完全居中 */
:deep(.search-form .el-form-item:last-child) {
  text-align: center;
}

/* 表格样式 */
.table-card {
  height: calc(35vh - 40px); /* 进一步减少表格高度 */
  margin-bottom: 12px; /* 减少底部间距 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.table-card .el-card__body) {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 表格在更窄容器中的样式优化 */
:deep(.table-card .el-table) {
  font-size: 13px; /* 稍微减小字体以适应更窄的空间 */
}

:deep(.table-card .el-table th) {
  padding: 8px 4px; /* 减少表头内边距 */
}

:deep(.table-card .el-table td) {
  padding: 8px 4px; /* 减少表格单元格内边距 */
}

:deep(.table-card .el-table) {
  flex: 1;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

:deep(.el-table__header) {
  background: #f5f7fa;
  line-height: 36px;
}

:deep(.el-table__row) {
  line-height: 36px;
}

:deep(.el-table__row.selected-row) {
  background-color: #ecf5ff;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.table-ops {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pagination-container {
  padding: 8px 12px;
  margin-top: 0;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
}

:deep(.el-pagination) {
  padding: 0;
  font-size: 12px;
  justify-content: flex-end;
}

/* 播放区域 */
.playback-card {
  height: calc(100vh - 140px); /* 增加播放区域高度 */
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  overflow: hidden;
}

:deep(.playback-card .el-card__body) {
  padding: 12px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.playback-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 0;
}

.playback-info {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.playback-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-tag {
  font-size: 12px;
  padding: 2px 6px;
}

.playback-time {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
}

.duration-badge {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.video-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 400px;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  max-height: calc(100vh - 400px);
}

.playback-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #909399;
  font-size: 16px;
  height: 100%;
  width: 100%;
  background: #f5f7fa;
}

.playback-progress {
  margin-top: 12px;
  padding: 0 8px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.progress-time {
  font-size: 14px;
  color: #606266;
  min-width: 50px;
}

.progress-time.current {
  text-align: right;
}

.progress-time.total {
  text-align: left;
}

:deep(.el-slider) {
  flex: 1;
  margin: 0;
}

:deep(.el-slider__runway.show-input) {
  margin-right: 0;
}

/* 详情卡片 */
.detail-card {
  flex: 1; /* 使用flex自动填充剩余空间 */
  min-height: 200px; /* 设置最小高度 */
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

:deep(.detail-card .el-card__body) {
  flex: 1;
  overflow: hidden; /* 移除滚动条，改为隐藏溢出内容 */
  display: flex;
  flex-direction: column;
  padding: 12px;
}

/* 详情描述样式优化 */
:deep(.detail-card .el-descriptions) {
  margin-bottom: 0;
}

:deep(.detail-card .el-descriptions__body) {
  background: #fafafa;
}

:deep(.detail-card .el-descriptions__label) {
  font-weight: 600;
  color: #606266;
  background: #f5f7fa !important;
  width: 80px; /* 固定标签宽度以适应更窄的容器 */
}

:deep(.detail-card .el-descriptions__content) {
  color: #303133;
}

/* 左侧容器宽度调整后的样式优化 */
:deep(.left-column .el-card__header) {
  padding: 10px 12px; /* 减少内边距 */
}

:deep(.left-column .el-card__body) {
  padding: 10px; /* 减少内边距 */
}

/* 录像详情空状态样式 */
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  min-height: 200px;
}

.detail-empty .empty-text {
  margin-top: 16px;
  font-size: 14px;
  color: #909399;
  line-height: 1.5;
}

:deep(.el-descriptions) {
  margin-bottom: 8px;
}

:deep(.el-descriptions__body) {
  background-color: #fafafa;
}

:deep(.el-descriptions__label) {
  width: 80px;
  padding: 6px 10px;
  background-color: #f5f7fa;
}

:deep(.el-descriptions__cell) {
  padding: 6px 10px;
}

.detail-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .video-recordings-container {
    padding: 16px;
    min-height: calc(100vh - var(--header-height) - 32px);
    max-height: calc(100vh - var(--header-height) - 32px);
  }

  .left-column, .right-column {
    height: calc(100vh - 180px);
  }

  .playback-card {
    height: calc(100vh - 180px);
  }

  .video-player {
    max-height: calc(100vh - 300px);
  }

  .table-card {
    height: calc(30vh - 40px);
  }

  .detail-card {
    height: calc(55vh - 80px);
  }
}

@media (max-width: 768px) {
  .video-recordings-container {
    padding: 12px;
    min-height: calc(100vh - var(--header-height) - 24px);
    max-height: calc(100vh - var(--header-height) - 24px);
  }

  .left-column, .right-column {
    height: calc(100vh - 160px);
  }

  .playback-card {
    height: calc(100vh - 160px);
  }

  .video-player {
    max-height: calc(100vh - 280px);
  }

  .table-card {
    height: calc(25vh - 30px);
  }

  .detail-card {
    height: calc(50vh - 60px);
  }
}
</style> 