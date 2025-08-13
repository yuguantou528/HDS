<template>
  <div class="audio-dispatch-container" :class="{ 'large-screen-theme': isLargeScreenTheme }">
    <!-- 主题切换按钮 - 根据使用场景控制显示 -->
    <div v-if="shouldShowThemeToggle" class="theme-toggle-container">
      <el-button
        @click="toggleTheme"
        :type="isLargeScreenTheme ? 'primary' : 'default'"
        size="small"
        class="theme-toggle-btn"
      >
        <el-icon><Monitor /></el-icon>
        {{ isLargeScreenTheme ? '常规模式' : '大屏模式' }}
      </el-button>
    </div>

    <el-row :gutter="20">
      <!-- 左侧设备列表 -->
      <el-col :span="6">
        <el-card class="device-list-card">
          <template #header>
            <div class="card-header">
              <span>设备列表</span>
              <div class="header-controls">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索设备"
                  prefix-icon="Search"
                  clearable
                  size="small"
                  style="width: 120px; margin-right: 8px;"
                />
                <el-button size="small" @click="refreshDevices">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
          
          <el-tabs v-model="activeDeviceTab">
            <el-tab-pane label="全部设备" name="all">
              <el-tree
                :data="filteredDevices"
                :props="{ label: 'name' }"
                node-key="id"
                @node-click="handleDeviceClick"
                :expand-on-click-node="false"
                :disabled="isDeviceSelectionDisabled"
              >
                <template #default="{ node, data }">
                  <div class="device-item">
                    <el-tag :type="getDeviceStatusType(data.status)" size="small">
                      <span class="status-indicator" :class="data.status"></span>
                      {{ getDeviceStatusLabel(data.status) }}
                    </el-tag>
                    <span class="device-name">{{ data.name }}</span>
                    <span class="device-type">{{ getDeviceTypeLabel(data.type) }}</span>
                    <span v-if="isDeviceSelected(data.id)" class="selected-indicator"><el-icon><Check /></el-icon>已选</span>
                    <div class="device-actions">
                      <el-button 
                        v-if="data.status === 'online'" 
                        size="mini" 
                        type="danger" 
                        @click.stop="emergencyCall(data)"
                        title="紧急呼叫"
                      >
                        <el-icon><Warning /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </template>
              </el-tree>
            </el-tab-pane>
            <el-tab-pane label="分组" name="groups">
              <div class="group-controls">
                <el-button size="small" @click="createPresetGroup">
                  <el-icon><Plus /></el-icon> 新建预设组
                </el-button>
              </div>
              <el-collapse v-model="activeGroups">
                <el-collapse-item v-for="group in groups" :key="group.id" :title="group.name" :name="group.id">
                  <template #title>
                    <div class="group-title">
                      <span>{{ group.name }}</span>
                      <div class="group-ops">
                        <el-tooltip content="选择组" placement="top">
                          <el-button circle size="small" :type="selectedGroups[group.id] ? 'primary' : 'default'" @click.stop="selectedGroups[group.id] = !selectedGroups[group.id]; handleGroupSelect(group)">
                            <el-icon><Check /></el-icon>
                          </el-button>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top">
                          <el-button circle size="small" @click.stop="editGroup(group)">
                            <el-icon><Edit /></el-icon>
                          </el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                          <el-button circle size="small" type="danger" @click.stop="deleteGroup(group)">
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </el-tooltip>
                      </div>
                    </div>
                  </template>
                  <div class="group-actions">
                    <div v-for="deviceId in group.devices" :key="deviceId" class="group-device-item">
                      <div class="device-item">
                        <el-tag :type="getDeviceStatusType(getDeviceById(deviceId)?.status)" size="small">
                          {{ getDeviceStatusLabel(getDeviceById(deviceId)?.status) }}
                        </el-tag>
                        <span class="device-name">{{ getDeviceById(deviceId)?.name }}</span>
                      </div>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </el-tab-pane>
            <el-tab-pane label="监控" name="monitor">
              <div class="monitor-panel">
                <div class="monitor-section">
                  <el-row :gutter="16">
                    <el-col :span="24">
                      <div class="stat-card">
                        <div class="stat-header">
                          <span>设备状态统计</span>
                          <el-tag size="small" type="success">{{ onlineRate }}% 在线率</el-tag>
                        </div>
                        <div class="status-stats">
                          <div class="stat-item" :style="{ borderColor: '#409EFF' }">
                            <span class="stat-number">{{ devices.length }}</span>
                            <span class="stat-label">总设备数</span>
                          </div>
                          <div class="stat-item" :style="{ borderColor: '#67c23a' }">
                            <span class="stat-number">{{ onlineCount }}</span>
                            <span class="stat-label">在线</span>
                          </div>
                          <div class="stat-item" :style="{ borderColor: '#e6a23c' }">
                            <span class="stat-number">{{ busyCount }}</span>
                            <span class="stat-label">忙碌</span>
                          </div>
                          <div class="stat-item" :style="{ borderColor: '#909399' }">
                            <span class="stat-number">{{ offlineCount }}</span>
                            <span class="stat-label">离线</span>
                          </div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                  <el-row :gutter="16">
                    <el-col :span="24">
                      <div class="stat-card">
                        <div class="stat-header">
                          <span>设备类型分布</span>
                        </div>
                        <div class="device-type-stats">
                          <div class="device-type-item" v-for="(count, type) in deviceTypeStats" :key="type">
                            <div class="device-type-icon" :class="type">
                              <el-icon v-if="type === 'intercom'"><ChatDotRound /></el-icon>
                              <el-icon v-else-if="type === 'radio'"><Connection /></el-icon>
                              <el-icon v-else-if="type === 'phone'"><Phone /></el-icon>
                            </div>
                            <div class="device-type-info">
                              <span class="device-type-name">{{ getDeviceTypeLabel(type) }}</span>
                              <el-progress :percentage="Math.round(count / devices.length * 100)" :stroke-width="6" :show-text="false" />
                              <span class="device-type-count">{{ count }}台 ({{ Math.round(count / devices.length * 100) }}%)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
      
      <!-- 中间通话控制区 -->
      <el-col :span="12">
        <el-card class="call-control-card">
          <template #header>
            <div class="card-header">
              <span>通话控制</span>
              <div class="call-controls">
                <el-button size="small" @click="startRecording" :disabled="!activeCall">
                  <el-icon><VideoPlay /></el-icon> {{ isRecording ? '停止录音' : '开始录音' }}
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="call-control-content">
            <div class="selected-devices">
              <h3>已选设备 ({{ selectedDevices.length }})</h3>
              <el-empty v-if="selectedDevices.length === 0" description="未选择设备" />
              <el-tag
                v-for="device in selectedDevices"
                :key="device.id"
                :closable="canRemoveDeviceInCall"
                @close="removeSelectedDevice(device)"
                :type="isEmergencyTarget(device) ? 'danger' : ''"
                class="selected-device-tag"
              >
                {{ device.name }}
                <span v-if="isEmergencyTarget(device)" class="emergency-badge">紧急</span>
              </el-tag>
            </div>
            
            <div class="call-actions">
              <el-button-group>
                <el-button type="primary" :disabled="selectedDevices.length !== 1 && !hasSelectedGroups" @click="startIndividualCall">
                  <el-icon><Phone /></el-icon> 单呼
                </el-button>
                <el-button type="success" :disabled="!hasSelectedGroups" @click="startGroupCall">
                  <el-icon><ChatDotRound /></el-icon> 组呼
                </el-button>
                <el-button type="warning" :disabled="!hasSelectedGroups && selectedDevices.length < 1" @click="startDynamicGroupCall">
                  <el-icon><Connection /></el-icon> 动态组呼
                </el-button>
              </el-button-group>
            </div>
            
            <div class="call-status" v-if="activeCall">
              <el-alert
                :title="'通话中: ' + getCallTypeLabel(activeCall.type)"
                type="info"
                :closable="false"
                show-icon
              >
                <div class="call-info">
                  <p>发起方: {{ getDeviceById(activeCall.caller)?.name }}</p>
                  <p>接收方: {{ activeCall.receivers.map(id => getDeviceById(id)?.name).join(', ') }}</p>
                  <p>通话时长: {{ callDuration }}</p>
                  <p v-if="isRecording" class="recording-status">● 录音中...</p>
                </div>
              </el-alert>
              <div class="end-call-btn-bar">
                <el-button type="danger" size="large" class="end-call-btn" @click="endCall">
                  <el-icon><CircleClose /></el-icon> 结束通话
                </el-button>
              </div>
            </div>
            
            <div class="volume-control" v-if="activeCall">
              <h3>音量控制</h3>
              <div class="volume-sliders">
                <div class="volume-item">
                  <span>主音量</span>
                  <el-slider v-model="mainVolume" :min="0" :max="100" />
                </div>
                <div class="volume-item">
                  <span>麦克风音量</span>
                  <el-slider v-model="micVolume" :min="0" :max="100" />
                </div>
              </div>
            </div>
            
            <div class="talk-control" v-if="activeCall">
              <h3>话权控制</h3>
              <el-table :data="talkControlData" style="width: 100%">
                <el-table-column prop="name" label="设备名称" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="scope.row.hasTalkRight ? 'success' : 'info'">
                      {{ scope.row.hasTalkRight ? '有话权' : '无话权' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="音量">
                  <template #default="scope">
                    <el-slider 
                      v-model="scope.row.volume" 
                      :min="0" 
                      :max="100" 
                      style="width: 100px;"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button
                      :type="scope.row.hasTalkRight ? 'danger' : 'success'"
                      size="small"
                      @click="toggleTalkRight(scope.row)"
                    >
                      {{ scope.row.hasTalkRight ? '取消话权' : '授予话权' }}
                    </el-button>
                    <el-button
                      size="small"
                      @click="muteDevice(scope.row)"
                    >
                      {{ scope.row.isMuted ? '取消静音' : '静音' }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧通话记录 -->
      <el-col :span="6">
        <el-card class="call-record-card">
          <template #header>
            <div class="card-header">
              <span>通话记录</span>
              <el-button size="small" @click="exportRecords">
                <el-icon><Download /></el-icon> 导出
              </el-button>
            </div>
          </template>
          
          <el-tabs v-model="activeRecordTab">
            <el-tab-pane label="通话记录" name="calls">
              <el-timeline>
                <el-timeline-item
                  v-for="record in callRecords"
                  :key="record.id"
                  :timestamp="formatTime(record.startTime)"
                  :type="record.status === 'completed' ? 'success' : record.status === 'failed' ? 'danger' : 'primary'"
                >
                  <h4>{{ getCallTypeLabel(record.type) }}</h4>
                  <p>发起方: {{ getDeviceById(record.caller)?.name || '未知设备' }}</p>
                  <p>接收方: {{ record.receivers.map(id => getDeviceById(id)?.name || '未知设备').join(', ') }}</p>
                  <p v-if="record.duration">通话时长: {{ formatDuration(record.duration) }}</p>
                  <p>状态: {{ getCallStatusLabel(record.status) }}</p>
                  <div v-if="record.hasRecording" class="recording-info">
                    <el-button size="mini" @click="playRecording(record)">播放录音</el-button>
                    <el-button size="mini" @click="downloadRecording(record)">下载</el-button>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-tab-pane>
            <el-tab-pane label="录音文件" name="recordings">
              <div class="recording-list">
                <div v-for="recording in recordings" :key="recording.id" class="recording-item modern-recording-card">
                  <div class="recording-cover">
                    <el-icon class="audio-icon"><Headset /></el-icon>
                  </div>
                  <div class="recording-meta">
                    <div class="recording-title">{{ recording.name }}</div>
                    <div class="recording-time">{{ formatTime(recording.createdAt) }} | 时长: {{ formatDuration(recording.duration) }}</div>
                  </div>
                  <div class="recording-actions">
                    <el-tooltip content="播放" placement="top">
                      <el-button circle size="small" @click="playRecording(recording)"><el-icon><VideoPlay /></el-icon></el-button>
                    </el-tooltip>
                    <el-tooltip content="下载" placement="top">
                      <el-button circle size="small" @click="downloadRecording(recording)"><el-icon><Download /></el-icon></el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-button circle size="small" type="danger" @click="deleteRecording(recording)"><el-icon><Delete /></el-icon></el-button>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预设组管理对话框 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="editingGroup ? '编辑预设组' : '新建预设组'"
      width="800px"
      class="group-management-dialog"
    >
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="组名称">
          <el-input v-model="groupForm.name" placeholder="请输入组名称" />
        </el-form-item>
        <el-form-item label="选择设备">
          <el-transfer
            v-model="groupForm.devices"
            :data="devices"
            :titles="['可选设备', '已选设备']"
            :props="{ key: 'id', label: 'name' }"
            filterable
            filter-placeholder="搜索设备"
            style="width: 100%;"
            class="horizontal-transfer"
          >
            <template #default="{ option }">
              <div class="transfer-item">
                <div class="transfer-item-left">
                  <el-tag :type="getDeviceStatusType(option.status)" size="small" class="transfer-status-tag">
                    {{ getDeviceStatusLabel(option.status) }}
                  </el-tag>
                  <span class="device-name-label">{{ option.name }}</span>
                </div>
                <span class="device-type-tag">{{ getDeviceTypeLabel(option.type) }}</span>
              </div>
            </template>
          </el-transfer>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveGroup">确定</el-button>
      </template>
    </el-dialog>

    <!-- 紧急呼叫确认对话框 -->
    <el-dialog
      v-model="emergencyDialogVisible"
      title="紧急呼叫确认"
      width="400px"
      class="emergency-dialog"
    >
      <div class="emergency-confirm">
        <el-icon class="emergency-icon"><Warning /></el-icon>
        <p>确定要向设备 "{{ emergencyDevice?.name }}" 发起紧急呼叫吗？</p>
        <p class="warning-text">紧急呼叫将中断所有其他通话！</p>
      </div>
      <template #footer>
        <el-button @click="emergencyDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmEmergencyCall">确认紧急呼叫</el-button>
      </template>
    </el-dialog>

    <!-- 录音文件播放弹窗 -->
    <el-dialog
      v-model="audioDialogVisible"
      title="录音播放"
      width="400px"
      class="audio-player-dialog"
      @close="audioDialogUrl = ''"
    >
      <audio v-if="audioDialogUrl" :src="audioDialogUrl" controls style="width: 100%;" autoplay />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Phone,
  ChatDotRound,
  Connection,
  SetUp,
  Refresh,
  Plus,
  VideoPlay,
  Microphone,
  Download,
  Warning,
  Check,
  Edit,
  Delete,
  CircleClose,
  Headset,
  Monitor
} from '@element-plus/icons-vue';
import type { DispatchDevice, DispatchGroup, CallRecord } from '@/types';

// 定义组件props
interface Props {
  hideThemeToggle?: boolean; // 是否隐藏主题切换按钮，默认false（显示）
  forceTheme?: 'large' | 'normal' | 'auto'; // 强制指定主题模式
}

const props = withDefaults(defineProps<Props>(), {
  hideThemeToggle: false,
  forceTheme: 'auto'
});

const route = useRoute();

// 根据使用场景确定默认主题模式
const getDefaultTheme = (): boolean => {
  // 如果通过props强制指定主题
  if (props.forceTheme === 'large') return true;
  if (props.forceTheme === 'normal') return false;

  // 自动判断：如果是应急指挥调度大屏页面，默认使用大屏模式
  if (route.path === '/emergency-command' || route.name === 'EmergencyCommand') {
    return true;
  }

  // 如果是独立的音频调度页面，默认使用常规模式
  if (route.path === '/dispatch/audio' || route.name === 'AudioDispatch') {
    return false;
  }

  // 其他情况默认使用常规模式
  return false;
};

// 主题切换状态
const isLargeScreenTheme = ref(getDefaultTheme());

// 监听props变化，动态调整主题
watch(() => props.forceTheme, (newTheme) => {
  if (newTheme === 'large') {
    isLargeScreenTheme.value = true;
  } else if (newTheme === 'normal') {
    isLargeScreenTheme.value = false;
  }
  // 'auto' 模式保持当前状态不变
}, { immediate: true });

// 控制主题切换按钮的显示
const shouldShowThemeToggle = computed(() => {
  // 如果通过props明确隐藏，则不显示
  if (props.hideThemeToggle) return false;

  // 如果是应急指挥调度大屏页面，隐藏切换按钮（大屏模式下不需要切换）
  if (route.path === '/emergency-command' || route.name === 'EmergencyCommand') {
    return false;
  }

  // 如果是独立的音频调度页面，隐藏切换按钮
  if (route.path === '/dispatch/audio' || route.name === 'AudioDispatch') {
    return false;
  }

  // 其他情况根据props决定
  return !props.hideThemeToggle;
});

// 设备列表数据
const devices = ref<DispatchDevice[]>([
  { id: '1', name: '对讲机-01', type: 'intercom', status: 'online' },
  { id: '2', name: '对讲机-02', type: 'intercom', status: 'offline' },
  { id: '3', name: '对讲机-03', type: 'intercom', status: 'online' },
  { id: '4', name: '手持台-01', type: 'radio', status: 'online' },
  { id: '5', name: '手持台-02', type: 'radio', status: 'busy' },
  { id: '6', name: '手持台-03', type: 'radio', status: 'online' },
  { id: '7', name: '电话-01', type: 'phone', status: 'online' },
  { id: '8', name: '电话-02', type: 'phone', status: 'offline' }
]);

// 分组数据
const groups = ref<DispatchGroup[]>([
  { id: 'g1', name: '一线调度组', type: 'static', devices: ['1', '3', '4'] },
  { id: 'g2', name: '二线调度组', type: 'static', devices: ['2', '5', '7'] },
  { id: 'g3', name: '应急调度组', type: 'dynamic', devices: ['1', '4', '6', '7'] }
]);

// 录音文件数据
const recordings = ref([
  {
    id: 'r1',
    name: '通话录音_20241201_1430',
    createdAt: new Date(Date.now() - 3600000),
    duration: 300,
    url: '/recordings/r1.mp3'
  },
  {
    id: 'r2',
    name: '紧急呼叫_20241201_1500',
    createdAt: new Date(Date.now() - 1800000),
    duration: 120,
    url: '/recordings/r2.mp3'
  }
]);

// 通话记录数据
const callRecords = ref<CallRecord[]>([
  {
    id: 'c1',
    type: 'individual',
    caller: '1',
    receivers: ['4'],
    startTime: new Date(Date.now() - 3600000),
    endTime: new Date(Date.now() - 3550000),
    duration: 600,
    status: 'completed',
    hasRecording: true
  },
  {
    id: 'c2',
    type: 'group',
    caller: '3',
    receivers: ['1', '4', '6'],
    startTime: new Date(Date.now() - 1800000),
    endTime: new Date(Date.now() - 1700000),
    duration: 1200,
    status: 'completed',
    hasRecording: false
  },
  {
    id: 'c3',
    type: 'dynamic',
    caller: '7',
    receivers: ['1', '3', '5'],
    startTime: new Date(Date.now() - 900000),
    status: 'failed',
    hasRecording: false
  },
  {
    id: 'c4',
    type: 'emergency',
    caller: '1',
    receivers: ['2'],
    startTime: new Date(Date.now() - 300000),
    endTime: new Date(Date.now() - 240000),
    duration: 60,
    status: 'completed',
    hasRecording: true
  }
]);

// 界面状态
const searchKeyword = ref('');
const activeDeviceTab = ref('all');
const activeGroups = ref<string[]>([]);
const selectedDevices = ref<DispatchDevice[]>([]);
const activeCall = ref<CallRecord | null>(null);
const callStartTime = ref<number | null>(null);
const callDuration = ref('00:00');
const talkControlData = ref<{ id: string; name: string; hasTalkRight: boolean; volume: number; isMuted: boolean }[]>([]);
const groupDialogVisible = ref(false);
const editingGroup = ref<DispatchGroup | null>(null);
const groupForm = ref<{ name: string; type: 'static' | 'dynamic' | 'mixed'; devices: string[] }>({
  name: '',
  type: 'static',
  devices: []
});
const availableDevices = ref<DispatchDevice[]>([]);
const emergencyDialogVisible = ref(false);
const emergencyDevice = ref<DispatchDevice | null>(null);
const isRecording = ref(false);
const mainVolume = ref(80);
const micVolume = ref(70);
const activeRecordTab = ref('calls');
const audioDialogVisible = ref(false);
const audioDialogUrl = ref('');

// 监控数据（保留设备状态相关的数据）

// 定时器
let durationTimer: number | null = null;

// 计算属性：根据搜索关键词过滤设备
const filteredDevices = computed(() => {
  if (!searchKeyword.value) return devices.value;
  
  return devices.value.filter(device => 
    device.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    getDeviceTypeLabel(device.type).toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 设备状态统计
const onlineCount = computed(() => devices.value.filter(d => d.status === 'online').length);
const busyCount = computed(() => devices.value.filter(d => d.status === 'busy').length);
const offlineCount = computed(() => devices.value.filter(d => d.status === 'offline').length);

// 获取设备类型标签
const getDeviceTypeLabel = (type: string) => {
  switch (type) {
    case 'intercom': return '对讲机';
    case 'radio': return '手持台';
    case 'phone': return '电话';
    default: return '其他';
  }
};

// 获取设备状态类型
const getDeviceStatusType = (status?: string) => {
  switch (status) {
    case 'online': return 'success';
    case 'busy': return 'warning';
    case 'offline': return 'info';
    default: return 'info';
  }
};

// 获取设备状态标签
const getDeviceStatusLabel = (status?: string) => {
  switch (status) {
    case 'online': return '在线';
    case 'busy': return '忙碌';
    case 'offline': return '离线';
    default: return '未知';
  }
};

// 获取通话类型标签
const getCallTypeLabel = (type: string) => {
  switch (type) {
    case 'individual': return '单呼';
    case 'group': return '组呼';
    case 'dynamic': return '动态组呼';
    case 'mixed': return '混合编组';
    case 'emergency': return '紧急呼叫';
    default: return '未知';
  }
};

// 获取通话状态标签
const getCallStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return '已完成';
    case 'failed': return '失败';
    case 'ongoing': return '进行中';
    default: return '未知';
  }
};

// 根据ID获取设备
const getDeviceById = (id?: string) => {
  if (!id) return null;
  return devices.value.find(device => device.id === id);
};

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

// 格式化通话时长
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 处理设备点击
const handleDeviceClick = (device: DispatchDevice) => {
  // 通话中且不是动态组呼，禁止操作
  if (activeCall.value && activeCall.value.type !== 'dynamic') return;
  // 其余情况正常切换选中
  const index = selectedDevices.value.findIndex(d => d.id === device.id);
  if (index >= 0) {
    selectedDevices.value.splice(index, 1);
  } else {
    selectedDevices.value.push(device);
  }
};

// 移除选中设备
function removeSelectedDevice(device: DispatchDevice) {
  const index = selectedDevices.value.findIndex(d => d.id === device.id);
  if (index >= 0) {
    selectedDevices.value.splice(index, 1);
  }
}

// 主题切换功能 - 差异化显示模式配置
// 使用场景1：应急指挥调度大屏 (/emergency-command) - 默认大屏模式，显示切换按钮
// 使用场景2：独立音频调度页面 (/dispatch/audio) - 默认常规模式，隐藏切换按钮
// 支持通过props强制指定主题模式：forceTheme='large'|'normal'|'auto'
const toggleTheme = () => {
  isLargeScreenTheme.value = !isLargeScreenTheme.value;
  ElMessage.success(isLargeScreenTheme.value ? '已切换到大屏模式' : '已切换到常规模式');
};

// 新增功能
const refreshDevices = () => {
  // 模拟刷新设备状态
  devices.value.forEach(device => {
    if (Math.random() < 0.1) {
      device.status = device.status === 'online' ? 'offline' : 'online';
    }
  });
};

const selectedGroups = reactive<Record<string, boolean>>({});
const hasSelectedGroups = computed(() => Object.values(selectedGroups).some(Boolean));

function handleGroupSelect(group: DispatchGroup) {
  // 选中/取消选中分组时，自动将组内设备加入/移除已选设备
  if (selectedGroups[group.id]) {
    // 加入组内所有设备
    group.devices.forEach(id => {
      const device = getDeviceById(id);
      if (device && !selectedDevices.value.some(d => d.id === id)) {
        selectedDevices.value.push(device);
      }
    });
  } else {
    // 移除组内所有设备
    selectedDevices.value = selectedDevices.value.filter(d => !group.devices.includes(d.id));
  }
}

// 组呼：对所有选中分组的设备发起组呼
const startGroupCall = () => {
  const groupDeviceIds = Object.entries(selectedGroups)
    .filter(([_, checked]) => checked)
    .flatMap(([groupId]) => {
      const group = groups.value.find(g => g.id === groupId);
      return group ? group.devices : [];
    });
  const uniqueIds = Array.from(new Set(groupDeviceIds));
  if (uniqueIds.length === 0) return;
  const caller = devices.value[0];
  startCall('group', caller.id, uniqueIds);
};

// 动态组呼：分组+单独设备一起组呼
const startDynamicGroupCall = () => {
  const groupDeviceIds = Object.entries(selectedGroups)
    .filter(([_, checked]) => checked)
    .flatMap(([groupId]) => {
      const group = groups.value.find(g => g.id === groupId);
      return group ? group.devices : [];
    });
  const allIds = [...groupDeviceIds, ...selectedDevices.value.map(d => d.id)];
  const uniqueIds = Array.from(new Set(allIds));
  if (uniqueIds.length === 0) return;
  const caller = devices.value[0];
  startCall('dynamic', caller.id, uniqueIds);
};

// 单呼：只允许选中一个设备或一个分组
const startIndividualCall = () => {
  if (selectedDevices.value.length === 1 && !hasSelectedGroups.value) {
    const caller = devices.value[0];
    const receiver = selectedDevices.value[0];
    startCall('individual', caller.id, [receiver.id]);
  } else if (hasSelectedGroups.value && selectedDevices.value.length === 0) {
    // 选中一个分组时，组内所有设备作为接收方
    const groupDeviceIds = Object.entries(selectedGroups)
      .filter(([_, checked]) => checked)
      .flatMap(([groupId]) => {
        const group = groups.value.find(g => g.id === groupId);
        return group ? group.devices : [];
      });
    if (groupDeviceIds.length === 0) return;
    const caller = devices.value[0];
    startCall('individual', caller.id, groupDeviceIds);
  }
};

// 开始通话
const startCall = (type: 'individual' | 'group' | 'dynamic' | 'mixed', callerId: string, receiverIds: string[]) => {
  // 创建新的通话记录
  const newCall: CallRecord = {
    id: 'call-' + Date.now(),
    type,
    caller: callerId,
    receivers: receiverIds,
    startTime: new Date(),
    status: 'ongoing',
    hasRecording: false
  };
  
  // 设置当前通话
  activeCall.value = newCall;
  callStartTime.value = Date.now();
  
  // 初始化话权控制数据
  talkControlData.value = [
    { id: callerId, name: getDeviceById(callerId)?.name || '', hasTalkRight: true, volume: 80, isMuted: false },
    ...receiverIds.map(id => ({
      id,
      name: getDeviceById(id)?.name || '',
      hasTalkRight: false,
      volume: 80,
      isMuted: false
    }))
  ];
  
  // 启动通话计时器
  startCallTimer();
  
  // 更新设备状态为忙碌
  updateDeviceStatus(callerId, 'busy');
  receiverIds.forEach(id => updateDeviceStatus(id, 'busy'));
  
  // 添加到通话记录
  callRecords.value.unshift(newCall);
};

// 结束通话
const endCall = () => {
  if (!activeCall.value || !callStartTime.value) return;
  
  // 计算通话时长
  const duration = Math.floor((Date.now() - callStartTime.value) / 1000);
  
  // 更新通话记录
  const callIndex = callRecords.value.findIndex(record => record.id === activeCall.value?.id);
  if (callIndex >= 0) {
    callRecords.value[callIndex].status = 'completed';
    callRecords.value[callIndex].endTime = new Date();
    callRecords.value[callIndex].duration = duration;
    callRecords.value[callIndex].hasRecording = isRecording.value;
  }
  
  // 恢复设备状态为在线
  if (activeCall.value.caller) {
    updateDeviceStatus(activeCall.value.caller, 'online');
  }
  activeCall.value.receivers.forEach(id => updateDeviceStatus(id, 'online'));
  
  // 清除当前通话
  activeCall.value = null;
  callStartTime.value = null;
  isRecording.value = false;
  
  // 停止计时器
  stopCallTimer();
};

// 切换话权
const toggleTalkRight = (device: { id: string; name: string; hasTalkRight: boolean; volume: number; isMuted: boolean }) => {
  device.hasTalkRight = !device.hasTalkRight;
};

// 静音设备
const muteDevice = (device: { id: string; name: string; hasTalkRight: boolean; volume: number; isMuted: boolean }) => {
  device.isMuted = !device.isMuted;
};

// 更新设备状态
const updateDeviceStatus = (deviceId: string, status: 'online' | 'offline' | 'busy') => {
  const deviceIndex = devices.value.findIndex(device => device.id === deviceId);
  if (deviceIndex >= 0) {
    devices.value[deviceIndex].status = status;
  }
};

// 启动通话计时器
const startCallTimer = () => {
  if (durationTimer !== null) {
    stopCallTimer();
  }
  
  durationTimer = window.setInterval(() => {
    if (!callStartTime.value) return;
    
    const elapsedSeconds = Math.floor((Date.now() - callStartTime.value) / 1000);
    callDuration.value = formatDuration(elapsedSeconds);
  }, 1000);
};

// 停止通话计时器
const stopCallTimer = () => {
  if (durationTimer !== null) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
};

const createPresetGroup = () => {
  groupDialogVisible.value = true;
  editingGroup.value = null;
  groupForm.value = { name: '', type: 'static', devices: [] };
  availableDevices.value = devices.value.filter(device => !groups.value.some(group => group.devices.includes(device.id)));
};

const editGroup = (group: DispatchGroup) => {
  editingGroup.value = group;
  groupForm.value = { name: group.name, type: group.type, devices: group.devices };
  availableDevices.value = devices.value.filter(device => !groups.value.some(g => g.id === group.id && g.devices.includes(device.id)));
  groupDialogVisible.value = true;
};

const deleteGroup = (group: DispatchGroup) => {
  ElMessageBox.confirm(
    `确定要删除分组"${group.name}"吗？删除后分组内的设备将被移除。`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = groups.value.findIndex(g => g.id === group.id);
    if (index >= 0) {
      groups.value.splice(index, 1);
      // 如果该分组当前被选中，取消选中状态
      if (selectedGroups[group.id]) {
        selectedGroups[group.id] = false;
        // 从已选设备中移除该分组的设备
        selectedDevices.value = selectedDevices.value.filter(d => !group.devices.includes(d.id));
      }
      ElMessage.success('分组删除成功');
    }
  }).catch(() => {
    // 用户取消删除，不执行任何操作
  });
};

const saveGroup = () => {
  if (editingGroup.value) {
    // 编辑现有组
    const index = groups.value.findIndex(g => g.id === editingGroup.value?.id);
    if (index >= 0) {
      groups.value[index] = {
        ...editingGroup.value,
        name: groupForm.value.name,
        type: groupForm.value.type,
        devices: groupForm.value.devices
      };
    }
  } else {
    // 创建新组
    const newGroup: DispatchGroup = {
      id: 'g' + Date.now(),
      name: groupForm.value.name,
      type: groupForm.value.type,
      devices: groupForm.value.devices
    };
    groups.value.push(newGroup);
  }
  groupDialogVisible.value = false;
};

const startRecording = () => {
  if (!activeCall.value) return;
  isRecording.value = !isRecording.value;
  if (isRecording.value) {
    // 开始录音逻辑
    console.log('开始录音');
  } else {
    // 停止录音逻辑
    console.log('停止录音');
  }
};

const startBroadcast = () => {
  // 实现开始广播的逻辑
  console.log('开始广播到选中的设备');
};

const downloadRecording = (recording: any) => {
  // 实现下载录音的逻辑
  console.log('下载录音:', recording.name);
};

const deleteRecording = (recording: any) => {
  // 实现删除录音的逻辑
  const index = recordings.value.findIndex(r => r.id === recording.id);
  if (index >= 0) {
    recordings.value.splice(index, 1);
  }
};

const playRecording = (recording: any) => {
  audioDialogUrl.value = recording.url;
  audioDialogVisible.value = true;
};

const exportRecords = () => {
  // 实现导出通话记录的逻辑
  console.log('导出通话记录');
};



const emergencyCall = (device: DispatchDevice) => {
  emergencyDialogVisible.value = true;
  emergencyDevice.value = device;
};

const confirmEmergencyCall = async () => {
  if (!emergencyDevice.value) return;
  // 中断所有当前通话
  if (activeCall.value) {
    endCall();
    await nextTick();
  }
  // 发起紧急呼叫
  startCall('individual', devices.value[0].id, [emergencyDevice.value.id]);
  emergencyDialogVisible.value = false;
  await nextTick();
  if (activeCall.value) {
    activeCall.value.type = 'emergency';
    // 替换已选设备为紧急呼叫目标
    selectedDevices.value.splice(0, selectedDevices.value.length, emergencyDevice.value);
    // 同步话权控制
    talkControlData.value.splice(0, talkControlData.value.length,
      {
        id: devices.value[0].id,
        name: getDeviceById(devices.value[0].id)?.name || '',
        hasTalkRight: true,
        volume: 80,
        isMuted: false
      },
      {
        id: emergencyDevice.value.id,
        name: emergencyDevice.value.name,
        hasTalkRight: false,
        volume: 80,
        isMuted: false
      }
    );
  }
};

const canRemoveDeviceInCall = computed(() => {
  if (!activeCall.value) return true;
  if (activeCall.value.type === 'dynamic') return true;
  return false;
});

const isDeviceSelectionDisabled = computed(() => {
  if (!activeCall.value) return false;
  if (activeCall.value.type === 'dynamic') return false;
  return true;
});

function isDeviceSelected(id: string) {
  return selectedDevices.value.some(d => d.id === id);
}

const isEmergencyCall = computed(() => activeCall.value && activeCall.value.type === 'emergency');
function isEmergencyTarget(device: DispatchDevice) {
  return isEmergencyCall.value && emergencyDevice.value && device.id === emergencyDevice.value.id;
}
const onlineRate = computed(() => devices.value.length ? Math.round(onlineCount.value / devices.value.length * 100) : 0);

// 设备类型统计
const deviceTypeStats = computed(() => {
  const stats: Record<string, number> = {};
  devices.value.forEach(device => {
    stats[device.type] = (stats[device.type] || 0) + 1;
  });
  return stats;
});



// 组件挂载时
onMounted(() => {
  availableDevices.value = devices.value.filter(device => !groups.value.some(group => group.devices.includes(device.id)));
});

// 组件卸载时
onUnmounted(() => {
  stopCallTimer();
});

// 监听selectedDevices变化，动态组呼通话中自动同步话权控制
watch(selectedDevices, (newVal, oldVal) => {
  if (activeCall.value && activeCall.value.type === 'dynamic') {
    // 找出新增的设备
    const currentIds = talkControlData.value.map(d => d.id);
    const newDevices = newVal.filter(d => !currentIds.includes(d.id));
    newDevices.forEach(device => {
      talkControlData.value.push({
        id: device.id,
        name: device.name,
        hasTalkRight: false,
        volume: 80,
        isMuted: false
      });
    });
    // 移除已不在selectedDevices中的设备
    talkControlData.value = talkControlData.value.filter(d => newVal.some(dev => dev.id === d.id) || d.hasTalkRight);
  }
}, { deep: true });
</script>

<style scoped>
/* ==================== 大屏主题样式 ==================== */
.large-screen-theme {
  /* 主背景 - 深色渐变 */
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%) !important;
  color: #e8f4fd !important;
}

.large-screen-theme .el-card {
  background: rgba(26, 31, 46, 0.8) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 20px rgba(64, 158, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
}

.large-screen-theme .el-card__header {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.05) 100%) !important;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3) !important;
  color: #e8f4fd !important;
}

