<template>
  <div class="app-sidebar" :class="{ 'is-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <el-icon class="collapse-icon" @click="toggleCollapse">
        <component :is="isCollapsed ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      :router="true"
      class="sidebar-menu"
      background-color="#ffffff"
      text-color="#303133"
      active-text-color="#409EFF"
      :unique-opened="true"
    >
      <!-- 首页菜单已隐藏 -->
      <!-- <el-menu-item index="/">
        <el-icon><HomeFilled /></el-icon>
        <template #title>首页</template>
      </el-menu-item> -->

      <!-- 设备管理菜单已隐藏 -->
      <!-- <el-sub-menu index="/device">
        <template #title>
          <el-icon><Monitor /></el-icon>
          <span>设备管理</span>
        </template>
        <el-menu-item index="/device/products">产品管理</el-menu-item>
        <el-menu-item index="/device/sub-devices">产品子设备管理</el-menu-item>
      </el-sub-menu> -->

      <!-- 应急指挥调度大屏 - 使用自定义按钮避免路由跳转 -->
      <div class="emergency-command-item" @click="openEmergencyCommand">
        <el-icon><Monitor /></el-icon>
        <span v-show="!isCollapsed">应急指挥调度大屏</span>
      </div>

      <el-sub-menu index="/dispatch">
        <template #title>
          <el-icon><Headset /></el-icon>
          <span>调度管理</span>
        </template>
        <el-menu-item index="/dispatch/audio">音频调度</el-menu-item>
        <el-menu-item index="/dispatch/call-records">通话记录</el-menu-item>
        <el-menu-item index="/dispatch/video">视频调度</el-menu-item>
        <el-menu-item index="/dispatch/recordings">视频录像</el-menu-item>
        <el-menu-item index="/dispatch/conference">视频会商</el-menu-item>
        <el-menu-item index="/dispatch/meeting-records">会商记录</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="/system">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </template>
        <el-menu-item index="/system/users">用户管理</el-menu-item>
        <el-menu-item index="/system/roles">角色管理</el-menu-item>
        <el-menu-item index="/system/permissions">权限管理</el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/profile">
        <el-icon><User /></el-icon>
        <template #title>个人中心</template>
      </el-menu-item>
      
      <!-- 系统设置菜单已隐藏 -->
      <!-- <el-menu-item index="/settings">
        <el-icon><Tools /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item> -->
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import {
  Setting,
  User,
  Expand,
  Fold,
  Headset,
  Monitor
} from '@element-plus/icons-vue';

const route = useRoute();
const isCollapsed = ref(false);

// 根据当前路由路径获取激活菜单项
const activeMenu = computed(() => {
  return route.path;
});

// 切换菜单折叠状态
const toggleCollapse = async () => {
  // 使用 requestAnimationFrame 确保动画流畅
  requestAnimationFrame(() => {
    isCollapsed.value = !isCollapsed.value;

    // 更新CSS变量以调整主内容区宽度
    const root = document.documentElement;
    const newWidth = isCollapsed.value ? '64px' : '200px';
    root.style.setProperty('--sidebar-width', newWidth);

    // 确保主内容区域也同步更新
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.left = newWidth;
      mainContent.style.width = `calc(100vw - ${newWidth})`;
    }
  });
};

// 打开应急指挥调度大屏（新标签页）
const openEmergencyCommand = (event: Event) => {
  // 阻止默认的路由跳转和事件冒泡
  event.preventDefault();
  event.stopPropagation();

  try {
    // 在新标签页中打开应急指挥调度大屏
    const url = window.location.origin + '/emergency-command';
    const newWindow = window.open(url, '_blank');

    // 检查是否成功打开新窗口（防止弹窗被阻止）
    if (!newWindow) {
      console.warn('新标签页可能被浏览器阻止，请检查弹窗设置');
    }
  } catch (error) {
    console.error('打开应急指挥调度大屏失败:', error);
  }

  // 确保当前页面不会跳转
  return false;
};
</script>

<style scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: var(--sidebar-width);
  will-change: width;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

.sidebar-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-color-light);
  transition: color 0.2s ease;
  transform: translateZ(0);
}

.collapse-icon:hover {
  color: var(--primary-color);
}

.sidebar-menu {
  border-right: none;
  height: calc(100% - 50px);
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  backface-visibility: hidden;
}

.sidebar-menu :deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  backface-visibility: hidden;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: #f5f7fa;
}

.sidebar-menu :deep(.el-menu-item .el-icon),
.sidebar-menu :deep(.el-sub-menu__title .el-icon) {
  margin-right: 10px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
}

/* 优化子菜单展开动画 */
.sidebar-menu :deep(.el-sub-menu .el-menu) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: left;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 优化箭头动画 */
.sidebar-menu :deep(.el-sub-menu__icon-arrow) {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  transform: translateZ(0);
}

/* 添加硬件加速 */
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 优化折叠时的动画 */
.sidebar-menu :deep(.el-menu--collapse .el-sub-menu .el-menu) {
  transition: none;
}

.sidebar-menu :deep(.el-menu--collapse .el-menu-item),
.sidebar-menu :deep(.el-menu--collapse .el-sub-menu__title) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 优化滚动条 */
.sidebar-menu :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

/* 减少动画期间的闪烁 */
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  contain: layout style paint;
}

/* 优化子菜单展开时的性能 */
.sidebar-menu :deep(.el-sub-menu.is-opened .el-menu) {
  contain: layout style paint;
}

/* 应急指挥调度大屏菜单项样式 */
.emergency-command-item {
  height: 56px;
  line-height: 56px;
  padding: 0 20px;
  cursor: pointer;
  color: #303133;
  display: flex;
  align-items: center;
  transition: all 0.3s;
  border-radius: 4px;
  margin: 0 4px;
}

.emergency-command-item:hover {
  background-color: #ecf5ff;
  color: #409EFF;
}

.emergency-command-item:active {
  background-color: #409EFF;
  color: #ffffff;
  transform: scale(0.98);
}

.emergency-command-item .el-icon {
  margin-right: 8px;
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.emergency-command-item span {
  font-size: 14px;
  transition: all 0.3s;
}

/* 折叠状态下的样式 */
.app-sidebar.is-collapsed .emergency-command-item {
  padding: 0 20px;
  justify-content: center;
}

.app-sidebar.is-collapsed .emergency-command-item .el-icon {
  margin-right: 0;
}
</style> 