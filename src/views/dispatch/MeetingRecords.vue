<template>
  <div class="meeting-records-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">会商记录</h1>
        <p class="page-description">查看和管理已结束的视频会商记录</p>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-left">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          size="default"
          @change="handleDateChange"
        />
        <el-input
          v-model="searchKeyword"
          placeholder="搜索会议主题或主持人"
          clearable
          size="default"
          style="width: 280px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="filter-right">
        <el-button type="primary" @click="exportRecords">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalRecords }}</div>
          <div class="stat-label">总会商数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon duration">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalDuration }}</div>
          <div class="stat-label">总时长(小时)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon participants">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalParticipants }}</div>
          <div class="stat-label">总参会人次</div>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">会商记录列表</span>
          </div>
        </template>

        <el-table
          :data="filteredRecords"
          class="data-table"
          stripe
          @row-click="viewMeetingDetail"
          v-loading="loading"
          element-loading-text="加载中..."
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="topic" label="会议主题" min-width="160" show-overflow-tooltip>
            <template #default="scope">
              <div class="topic-cell">
                <div class="topic-main">
                  <span class="topic-text">{{ scope.row.topic }}</span>
                  <el-tag v-if="scope.row.hasRecording" type="success" size="small" class="recording-tag">
                    <el-icon><VideoCamera /></el-icon>
                    有录像
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="host" label="主持人" width="120" align="center">
            <template #default="scope">
              <div class="host-cell">
                <el-avatar :size="24" class="host-avatar">{{ scope.row.host[0] }}</el-avatar>
                <span class="host-name">{{ scope.row.host }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="participants" label="参会人数" width="100" align="center">
            <template #default="scope">
              <el-tag type="info" size="small">{{ scope.row.members?.length || 0 }}人</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="startTime" label="开始时间" width="160" align="center" />

          <el-table-column prop="endTime" label="结束时间" width="160" align="center" />

          <el-table-column prop="duration" label="会议时长" width="110" align="center">
            <template #default="scope">
              <span class="duration-text">{{ formatDuration(scope.row.duration) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="240" fixed="right" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <el-button size="small" type="primary" link @click.stop="viewMeetingDetail(scope.row)">
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button
                  size="small"
                  type="success"
                  link
                  :disabled="!scope.row.hasRecording"
                  @click.stop="playRecording(scope.row)"
                >
                  <el-icon><VideoPlay /></el-icon>
                  录像
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  link
                  @click.stop="deleteMeetingRecord(scope.row)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
          <div class="footer-left">
            <span class="total-text">共 {{ totalRecords }} 条记录</span>
          </div>
          <div class="footer-right">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalRecords"
              layout="sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              small
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 会议详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedMeeting?.topic || '会议详情'"
      width="900px"
      class="detail-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="selectedMeeting" class="detail-content">
        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="会议主题" :span="2">
                <span class="detail-topic">{{ selectedMeeting.topic }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="主持人">
                <div class="host-info">
                  <el-avatar :size="20">{{ selectedMeeting.host[0] }}</el-avatar>
                  <span>{{ selectedMeeting.host }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="会议状态">
                <el-tag type="info">{{ selectedMeeting.status }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">{{ selectedMeeting.startTime }}</el-descriptions-item>
              <el-descriptions-item label="结束时间">{{ selectedMeeting.endTime }}</el-descriptions-item>
              <el-descriptions-item label="会议时长">
                <span class="duration-highlight">{{ formatDuration(selectedMeeting.duration) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="参会人数">
                <el-tag type="primary">{{ selectedMeeting.members?.length || 0 }}人</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="参会成员" name="members">
            <div class="members-grid">
              <div
                v-for="member in selectedMeeting.members"
                :key="member.id"
                class="member-card"
              >
                <el-avatar :size="40" class="member-avatar">{{ member.name[0] }}</el-avatar>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-role">
                    <el-tag
                      :type="member.id === selectedMeeting.hostId ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ member.id === selectedMeeting.hostId ? '主持人' : '参会者' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="会议纪要" name="summary" v-if="selectedMeeting.summary">
            <div class="summary-content">
              <el-input
                v-model="selectedMeeting.summary"
                type="textarea"
                :rows="8"
                placeholder="暂无会议纪要"
                readonly
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button
            type="success"
            :disabled="!selectedMeeting?.hasRecording"
            @click="playRecording(selectedMeeting)"
          >
            <el-icon><VideoPlay /></el-icon>
            播放录像
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 录像播放弹窗 -->
    <el-dialog
      v-model="recordingDialogVisible"
      :title="`会议录像 - ${selectedMeeting?.topic || ''}`"
      width="90%"
      top="5vh"
      class="recording-dialog"
      :close-on-click-modal="false"
      @close="handleCloseRecording"
    >
      <div v-if="selectedMeeting" class="recording-content">
        <!-- 录像信息 -->
        <div class="recording-info">
          <div class="info-left">
            <div class="meeting-title">{{ selectedMeeting.topic }}</div>
            <div class="meeting-meta">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                主持人：{{ selectedMeeting.host }}
              </span>
              <span class="meta-item">
                <el-icon><Timer /></el-icon>
                时长：{{ formatDuration(selectedMeeting.duration) }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                时间：{{ selectedMeeting.startTime }}
              </span>
            </div>
          </div>
          <div class="info-right">
            <el-tag type="success" v-if="selectedMeeting.hasRecording">
              <el-icon><VideoCamera /></el-icon>
              有录像
            </el-tag>
          </div>
        </div>

        <!-- 视频播放器 -->
        <div class="video-player-container">
          <div class="video-wrapper">
            <video
              ref="videoPlayerRef"
              class="video-player"
              controls
              preload="metadata"
              @loadedmetadata="onVideoLoaded"
              @timeupdate="onTimeUpdate"
              @ended="onVideoEnded"
              @error="onVideoError"
            >
              <source :src="recordingUrl" type="video/mp4">
              您的浏览器不支持视频播放。
            </video>

            <!-- 加载状态 -->
            <div v-if="videoLoading" class="video-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>正在加载录像...</span>
            </div>

            <!-- 错误状态 -->
            <div v-if="videoError" class="video-error">
              <el-icon class="error-icon"><Warning /></el-icon>
              <span>录像加载失败，请稍后重试</span>
            </div>
          </div>

          <!-- 自定义控制栏 -->
          <div class="video-controls">
            <div class="controls-left">
              <el-button-group>
                <el-button
                  :type="isPlaying ? 'danger' : 'primary'"
                  @click="togglePlay"
                  :disabled="videoError"
                >
                  <el-icon>
                    <component :is="isPlaying ? 'VideoPause' : 'VideoPlay'" />
                  </el-icon>
                  {{ isPlaying ? '暂停' : '播放' }}
                </el-button>
                <el-button @click="stopVideo" :disabled="videoError">
                  <el-icon><CircleClose /></el-icon>
                  停止
                </el-button>
                <el-button @click="reloadVideo" :disabled="videoError">
                  <el-icon><Refresh /></el-icon>
                  重载
                </el-button>
              </el-button-group>
            </div>

            <div class="controls-center">
              <div class="time-display">
                <span class="current-time">{{ formatTime(currentTime) }}</span>
                <span class="separator">/</span>
                <span class="total-time">{{ formatTime(totalTime) }}</span>
              </div>
              <div class="progress-container">
                <el-slider
                  v-model="currentTime"
                  :max="totalTime"
                  :show-tooltip="false"
                  :disabled="videoError || totalTime === 0"
                  @change="seekTo"
                  class="progress-slider"
                />
              </div>
            </div>

            <div class="controls-right">
              <div class="volume-control">
                <el-button
                  @click="toggleMute"
                  :type="isMuted ? 'warning' : 'info'"
                  circle
                  size="small"
                >
                  <el-icon>
                    <component :is="isMuted ? 'Muted' : 'Microphone'" />
                  </el-icon>
                </el-button>
                <el-slider
                  v-model="volume"
                  :max="100"
                  :show-tooltip="false"
                  @change="setVolume"
                  class="volume-slider"
                />
              </div>
              <el-button @click="toggleFullscreen" circle size="small">
                <el-icon><FullScreen /></el-icon>
              </el-button>
              <el-button type="success" @click="downloadRecording" circle size="small">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 录像详情 -->
        <div class="recording-details">
          <el-tabs v-model="recordingTab" class="recording-tabs">
            <el-tab-pane label="录像信息" name="info">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="文件大小">{{ formatFileSize(selectedMeeting.fileSize || 0) }}</el-descriptions-item>
                <el-descriptions-item label="分辨率">{{ selectedMeeting.resolution || '1920x1080' }}</el-descriptions-item>
                <el-descriptions-item label="帧率">{{ selectedMeeting.frameRate || '30fps' }}</el-descriptions-item>
                <el-descriptions-item label="编码格式">{{ selectedMeeting.codec || 'H.264' }}</el-descriptions-item>
                <el-descriptions-item label="录制开始">{{ selectedMeeting.startTime }}</el-descriptions-item>
                <el-descriptions-item label="录制结束">{{ selectedMeeting.endTime }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="参会成员" name="members">
              <div class="members-timeline">
                <div
                  v-for="member in selectedMeeting.members"
                  :key="member.id"
                  class="member-timeline-item"
                >
                  <el-avatar :size="32">{{ member.name[0] }}</el-avatar>
                  <div class="member-timeline-content">
                    <div class="member-name">{{ member.name }}</div>
                    <div class="member-duration">参会时长：{{ formatDuration(member.duration || selectedMeeting.duration) }}</div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <template #footer>
        <div class="recording-dialog-footer">
          <el-button @click="recordingDialogVisible = false">关闭</el-button>
          <el-button type="success" @click="downloadRecording">
            <el-icon><Download /></el-icon>
            下载录像
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Download,
  View,
  VideoPlay,
  VideoPause,
  Delete,
  ChatDotRound,
  Timer,
  User,
  VideoCamera,
  CircleClose,
  Refresh,
  FullScreen,
  Microphone,
  Muted,
  Loading,
  Warning,
  Calendar
} from '@element-plus/icons-vue';
import { useMeetingStore } from '@/store/meeting';

// 使用meeting store
const meetingStore = useMeetingStore();

// 基础响应式数据
const dateRange = ref<[string, string] | null>(null);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const detailDialogVisible = ref(false);
const selectedMeeting = ref<any>(null);
const activeTab = ref('basic');
const loading = ref(false);

// 录像播放相关数据
const recordingDialogVisible = ref(false);
const recordingTab = ref('info');
const videoPlayerRef = ref<HTMLVideoElement | null>(null);
const recordingUrl = ref('');
const videoLoading = ref(false);
const videoError = ref(false);
const isPlaying = ref(false);
const isMuted = ref(false);
const currentTime = ref(0);
const totalTime = ref(0);
const volume = ref(50);

// 获取已结束的会议记录
const meetingRecords = computed(() => {
  return meetingStore.meetings.filter(meeting => meeting.status === '已结束');
});

// 过滤后的记录
const filteredRecords = computed(() => {
  let records = [...meetingRecords.value];
  
  // 日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value;
    records = records.filter(record => {
      const recordDate = record.startTime.split(' ')[0];
      return recordDate >= startDate && recordDate <= endDate;
    });
  }
  
  // 关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    records = records.filter(record => 
      record.topic.toLowerCase().includes(keyword) ||
      record.host.toLowerCase().includes(keyword)
    );
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return records.slice(start, end);
});

// 统计数据
const totalRecords = computed(() => meetingRecords.value.length);
const totalDuration = computed(() => {
  return meetingRecords.value.reduce((total, record) => total + (record.duration || 0), 0);
});
const totalParticipants = computed(() => {
  return meetingRecords.value.reduce((total, record) => total + (record.members?.length || 0), 0);
});

// 方法
function handleDateChange() {
  currentPage.value = 1;
}

function handleSearch() {
  currentPage.value = 1;
}

function handleSizeChange(newSize: number) {
  pageSize.value = newSize;
  currentPage.value = 1;
}

function handleCurrentChange(newPage: number) {
  currentPage.value = newPage;
}

function formatDuration(minutes: number): string {
  if (!minutes) return '0分钟';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
}

function viewMeetingDetail(meeting: any) {
  selectedMeeting.value = meeting;
  detailDialogVisible.value = true;
}

function playRecording(meeting: any) {
  if (!meeting.hasRecording) {
    ElMessage.warning('该会议没有录像');
    return;
  }

  selectedMeeting.value = meeting;
  recordingDialogVisible.value = true;
  recordingTab.value = 'info';

  // 模拟录像URL（实际项目中应该从API获取）
  recordingUrl.value = `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4?meeting=${meeting.id}`;

  // 重置播放状态
  resetVideoState();

  // 等待DOM更新后初始化视频
  nextTick(() => {
    initializeVideo();
  });
}

// 重置视频状态
function resetVideoState() {
  videoLoading.value = true;
  videoError.value = false;
  isPlaying.value = false;
  currentTime.value = 0;
  totalTime.value = 0;
  volume.value = 50;
  isMuted.value = false;
}

// 初始化视频
function initializeVideo() {
  if (!videoPlayerRef.value) return;

  const video = videoPlayerRef.value;
  video.volume = volume.value / 100;
  video.muted = isMuted.value;
}

// 视频加载完成
function onVideoLoaded() {
  if (!videoPlayerRef.value) return;

  videoLoading.value = false;
  totalTime.value = Math.floor(videoPlayerRef.value.duration);
  ElMessage.success('录像加载完成');
}

// 时间更新
function onTimeUpdate() {
  if (!videoPlayerRef.value) return;
  currentTime.value = Math.floor(videoPlayerRef.value.currentTime);
}

// 视频播放结束
function onVideoEnded() {
  isPlaying.value = false;
  currentTime.value = 0;
  ElMessage.info('录像播放完成');
}

// 视频加载错误
function onVideoError() {
  videoLoading.value = false;
  videoError.value = true;
  ElMessage.error('录像加载失败，请检查网络连接');
}

// 切换播放/暂停
function togglePlay() {
  if (!videoPlayerRef.value || videoError.value) return;

  if (isPlaying.value) {
    videoPlayerRef.value.pause();
  } else {
    videoPlayerRef.value.play().catch(err => {
      console.error('播放失败:', err);
      ElMessage.error('播放失败，请重试');
    });
  }
  isPlaying.value = !isPlaying.value;
}

// 停止播放
function stopVideo() {
  if (!videoPlayerRef.value) return;

  videoPlayerRef.value.pause();
  videoPlayerRef.value.currentTime = 0;
  isPlaying.value = false;
  currentTime.value = 0;
}

// 重新加载视频
function reloadVideo() {
  if (!videoPlayerRef.value) return;

  resetVideoState();
  videoPlayerRef.value.load();
}

// 跳转到指定时间
function seekTo(time: number) {
  if (!videoPlayerRef.value) return;
  videoPlayerRef.value.currentTime = time;
}

// 切换静音
function toggleMute() {
  if (!videoPlayerRef.value) return;

  isMuted.value = !isMuted.value;
  videoPlayerRef.value.muted = isMuted.value;
}

// 设置音量
function setVolume(vol: number) {
  if (!videoPlayerRef.value) return;

  volume.value = vol;
  videoPlayerRef.value.volume = vol / 100;

  // 如果音量大于0，取消静音
  if (vol > 0 && isMuted.value) {
    isMuted.value = false;
    videoPlayerRef.value.muted = false;
  }
}

// 全屏切换
function toggleFullscreen() {
  if (!videoPlayerRef.value) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    videoPlayerRef.value.requestFullscreen().catch(err => {
      console.error('全屏失败:', err);
      ElMessage.error('全屏功能不可用');
    });
  }
}

// 下载录像
function downloadRecording() {
  if (!selectedMeeting.value || !recordingUrl.value) {
    ElMessage.warning('录像文件不可用');
    return;
  }

  // 创建下载链接
  const link = document.createElement('a');
  link.href = recordingUrl.value;
  link.download = `${selectedMeeting.value.topic}_录像.mp4`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  ElMessage.success('开始下载录像文件');
}

// 关闭录像弹窗
function handleCloseRecording() {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.pause();
  }
  resetVideoState();
  recordingDialogVisible.value = false;
}

// 格式化时间（秒转为 mm:ss 格式）
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function deleteMeetingRecord(meeting: any) {
  ElMessageBox.confirm(
    `确定要删除会议"${meeting.topic}"的记录吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 从store中删除会议记录
    const index = meetingStore.meetings.findIndex(m => m.id === meeting.id);
    if (index > -1) {
      meetingStore.meetings.splice(index, 1);
      ElMessage.success('会议记录已删除');
    }
  }).catch(() => {
    // 用户取消删除
  });
}

function exportRecords() {
  ElMessage.info('导出功能开发中...');
  // 这里可以添加导出逻辑
}

onMounted(() => {
  // 页面加载时的初始化逻辑
});
</script>

<style scoped>
/* 页面容器 */
.meeting-records-page {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
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
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-right {
  display: flex;
  gap: 8px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: #ffffff;
}

.stat-icon.total {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

.stat-icon.duration {
  background: linear-gradient(135deg, #52c41a, #389e0d);
}

.stat-icon.participants {
  background: linear-gradient(135deg, #fa8c16, #d46b08);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

/* 表格容器 */
.table-container {
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.table-card {
  border: none;
  box-shadow: none;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

/* 表格样式 */
.data-table {
  border: none;
}

.data-table :deep(.el-table__header th) {
  background: #ffffff;
  color: #262626;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}

.data-table :deep(.el-table__row):hover {
  background: #f8f9fa;
}

.data-table :deep(.el-table td) {
  border-bottom: 1px solid #f5f5f5;
}

/* 表格单元格样式 */
.topic-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.topic-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topic-text {
  font-weight: 500;
  color: #262626;
}

.recording-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.host-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.host-avatar {
  background: #1890ff;
  color: #ffffff;
  font-size: 12px;
}

.host-name {
  font-weight: 500;
  color: #262626;
}

.duration-text {
  font-weight: 500;
  color: #52c41a;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 表格底部 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
}

.footer-left {
  display: flex;
  align-items: center;
}

.total-text {
  font-size: 14px;
  color: #8c8c8c;
}

.footer-right {
  display: flex;
  align-items: center;
}

/* 弹窗样式 */
.detail-dialog {
  border-radius: 8px;
}

.detail-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.detail-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
}

.detail-content {
  max-height: 500px;
  overflow-y: auto;
}

.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.detail-topic {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-highlight {
  font-weight: 600;
  color: #52c41a;
}

/* 成员网格 */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.member-avatar {
  background: #1890ff;
  color: #ffffff;
  font-size: 16px;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.member-role {
  font-size: 12px;
}

/* 会议纪要 */
.summary-content {
  padding: 0;
}

.summary-content :deep(.el-textarea__inner) {
  border: 1px solid #f0f0f0;
  background: #fafafa;
}

/* 弹窗操作按钮 */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 录像播放弹窗样式 */
.recording-dialog {
  border-radius: 8px;
}

.recording-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.recording-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.recording-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.recording-content {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow: hidden;
}

/* 录像信息 */
.recording-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

.info-left {
  flex: 1;
}

.meeting-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.meeting-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #8c8c8c;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-right {
  display: flex;
  align-items: center;
}

/* 视频播放器容器 */
.video-player-container {
  display: flex;
  flex-direction: column;
  background: #000000;
  position: relative;
  height: 400px;
}

.video-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320px;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000000;
}

.video-loading,
.video-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: 16px;
}

.loading-icon,
.error-icon {
  font-size: 32px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 视频控制栏 */
.video-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
}

.controls-left {
  display: flex;
  align-items: center;
}

.controls-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 20px;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #262626;
  margin-bottom: 8px;
}

.separator {
  color: #8c8c8c;
}

.progress-container {
  width: 100%;
}

.progress-slider :deep(.el-slider__runway) {
  height: 6px;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
}

.volume-slider :deep(.el-slider__runway) {
  height: 4px;
}

/* 录像详情 */
.recording-details {
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  max-height: 200px;
  overflow-y: auto;
}

.recording-tabs {
  padding: 12px 24px 0;
}

.recording-tabs :deep(.el-tabs__content) {
  padding: 12px 0;
  max-height: 150px;
  overflow-y: auto;
}

.members-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
}

.member-timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
}

.member-timeline-content {
  flex: 1;
}

.member-name {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.member-duration {
  font-size: 12px;
  color: #8c8c8c;
}

/* 弹窗底部 */
.recording-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .recording-dialog {
    width: 95% !important;
    top: 3vh !important;
  }

  .recording-content {
    max-height: 85vh;
  }

  .video-player-container {
    height: 300px;
  }

  .video-wrapper {
    height: 220px;
  }
}

@media (max-width: 768px) {
  .meeting-records-page {
    padding: 16px;
  }

  .filter-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .filter-left {
    flex-direction: column;
    gap: 8px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .members-grid {
    grid-template-columns: 1fr;
  }

  .recording-dialog {
    width: 98% !important;
    top: 2vh !important;
  }

  .recording-content {
    max-height: 90vh;
  }

  .video-player-container {
    height: 250px;
  }

  .video-wrapper {
    height: 180px;
  }

  .video-controls {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    padding: 8px 12px;
  }

  .controls-center {
    margin: 0;
  }

  .meeting-meta {
    flex-direction: column;
    gap: 8px;
  }

  .recording-info {
    padding: 12px 16px;
  }

  .recording-details {
    max-height: 150px;
  }

  .recording-tabs {
    padding: 8px 16px 0;
  }
}
</style>