.large-screen-theme .el-card__body {
  background: rgba(15, 20, 25, 0.6) !important;
  color: #e8f4fd !important;
}

/* 修复白色背景内容区域的文字颜色 */
.large-screen-theme .el-card__body * {
  color: #e8f4fd !important;
}

.large-screen-theme .el-card__body .el-text {
  color: #e8f4fd !important;
}

.large-screen-theme .el-card__body p,
.large-screen-theme .el-card__body span,
.large-screen-theme .el-card__body div {
  color: #e8f4fd !important;
}

/* 特殊处理表单标签 */
.large-screen-theme .el-form-item__label {
  color: #74b9ff !important;
  font-weight: 600 !important;
}

/* 强制覆盖所有白色背景 */
.large-screen-theme .el-card,
.large-screen-theme .el-card__header,
.large-screen-theme .el-card__body,
.large-screen-theme .el-dialog,
.large-screen-theme .el-dialog__body,
.large-screen-theme .el-form,
.large-screen-theme .el-form-item,
.large-screen-theme .el-main,
.large-screen-theme .el-container,
.large-screen-theme .el-aside,
.large-screen-theme .el-header,
.large-screen-theme .el-footer {
  background: rgba(26, 31, 46, 0.8) !important;
  color: #e8f4fd !important;
}

