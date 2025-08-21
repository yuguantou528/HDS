<template>
  <div class="permissions-container">
    <div class="page-header">
      <h2>权限管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增权限
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="权限名称">
          <el-input v-model="searchForm.name" placeholder="请输入权限名称" clearable />
        </el-form-item>
        <el-form-item label="权限类型">
          <el-select v-model="searchForm.type" placeholder="请选择权限类型" clearable style="width: 150px;">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="接口" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 权限表格 -->
    <div class="table-section">
      <el-table 
        :data="permissions" 
        v-loading="loading" 
        stripe 
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="权限名称" width="180" />
        <el-table-column prop="code" label="权限编码" width="160" />
        <el-table-column prop="type" label="权限类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径/接口" min-width="180" />
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" align="center" />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" size="small" @click="editPermission(row)">编辑</el-button>
              <el-button
                :type="row.status === 'active' ? 'warning' : 'success'"
                size="small"
                @click="togglePermissionStatus(row)"
              >
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button type="danger" size="small" @click="deletePermission(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑权限对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑权限' : '新增权限'" 
      width="600px"
    >
      <el-form :model="permissionForm" :rules="permissionRules" ref="permissionFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权限名称" prop="name">
              <el-input v-model="permissionForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限编码" prop="code">
              <el-input v-model="permissionForm.code" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权限类型" prop="type">
              <el-select v-model="permissionForm.type" placeholder="请选择权限类型">
                <el-option label="菜单" value="menu" />
                <el-option label="按钮" value="button" />
                <el-option label="接口" value="api" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父级权限" prop="parentId">
              <el-tree-select
                v-model="permissionForm.parentId"
                :data="permissionTreeOptions"
                :props="{ value: 'id', label: 'name', children: 'children' }"
                placeholder="请选择父级权限"
                clearable
                check-strictly
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="路径/接口" prop="path">
              <el-input v-model="permissionForm.path" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="permissionForm.sort" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="权限描述" prop="description">
          <el-input v-model="permissionForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPermission">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const permissionFormRef = ref();

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  status: ''
});

// 权限表单
const permissionForm = reactive({
  id: '',
  name: '',
  code: '',
  type: '',
  parentId: null,
  path: '',
  description: '',
  sort: 0
});

// 表单验证规则
const permissionRules = {
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  path: [{ required: true, message: '请输入路径或接口', trigger: 'blur' }],
  description: [{ required: true, message: '请输入权限描述', trigger: 'blur' }]
};

// 权限列表
const permissions = ref([
  {
    id: 1,
    name: '调度管理',
    code: 'DISPATCH',
    type: 'menu',
    path: '/dispatch',
    description: '调度管理模块',
    sort: 1,
    status: 'active',
    createTime: '2023-01-01 10:00:00',
    children: [
      {
        id: 11,
        name: '音频调度',
        code: 'DISPATCH_AUDIO',
        type: 'menu',
        path: '/dispatch/audio',
        description: '音频调度功能',
        sort: 1,
        status: 'active',
        createTime: '2023-01-01 10:00:00'
      },
      {
        id: 12,
        name: '通话记录',
        code: 'DISPATCH_CALL_RECORDS',
        type: 'menu',
        path: '/dispatch/call-records',
        description: '通话记录查看',
        sort: 2,
        status: 'active',
        createTime: '2023-01-01 10:00:00'
      },
      {
        id: 13,
        name: '视频调度',
        code: 'DISPATCH_VIDEO',
        type: 'menu',
        path: '/dispatch/video',
        description: '视频调度功能',
        sort: 3,
        status: 'active',
        createTime: '2023-01-01 10:00:00'
      }
    ]
  },
  {
    id: 2,
    name: '系统管理',
    code: 'SYSTEM',
    type: 'menu',
    path: '/system',
    description: '系统管理模块',
    sort: 2,
    status: 'active',
    createTime: '2023-01-01 10:00:00',
    children: [
      {
        id: 21,
        name: '用户管理',
        code: 'SYSTEM_USERS',
        type: 'menu',
        path: '/system/users',
        description: '用户管理功能',
        sort: 1,
        status: 'active',
        createTime: '2023-01-01 10:00:00'
      },
      {
        id: 22,
        name: '角色管理',
        code: 'SYSTEM_ROLES',
        type: 'menu',
        path: '/system/roles',
        description: '角色管理功能',
        sort: 2,
        status: 'active',
        createTime: '2023-01-01 10:00:00'
      }
    ]
  }
]);

// 权限树选项（用于父级权限选择）
const permissionTreeOptions = computed(() => {
  const buildTree = (items: any[]) => {
    return items.map(item => ({
      id: item.id,
      name: item.name,
      children: item.children ? buildTree(item.children) : undefined
    }));
  };
  return [{ id: 0, name: '根权限', children: buildTree(permissions.value) }];
});

// 方法
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    'menu': 'primary',
    'button': 'success',
    'api': 'warning'
  };
  return typeMap[type] || 'info';
};

const getTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    'menu': '菜单',
    'button': '按钮',
    'api': '接口'
  };
  return textMap[type] || type;
};

const openCreateDialog = () => {
  isEdit.value = false;
  resetPermissionForm();
  dialogVisible.value = true;
};

const editPermission = (row: any) => {
  isEdit.value = true;
  Object.assign(permissionForm, row);
  dialogVisible.value = true;
};

const resetPermissionForm = () => {
  Object.assign(permissionForm, {
    id: '',
    name: '',
    code: '',
    type: '',
    parentId: null,
    path: '',
    description: '',
    sort: 0
  });
};

const submitPermission = async () => {
  if (!permissionFormRef.value) return;
  
  try {
    await permissionFormRef.value.validate();
    // 这里应该调用API保存权限
    ElMessage.success(isEdit.value ? '权限更新成功' : '权限创建成功');
    dialogVisible.value = false;
    loadPermissions();
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

const togglePermissionStatus = (row: any) => {
  const action = row.status === 'active' ? '禁用' : '启用';
  ElMessageBox.confirm(`确定要${action}权限 ${row.name} 吗？`, '确认操作', {
    type: 'warning'
  }).then(() => {
    row.status = row.status === 'active' ? 'inactive' : 'active';
    ElMessage.success(`权限${action}成功`);
  });
};

const deletePermission = (row: any) => {
  if (row.children && row.children.length > 0) {
    ElMessage.warning('该权限下还有子权限，无法删除');
    return;
  }
  
  ElMessageBox.confirm(`确定要删除权限 ${row.name} 吗？`, '确认删除', {
    type: 'warning'
  }).then(() => {
    // 这里应该调用API删除权限
    ElMessage.success('权限删除成功');
    loadPermissions();
  });
};

const handleSearch = () => {
  loadPermissions();
};

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    type: '',
    status: ''
  });
  loadPermissions();
};

const loadPermissions = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

onMounted(() => {
  loadPermissions();
});
</script>

<style scoped>
.permissions-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  text-align: right;
}

/* 表格操作按钮样式优化 */
.table-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.table-actions .el-button {
  margin: 0;
  min-width: 60px;
}

/* 表格样式优化 */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #fafafa !important;
  font-weight: 600;
}

:deep(.el-table th.el-table__cell) {
  background-color: #fafafa !important;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-table .cell) {
  padding: 0 12px;
}

/* 搜索表单样式优化 */
.search-section .el-form-item {
  margin-right: 20px;
  margin-bottom: 0;
}

.search-section .el-form-item__label {
  font-weight: 600;
  color: #303133;
}
</style>
