<template>
  <div class="emergency-command-screen">
    <!-- 顶部标题栏 -->
    <div class="screen-header">
      <!-- 左上角时间显示 -->
      <div class="header-time">
        <div class="time-display">
          <div class="date">2025年08月12日</div>
          <div class="time">11:27:37</div>
        </div>
      </div>

      <!-- 中央区域：标题和功能按钮 -->
      <div class="header-center">
        <!-- 标题左侧按钮 -->
        <div class="center-left-buttons">
          <el-button
            type="primary"
            size="large"
            :class="{ active: activeModule === 'audio' }"
            @click="switchModule('audio')"
          >
            <el-icon><Headset /></el-icon>
            音频调度
          </el-button>
          <el-button
            type="primary"
            size="large"
            :class="{ active: activeModule === 'video' }"
            @click="switchModule('video')"
          >
            <el-icon><VideoCamera /></el-icon>
            视频调度
          </el-button>
        </div>

        <!-- 中间标题 -->
        <div class="title-container">
          <h1 class="screen-title">应急指挥调度大屏</h1>
        </div>

        <!-- 标题右侧按钮 -->
        <div class="center-right-buttons">
          <el-button
            type="primary"
            size="large"
            :class="{ active: activeModule === 'recordings' }"
            @click="switchModule('recordings')"
          >
            <el-icon><VideoPlay /></el-icon>
            视频录像
          </el-button>
          <el-button
            type="primary"
            size="large"
            :class="{ active: activeModule === 'conference' }"
            @click="switchModule('conference')"
          >
            <el-icon><ChatDotRound /></el-icon>
            视频会商
          </el-button>
        </div>
      </div>

      <!-- 右上角天气信息 -->
      <div class="header-weather">
        <div class="weather-display">
          <div class="weather-icon">☀️</div>
          <div class="weather-info">
            <div class="weather-status">晴天</div>
            <div class="temperature">25°C</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="screen-content">
      <!-- 音频调度模块 -->
      <div v-if="activeModule === 'audio'" class="module-container">
        <AudioDispatch :force-theme="'large'" />
      </div>

      <!-- 视频调度模块 -->
      <div v-if="activeModule === 'video'" class="module-container">
        <VideoDispatch />
      </div>

      <!-- 视频录像模块 -->
      <div v-if="activeModule === 'recordings'" class="module-container">
        <VideoRecordings />
      </div>

      <!-- 视频会商模块 -->
      <div v-if="activeModule === 'conference'" class="module-container">
        <VideoConference />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Headset,
  VideoCamera,
  VideoPlay,
  ChatDotRound,
  Monitor
} from '@element-plus/icons-vue';

// 导入各个功能模块组件
import AudioDispatch from '@/views/dispatch/AudioDispatch.vue';
import VideoDispatch from '@/views/dispatch/VideoDispatch.vue';
import VideoRecordings from '@/views/dispatch/VideoRecordings.vue';
import VideoConference from '@/views/dispatch/VideoConference.vue';

// 当前激活的模块，默认显示音频调度
const activeModule = ref<string>('audio');

// 切换功能模块
const switchModule = (module: string) => {
  activeModule.value = module;
};
</script>