/* 修复可能的白色背景元素 */
.large-screen-theme [style*="background: white"],
.large-screen-theme [style*="background: #fff"],
.large-screen-theme [style*="background: #ffffff"],
.large-screen-theme [style*="background-color: white"],
.large-screen-theme [style*="background-color: #fff"],
.large-screen-theme [style*="background-color: #ffffff"] {
  background: rgba(26, 31, 46, 0.8) !important;
  color: #e8f4fd !important;
}

/* 卡片选中状态 */
.large-screen-theme .el-card.is-selected,
.large-screen-theme .el-card:hover,
.large-screen-theme .el-card.active {
  background: rgba(64, 158, 255, 0.15) !important;
  border-color: #74b9ff !important;
  box-shadow: 0 0 20px rgba(116, 185, 255, 0.3) !important;
  transform: translateY(-2px) !important;
  transition: all 0.3s ease !important;
}

.large-screen-theme .el-card.is-selected .el-card__body,
.large-screen-theme .el-card:hover .el-card__body,
.large-screen-theme .el-card.active .el-card__body {
  background: rgba(64, 158, 255, 0.1) !important;
  color: #e8f4fd !important;
}

/* 修复内联样式的白色背景 */
.large-screen-theme div[style*="background"],
.large-screen-theme span[style*="background"] {
  background: rgba(26, 31, 46, 0.8) !important;
  color: #e8f4fd !important;
}

