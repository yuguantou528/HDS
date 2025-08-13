<!--
<template>
  <div class="subdevices-container">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="设备名称">
          <el-input v-model="searchForm.name" placeholder="请输入设备名称" clearable />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="Mesh电台" value="mesh_radio" />
            <el-option label="370M基站" value="base_station" />
            <el-option label="执法仪" value="body_camera" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="序列号">
          <el-input v-model="searchForm.serialNumber" placeholder="请输入序列号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>产品子设备管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAddSubDevice">
              <el-icon><Plus /></el-icon>新增子设备
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="filteredSubDevices"
        style="width: 100%"
        v-loading="loading"
        border
      >
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="serialNumber" label="序列号" min-width="120" />
        <el-table-column label="设备类型" min-width="120">
          <template #default="scope">
            <el-tag>{{ getSubDeviceTypeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="电量" width="100">
          <template #default="scope">
            <el-progress :percentage="scope.row.batteryLevel || 0" :text-inside="true" :stroke-width="16" status="success" />
          </template>
        </el-table-column>
        <el-table-column label="信号" width="100">
          <template #default="scope">
            <el-progress :percentage="scope.row.signalStrength || 0" :text-inside="true" :stroke-width="16" status="warning" />
          </template>
        </el-table-column>
        <el-table-column label="位置" min-width="160">
          <template #default="scope">
            <span v-if="scope.row.location">{{ scope.row.location.latitude }}, {{ scope.row.location.longitude }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="最后活跃" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.lastActiveTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEditSubDevice(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDeleteSubDevice(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalSubDevices"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 子设备表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑子设备' : '新增子设备'"
      width="500px"
    >
      <el-form
        ref="subDeviceFormRef"
        :model="subDeviceForm"
        :rules="subDeviceRules"
        label-width="100px"
      >
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="subDeviceForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        
        <el-form-item label="序列号" prop="serialNumber">
          <el-input v-model="subDeviceForm.serialNumber" placeholder="请输入序列号" />
        </el-form-item>
        
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="subDeviceForm.type" placeholder="请选择设备类型" style="width: 100%">
            <el-option label="Mesh电台" value="mesh_radio" />
            <el-option label="370M基站" value="base_station" />
            <el-option label="执法仪" value="body_camera" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="subDeviceForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="电量" prop="batteryLevel">
          <el-input-number v-model="subDeviceForm.batteryLevel" :min="0" :max="100" />
        </el-form-item>
        
        <el-form-item label="信号" prop="signalStrength">
          <el-input-number v-model="subDeviceForm.signalStrength" :min="0" :max="100" />
        </el-form-item>
        
        <el-form-item label="位置" prop="location">
          <el-input v-model="locationInput" placeholder="格式: 纬度,经度" />
          <el-button size="small" @click="parseLocation">设置</el-button>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import type { SubDevice } from '@/types';

const loading = ref(false);
const searchForm = reactive({
  name: '',
  type: '',
  status: '',
  serialNumber: ''
});
const currentPage = ref(1);
const pageSize = ref(10);
const totalSubDevices = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const subDeviceFormRef = ref<FormInstance>();
const locationInput = ref('');

const subDevices = ref<SubDevice[]>([
  {
    id: '1',
    productId: '1',
    name: 'Mesh电台-001',
    serialNumber: 'MR-001',
    type: 'mesh_radio',
    status: 'online',
    batteryLevel: 90,
    signalStrength: 80,
    location: { latitude: 31.23, longitude: 121.47 },
    lastActiveTime: new Date('2023-07-01T10:00:00'),
    createdAt: new Date('2023-06-01')
  },
  {
    id: '2',
    productId: '2',
    name: '370M基站-001',
    serialNumber: 'BS-370-001',
    type: 'base_station',
    status: 'maintenance',
    batteryLevel: 100,
    signalStrength: 60,
    location: { latitude: 30.67, longitude: 104.06 },
    lastActiveTime: new Date('2023-07-01T09:30:00'),
    createdAt: new Date('2023-06-10')
  },
  {
    id: '3',
    productId: '3',
    name: '执法仪-001',
    serialNumber: 'BC-001',
    type: 'body_camera',
    status: 'offline',
    batteryLevel: 50,
    signalStrength: 30,
    lastActiveTime: new Date('2023-06-30T18:00:00'),
    createdAt: new Date('2023-06-15')
  }
]);

const subDeviceForm = reactive<Partial<SubDevice>>({
  name: '',
  serialNumber: '',
  type: 'mesh_radio',
  status: 'online',
  batteryLevel: 100,
  signalStrength: 100,
  location: undefined
});

const subDeviceRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2-50个字符', trigger: 'blur' }
  ],
  serialNumber: [
    { required: true, message: '请输入序列号', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2-50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
});

const filteredSubDevices = computed(() => {
  let filtered = subDevices.value;
  if (searchForm.name) {
    filtered = filtered.filter(device => device.name.toLowerCase().includes(searchForm.name.toLowerCase()));
  }
  if (searchForm.type) {
    filtered = filtered.filter(device => device.type === searchForm.type);
  }
  if (searchForm.status) {
    filtered = filtered.filter(device => device.status === searchForm.status);
  }
  if (searchForm.serialNumber) {
    filtered = filtered.filter(device => device.serialNumber.toLowerCase().includes(searchForm.serialNumber.toLowerCase()));
  }
  totalSubDevices.value = filtered.length;
  return filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

const getSubDeviceTypeLabel = (type: string) => {
  switch (type) {
    case 'mesh_radio': return 'Mesh电台';
    case 'base_station': return '370M基站';
    case 'body_camera': return '执法仪';
    default: return '其他';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'online': return '在线';
    case 'offline': return '离线';
    case 'maintenance': return '维护中';
    default: return '--';
  }
};

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'online': return 'success';
    case 'offline': return 'info';
    case 'maintenance': return 'warning';
    default: return 'info';
  }
};

const formatDate = (date?: Date) => {
  if (!date) return '--';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function handleSearch() {
  currentPage.value = 1;
}
function handleReset() {
  searchForm.name = '';
  searchForm.type = '';
  searchForm.status = '';
  searchForm.serialNumber = '';
  currentPage.value = 1;
}

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const handleAddSubDevice = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const handleEditSubDevice = (device: SubDevice) => {
  isEdit.value = true;
  Object.assign(subDeviceForm, device);
  locationInput.value = device.location ? `${device.location.latitude},${device.location.longitude}` : '';
  dialogVisible.value = true;
};

const handleDeleteSubDevice = (device: SubDevice) => {
  ElMessageBox.confirm(
    `确定要删除子设备 "${device.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = subDevices.value.findIndex(d => d.id === device.id);
    if (index !== -1) {
      subDevices.value.splice(index, 1);
      totalSubDevices.value = subDevices.value.length;
      ElMessage.success('删除成功');
    }
  }).catch(() => {});
};

const resetForm = () => {
  if (subDeviceFormRef.value) {
    subDeviceFormRef.value.resetFields();
  }
  subDeviceForm.id = '';
  subDeviceForm.name = '';
  subDeviceForm.serialNumber = '';
  subDeviceForm.type = 'mesh_radio';
  subDeviceForm.status = 'online';
  subDeviceForm.batteryLevel = 100;
  subDeviceForm.signalStrength = 100;
  subDeviceForm.location = undefined;
  locationInput.value = '';
};

const parseLocation = () => {
  if (!locationInput.value) {
    subDeviceForm.location = undefined;
    return;
  }
  const parts = locationInput.value.split(',');
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      subDeviceForm.location = { latitude: lat, longitude: lng };
      ElMessage.success('位置设置成功');
      return;
    }
  }
  ElMessage.error('位置格式错误，应为: 纬度,经度');
};

const submitForm = async () => {
  if (!subDeviceFormRef.value) return;
  await subDeviceFormRef.value.validate(async (valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = subDevices.value.findIndex(d => d.id === subDeviceForm.id);
        if (index !== -1) {
          const updated = {
            ...subDevices.value[index],
            ...subDeviceForm,
            updatedAt: new Date()
          };
          subDevices.value[index] = updated as SubDevice;
          ElMessage.success('更新成功');
        }
      } else {
        const newSubDevice: SubDevice = {
          id: 'sd-' + Date.now(),
          productId: '1',
          name: subDeviceForm.name!,
          serialNumber: subDeviceForm.serialNumber!,
          type: subDeviceForm.type as any,
          status: subDeviceForm.status as any,
          batteryLevel: subDeviceForm.batteryLevel || 100,
          signalStrength: subDeviceForm.signalStrength || 100,
          location: subDeviceForm.location,
          lastActiveTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        subDevices.value.push(newSubDevice);
        totalSubDevices.value = subDevices.value.length;
        ElMessage.success('添加成功');
      }
      dialogVisible.value = false;
    }
  });
};

onMounted(() => {
  totalSubDevices.value = subDevices.value.length;
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<style scoped>
.subdevices-container {
  padding: 20px;
}
.search-card {
  margin-bottom: 18px;
  border-radius: 10px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
  background: #fff;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 0 0 0;
}
.table-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 
-->

<template>
  <div class="subdevices-container">
    <h2>子设备管理模块内容已被注释</h2>
  </div>
</template>

<script setup lang="ts">
// 子设备管理模块内容已被注释
</script>

<style scoped>
.subdevices-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px);
}
</style> 