<template>
  <div class="video-conference-test">
    <h1>视频会商页面测试</h1>
    <p>如果您能看到这个页面，说明路由工作正常。</p>

    <div class="debug-info">
      <h3>调试信息：</h3>
      <p>当前路由：{{ $route.path }}</p>
      <p>当前时间：{{ currentTime }}</p>
      <p>用户登录状态：{{ isLoggedIn ? '已登录' : '未登录' }}</p>
    </div>

    <div class="test-buttons">
      <el-button type="primary" @click="showMessage">点击测试</el-button>
      <el-button type="success" @click="testNavigation">测试导航</el-button>
      <el-button type="warning" @click="checkConsole">检查控制台</el-button>
    </div>

    <!-- 菜单测试 -->
    <div class="menu-test">
      <h3>菜单测试</h3>
      <el-menu mode="horizontal" :router="true">
        <el-menu-item index="/dispatch/audio">音频调度</el-menu-item>
        <el-menu-item index="/dispatch/video">视频调度</el-menu-item>
        <el-menu-item index="/dispatch/conference">视频会商</el-menu-item>
      </el-menu>

      <div style="margin-top: 20px;">
        <el-button @click="navigateToConference">手动导航到视频会商</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const currentTime = ref('');
const isLoggedIn = ref(authStore.isLoggedIn);

function showMessage() {
  ElMessage.success('视频会商页面工作正常！');
  console.log('测试按钮点击成功');
}

function testNavigation() {
  console.log('当前路由信息：', {
    path: route.path,
    name: route.name,
    meta: route.meta
  });
  ElMessage.info('导航信息已输出到控制台');
}

function checkConsole() {
  console.log('=== 调试信息 ===');
  console.log('路由对象：', route);
  console.log('认证状态：', authStore.isLoggedIn);
  console.log('用户信息：', authStore.user);
  console.log('localStorage token：', localStorage.getItem('token'));
  console.log('=== 调试信息结束 ===');
  ElMessage.info('调试信息已输出到控制台');
}

function navigateToConference() {
  console.log('手动导航到视频会商页面');
  router.push('/dispatch/conference').then(() => {
    ElMessage.success('导航成功');
  }).catch(error => {
    console.error('导航失败：', error);
    ElMessage.error('导航失败');
  });
}

onMounted(() => {
  currentTime.value = new Date().toLocaleString();
  console.log('视频会商测试页面已加载');
});
</script>

<style scoped>
.video-conference-test {
  padding: 40px;
  text-align: center;
}

h1 {
  color: #409EFF;
  margin-bottom: 20px;
}

p {
  margin-bottom: 20px;
  font-size: 16px;
  color: #606266;
}

.debug-info {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.debug-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.debug-info p {
  margin: 5px 0;
  font-family: monospace;
  font-size: 14px;
}

.test-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 30px;
}
</style>
