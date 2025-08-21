<template>
  <div class="roles-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="角色名称">
          <el-input v-model="searchForm.name" placeholder="请输入角色名称" clearable />
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

    <!-- 角色表格 -->
    <div class="table-section">
      <el-table :data="roles" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="角色名称" width="140" />
        <el-table-column prop="code" label="角色编码" width="130" align="center" />
        <el-table-column prop="description" label="角色描述" min-width="200" />
        <el-table-column prop="userCount" label="用户数量" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" align="center" />
        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" size="small" @click="editRole(row)">编辑</el-button>
              <el-button type="info" size="small" @click="setPermissions(row)">权限设置</el-button>
              <el-button
                :type="row.status === 'active' ? 'warning' : 'success'"
                size="small"
                @click="toggleRoleStatus(row)"
              >
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button type="danger" size="small" @click="deleteRole(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑角色' : '新增角色'" 
      width="500px"
    >
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRole">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限设置对话框 -->
    <el-dialog 
      v-model="permissionDialogVisible" 
      title="权限设置" 
      width="600px"
    >
      <div class="permission-content">
        <div class="role-info">
          <span>角色：{{ currentRole?.name }}</span>
        </div>
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          :props="{ children: 'children', label: 'name' }"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissions"
          class="permission-tree"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermissions">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const isEdit = ref(false);
const roleFormRef = ref();
const permissionTreeRef = ref();
const currentRole = ref<any>(null);

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
});

// 角色表单
const roleForm = reactive({
  id: '',
  name: '',
  code: '',
  description: ''
});

// 表单验证规则
const roleRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
};

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 角色列表
const roles = ref([
  {
    id: 1,
    name: '系统管理员',
    code: 'ADMIN',
    description: '系统最高权限管理员，拥有所有功能权限',
    userCount: 2,
    status: 'active',
    createTime: '2023-01-01 10:00:00'
  },
  {
    id: 2,
    name: '调度操作员',
    code: 'OPERATOR',
    description: '负责日常调度操作，拥有调度相关功能权限',
    userCount: 5,
    status: 'active',
    createTime: '2023-01-02 10:00:00'
  },
  {
    id: 3,
    name: '观察员',
    code: 'OBSERVER',
    description: '只能查看相关信息，无操作权限',
    userCount: 3,
    status: 'active',
    createTime: '2023-01-03 10:00:00'
  }
]);

// 权限树数据
const permissionTree = ref([
  {
    id: 1,
    name: '调度管理',
    children: [
      { id: 11, name: '音频调度' },
      { id: 12, name: '通话记录' },
      { id: 13, name: '视频调度' },
      { id: 14, name: '视频录像' },
      { id: 15, name: '视频会商' },
      { id: 16, name: '会商记录' }
    ]
  },
  {
    id: 2,
    name: '系统管理',
    children: [
      { id: 21, name: '用户管理' },
      { id: 22, name: '角色管理' },
      { id: 23, name: '权限管理' }
    ]
  },
  {
    id: 3,
    name: '应急指挥',
    children: [
      { id: 31, name: '应急指挥调度大屏' }
    ]
  }
]);

// 已选中的权限
const checkedPermissions = ref<number[]>([]);

// 方法
const openCreateDialog = () => {
  isEdit.value = false;
  resetRoleForm();
  dialogVisible.value = true;
};

const editRole = (row: any) => {
  isEdit.value = true;
  Object.assign(roleForm, row);
  dialogVisible.value = true;
};

const resetRoleForm = () => {
  Object.assign(roleForm, {
    id: '',
    name: '',
    code: '',
    description: ''
  });
};

const submitRole = async () => {
  if (!roleFormRef.value) return;
  
  try {
    await roleFormRef.value.validate();
    // 这里应该调用API保存角色
    ElMessage.success(isEdit.value ? '角色更新成功' : '角色创建成功');
    dialogVisible.value = false;
    loadRoles();
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

const setPermissions = (row: any) => {
  currentRole.value = row;
  // 模拟获取角色已有权限
  checkedPermissions.value = [11, 12, 13]; // 示例数据
  permissionDialogVisible.value = true;
};

const savePermissions = () => {
  const checkedKeys = permissionTreeRef.value.getCheckedKeys();
  const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys();
  const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys];
  
  console.log('保存权限:', allCheckedKeys);
  ElMessage.success('权限设置成功');
  permissionDialogVisible.value = false;
};

const toggleRoleStatus = (row: any) => {
  const action = row.status === 'active' ? '禁用' : '启用';
  ElMessageBox.confirm(`确定要${action}角色 ${row.name} 吗？`, '确认操作', {
    type: 'warning'
  }).then(() => {
    row.status = row.status === 'active' ? 'inactive' : 'active';
    ElMessage.success(`角色${action}成功`);
  });
};

const deleteRole = (row: any) => {
  if (row.userCount > 0) {
    ElMessage.warning('该角色下还有用户，无法删除');
    return;
  }
  
  ElMessageBox.confirm(`确定要删除角色 ${row.name} 吗？`, '确认删除', {
    type: 'warning'
  }).then(() => {
    const index = roles.value.findIndex(r => r.id === row.id);
    if (index > -1) {
      roles.value.splice(index, 1);
      ElMessage.success('角色删除成功');
    }
  });
};

const handleSearch = () => {
  loadRoles();
};

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    status: ''
  });
  loadRoles();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  loadRoles();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  loadRoles();
};

const loadRoles = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    pagination.total = roles.value.length;
    loading.value = false;
  }, 500);
};

onMounted(() => {
  loadRoles();
});
</script>

<style scoped>
.roles-container {
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

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  text-align: right;
}

.permission-content {
  max-height: 400px;
  overflow-y: auto;
}

.role-info {
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-weight: 600;
}

.permission-tree {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
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
