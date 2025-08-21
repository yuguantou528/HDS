<template>
  <div class="users-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增用户
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="searchForm.realName" placeholder="请输入姓名" clearable />
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

    <!-- 用户表格 -->
    <div class="table-section">
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="department" label="部门" width="100" align="center" />
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
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
              <el-button type="primary" size="small" @click="editUser(row)">编辑</el-button>
              <el-button
                :type="row.status === 'active' ? 'warning' : 'success'"
                size="small"
                @click="toggleUserStatus(row)"
              >
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button type="danger" size="small" @click="deleteUser(row)">删除</el-button>
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

    <!-- 新增/编辑用户对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑用户' : '新增用户'" 
      width="600px"
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="userForm.username" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="realName">
              <el-input v-model="userForm.realName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="userForm.phone" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="userForm.department" placeholder="请选择部门">
                <el-option label="技术部" value="技术部" />
                <el-option label="运营部" value="运营部" />
                <el-option label="市场部" value="市场部" />
                <el-option label="人事部" value="人事部" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="userForm.role" placeholder="请选择角色">
                <el-option label="管理员" value="管理员" />
                <el-option label="操作员" value="操作员" />
                <el-option label="观察员" value="观察员" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUser">确定</el-button>
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
const isEdit = ref(false);
const userFormRef = ref();

// 搜索表单
const searchForm = reactive({
  username: '',
  realName: '',
  status: ''
});

// 用户表单
const userForm = reactive({
  id: '',
  username: '',
  realName: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  password: ''
});

// 表单验证规则
const userRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 用户列表
const users = ref([
  {
    id: 1,
    username: 'admin',
    realName: '系统管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    department: '技术部',
    role: '管理员',
    status: 'active',
    createTime: '2023-01-01 10:00:00'
  },
  {
    id: 2,
    username: 'operator1',
    realName: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    department: '运营部',
    role: '操作员',
    status: 'active',
    createTime: '2023-01-02 10:00:00'
  },
  {
    id: 3,
    username: 'observer1',
    realName: '李四',
    email: 'lisi@example.com',
    phone: '13800138002',
    department: '市场部',
    role: '观察员',
    status: 'inactive',
    createTime: '2023-01-03 10:00:00'
  }
]);

// 方法
const getRoleTagType = (role: string) => {
  const typeMap: Record<string, string> = {
    '管理员': 'danger',
    '操作员': 'warning',
    '观察员': 'info'
  };
  return typeMap[role] || 'info';
};

const openCreateDialog = () => {
  isEdit.value = false;
  resetUserForm();
  dialogVisible.value = true;
};

const editUser = (row: any) => {
  isEdit.value = true;
  Object.assign(userForm, row);
  dialogVisible.value = true;
};

const resetUserForm = () => {
  Object.assign(userForm, {
    id: '',
    username: '',
    realName: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    password: ''
  });
};

const submitUser = async () => {
  if (!userFormRef.value) return;
  
  try {
    await userFormRef.value.validate();
    // 这里应该调用API保存用户
    ElMessage.success(isEdit.value ? '用户更新成功' : '用户创建成功');
    dialogVisible.value = false;
    loadUsers();
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

const toggleUserStatus = (row: any) => {
  const action = row.status === 'active' ? '禁用' : '启用';
  ElMessageBox.confirm(`确定要${action}用户 ${row.realName} 吗？`, '确认操作', {
    type: 'warning'
  }).then(() => {
    row.status = row.status === 'active' ? 'inactive' : 'active';
    ElMessage.success(`用户${action}成功`);
  });
};

const deleteUser = (row: any) => {
  ElMessageBox.confirm(`确定要删除用户 ${row.realName} 吗？`, '确认删除', {
    type: 'warning'
  }).then(() => {
    const index = users.value.findIndex(u => u.id === row.id);
    if (index > -1) {
      users.value.splice(index, 1);
      ElMessage.success('用户删除成功');
    }
  });
};

const handleSearch = () => {
  loadUsers();
};

const resetSearch = () => {
  Object.assign(searchForm, {
    username: '',
    realName: '',
    status: ''
  });
  loadUsers();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  loadUsers();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  loadUsers();
};

const loadUsers = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    pagination.total = users.value.length;
    loading.value = false;
  }, 500);
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.users-container {
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