/* 增强文字对比度 */
.large-screen-theme {
  font-size: 14px !important;
  line-height: 1.6 !important;
}

.large-screen-theme * {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
}

/* 确保所有文本都有足够的对比度 */
.large-screen-theme,
.large-screen-theme * {
  color: #e8f4fd !important;
}

/* 特殊元素的颜色覆盖 */
.large-screen-theme .el-text--primary {
  color: #74b9ff !important;
}

.large-screen-theme .el-text--success {
  color: #00d4aa !important;
}

.large-screen-theme .el-text--warning {
  color: #ffc107 !important;
}

.large-screen-theme .el-text--danger {
  color: #ff6b6b !important;
}

.large-screen-theme .el-text--info {
  color: rgba(232, 244, 253, 0.8) !important;
}

/* 修复可能的深色文字 */
.large-screen-theme [style*="color: #000"],
.large-screen-theme [style*="color: black"],
.large-screen-theme [style*="color: #333"],
.large-screen-theme [style*="color: #666"] {
  color: #e8f4fd !important;
}

/* 按钮大屏样式 */
.large-screen-theme .el-button {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.8) 0%, rgba(64, 158, 255, 0.6) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.8) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3) !important;
  transition: all 0.3s ease !important;
}

.large-screen-theme .el-button:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 1) 0%, rgba(64, 158, 255, 0.8) 100%) !important;
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5) !important;
  transform: translateY(-2px) !important;
}


/* 树形控件大屏样式 */
.large-screen-theme .el-tree {
  background: transparent !important;
  color: #e8f4fd !important;
}

.large-screen-theme .el-tree-node__content {
  background: rgba(26, 31, 46, 0.3) !important;
  border: 1px solid rgba(64, 158, 255, 0.1) !important;
  border-radius: 8px !important;
  margin-bottom: 4px !important;
  padding: 8px 12px !important;
  transition: all 0.3s ease !important;
}

.large-screen-theme .el-tree-node__content:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  border-color: rgba(64, 158, 255, 0.3) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2) !important;
}

/* 选项卡大屏样式 */
.large-screen-theme .el-tabs__header {
  background: rgba(26, 31, 46, 0.6) !important;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3) !important;
}

.large-screen-theme .el-tabs__item {
  color: rgba(232, 244, 253, 0.7) !important;
}

.large-screen-theme .el-tabs__item.is-active {
  color: #74b9ff !important;
  border-bottom-color: #74b9ff !important;
}

.large-screen-theme .el-tabs__nav-wrap::after {
  background-color: rgba(64, 158, 255, 0.3) !important;
}