<style scoped>
.emergency-command-screen {
  width: 100vw;
  height: 100vh;
  background:
    radial-gradient(circle at 20% 80%, rgba(64, 158, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.emergency-command-screen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px, 80px 80px;
  pointer-events: none;
  opacity: 0.5;
}

/* 顶部标题栏 */
.screen-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  background: linear-gradient(135deg,
    rgba(15, 32, 64, 0.95) 0%,
    rgba(25, 45, 85, 0.9) 50%,
    rgba(35, 58, 106, 0.85) 100%);
  backdrop-filter: blur(15px);
  border-bottom: 2px solid rgba(64, 158, 255, 0.3);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 1px 0 rgba(255, 255, 255, 0.1) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset;
  position: relative;
  overflow: hidden;
}

/* 添加动态光晕效果 */
.screen-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(64, 158, 255, 0.1),
    transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* 左上角时间显示 */
.header-time {
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

.time-display {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 8px 0;
  backdrop-filter: none;
  box-shadow: none;
  color: #ffffff;
  text-align: left;
  position: relative;
  overflow: hidden;
}

/* 移除时间图标装饰 */

.time-display .date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.time-display .time {
  font-size: 18px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #64B5F6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

/* 中央区域 */
.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  flex: 1;
  z-index: 2;
  position: relative;
}

.center-left-buttons,
.center-right-buttons {
  display: flex;
  gap: 20px;
  align-items: center;
}

.title-container {
  margin: 0 30px;
  position: relative;
}

.screen-title {
  color: #ffffff;
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  text-shadow:
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(64, 158, 255, 0.3);
  white-space: nowrap;
  background: linear-gradient(135deg,
    #ffffff 0%,
    #64B5F6 50%,
    #ffffff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 100%;
  animation: titleShine 3s ease-in-out infinite;
  position: relative;
}

@keyframes titleShine {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.screen-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg,
    transparent,
    #64B5F6,
    transparent);
  border-radius: 1px;
}

/* 右上角天气信息 */
.header-weather {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

.weather-display {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 8px 0;
  backdrop-filter: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

/* 移除天气背景装饰 */

.weather-icon {
  font-size: 28px;
  animation: float 2s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}

.weather-info {
  text-align: right;
  position: relative;
  z-index: 1;
}

.weather-info .weather-status {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.weather-info .temperature {
  font-size: 18px;
  font-weight: bold;
  color: #FFD54F;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
}

/* 顶部标题栏功能按钮样式 - 只应用于header区域的按钮 */
.screen-header :deep(.el-button) {
  height: 50px;
  padding: 0 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  background: linear-gradient(135deg,
    rgba(64, 158, 255, 0.15) 0%,
    rgba(64, 158, 255, 0.05) 100%);
  color: #ffffff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 1px 0 rgba(255, 255, 255, 0.1) inset;
}

.screen-header :deep(.el-button::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent);
  transition: left 0.5s;
}

.screen-header :deep(.el-button:hover) {
  background: linear-gradient(135deg,
    rgba(64, 158, 255, 0.3) 0%,
    rgba(64, 158, 255, 0.15) 100%);
  border: none;
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 25px rgba(64, 158, 255, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.2);
  color: #64B5F6;
}

.screen-header :deep(.el-button:hover::before) {
  left: 100%;
}

.screen-header :deep(.el-button.active) {
  background: linear-gradient(135deg,
    #409EFF 0%,
    #64B5F6 100%);
  border: none;
  box-shadow:
    0 6px 20px rgba(64, 158, 255, 0.4),
    0 0 0 3px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.screen-header :deep(.el-button.active::before) {
  display: none;
}

.screen-header :deep(.el-button:active) {
  transform: translateY(-1px) scale(0.98);
}

.screen-header :deep(.el-button .el-icon) {
  margin-right: 8px;
  font-size: 18px;
  transition: transform 0.3s ease;
}

.screen-header :deep(.el-button:hover .el-icon) {
  transform: scale(1.1) rotate(5deg);
}

/* 主内容区域 */
.screen-content {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.module-container {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}



/* 响应式调整 */
@media (max-width: 1200px) {
  .screen-header {
    height: 70px;
    padding: 0 20px;
  }

  .header-time,
  .header-weather {
    position: static;
    transform: none;
  }

  .time-display,
  .weather-display {
    padding: 8px 0;
    border-radius: 0;
  }

  .header-center {
    gap: 20px;
  }

  .center-left-buttons,
  .center-right-buttons {
    gap: 15px;
  }

  .title-container {
    margin: 0 20px;
  }

  .screen-title {
    font-size: 28px;
  }

  .screen-header :deep(.el-button) {
    height: 45px;
    padding: 0 20px;
    font-size: 14px;
    border-radius: 22px;
  }

  .time-display .time,
  .weather-info .temperature {
    font-size: 16px;
  }

  .weather-icon {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .screen-header {
    flex-direction: column;
    height: auto;
    padding: 20px;
    gap: 15px;
  }

  .screen-header::before {
    animation: none; /* 移动端禁用光晕动画以提升性能 */
  }

  .header-time,
  .header-weather {
    order: -1;
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    transform: none;
  }

  .time-display,
  .weather-display {
    padding: 8px 12px;
    border-radius: 8px;
  }

  .header-center {
    flex-direction: column;
    gap: 15px;
  }

  .center-left-buttons,
  .center-right-buttons {
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .screen-title {
    font-size: 24px;
    animation: none; /* 移动端禁用标题动画 */
    background: #ffffff;
    background-clip: initial;
    -webkit-background-clip: initial;
    -webkit-text-fill-color: initial;
  }

  :deep(.el-button) {
    height: 40px;
    padding: 0 16px;
    font-size: 12px;
    border-radius: 20px;
  }

  :deep(.el-button::before) {
    display: none; /* 移动端禁用按钮光晕效果 */
  }

  :deep(.el-button:hover .el-icon) {
    transform: none; /* 移动端禁用图标动画 */
  }

  .weather-icon {
    font-size: 20px;
    animation: none; /* 移动端禁用天气图标动画 */
  }
}
</style>
