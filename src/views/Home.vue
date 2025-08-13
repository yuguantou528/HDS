<template>
  <div class="home-container">
    <!-- 顶部统计卡片区域 -->
    <div class="stat-cards">
      <el-card class="stat-card blue">
        <div class="stat-card-content">
          <div class="stat-icon"><el-icon><Monitor /></el-icon></div>
          <div class="stat-info">
            <div class="stat-title">设备总数</div>
            <div class="stat-value">{{ deviceStats.total }}</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card green">
        <div class="stat-card-content">
          <div class="stat-icon"><el-icon><CircleCheckFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-title">在线设备</div>
            <div class="stat-value">{{ deviceStats.online }}</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card orange">
        <div class="stat-card-content">
          <div class="stat-icon"><el-icon><WarningFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-title">维护中</div>
            <div class="stat-value">{{ deviceStats.maintenance }}</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card red">
        <div class="stat-card-content">
          <div class="stat-icon"><el-icon><CircleCloseFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-title">离线设备</div>
            <div class="stat-value">{{ deviceStats.offline }}</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card purple">
        <div class="stat-card-content">
          <div class="stat-icon"><el-icon><Cpu /></el-icon></div>
          <div class="stat-info">
            <div class="stat-title">Mesh电台</div>
            <div class="stat-value">{{ deviceStats.mesh }}</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card teal">
        <div class="stat-card-content">
          <div class="stat-icon"><el-icon><Monitor /></el-icon></div>
          <div class="stat-info">
            <div class="stat-title">基站</div>
            <div class="stat-value">{{ deviceStats.base }}</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card dark">
        <div class="stat-card-content">
          <div class="stat-icon"><el-icon><VideoCamera /></el-icon></div>
          <div class="stat-info">
            <div class="stat-title">执法仪</div>
            <div class="stat-value">{{ deviceStats.body }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 中部图表区域 -->
    <div class="chart-section">
      <el-card class="chart-card">
        <template #header><span>设备类型分布</span></template>
        <div ref="typePieRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header><span>设备状态分布</span></template>
        <div ref="statusPieRef" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header><span>设备活跃趋势</span></template>
        <div ref="trendLineRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 底部设备表格区域 -->
    <el-card class="table-card">
      <template #header><span>设备列表</span></template>
      <el-table :data="pagedDevices" style="width: 100%" border>
        <el-table-column prop="name" label="设备名称" min-width="140" />
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="scope">
            <el-tag>{{ getTypeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastActiveTime" label="最后活跃" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.lastActiveTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="viewDevice(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="devices.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { Monitor, Cpu, VideoCamera, CircleCheckFilled, CircleCloseFilled, WarningFilled } from '@element-plus/icons-vue';

// 模拟设备数据
const devices = ref([
  { id: '1', name: 'Mesh电台-001', type: 'mesh_radio', status: 'online', lastActiveTime: new Date('2023-07-17T10:00:00') },
  { id: '2', name: '基站-001', type: 'base_station', status: 'online', lastActiveTime: new Date('2023-07-17T09:30:00') },
  { id: '3', name: '执法仪-001', type: 'body_camera', status: 'offline', lastActiveTime: new Date('2023-07-16T18:00:00') },
  { id: '4', name: 'Mesh电台-002', type: 'mesh_radio', status: 'maintenance', lastActiveTime: new Date('2023-07-16T15:00:00') },
  { id: '5', name: '基站-002', type: 'base_station', status: 'online', lastActiveTime: new Date('2023-07-17T08:00:00') },
  { id: '6', name: '执法仪-002', type: 'body_camera', status: 'online', lastActiveTime: new Date('2023-07-17T10:10:00') },
  { id: '7', name: 'Mesh电台-003', type: 'mesh_radio', status: 'offline', lastActiveTime: new Date('2023-07-15T12:00:00') },
  { id: '8', name: '基站-003', type: 'base_station', status: 'maintenance', lastActiveTime: new Date('2023-07-16T13:00:00') },
  { id: '9', name: '执法仪-003', type: 'body_camera', status: 'online', lastActiveTime: new Date('2023-07-17T10:20:00') }
]);

const deviceStats = computed(() => {
  const total = devices.value.length;
  const online = devices.value.filter(d => d.status === 'online').length;
  const offline = devices.value.filter(d => d.status === 'offline').length;
  const maintenance = devices.value.filter(d => d.status === 'maintenance').length;
  const mesh = devices.value.filter(d => d.type === 'mesh_radio').length;
  const base = devices.value.filter(d => d.type === 'base_station').length;
  const body = devices.value.filter(d => d.type === 'body_camera').length;
  return { total, online, offline, maintenance, mesh, base, body };
});

// 图表refs
const typePieRef = ref();
const statusPieRef = ref();
const trendLineRef = ref();

// 设备类型分布
const typePieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      name: '类型',
      type: 'pie',
      radius: '70%',
      data: [
        { value: deviceStats.value.mesh, name: 'Mesh电台' },
        { value: deviceStats.value.base, name: '基站' },
        { value: deviceStats.value.body, name: '执法仪' }
      ],
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
      }
    }
  ]
}));
// 设备状态分布
const statusPieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      name: '状态',
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
      data: [
        { value: deviceStats.value.online, name: '在线' },
        { value: deviceStats.value.maintenance, name: '维护中' },
        { value: deviceStats.value.offline, name: '离线' }
      ]
    }
  ]
}));
// 设备活跃趋势（近7天上线数）
const trendLineOption = computed(() => {
  // 模拟数据
  const days = Array.from({ length: 7 }, (_, i) => `7-${11 + i}`);
  const onlineCounts = days.map(() => Math.floor(Math.random() * 6 + 3));
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value' },
    series: [
      {
        name: '在线设备数',
        type: 'line',
        data: onlineCounts,
        smooth: true,
        areaStyle: { opacity: 0.2 },
        itemStyle: { color: '#67C23A' }
      }
    ]
  };
});