/* 设备状态指示器大屏样式 */
.large-screen-theme .status-indicator {
  width: 12px !important;
  height: 12px !important;
  border-radius: 50% !important;
  display: inline-block !important;
  margin-right: 6px !important;
  box-shadow: 0 0 10px currentColor !important;
  animation: pulse 2s infinite !important;
}

.large-screen-theme .status-indicator.online {
  background: #00d4aa !important;
  box-shadow: 0 0 15px #00d4aa !important;
}

.large-screen-theme .status-indicator.offline {
  background: #636e72 !important;
  box-shadow: 0 0 10px #636e72 !important;
}

.large-screen-theme .status-indicator.busy {
  background: #ff6b6b !important;
  box-shadow: 0 0 15px #ff6b6b !important;
}

.large-screen-theme .status-indicator.calling {
  background: #ffc107 !important;
  box-shadow: 0 0 15px #ffc107 !important;
}

/* 数据统计卡片大屏样式 */
.large-screen-theme .stat-card {
  background: linear-gradient(135deg, rgba(26, 31, 46, 0.9) 0%, rgba(15, 20, 25, 0.9) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              0 0 20px rgba(64, 158, 255, 0.1) !important;
  backdrop-filter: blur(15px) !important;
}

.large-screen-theme .stat-header {
  border-bottom: 1px solid rgba(64, 158, 255, 0.3) !important;
  color: #e8f4fd !important;
}

.large-screen-theme .stat-header span {
  color: #74b9ff !important;
  font-weight: 600 !important;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.5) !important;
}

/* 重要数据高亮显示 */
.large-screen-theme .device-count,
.large-screen-theme .call-duration,
.large-screen-theme .signal-strength {
  font-size: 24px !important;
  font-weight: bold !important;
  color: #00d4aa !important;
  text-shadow: 0 0 15px rgba(0, 212, 170, 0.6) !important;
  background: linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(0, 212, 170, 0.05) 100%) !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  border: 1px solid rgba(0, 212, 170, 0.3) !important;
  display: inline-block !important;
  margin: 4px 0 !important;
}

/* 设备名称和类型大屏样式 */
.large-screen-theme .device-name {
  color: #e8f4fd !important;
  font-weight: 500 !important;
  font-size: 14px !important;
}

.large-screen-theme .device-type {
  color: rgba(232, 244, 253, 0.7) !important;
  font-size: 12px !important;
}

/* 选中设备指示器 */
.large-screen-theme .selected-indicator {
  background: linear-gradient(135deg, #00d4aa 0%, #00b894 100%) !important;
  color: #ffffff !important;
  padding: 2px 8px !important;
  border-radius: 12px !important;
  font-size: 11px !important;
  font-weight: bold !important;
  box-shadow: 0 0 15px rgba(0, 212, 170, 0.6) !important;
  animation: glow 2s ease-in-out infinite alternate !important;
}

/* 紧急呼叫徽章 */
.large-screen-theme .emergency-badge {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
  color: #ffffff !important;
  border-radius: 12px !important;
  font-size: 11px !important;
  padding: 4px 10px !important;
  font-weight: bold !important;
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.8) !important;
  animation: emergencyPulse 1s ease-in-out infinite alternate !important;
}

/* 录音卡片大屏样式 */
.large-screen-theme .modern-recording-card {
  background: linear-gradient(135deg, rgba(26, 31, 46, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(10px) !important;
}

.large-screen-theme .modern-recording-card:hover {
  border-color: rgba(64, 158, 255, 0.5) !important;
  box-shadow: 0 8px 30px rgba(64, 158, 255, 0.2) !important;
  transform: translateY(-3px) scale(1.02) !important;
}

.large-screen-theme .recording-cover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.1) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
}

.large-screen-theme .audio-icon {
  color: #74b9ff !important;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.5) !important;
}

.large-screen-theme .recording-title {
  color: #e8f4fd !important;
  font-weight: 600 !important;
}

.large-screen-theme .recording-time {
  color: rgba(232, 244, 253, 0.6) !important;
}

/* 监控面板标题大屏样式 */
.large-screen-theme .monitor-section-title {
  color: #74b9ff !important;
  border-left: 4px solid #74b9ff !important;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.5) !important;
  background: linear-gradient(90deg, rgba(116, 185, 255, 0.1) 0%, transparent 100%) !important;
  padding: 8px 16px !important;
  border-radius: 0 8px 8px 0 !important;
}

/* 动画效果 */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

@keyframes glow {
  from { box-shadow: 0 0 15px rgba(0, 212, 170, 0.6); }
  to { box-shadow: 0 0 25px rgba(0, 212, 170, 0.9); }
}

@keyframes emergencyPulse {
  from {
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.8);
    transform: scale(1);
  }
  to {
    box-shadow: 0 0 30px rgba(255, 107, 107, 1);
    transform: scale(1.05);
  }
}

/* 表格大屏样式 */
.large-screen-theme .el-table {
  background: rgba(15, 20, 25, 0.8) !important;
  color: #e8f4fd !important;
}

.large-screen-theme .el-table th {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.1) 100%) !important;
  color: #74b9ff !important;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3) !important;
  font-weight: 600 !important;
}

.large-screen-theme .el-table td {
  border-bottom: 1px solid rgba(64, 158, 255, 0.1) !important;
  background: rgba(26, 31, 46, 0.3) !important;
}

.large-screen-theme .el-table tr:hover td {
  background: rgba(64, 158, 255, 0.1) !important;
}

/* 进度条大屏样式 */
.large-screen-theme .el-progress-bar__outer {
  background: rgba(15, 20, 25, 0.8) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
}

.large-screen-theme .el-progress-bar__inner {
  background: linear-gradient(90deg, #00d4aa 0%, #74b9ff 100%) !important;
  box-shadow: 0 0 15px rgba(0, 212, 170, 0.6) !important;
}

/* 滑块组件大屏样式 - 增强可见性 */
.large-screen-theme .el-slider__runway {
  background: rgba(255, 255, 255, 0.25) !important;
  border: 2px solid rgba(116, 185, 255, 0.5) !important;
  height: 10px !important;
  border-radius: 5px !important;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3) !important;
}

.large-screen-theme .el-slider__bar {
  background: linear-gradient(90deg, #74b9ff 0%, #00d4aa 100%) !important;
  box-shadow: 0 0 15px rgba(116, 185, 255, 0.8) !important;
  border-radius: 5px !important;
  height: 10px !important;
}

.large-screen-theme .el-slider__button {
  background: #74b9ff !important;
  border: 3px solid #ffffff !important;
  box-shadow: 0 0 20px rgba(116, 185, 255, 1) !important;
  width: 22px !important;
  height: 22px !important;
  transform: scale(1.1) !important;
}

.large-screen-theme .el-slider__button:hover {
  background: #00d4aa !important;
  box-shadow: 0 0 25px rgba(0, 212, 170, 1) !important;
  transform: scale(1.3) !important;
}

/* 对话框大屏样式 - 增强可见性 - 使用更强的选择器 */
.large-screen-theme :deep(.el-dialog),
.large-screen-theme.el-dialog,
body.large-screen-theme .el-dialog {
  background: linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(26, 31, 46, 0.98) 100%) !important;
  border: 3px solid rgba(64, 158, 255, 0.9) !important;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9),
              0 0 50px rgba(64, 158, 255, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(25px) !important;
  border-radius: 12px !important;
}

.large-screen-theme :deep(.el-dialog__header),
.large-screen-theme.el-dialog__header,
body.large-screen-theme .el-dialog__header {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.4) 0%, rgba(64, 158, 255, 0.2) 100%) !important;
  border-bottom: 3px solid rgba(64, 158, 255, 0.8) !important;
  box-shadow: 0 3px 15px rgba(64, 158, 255, 0.3) !important;
  padding: 20px 24px !important;
}

.large-screen-theme :deep(.el-dialog__title),
.large-screen-theme.el-dialog__title,
body.large-screen-theme .el-dialog__title {
  color: #74b9ff !important;
  font-weight: 700 !important;
  text-shadow: 0 0 20px rgba(116, 185, 255, 0.9) !important;
  font-size: 20px !important;
  letter-spacing: 1px !important;
}

.large-screen-theme :deep(.el-dialog__body),
.large-screen-theme.el-dialog__body,
body.large-screen-theme .el-dialog__body {
  background: rgba(15, 20, 25, 0.98) !important;
  color: #e8f4fd !important;
  border: 2px solid rgba(64, 158, 255, 0.3) !important;
  border-top: none !important;
  border-bottom: none !important;
  padding: 24px !important;
  min-height: 200px !important;
}

.large-screen-theme .el-dialog__footer {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.05) 100%) !important;
  border-top: 2px solid rgba(64, 158, 255, 0.4) !important;
  border-left: 1px solid rgba(64, 158, 255, 0.2) !important;
  border-right: 1px solid rgba(64, 158, 255, 0.2) !important;
  border-bottom: 1px solid rgba(64, 158, 255, 0.2) !important;
}

/* 强制覆盖所有弹窗类组件的白色背景 */
.large-screen-theme .el-dialog,
.large-screen-theme .el-dialog__wrapper,
.large-screen-theme .el-dialog__header,
.large-screen-theme .el-dialog__body,
.large-screen-theme .el-dialog__footer,
.large-screen-theme .el-drawer,
.large-screen-theme .el-drawer__body,
.large-screen-theme .el-popover,
.large-screen-theme .el-tooltip__popper,
.large-screen-theme .el-dropdown-menu {
  background: rgba(26, 31, 46, 0.95) !important;
  color: #e8f4fd !important;
}

/* 修复所有可能的白色背景容器 */
.large-screen-theme div,
.large-screen-theme .el-row,
.large-screen-theme .el-col,
.large-screen-theme .content-wrapper,
.large-screen-theme .form-container,
.large-screen-theme .dialog-content,
.large-screen-theme .panel-content,
.large-screen-theme .white-bg,
.large-screen-theme .bg-white {
  background-color: transparent !important;
}

/* 特殊处理需要深色背景的容器 */
.large-screen-theme .main-content,
.large-screen-theme .content-panel,
.large-screen-theme .form-panel,
.large-screen-theme .dialog-panel {
  background: rgba(26, 31, 46, 0.8) !important;
  color: #e8f4fd !important;
}

