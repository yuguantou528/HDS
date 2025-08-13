<template>
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
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

function navigateToConference() {
  console.log('手动导航到视频会商页面');
  router.push('/dispatch/conference').then(() => {
    ElMessage.success('导航成功');
  }).catch(error => {
    console.error('导航失败：', error);
    ElMessage.error('导航失败');
  });
}
</script>

<style scoped>
.menu-test {
  padding: 20px;
}
</style>
