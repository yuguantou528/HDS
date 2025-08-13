<!--
<template>
  <div class="products-container">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.name" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="产品类型">
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
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
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
          <span>产品管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAddProduct">
              <el-icon><Plus /></el-icon>新增产品
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="filteredProducts"
        style="width: 100%"
        v-loading="loading"
        border
      >
        <el-table-column prop="name" label="产品名称" min-width="150" />
        <el-table-column prop="model" label="产品型号" min-width="120" />
        <el-table-column label="产品类型" min-width="120">
          <template #default="scope">
            {{ getProductTypeLabel(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEditProduct(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDeleteProduct(scope.row)"
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
          :total="totalProducts"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 产品表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑产品' : '新增产品'"
      width="500px"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productRules"
        label-width="100px"
      >
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品型号" prop="model">
          <el-input v-model="productForm.model" placeholder="请输入产品型号" />
        </el-form-item>
        <el-form-item label="产品类型" prop="type">
          <el-select v-model="productForm.type" placeholder="请选择产品类型" style="width: 100%">
            <el-option label="Mesh电台" value="mesh_radio" />
            <el-option label="370M基站" value="base_station" />
            <el-option label="执法仪" value="body_camera" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="productForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入产品描述"
          />
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
import type { Product } from '@/types';

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalProducts = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const productFormRef = ref<FormInstance>();

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  status: ''
});

// 产品列表数据
const products = ref<Product[]>([
  {
    id: '1',
    name: 'Mesh电台 Pro',
    model: 'MR-2023',
    type: 'mesh_radio',
    status: 'active',
    description: '高性能Mesh自组网电台，支持远距离通信',
    createdAt: new Date('2023-01-15')
  },
  {
    id: '2',
    name: '370M基站 Plus',
    model: 'BS-370-01',
    type: 'base_station',
    status: 'active',
    description: '370MHz频段基站，覆盖范围广',
    createdAt: new Date('2023-02-20')
  },
  {
    id: '3',
    name: '执法记录仪 HD',
    model: 'BC-4K-2023',
    type: 'body_camera',
    status: 'active',
    description: '4K高清执法记录仪，支持夜视',
    createdAt: new Date('2023-03-10')
  },
  {
    id: '4',
    name: 'Mesh电台 Lite',
    model: 'MR-2022-L',
    type: 'mesh_radio',
    status: 'inactive',
    description: '轻量级Mesh电台，适合短距离通信',
    createdAt: new Date('2022-11-05')
  },
  {
    id: '5',
    name: '370M基站 Mini',
    model: 'BS-370-S',
    type: 'base_station',
    status: 'active',
    description: '小型370MHz基站，适合室内覆盖',
    createdAt: new Date('2023-04-25')
  }
]);

const productForm = reactive<Partial<Product>>({
  name: '',
  model: '',
  type: 'mesh_radio',
  status: 'active',
  description: ''
});

const productRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2-50个字符', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入产品型号', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2-50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择产品类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
});

const filteredProducts = computed(() => {
  let filtered = products.value;
  if (searchForm.name) {
    filtered = filtered.filter(product => product.name.toLowerCase().includes(searchForm.name.toLowerCase()));
  }
  if (searchForm.type) {
    filtered = filtered.filter(product => product.type === searchForm.type);
  }
  if (searchForm.status) {
    filtered = filtered.filter(product => product.status === searchForm.status);
  }
  totalProducts.value = filtered.length;
  return filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

const getProductTypeLabel = (type: string) => {
  switch (type) {
    case 'mesh_radio': return 'Mesh电台';
    case 'base_station': return '370M基站';
    case 'body_camera': return '执法仪';
    default: return '其他';
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleReset = () => {
  searchForm.name = '';
  searchForm.type = '';
  searchForm.status = '';
  currentPage.value = 1;
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const handleAddProduct = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const handleEditProduct = (product: Product) => {
  isEdit.value = true;
  Object.assign(productForm, product);
  dialogVisible.value = true;
};

const handleDeleteProduct = (product: Product) => {
  ElMessageBox.confirm(
    `确定要删除产品 "${product.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = products.value.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products.value.splice(index, 1);
      totalProducts.value = products.value.length;
      ElMessage.success('删除成功');
    }
  }).catch(() => {});
};

const resetForm = () => {
  if (productFormRef.value) {
    productFormRef.value.resetFields();
  }
  productForm.id = '';
  productForm.name = '';
  productForm.model = '';
  productForm.type = 'mesh_radio';
  productForm.status = 'active';
  productForm.description = '';
};

const submitForm = async () => {
  if (!productFormRef.value) return;
  await productFormRef.value.validate(async (valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = products.value.findIndex(p => p.id === productForm.id);
        if (index !== -1) {
          const updatedProduct = {
            ...products.value[index],
            ...productForm,
            updatedAt: new Date()
          };
          products.value[index] = updatedProduct;
          ElMessage.success('更新成功');
        }
      } else {
        const newProduct: Product = {
          id: 'p-' + Date.now(),
          name: productForm.name!,
          model: productForm.model!,
          type: productForm.type as 'mesh_radio' | 'base_station' | 'body_camera' | 'other',
          status: productForm.status as 'active' | 'inactive',
          description: productForm.description,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        products.value.push(newProduct);
        totalProducts.value = products.value.length;
        ElMessage.success('添加成功');
      }
      dialogVisible.value = false;
    }
  });
};

onMounted(() => {
  totalProducts.value = products.value.length;
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<style scoped>
.products-container {
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
  <div class="products-container">
    <h2>产品管理模块内容已被注释</h2>
  </div>
</template>

<script setup lang="ts">
// 产品管理模块内容已被注释
</script>

<style scoped>
.products-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px);
}
</style> 