/* 下拉菜单和选择器样式 */
.large-screen-theme .el-select-dropdown,
.large-screen-theme .el-dropdown-menu,
.large-screen-theme .el-cascader-panel,
.large-screen-theme .el-date-picker,
.large-screen-theme .el-time-picker,
.large-screen-theme .el-picker-panel {
  background: rgba(26, 31, 46, 0.95) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
}

.large-screen-theme .el-select-dropdown__item,
.large-screen-theme .el-dropdown-menu__item,
.large-screen-theme .el-cascader-node,
.large-screen-theme .el-date-table td,
.large-screen-theme .el-time-spinner__item {
  background: transparent !important;
  color: #e8f4fd !important;
}

.large-screen-theme .el-select-dropdown__item:hover,
.large-screen-theme .el-dropdown-menu__item:hover,
.large-screen-theme .el-cascader-node:hover {
  background: rgba(64, 158, 255, 0.2) !important;
  color: #74b9ff !important;
}

/* 消息框和确认框样式 */
.large-screen-theme .el-message-box,
.large-screen-theme .el-message,
.large-screen-theme .el-notification {
  background: rgba(26, 31, 46, 0.95) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(20px) !important;
}

.large-screen-theme .el-message-box__header,
.large-screen-theme .el-message-box__content,
.large-screen-theme .el-message-box__btns {
  background: transparent !important;
  color: #e8f4fd !important;
}

.large-screen-theme .el-message-box__title {
  color: #74b9ff !important;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.5) !important;
}

/* 全局白色背景强制覆盖 - 最高优先级 */
.large-screen-theme * {
  background-color: transparent !important;
}

.large-screen-theme *[style*="background: white"],
.large-screen-theme *[style*="background: #fff"],
.large-screen-theme *[style*="background: #ffffff"],
.large-screen-theme *[style*="background-color: white"],
.large-screen-theme *[style*="background-color: #fff"],
.large-screen-theme *[style*="background-color: #ffffff"],
.large-screen-theme *.white-bg,
.large-screen-theme *.bg-white {
  background: rgba(26, 31, 46, 0.8) !important;
  color: #e8f4fd !important;
}

/* 需要保持深色背景的重要容器 */
.large-screen-theme .el-card,
.large-screen-theme .el-dialog,
.large-screen-theme .el-drawer,
.large-screen-theme .el-popover,
.large-screen-theme .el-tooltip__popper,
.large-screen-theme .el-select-dropdown,
.large-screen-theme .el-dropdown-menu,
.large-screen-theme .el-message-box,
.large-screen-theme .main-container,
.large-screen-theme .content-area {
  background: rgba(26, 31, 46, 0.8) !important;
}

/* 音量控制和进度条可见性修复 - 已合并到上面的滑块样式中 */

/* 进度圆圈可见性修复 - 大幅增强 */
.large-screen-theme .el-progress-circle {
  color: #74b9ff !important;
  filter: brightness(1.5) contrast(1.3) !important;
}

.large-screen-theme .el-progress__text {
  color: #74b9ff !important;
  font-weight: bold !important;
  font-size: 14px !important;
  text-shadow: 0 0 15px rgba(116, 185, 255, 0.8) !important;
}

.large-screen-theme .el-progress-circle__path {
  stroke: rgba(255, 255, 255, 0.3) !important;
  stroke-width: 4 !important;
}

.large-screen-theme .el-progress-circle__track {
  stroke: #74b9ff !important;
  stroke-width: 6 !important;
  filter: drop-shadow(0 0 12px rgba(116, 185, 255, 0.9)) !important;
}

/* 进度圆圈整体容器增强 */
.large-screen-theme .el-progress {
  filter: brightness(1.4) contrast(1.2) !important;
}

.large-screen-theme .el-progress svg {
  filter: drop-shadow(0 0 10px rgba(116, 185, 255, 0.7)) !important;
}

/* 通话记录表格中的进度指示器 */
.large-screen-theme .call-progress,
.large-screen-theme .progress-indicator {
  color: #74b9ff !important;
  background: rgba(116, 185, 255, 0.1) !important;
  border: 1px solid rgba(116, 185, 255, 0.3) !important;
  border-radius: 50% !important;
  box-shadow: 0 0 15px rgba(116, 185, 255, 0.5) !important;
}

/* 音量控制区域整体样式 */
.large-screen-theme .volume-control,
.large-screen-theme .audio-control {
  background: rgba(26, 31, 46, 0.6) !important;
  border: 1px solid rgba(116, 185, 255, 0.2) !important;
  border-radius: 8px !important;
  padding: 10px !important;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3) !important;
}

/* 音量数值显示 */
.large-screen-theme .volume-value,
.large-screen-theme .audio-level {
  color: #74b9ff !important;
  font-weight: bold !important;
  font-size: 14px !important;
  text-shadow: 0 0 15px rgba(116, 185, 255, 0.8) !important;
  background: rgba(116, 185, 255, 0.15) !important;
  padding: 4px 10px !important;
  border-radius: 6px !important;
  border: 2px solid rgba(116, 185, 255, 0.4) !important;
  box-shadow: 0 0 10px rgba(116, 185, 255, 0.3) !important;
}

/* 音量控制标签增强 */
.large-screen-theme .volume-item span,
.large-screen-theme .volume-control h3 {
  color: #74b9ff !important;
  font-weight: bold !important;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.5) !important;
}

/* 通话状态指示器 */
.large-screen-theme .call-status,
.large-screen-theme .status-indicator {
  border: 2px solid #74b9ff !important;
  background: rgba(116, 185, 255, 0.2) !important;
  box-shadow: 0 0 15px rgba(116, 185, 255, 0.6) !important;
}

.large-screen-theme .call-status.active,
.large-screen-theme .status-indicator.active {
  background: rgba(0, 212, 170, 0.3) !important;
  border-color: #00d4aa !important;
  box-shadow: 0 0 20px rgba(0, 212, 170, 0.8) !important;
}

/* 表格中的圆形进度指示器特殊处理 */
.large-screen-theme .el-table .el-progress,
.large-screen-theme .el-table .el-progress-circle,
.large-screen-theme .el-table .progress-circle {
  filter: brightness(1.5) contrast(1.2) !important;
}

.large-screen-theme .el-table .el-progress-circle svg,
.large-screen-theme .el-table .progress-circle svg {
  filter: drop-shadow(0 0 8px rgba(116, 185, 255, 0.8)) !important;
}

.large-screen-theme .el-table .el-progress-circle svg circle,
.large-screen-theme .el-table .progress-circle svg circle {
  stroke: #74b9ff !important;
  stroke-width: 3 !important;
}

.large-screen-theme .el-table .el-progress-circle svg circle:first-child,
.large-screen-theme .el-table .progress-circle svg circle:first-child {
  stroke: rgba(255, 255, 255, 0.2) !important;
  stroke-width: 2 !important;
}

/* 音量滑块在表格中的特殊处理 */
.large-screen-theme .el-table .el-slider,
.large-screen-theme .el-table .volume-slider {
  filter: brightness(1.3) contrast(1.1) !important;
}

.large-screen-theme .el-table .el-slider__runway {
  background: rgba(255, 255, 255, 0.3) !important;
  height: 6px !important;
  border-radius: 3px !important;
  border: 1px solid rgba(116, 185, 255, 0.4) !important;
}

.large-screen-theme .el-table .el-slider__bar {
  background: linear-gradient(90deg, #74b9ff 0%, #00d4aa 100%) !important;
  height: 6px !important;
  border-radius: 3px !important;
  box-shadow: 0 0 12px rgba(116, 185, 255, 0.7) !important;
}

.large-screen-theme .el-table .el-slider__button {
  width: 16px !important;
  height: 16px !important;
  background: #74b9ff !important;
  border: 2px solid #ffffff !important;
  box-shadow: 0 0 15px rgba(116, 185, 255, 0.9) !important;
}

/* 消息提示大屏样式 */
.large-screen-theme .el-message {
  background: linear-gradient(135deg, rgba(26, 31, 46, 0.9) 0%, rgba(15, 20, 25, 0.9) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  color: #e8f4fd !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(15px) !important;
}

/* 下拉选择器大屏样式 */
.large-screen-theme .el-select .el-input .el-input__wrapper {
  background: rgba(15, 20, 25, 0.8) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
}

.large-screen-theme .el-select-dropdown {
  background: linear-gradient(135deg, rgba(26, 31, 46, 0.95) 0%, rgba(15, 20, 25, 0.95) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(15px) !important;
}

.large-screen-theme .el-select-dropdown__item {
  color: #e8f4fd !important;
  background: transparent !important;
}

.large-screen-theme .el-select-dropdown__item:hover {
  background: rgba(64, 158, 255, 0.1) !important;
}

.large-screen-theme .el-select-dropdown__item.selected {
  background: rgba(64, 158, 255, 0.2) !important;
  color: #74b9ff !important;
}

/* 分页器大屏样式 */
.large-screen-theme .el-pagination {
  color: #e8f4fd !important;
}

.large-screen-theme .el-pagination button {
  background: rgba(26, 31, 46, 0.8) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  color: #e8f4fd !important;
}

.large-screen-theme .el-pagination button:hover {
  background: rgba(64, 158, 255, 0.2) !important;
  border-color: rgba(64, 158, 255, 0.5) !important;
}

.large-screen-theme .el-pagination .el-pager li {
  background: rgba(26, 31, 46, 0.8) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  color: #e8f4fd !important;
}

.large-screen-theme .el-pagination .el-pager li:hover {
  background: rgba(64, 158, 255, 0.2) !important;
}

.large-screen-theme .el-pagination .el-pager li.active {
  background: linear-gradient(135deg, #74b9ff 0%, #409EFF 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(116, 185, 255, 0.6) !important;
}

/* 工具提示大屏样式 */
.large-screen-theme .el-tooltip__popper {
  background: linear-gradient(135deg, rgba(26, 31, 46, 0.95) 0%, rgba(15, 20, 25, 0.95) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  color: #e8f4fd !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(15px) !important;
}

/* 滚动条大屏样式 */
.large-screen-theme ::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
}

.large-screen-theme ::-webkit-scrollbar-track {
  background: rgba(15, 20, 25, 0.5) !important;
  border-radius: 4px !important;
}

.large-screen-theme ::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.6) 0%, rgba(64, 158, 255, 0.4) 100%) !important;
  border-radius: 4px !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
}

.large-screen-theme ::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.8) 0%, rgba(64, 158, 255, 0.6) 100%) !important;
}

/* 主题切换按钮样式 */
.theme-toggle-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

