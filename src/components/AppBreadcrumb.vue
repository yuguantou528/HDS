<template>
  <div class="breadcrumb-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index" :to="item.path">
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

interface BreadcrumbItem {
  title: string;
  path: string | null;
}

// 根据当前路由生成面包屑导航
const breadcrumbItems = computed(() => {
  const result: BreadcrumbItem[] = [];
  
  // 添加首页
  result.push({
    title: '首页',
    path: '/'
  });
  
  // 如果当前路由有匹配的路径，则添加到面包屑
  if (route.matched && route.matched.length > 0) {
    const matchedRoutes = route.matched.filter(item => {
      return item.meta && item.meta.title;
    });
    
    // 添加中间层级
    matchedRoutes.forEach((item, index) => {
      // 最后一级不可点击
      const path = index === matchedRoutes.length - 1 ? null : item.path;
      
      result.push({
        title: item.meta.title as string,
        path
      });
    });
  }
  
  return result;
});
</script>

<style scoped>
.breadcrumb-container {
  display: flex;
  align-items: center;
  height: 100%;
}

:deep(.el-breadcrumb__item) {
  display: flex;
  align-items: center;
  font-size: 14px;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  font-weight: 600;
  color: var(--text-color);
}
</style> 