// 图表渲染
function renderCharts() {
  if (typePieRef.value) echarts.init(typePieRef.value).setOption(typePieOption.value);
  if (statusPieRef.value) echarts.init(statusPieRef.value).setOption(statusPieOption.value);
  if (trendLineRef.value) echarts.init(trendLineRef.value).setOption(trendLineOption.value);
}
onMounted(() => {
  nextTick(renderCharts);
  window.addEventListener('resize', renderCharts);
});

// 表格分页
const currentPage = ref(1);
const pageSize = ref(5);
const pagedDevices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return devices.value.slice(start, start + pageSize.value);
});
function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}
function handleCurrentChange(page: number) {
  currentPage.value = page;
}
function getTypeLabel(type: string) {
  switch (type) {
    case 'mesh_radio': return 'Mesh电台';
    case 'base_station': return '基站';
    case 'body_camera': return '执法仪';
    default: return '其他';
  }
}
function getStatusLabel(status: string) {
  switch (status) {
    case 'online': return '在线';
    case 'offline': return '离线';
    case 'maintenance': return '维护中';
    default: return '--';
  }
}
function getStatusTagType(status: string) {
  switch (status) {
    case 'online': return 'success';
    case 'offline': return 'info';
    case 'maintenance': return 'warning';
    default: return 'info';
  }
}
function formatDate(date?: Date) {
  if (!date) return '--';
  return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function viewDevice(row: any) {
  alert('设备详情：' + row.name);
}
</script>

<style scoped>
.home-container {
  padding: 20px;
  height: calc(100vh - var(--header-height) - 40px); /* 使用相对高度 */
  overflow-y: auto; /* 只在需要时显示垂直滚动条 */
}
.stat-cards {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}
.stat-card {
  height: 110px;
  border-radius: 10px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
}
.stat-card-content {
  display: flex;
  align-items: center;
  height: 100%;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-right: 14px;
}
.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}
.blue .stat-icon { background: rgba(64,158,255,0.08); color: #409EFF; }
.green .stat-icon { background: rgba(103,194,58,0.08); color: #67C23A; }
.orange .stat-icon { background: rgba(230,162,60,0.08); color: #E6A23C; }
.red .stat-icon { background: rgba(245,108,108,0.08); color: #F56C6C; }
.purple .stat-icon { background: rgba(114,124,245,0.08); color: #727CF5; }
.teal .stat-icon { background: rgba(32,201,151,0.08); color: #20C997; }
.dark .stat-icon { background: rgba(51,54,80,0.08); color: #333650; }
.chart-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}
.chart-card {
  min-height: 320px;
  border-radius: 10px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
}
.chart-container {
  width: 100%;
  height: 240px;
}
.table-card {
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 