/* 主题切换按钮样式 - 差异化显示配置 */
/* 应急指挥调度大屏：显示切换按钮，允许操作员切换模式 */
/* 独立音频调度页面：隐藏切换按钮，固定使用常规模式 */
.theme-toggle-btn {
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.large-screen-theme .theme-toggle-btn {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.8) 0%, rgba(64, 158, 255, 0.6) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.8) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3) !important;
}

.large-screen-theme .theme-toggle-btn:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 1) 0%, rgba(64, 158, 255, 0.8) 100%) !important;
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5) !important;
  transform: translateY(-2px) !important;
}

/* 常规主题下的切换按钮 */
.audio-dispatch-container:not(.large-screen-theme) .theme-toggle-btn {
  background: #ffffff;
  border: 1px solid #dcdfe6;
  color: #606266;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.audio-dispatch-container:not(.large-screen-theme) .theme-toggle-btn:hover {
  background: #409EFF;
  border-color: #409EFF;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

/* 全局文字颜色强制覆盖 - 最高优先级 */
.large-screen-theme * {
  color: #e8f4fd !important;
}

.large-screen-theme .el-button * {
  color: #ffffff !important;
}

.large-screen-theme .el-tag * {
  color: #ffffff !important;
}

/* 修复可能的黑色文字 */
.large-screen-theme [style*="color:#000"],
.large-screen-theme [style*="color: #000"],
.large-screen-theme [style*="color:black"],
.large-screen-theme [style*="color: black"] {
  color: #e8f4fd !important;
}

/* 原有样式保持 */
.audio-dispatch-container {
  padding: 20px;
  background: #f5f7fa;
  height: calc(100vh - var(--header-height) - 40px); /* 使用相对高度 */
  overflow: hidden;
}

/* 确保行和列正确处理高度 */
:deep(.el-row) {
  height: 100%;
  min-height: 0;
}

:deep(.el-col) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
}

.device-list-card,
.call-control-card,
.call-record-card {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 卡片内容区域样式 */
:deep(.device-list-card .el-card__body),
:deep(.call-control-card .el-card__body),
:deep(.call-record-card .el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

/* 设备列表卡片内容滚动 */
:deep(.device-list-card .el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.device-list-card .el-tab-pane) {
  height: 100%;
  overflow-y: auto;
}

:deep(.device-list-card .el-tree) {
  max-height: 100%;
  overflow-y: auto;
}

/* 通话控制区域滚动 */
.call-control-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px; /* 为滚动条留出空间 */
}

/* 通话记录区域滚动 */
:deep(.call-record-card .el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.call-record-card .el-tab-pane) {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px; /* 为滚动条留出空间 */
}

/* 时间线容器滚动 */
:deep(.call-record-card .el-timeline) {
  max-height: 100%;
  overflow-y: auto;
}

.device-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.device-item:hover {
  background-color: #f5f7fa;
}

.device-name {
  margin-left: 8px;
  flex: 1;
  font-weight: 500;
}

.device-type {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.device-actions {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.device-item:hover .device-actions {
  opacity: 1;
}

.group-device-item {
  padding: 5px 0;
}

.group-controls {
  margin-bottom: 16px;
}

.group-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.group-ops {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-left: 8px;
}

.group-actions {
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.monitor-panel {
  padding: 16px 0;
  height: 100%;
  overflow-y: auto;
}

.monitor-item {
  margin-bottom: 24px;
}

.monitor-item h4 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.status-stats {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.stat-item {
  text-align: center;
  flex: 1;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  display: block;
}

.stat-label {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
}



.selected-devices {
  margin-bottom: 24px;
}

.selected-devices h3 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.selected-devices .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  border-radius: 6px;
}

.call-actions {
  margin-bottom: 24px;
  text-align: center;
}

.call-controls {
  display: flex;
  gap: 8px;
}

.call-status {
  margin-bottom: 24px;
}

.call-info {
  margin-top: 12px;
}

.call-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #606266;
}

.volume-control {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.volume-control h3 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.volume-sliders {
  display: flex;
  gap: 24px;
}

.volume-item {
  flex: 1;
}

.volume-item span {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.talk-control {
  margin-top: 24px;
  flex-shrink: 0; /* 防止被压缩 */
}

.talk-control h3 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

/* 话权控制表格滚动 */
:deep(.talk-control .el-table) {
  max-height: 300px;
  overflow-y: auto;
}

/* 确保各个区域的间距和布局 */
.selected-devices,
.call-actions,
.call-status,
.volume-control {
  flex-shrink: 0; /* 防止被压缩 */
}

.recording-info {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #409EFF;
}

.recording-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px; /* 为滚动条留出空间 */
}

/* 自定义滚动条样式 */
.call-control-content::-webkit-scrollbar,
:deep(.el-tab-pane)::-webkit-scrollbar,
.recording-list::-webkit-scrollbar,
.monitor-panel::-webkit-scrollbar {
  width: 6px;
}

.call-control-content::-webkit-scrollbar-track,
:deep(.el-tab-pane)::-webkit-scrollbar-track,
.recording-list::-webkit-scrollbar-track,
.monitor-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.call-control-content::-webkit-scrollbar-thumb,
:deep(.el-tab-pane)::-webkit-scrollbar-thumb,
.recording-list::-webkit-scrollbar-thumb,
.monitor-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.call-control-content::-webkit-scrollbar-thumb:hover,
:deep(.el-tab-pane)::-webkit-scrollbar-thumb:hover,
.recording-list::-webkit-scrollbar-thumb:hover,
.monitor-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.recording-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.recording-item:hover {
  background: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recording-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.recording-info p {
  margin: 2px 0;
  font-size: 12px;
  color: #909399;
}

.recording-actions {
  display: flex;
  gap: 8px;
}

.recording-actions .el-button {
  margin-left: 0;
}

/* 紧急呼叫对话框样式 */
.emergency-confirm {
  text-align: center;
  padding: 20px 0;
}

.emergency-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.emergency-confirm p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

/* 大屏主题下的紧急呼叫弹窗特殊样式 */
.large-screen-theme .emergency-confirm {
  background: rgba(26, 31, 46, 0.98) !important;
  border-radius: 8px;
  padding: 30px 20px;
  margin: -10px;
}

.large-screen-theme .emergency-confirm p {
  color: #e8f4fd !important;
  font-size: 16px !important;
  font-weight: 500;
}

.large-screen-theme .emergency-confirm .warning-text {
  color: #ff6b6b !important;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(255, 107, 107, 0.5);
}

/* 紧急呼叫弹窗特殊样式 - 强制覆盖确保高可见性 */
body.large-screen-theme .emergency-dialog.el-dialog,
.large-screen-theme .emergency-dialog.el-dialog,
.el-overlay .emergency-dialog.el-dialog {
  background: linear-gradient(135deg, rgba(15, 20, 25, 0.99) 0%, rgba(26, 31, 46, 0.99) 100%) !important;
  border: 3px solid rgba(255, 107, 107, 0.9) !important;
  box-shadow: 0 25px 80px rgba(255, 107, 107, 0.4),
              0 0 60px rgba(255, 107, 107, 0.6),
              0 0 100px rgba(0, 0, 0, 0.9) !important;
  backdrop-filter: blur(25px) !important;
  border-radius: 12px !important;
}

.large-screen-theme .emergency-dialog .el-dialog__header {
  background: linear-gradient(90deg, rgba(255, 107, 107, 0.3) 0%, rgba(255, 107, 107, 0.1) 100%) !important;
  border-bottom: 1px solid rgba(255, 107, 107, 0.5) !important;
}

.large-screen-theme .emergency-dialog .el-dialog__title {
  color: #ff6b6b !important;
  font-weight: 700 !important;
  text-shadow: 0 0 15px rgba(255, 107, 107, 0.8) !important;
}

.large-screen-theme .emergency-dialog .el-dialog__body {
  background: rgba(15, 20, 25, 0.98) !important;
}

/* 预设组管理弹窗特殊样式 - 强制覆盖 */
body.large-screen-theme .group-management-dialog.el-dialog,
.large-screen-theme .group-management-dialog.el-dialog,
.el-overlay .group-management-dialog.el-dialog {
  background: linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(26, 31, 46, 0.98) 100%) !important;
  border: 3px solid rgba(64, 158, 255, 0.9) !important;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9),
              0 0 50px rgba(64, 158, 255, 0.5) !important;
  backdrop-filter: blur(25px) !important;
  border-radius: 12px !important;
}

.large-screen-theme .group-management-dialog .el-dialog__header {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.3) 0%, rgba(64, 158, 255, 0.1) 100%) !important;
  border-bottom: 2px solid rgba(64, 158, 255, 0.6) !important;
}

.large-screen-theme .group-management-dialog .el-dialog__body {
  background: rgba(15, 20, 25, 0.98) !important;
}

/* 录音播放弹窗特殊样式 - 强制覆盖 */
body.large-screen-theme .audio-player-dialog.el-dialog,
.large-screen-theme .audio-player-dialog.el-dialog,
.el-overlay .audio-player-dialog.el-dialog {
  background: linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(26, 31, 46, 0.98) 100%) !important;
  border: 3px solid rgba(0, 212, 170, 0.9) !important;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9),
              0 0 50px rgba(0, 212, 170, 0.5) !important;
  backdrop-filter: blur(25px) !important;
  border-radius: 12px !important;
}

.large-screen-theme .audio-player-dialog .el-dialog__header {
  background: linear-gradient(90deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 212, 170, 0.1) 100%) !important;
  border-bottom: 2px solid rgba(0, 212, 170, 0.6) !important;
}

.large-screen-theme .audio-player-dialog .el-dialog__title {
  color: #00d4aa !important;
  font-weight: 700 !important;
  text-shadow: 0 0 15px rgba(0, 212, 170, 0.8) !important;
}

.large-screen-theme .audio-player-dialog .el-dialog__body {
  background: rgba(15, 20, 25, 0.98) !important;
}

/* 弹窗关闭按钮样式增强 */
.large-screen-theme .el-dialog__headerbtn {
  background: rgba(64, 158, 255, 0.1) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  border-radius: 4px !important;
  transition: all 0.3s ease !important;
}

.large-screen-theme .el-dialog__headerbtn:hover {
  background: rgba(64, 158, 255, 0.2) !important;
  border-color: rgba(64, 158, 255, 0.6) !important;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.4) !important;
}

.large-screen-theme .el-dialog__close {
  color: #74b9ff !important;
  font-size: 18px !important;
  font-weight: bold !important;
}

