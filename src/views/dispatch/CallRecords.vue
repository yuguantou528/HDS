<template>
  <div class="call-records-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">通话记录</h1>
        <p class="page-description">查看和管理音频调度通话记录</p>
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
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm"
          size="default"
          @change="handleDateChange"
        />
        <el-select
          v-model="typeFilter"
          placeholder="通话类型"
          clearable
          size="default"
          style="width: 120px"
          @change="handleTypeChange"
        >
          <el-option label="全部" value="" />
          <el-option label="单呼" value="individual" />
          <el-option label="组呼" value="group" />
          <el-option label="动态组呼" value="dynamic" />
          <el-option label="紧急呼叫" value="emergency" />
          <el-option label="广播" value="broadcast" />
        </el-select>
        <el-select
          v-model="statusFilter"
          placeholder="通话状态"
          clearable
          size="default"
          style="width: 120px"
          @change="handleStatusChange"
        >
          <el-option label="全部" value="" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设备名称或用户"
          clearable
          size="default"
          style="width: 200px"
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
        <el-button @click="clearAllRecords" type="danger" plain>
          <el-icon><Delete /></el-icon>
          清空记录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><Phone /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalCalls }}</div>
          <div class="stat-label">总通话数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon duration">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalDuration }}</div>
          <div class="stat-label">总时长(分钟)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ successRate }}%</div>
          <div class="stat-label">成功率</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon recording">
          <el-icon><Microphone /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ recordingCount }}</div>
          <div class="stat-label">有录音</div>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">通话记录列表</span>
          </div>
        </template>

        <el-table
          :data="filteredRecords"
          class="data-table"
          stripe
          @row-click="viewCallDetail"
          v-loading="loading"
          element-loading-text="加载中..."
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          
          <el-table-column prop="type" label="通话类型" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getCallTypeTagType(scope.row.type)" size="small">
                {{ getCallTypeLabel(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="caller" label="主叫方" width="150" show-overflow-tooltip>
            <template #default="scope">
              <div class="caller-cell">
                <el-avatar :size="24" class="caller-avatar">{{ scope.row.callerName[0] }}</el-avatar>
                <span class="caller-name">{{ scope.row.callerName }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="receivers" label="被叫方" min-width="200" show-overflow-tooltip>
            <template #default="scope">
              <div class="receivers-cell">
                <span v-if="scope.row.receiverNames.length <= 2">
                  {{ scope.row.receiverNames.join('、') }}
                </span>
                <span v-else>
                  {{ scope.row.receiverNames.slice(0, 2).join('、') }}
                  <el-tag size="small" type="info">+{{ scope.row.receiverNames.length - 2 }}</el-tag>
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="startTime" label="开始时间" width="160" align="center">
            <template #default="scope">
              {{ formatDateTime(scope.row.startTime) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="duration" label="通话时长" width="100" align="center">
            <template #default="scope">
              <span class="duration-text">{{ formatDuration(scope.row.duration) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="hasRecording" label="录音" width="80" align="center">
            <template #default="scope">
              <el-icon v-if="scope.row.hasRecording" color="#52c41a" size="16">
                <Microphone />
              </el-icon>
              <span v-else class="no-recording">-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <el-button size="small" type="primary" link @click.stop="viewCallDetail(scope.row)">
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
                  录音
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  link
                  @click.stop="deleteCallRecord(scope.row)"
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
            <span class="total-text">共 {{ totalCalls }} 条记录</span>
          </div>
          <div class="footer-right">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalCalls"
              layout="sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              small
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 通话详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`通话详情 - ${selectedCall?.callerName || ''}`"
      width="800px"
      class="detail-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="selectedCall" class="detail-content">
        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="通话类型">
                <el-tag :type="getCallTypeTagType(selectedCall.type)">
                  {{ getCallTypeLabel(selectedCall.type) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="通话状态">
                <el-tag :type="getStatusTagType(selectedCall.status)">
                  {{ getStatusLabel(selectedCall.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="主叫方">
                <div class="caller-info">
                  <el-avatar :size="20">{{ selectedCall.callerName[0] }}</el-avatar>
                  <span>{{ selectedCall.callerName }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="被叫方数量">
                <el-tag type="primary">{{ selectedCall.receiverNames.length }}个</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">{{ formatDateTime(selectedCall.startTime) }}</el-descriptions-item>
              <el-descriptions-item label="结束时间">
                {{ selectedCall.endTime ? formatDateTime(selectedCall.endTime) : '未结束' }}
              </el-descriptions-item>
              <el-descriptions-item label="通话时长">
                <span class="duration-highlight">{{ formatDuration(selectedCall.duration) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="是否有录音">
                <el-tag :type="selectedCall.hasRecording ? 'success' : 'info'">
                  {{ selectedCall.hasRecording ? '有录音' : '无录音' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="参与方详情" name="participants">
            <div class="participants-section">
              <h4>主叫方</h4>
              <div class="participant-card caller-card">
                <el-avatar :size="40">{{ selectedCall.callerName[0] }}</el-avatar>
                <div class="participant-info">
                  <div class="participant-name">{{ selectedCall.callerName }}</div>
                  <div class="participant-role">
                    <el-tag type="warning" size="small">主叫</el-tag>
                  </div>
                </div>
              </div>
              
              <h4>被叫方</h4>
              <div class="participants-grid">
                <div 
                  v-for="(name, index) in selectedCall.receiverNames" 
                  :key="index"
                  class="participant-card"
                >
                  <el-avatar :size="32">{{ name[0] }}</el-avatar>
                  <div class="participant-info">
                    <div class="participant-name">{{ name }}</div>
                    <div class="participant-role">
                      <el-tag type="info" size="small">被叫</el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            type="success" 
            :disabled="!selectedCall?.hasRecording"
            @click="playRecording(selectedCall)"
          >
            <el-icon><VideoPlay /></el-icon>
            播放录音
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 录音播放弹窗 -->
    <el-dialog
      v-model="recordingDialogVisible"
      :title="`通话录音 - ${selectedCall?.callerName || ''}`"
      width="600px"
      class="recording-dialog"
      :close-on-click-modal="false"
      @close="handleCloseRecording"
    >
      <div v-if="selectedCall" class="recording-content">
        <!-- 录音信息 -->
        <div class="recording-info">
          <div class="info-left">
            <div class="call-title">{{ getCallTypeLabel(selectedCall.type) }} - {{ selectedCall.callerName }}</div>
            <div class="call-meta">
              <span class="meta-item">
                <el-icon><Timer /></el-icon>
                时长：{{ formatDuration(selectedCall.duration) }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                时间：{{ formatDateTime(selectedCall.startTime) }}
              </span>
            </div>
          </div>
          <div class="info-right">
            <el-tag type="success" v-if="selectedCall.hasRecording">
              <el-icon><Microphone /></el-icon>
              有录音
            </el-tag>
          </div>
        </div>

        <!-- 音频播放器 -->
        <div class="audio-player-container">
          <audio
            ref="audioPlayerRef"
            class="audio-player"
            controls
            preload="metadata"
            @loadedmetadata="onAudioLoaded"
            @timeupdate="onTimeUpdate"
            @ended="onAudioEnded"
            @error="onAudioError"
          >
            <source :src="recordingUrl" type="audio/mp3">
            您的浏览器不支持音频播放。
          </audio>
          
          <!-- 加载状态 -->
          <div v-if="audioLoading" class="audio-loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>正在加载录音...</span>
          </div>
          
          <!-- 错误状态 -->
          <div v-if="audioError" class="audio-error">
            <el-icon class="error-icon"><Warning /></el-icon>
            <span>录音加载失败，请稍后重试</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="recording-dialog-footer">
          <el-button @click="recordingDialogVisible = false">关闭</el-button>
          <el-button type="success" @click="downloadRecording">
            <el-icon><Download /></el-icon>
            下载录音
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Download,
  Delete,
  View,
  VideoPlay,
  Phone,
  Timer,
  CircleCheck,
  Microphone,
  Calendar,
  Loading,
  Warning
} from '@element-plus/icons-vue';

// 响应式数据
const dateRange = ref<[string, string] | null>(null);
const typeFilter = ref('');
const statusFilter = ref('');
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const detailDialogVisible = ref(false);
const recordingDialogVisible = ref(false);
const selectedCall = ref<any>(null);
const activeTab = ref('basic');

// 录音播放相关
const audioPlayerRef = ref<HTMLAudioElement | null>(null);
const recordingUrl = ref('');
const audioLoading = ref(false);
const audioError = ref(false);

// 模拟通话记录数据
const callRecords = ref([
  {
    id: 'call-001',
    type: 'individual',
    caller: 'device-001',
    callerName: '调度台001',
    receivers: ['device-002'],
    receiverNames: ['巡逻车A'],
    startTime: new Date('2024-01-16 09:30:00'),
    endTime: new Date('2024-01-16 09:35:30'),
    duration: 330, // 秒
    status: 'completed',
    hasRecording: true,
    recordingUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
  },
  {
    id: 'call-002',
    type: 'group',
    caller: 'device-001',
    callerName: '调度台001',
    receivers: ['device-002', 'device-003', 'device-004'],
    receiverNames: ['巡逻车A', '巡逻车B', '指挥车C'],
    startTime: new Date('2024-01-16 10:15:00'),
    endTime: new Date('2024-01-16 10:22:15'),
    duration: 435,
    status: 'completed',
    hasRecording: true,
    recordingUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
  },
  {
    id: 'call-003',
    type: 'emergency',
    caller: 'device-005',
    callerName: '应急设备E',
    receivers: ['device-001'],
    receiverNames: ['调度台001'],
    startTime: new Date('2024-01-16 11:45:00'),
    endTime: new Date('2024-01-16 11:48:30'),
    duration: 210,
    status: 'completed',
    hasRecording: true,
    recordingUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
  },
  {
    id: 'call-004',
    type: 'broadcast',
    caller: 'device-001',
    callerName: '调度台001',
    receivers: ['device-002', 'device-003', 'device-004', 'device-005', 'device-006'],
    receiverNames: ['巡逻车A', '巡逻车B', '指挥车C', '应急设备E', '监控点F'],
    startTime: new Date('2024-01-16 14:20:00'),
    endTime: new Date('2024-01-16 14:25:45'),
    duration: 345,
    status: 'completed',
    hasRecording: false
  },
  {
    id: 'call-005',
    type: 'individual',
    caller: 'device-002',
    callerName: '巡逻车A',
    receivers: ['device-001'],
    receiverNames: ['调度台001'],
    startTime: new Date('2024-01-15 16:30:00'),
    endTime: null,
    duration: 0,
    status: 'failed',
    hasRecording: false
  }
]);

// 计算属性
const filteredRecords = computed(() => {
  let records = [...callRecords.value];
  
  // 日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value;
    const start = new Date(startDate);
    const end = new Date(endDate);
    records = records.filter(record => {
      const recordTime = new Date(record.startTime);
      return recordTime >= start && recordTime <= end;
    });
  }
  
  // 类型过滤
  if (typeFilter.value) {
    records = records.filter(record => record.type === typeFilter.value);
  }
  
  // 状态过滤
  if (statusFilter.value) {
    records = records.filter(record => record.status === statusFilter.value);
  }
  
  // 关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    records = records.filter(record => 
      record.callerName.toLowerCase().includes(keyword) ||
      record.receiverNames.some(name => name.toLowerCase().includes(keyword))
    );
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return records.slice(start, end);
});

// 统计数据
const totalCalls = computed(() => callRecords.value.length);
const totalDuration = computed(() => {
  return Math.floor(callRecords.value.reduce((total, record) => total + (record.duration || 0), 0) / 60);
});
const successRate = computed(() => {
  const completed = callRecords.value.filter(record => record.status === 'completed').length;
  return totalCalls.value > 0 ? Math.round((completed / totalCalls.value) * 100) : 0;
});
const recordingCount = computed(() => {
  return callRecords.value.filter(record => record.hasRecording).length;
});

// 方法
function handleDateChange() {
  currentPage.value = 1;
}

function handleTypeChange() {
  currentPage.value = 1;
}

function handleStatusChange() {
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

function getCallTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    individual: '单呼',
    group: '组呼',
    dynamic: '动态组呼',
    emergency: '紧急呼叫',
    broadcast: '广播'
  };
  return labels[type] || type;
}

function getCallTypeTagType(type: string): string {
  const types: Record<string, string> = {
    individual: 'primary',
    group: 'success',
    dynamic: 'warning',
    emergency: 'danger',
    broadcast: 'info'
  };
  return types[type] || 'info';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
    ongoing: '进行中'
  };
  return labels[status] || status;
}

function getStatusTagType(status: string): string {
  const types: Record<string, string> = {
    completed: 'success',
    failed: 'danger',
    cancelled: 'warning',
    ongoing: 'primary'
  };
  return types[status] || 'info';
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0秒';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}时${minutes}分${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

function viewCallDetail(call: any) {
  selectedCall.value = call;
  detailDialogVisible.value = true;
  activeTab.value = 'basic';
}

function playRecording(call: any) {
  if (!call.hasRecording) {
    ElMessage.warning('该通话没有录音');
    return;
  }
  
  selectedCall.value = call;
  recordingDialogVisible.value = true;
  recordingUrl.value = call.recordingUrl;
  
  // 重置播放状态
  audioLoading.value = true;
  audioError.value = false;
}

function handleCloseRecording() {
  if (audioPlayerRef.value) {
    audioPlayerRef.value.pause();
  }
  recordingDialogVisible.value = false;
  audioLoading.value = false;
  audioError.value = false;
}

function onAudioLoaded() {
  audioLoading.value = false;
  ElMessage.success('录音加载完成');
}

function onTimeUpdate() {
  // 音频时间更新处理
}

function onAudioEnded() {
  ElMessage.info('录音播放完成');
}

function onAudioError() {
  audioLoading.value = false;
  audioError.value = true;
  ElMessage.error('录音加载失败，请检查网络连接');
}

function downloadRecording() {
  if (!selectedCall.value || !recordingUrl.value) {
    ElMessage.warning('录音文件不可用');
    return;
  }
  
  const link = document.createElement('a');
  link.href = recordingUrl.value;
  link.download = `${selectedCall.value.callerName}_${formatDateTime(selectedCall.value.startTime)}.mp3`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  ElMessage.success('开始下载录音文件');
}

function deleteCallRecord(call: any) {
  ElMessageBox.confirm(
    `确定要删除通话记录"${call.callerName} → ${call.receiverNames.join('、')}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = callRecords.value.findIndex(r => r.id === call.id);
    if (index > -1) {
      callRecords.value.splice(index, 1);
      ElMessage.success('通话记录已删除');
    }
  }).catch(() => {
    // 用户取消删除
  });
}

function exportRecords() {
  ElMessage.info('导出功能开发中...');
}

function clearAllRecords() {
  ElMessageBox.confirm(
    '确定要清空所有通话记录吗？此操作不可恢复。',
    '清空确认',
    {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    callRecords.value = [];
    ElMessage.success('所有通话记录已清空');
  }).catch(() => {
    // 用户取消清空
  });
}

onMounted(() => {
  // 页面加载时的初始化逻辑
});
</script>

<style scoped>
/* 页面容器 */
.call-records-page {
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
  grid-template-columns: repeat(4, 1fr);
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

.stat-icon.success {
  background: linear-gradient(135deg, #fa8c16, #d46b08);
}

.stat-icon.recording {
  background: linear-gradient(135deg, #722ed1, #531dab);
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
.caller-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.caller-avatar {
  background: #1890ff;
  color: #ffffff;
  font-size: 12px;
}

.caller-name {
  font-weight: 500;
  color: #262626;
}

.receivers-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-text {
  font-weight: 500;
  color: #52c41a;
}

.no-recording {
  color: #d9d9d9;
  font-size: 16px;
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

.caller-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-highlight {
  font-weight: 600;
  color: #52c41a;
}

/* 参与方详情 */
.participants-section h4 {
  margin: 0 0 12px 0;
  color: #262626;
  font-weight: 600;
}

.participant-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.caller-card {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.participant-role {
  font-size: 12px;
}

.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* 弹窗操作按钮 */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 录音播放弹窗 */
.recording-dialog {
  border-radius: 8px;
}

.recording-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.recording-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.recording-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.recording-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 录音信息 */
.recording-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.info-left {
  flex: 1;
}

.call-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.call-meta {
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

/* 音频播放器 */
.audio-player-container {
  position: relative;
  padding: 20px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.audio-player {
  width: 100%;
  height: 40px;
}

.audio-loading,
.audio-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #8c8c8c;
  font-size: 14px;
}

.loading-icon,
.error-icon {
  font-size: 24px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-icon {
  color: #ff4d4f;
}

/* 录音弹窗底部 */
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
}

@media (max-width: 768px) {
  .call-records-page {
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

  .participants-grid {
    grid-template-columns: 1fr;
  }

  .call-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