.large-screen-theme .el-dialog__close:hover {
  color: #ffffff !important;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.8) !important;
}

/* 弹窗遮罩层增强 */
.large-screen-theme .el-overlay {
  background-color: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(8px) !important;
}

/* 全局强制弹窗样式 - 最高优先级 */
body.large-screen-theme .el-overlay .el-dialog,
.large-screen-theme .el-overlay .el-dialog,
.el-overlay .large-screen-theme .el-dialog {
  background: linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(26, 31, 46, 0.98) 100%) !important;
  border: 3px solid rgba(64, 158, 255, 0.9) !important;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9),
              0 0 50px rgba(64, 158, 255, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(25px) !important;
  border-radius: 12px !important;
}

body.large-screen-theme .el-overlay .el-dialog .el-dialog__header,
.large-screen-theme .el-overlay .el-dialog .el-dialog__header {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.4) 0%, rgba(64, 158, 255, 0.2) 100%) !important;
  border-bottom: 3px solid rgba(64, 158, 255, 0.8) !important;
  box-shadow: 0 3px 15px rgba(64, 158, 255, 0.3) !important;
  padding: 20px 24px !important;
}

body.large-screen-theme .el-overlay .el-dialog .el-dialog__title,
.large-screen-theme .el-overlay .el-dialog .el-dialog__title {
  color: #74b9ff !important;
  font-weight: 700 !important;
  text-shadow: 0 0 20px rgba(116, 185, 255, 0.9) !important;
  font-size: 20px !important;
  letter-spacing: 1px !important;
}

body.large-screen-theme .el-overlay .el-dialog .el-dialog__body,
.large-screen-theme .el-overlay .el-dialog .el-dialog__body {
  background: rgba(15, 20, 25, 0.98) !important;
  color: #e8f4fd !important;
  border: 2px solid rgba(64, 158, 255, 0.3) !important;
  border-top: none !important;
  border-bottom: none !important;
  padding: 24px !important;
  min-height: 200px !important;
}

/* 弹窗动画增强 */
.large-screen-theme .el-dialog {
  animation: dialogFadeIn 0.3s ease-out !important;
}

@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 最终强制样式覆盖 - 确保所有弹窗都应用大屏样式 */
html body.large-screen-theme .el-overlay .el-dialog[class*="dialog"],
html body.large-screen-theme .el-overlay .el-dialog {
  background: linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(26, 31, 46, 0.98) 100%) !important;
  border: 3px solid rgba(64, 158, 255, 0.9) !important;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9),
              0 0 50px rgba(64, 158, 255, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(25px) !important;
  border-radius: 12px !important;
}

html body.large-screen-theme .el-overlay .el-dialog .el-dialog__header {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.4) 0%, rgba(64, 158, 255, 0.2) 100%) !important;
  border-bottom: 3px solid rgba(64, 158, 255, 0.8) !important;
  box-shadow: 0 3px 15px rgba(64, 158, 255, 0.3) !important;
  padding: 20px 24px !important;
}

html body.large-screen-theme .el-overlay .el-dialog .el-dialog__title {
  color: #74b9ff !important;
  font-weight: 700 !important;
  text-shadow: 0 0 20px rgba(116, 185, 255, 0.9) !important;
  font-size: 20px !important;
  letter-spacing: 1px !important;
}

html body.large-screen-theme .el-overlay .el-dialog .el-dialog__body {
  background: rgba(15, 20, 25, 0.98) !important;
  color: #e8f4fd !important;
  border: 2px solid rgba(64, 158, 255, 0.3) !important;
  border-top: none !important;
  border-bottom: none !important;
  padding: 24px !important;
  min-height: 200px !important;
}

.warning-text {
  color: #f56c6c !important;
  font-weight: 600;
}

/* 设备树样式优化 */
:deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
}

:deep(.el-tree-node__content:hover) {
  background-color: transparent;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  border-radius: 6px;
}

/* 标签页样式优化 */
:deep(.el-tabs__header) {
  margin-bottom: 16px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e4e7ed;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #409EFF;
  font-weight: 600;
}

/* 按钮组样式优化 */
:deep(.el-button-group .el-button) {
  border-radius: 6px;
  margin-right: 0;
}

:deep(.el-button-group .el-button:first-child) {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

:deep(.el-button-group .el-button:last-child) {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 12px 0;
}

/* 滑块样式优化 */
:deep(.el-slider__runway) {
  background-color: #e4e7ed;
}

:deep(.el-slider__bar) {
  background-color: #409EFF;
}

:deep(.el-slider__button) {
  border-color: #409EFF;
}

/* 进度条样式优化 */
:deep(.el-progress-bar__outer) {
  background-color: #e4e7ed;
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}

/* 时间线样式优化 */
:deep(.el-timeline-item__node) {
  background-color: #409EFF;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}

/* 折叠面板样式优化 */
:deep(.el-collapse-item__header) {
  background-color: #fafafa;
  border-radius: 6px;
  margin-bottom: 8px;
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  padding: 12px 16px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background-color: #fafafa;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background-color: #fafafa;
}

/* 穿梭框左右水平布局 */
.horizontal-transfer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.horizontal-transfer .el-transfer__buttons) {
  display: flex;
  flex-direction: column;
  width: auto;
  padding: 0 20px;
}

:deep(.horizontal-transfer .el-transfer__buttons .el-button) {
  margin: 5px 0;
}

:deep(.horizontal-transfer .el-transfer-panel) {
  width: 45%;
  height: 350px;
  margin-bottom: 0;
}

:deep(.horizontal-transfer .el-transfer-panel__body) {
  height: calc(100% - 55px);
  overflow: hidden;
}

:deep(.horizontal-transfer .el-transfer-panel__list) {
  height: 100%;
  overflow-y: auto;
  padding: 0;
}

:deep(.horizontal-transfer .el-transfer-panel__filter) {
  width: 100%;
  margin-bottom: 10px;
}

:deep(.horizontal-transfer .el-transfer-panel__item) {
  height: auto;
  padding: 8px 12px;
}

.transfer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
}

.transfer-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.device-name-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transfer-status-tag {
  flex-shrink: 0;
}

.device-type-tag {
  flex-shrink: 0;
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  width: 60px;
  text-align: center;
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .volume-sliders {
    flex-direction: column;
    gap: 16px;
  }
  
  .status-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .recording-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .recording-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  /* 窄屏幕下穿梭框切换为垂直布局 */
  .horizontal-transfer {
    flex-direction: column;
  }
  
  :deep(.horizontal-transfer .el-transfer-panel) {
    width: 100%;
    margin-bottom: 10px;
  }
  
  :deep(.horizontal-transfer .el-transfer__buttons) {
    display: flex;
    flex-direction: row;
    width: 100%;
    padding: 10px 0;
  }
  
  :deep(.horizontal-transfer .el-transfer__buttons .el-button) {
    margin: 0 5px;
  }
}

/* 动画效果 */
.device-item,
.recording-item,
.stat-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.device-item:hover,
.recording-item:hover,
.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

/* 状态指示器 */
.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-indicator.online {
  background-color: #67c23a;
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.4);
}

.status-indicator.busy {
  background-color: #e6a23c;
  box-shadow: 0 0 6px rgba(230, 162, 60, 0.4);
}

.status-indicator.offline {
  background-color: #909399;
}

/* 紧急呼叫按钮动画 */
@keyframes emergency-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}

.device-actions .el-button--danger {
  animation: emergency-pulse 2s infinite;
}

/* 录音状态动画 */
@keyframes recording-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}

.recording-status {
  animation: recording-blink 1s infinite;
}

.selected-indicator {
  color: #67c23a;
  font-size: 13px;
  margin-left: 8px;
  display: flex;
  align-items: center;
}
.selected-indicator .el-icon {
  margin-right: 2px;
}

.end-call-btn {
  font-size: 16px;
  font-weight: bold;
  padding: 10px 28px;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.15);
  margin-top: 10px;
}

.modern-recording-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.06);
  padding: 12px 18px;
  margin-bottom: 14px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.modern-recording-card:hover {
  box-shadow: 0 6px 24px 0 rgba(64,158,255,0.13);
  transform: translateY(-2px) scale(1.01);
}
.recording-cover {
  width: 38px;
  height: 38px;
  background: #ecf5ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}
.audio-icon {
  font-size: 22px;
  color: #409EFF;
}
.recording-meta {
  flex: 1;
}
.recording-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.recording-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.recording-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.selected-device-tag {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
  margin-right: 8px;
}
.emergency-badge {
  background: #f56c6c;
  color: #fff;
  border-radius: 8px;
  font-size: 12px;
  padding: 2px 8px;
  margin-left: 6px;
  font-weight: bold;
}
.end-call-btn-bar {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

/* 监控面板样式优化 */
.monitor-section {
  margin-bottom: 24px;
}

.monitor-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 4px solid #409EFF;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  margin-bottom: 16px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.stat-header span {
  font-weight: 600;
  color: #303133;
}

.status-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  display: block;
}

.stat-label {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
}

.device-type-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.device-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-type-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.device-type-icon.intercom {
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.device-type-icon.radio {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.device-type-icon.phone {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.device-type-info {
  flex: 1;
}

.device-type-name {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
}

.device-type-count {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: block;
}



.call-stat-row {
  display: flex;
  align-items: center;
}

.call-stat-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
}

.call-stat-value {
  flex: 1;
}

.call-duration-display {
  font-size: 18px;
  font-weight: 600;
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.1);
  padding: 6px 12px;
  border-radius: 4px;
  text-align: center;
}

.call-devices-count {
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
  padding: 6px 12px;
  border-radius: 4px;
  text-align: center;
}



/* 响应式设计改进 */
@media (max-width: 1200px) {
  .audio-dispatch-container {
    padding: 16px;
  }

  /* 在小屏幕上调整卡片高度 */
  .device-list-card,
  .call-control-card,
  .call-record-card {
    min-height: 500px;
  }

  /* 调整滚动区域的最大高度 */
  :deep(.talk-control .el-table) {
    max-height: 200px;
  }

  .volume-sliders {
    flex-direction: column;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .audio-dispatch-container {
    padding: 12px;
    height: calc(100vh - var(--header-height) - 24px);
  }

  /* 在移动设备上使用更紧凑的布局 */
  :deep(.el-col) {
    margin-bottom: 16px;
  }

  .device-list-card,
  .call-control-card,
  .call-record-card {
    min-height: 400px;
  }
}
</style>


 