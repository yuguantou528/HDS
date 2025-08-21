<template>
  <div class="conference-main large-screen-container">
    <!-- 左侧会议列表 -->
    <div class="conference-list large-screen-card">
      <div class="meeting-list-header">
        <span class="meeting-list-title large-screen-text-primary">会商会议</span>
        <el-button type="primary" class="large-screen-button" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>发起会议
        </el-button>
      </div>
      <el-tabs v-model="meetingTab" class="meeting-tabs" stretch>
        <el-tab-pane label="进行中" name="active">
          <el-scrollbar class="meeting-list-scrollbar">
            <el-card
              v-for="meeting in meetings.filter(m => m.status === '进行中')"
              :key="meeting.id"
              :class="['meeting-card', 'meeting-card-shadow', 'large-screen-card', { active: meeting.id === meetingStore.activeMeetingId } ]"
              @click="selectMeeting(meeting.id)"
            >
              <div class="meeting-topic large-screen-text-primary">{{ meeting.topic }}</div>
              <div class="meeting-meta">
                <el-tag :type="meeting.status === '进行中' ? 'success' : 'info'" class="large-screen-tag">{{ meeting.status }}</el-tag>
                <span class="host large-screen-text-secondary">主持: {{ meeting.host }}</span>
              </div>
              <div class="meeting-time large-screen-text-tertiary">
                <el-icon><Calendar /></el-icon>
                {{ meeting.startTime }}
              </div>
              <div class="meeting-members">
                <el-avatar v-for="m in meeting.members" :key="m.id" :size="16" class="large-screen-avatar" :style="getMemberAvatarStyle(m)">{{ m.name[0] }}</el-avatar>
                <span class="member-count large-screen-text-info">{{ meeting.members.length }}人</span>
              </div>
            </el-card>
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="已结束" name="ended">
          <el-scrollbar class="meeting-list-scrollbar">
            <el-card
              v-for="meeting in meetings.filter(m => m.status === '已结束')"
              :key="meeting.id"
              :class="['meeting-card', 'meeting-card-shadow', 'large-screen-card', { active: meeting.id === meetingStore.activeMeetingId } ]"
              @click="selectMeeting(meeting.id)"
            >
              <div class="meeting-topic large-screen-text-primary">{{ meeting.topic }}</div>
              <div class="meeting-meta">
                <el-tag :type="meeting.status === '进行中' ? 'success' : 'info'" class="large-screen-tag">{{ meeting.status }}</el-tag>
                <span class="host large-screen-text-secondary">主持: {{ meeting.host }}</span>
              </div>
              <div class="meeting-time large-screen-text-tertiary">
                <el-icon><Calendar /></el-icon>
                {{ meeting.startTime }}
              </div>
              <div class="meeting-duration large-screen-text-tertiary">
                <el-icon><Timer /></el-icon>
                会议时长：{{ meeting.duration || calcMeetingDuration(meeting) }}
              </div>
              <div class="meeting-members">
                <el-avatar v-for="m in meeting.members" :key="m.id" :size="16" class="large-screen-avatar" :style="getMemberAvatarStyle(m)">{{ m.name[0] }}</el-avatar>
                <span class="member-count large-screen-text-info">{{ meeting.members.length }}人</span>
              </div>
              <div class="meeting-actions">
                <el-button type="danger" class="large-screen-button" @click.stop="deleteMeeting(meeting)">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </el-card>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 中间主画面+成员列表 -->
    <div class="conference-center large-screen-card">
      <div class="meeting-detail">
        <div class="detail-header">
          <div class="detail-title">
            <span class="title-text large-screen-text-primary">{{ meetingStore.activeMeeting.topic || '未选择会议' }}</span>
            <el-tag v-if="meetingStore.activeMeeting.topic" :type="meetingStore.activeMeeting.status === '进行中' ? 'success' : 'info'" class="large-screen-tag">{{ meetingStore.activeMeeting.status }}</el-tag>
          </div>
          <div class="detail-ops">
            <!-- 只在进行中的会议显示操作按钮 -->
            <el-button-group v-if="meetingStore.activeMeeting.topic && meetingStore.activeMeeting.status === '进行中'">
              <el-button class="large-screen-button" @click="openInviteDialog">
                <el-icon><UserFilled /></el-icon>邀请成员
                <!-- 暂时移除邀请状态徽章 -->
                <!-- <el-badge
                  v-if="getPendingInviteCount(meetingStore.activeMeeting.id) > 0"
                  :value="getPendingInviteCount(meetingStore.activeMeeting.id)"
                  class="invite-badge"
                /> -->
              </el-button>
              <el-button type="warning" class="large-screen-button" @click="toggleMuteAll(meetingStore.activeMeeting)">
                <el-icon><Microphone /></el-icon>{{ meetingStore.activeMeeting.muted ? '解除全体禁言' : '全体禁言' }}
              </el-button>
              <el-button
                :type="isRecording ? 'danger' : 'primary'"
                class="large-screen-button recording-btn"
                @click="toggleRecording"
              >
                <el-icon>
                  <component :is="isRecording ? 'VideoPause' : 'VideoPlay'" />
                </el-icon>
                {{ isRecording ? '停止录像' : '开始录像' }}
              </el-button>
              <el-button type="danger" class="large-screen-button" @click="endMeeting(meetingStore.activeMeeting)">
                <el-icon><CircleClose /></el-icon>结束会议
              </el-button>
            </el-button-group>
            <!-- 已结束会议不显示操作按钮 -->
          </div>
        </div>
        <div class="video-area">
          <div v-if="!meetingStore.activeMeeting.topic" class="no-meeting-selected">
            <el-icon :size="48"><VideoCamera /></el-icon>
            <div>请从左侧选择或创建一个会议</div>
          </div>
          <!-- 进行中的会议 - 显示视频网格 -->
          <div v-else-if="meetingStore.activeMeeting.status === '进行中'" class="video-grid-container">
            <!-- 不对称六画面网格布局 -->
            <div class="video-grid asymmetric-layout">
              <!-- 主讲人区域 - 占据更大空间 -->
              <div class="video-cell main-speaker" @click="selectVideoCell('main')">
                <div class="video-controls">
                  <div class="video-title">主讲人</div>
                  <div class="video-actions">
                    <el-button
                      circle
                      size="small"
                      :class="{ 'camera-off': !cameraStates.main }"
                      :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
                      @click.stop="toggleCamera('main')"
                    >
                      <el-icon>
                        <component :is="cameraStates.main ? 'VideoCameraFilled' : 'VideoCamera'" />
                      </el-icon>
                    </el-button>
                    <el-button
                      circle
                      size="small"
                      :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
                      @click.stop="toggleFullscreen('main')"
                    >
                      <el-icon><FullScreen /></el-icon>
                    </el-button>
                    <el-button
                      circle
                      size="small"
                      :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
                      @click.stop="toggleMute('main')"
                    >
                      <el-icon><Mute /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="video-player">
                  <div v-if="cameraStates.main" class="video-placeholder">
                    <el-icon :size="64"><VideoCamera /></el-icon>
                    <div class="placeholder-text">主讲人画面</div>
                    <div class="placeholder-subtitle">等待视频接入...</div>
                  </div>
                  <div v-else class="video-placeholder camera-off-state">
                    <el-icon :size="64"><VideoCamera /></el-icon>
                    <div class="placeholder-text">摄像头已关闭</div>
                    <div class="placeholder-subtitle">主讲人已关闭摄像头</div>
                  </div>
                </div>
              </div>

              <!-- 参会者区域 1 -->
              <div class="video-cell participant" @click="selectVideoCell('participant1')">
                <div class="video-controls">
                  <div class="video-title">参会者1</div>
                  <div class="video-actions">
                    <el-button
                      circle
                      size="small"
                      :class="{ 'camera-off': !cameraStates.participant1 }"
                      :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
                      @click.stop="toggleCamera('participant1')"
                    >
                      <el-icon>
                        <component :is="cameraStates.participant1 ? 'VideoCameraFilled' : 'VideoCamera'" />
                      </el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleFullscreen('participant1')">
                      <el-icon><FullScreen /></el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleMute('participant1')">
                      <el-icon><Mute /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="video-player">
                  <div v-if="cameraStates.participant1" class="video-placeholder">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">参会者画面</div>
                  </div>
                  <div v-else class="video-placeholder camera-off-state">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">摄像头已关闭</div>
                  </div>
                </div>
              </div>

              <!-- 参会者区域 2 -->
              <div class="video-cell participant" @click="selectVideoCell('participant2')">
                <div class="video-controls">
                  <div class="video-title">参会者2</div>
                  <div class="video-actions">
                    <el-button
                      circle
                      size="small"
                      :class="{ 'camera-off': !cameraStates.participant2 }"
                      :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
                      @click.stop="toggleCamera('participant2')"
                    >
                      <el-icon>
                        <component :is="cameraStates.participant2 ? 'VideoCameraFilled' : 'VideoCamera'" />
                      </el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleFullscreen('participant2')">
                      <el-icon><FullScreen /></el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleMute('participant2')">
                      <el-icon><Mute /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="video-player">
                  <div v-if="cameraStates.participant2" class="video-placeholder">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">参会者画面</div>
                  </div>
                  <div v-else class="video-placeholder camera-off-state">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">摄像头已关闭</div>
                  </div>
                </div>
              </div>

              <!-- 参会者区域 3 -->
              <div class="video-cell participant" @click="selectVideoCell('participant3')">
                <div class="video-controls">
                  <div class="video-title">参会者3</div>
                  <div class="video-actions">
                    <el-button
                      circle
                      size="small"
                      :class="{ 'camera-off': !cameraStates.participant3 }"
                      :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
                      @click.stop="toggleCamera('participant3')"
                    >
                      <el-icon>
                        <component :is="cameraStates.participant3 ? 'VideoCameraFilled' : 'VideoCamera'" />
                      </el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleFullscreen('participant3')">
                      <el-icon><FullScreen /></el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleMute('participant3')">
                      <el-icon><Mute /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="video-player">
                  <div v-if="cameraStates.participant3" class="video-placeholder">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">参会者画面</div>
                  </div>
                  <div v-else class="video-placeholder camera-off-state">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">摄像头已关闭</div>
                  </div>
                </div>
              </div>

              <!-- 参会者区域 4 -->
              <div class="video-cell participant" @click="selectVideoCell('participant4')">
                <div class="video-controls">
                  <div class="video-title">参会者4</div>
                  <div class="video-actions">
                    <el-button
                      circle
                      size="small"
                      :class="{ 'camera-off': !cameraStates.participant4 }"
                      :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
                      @click.stop="toggleCamera('participant4')"
                    >
                      <el-icon>
                        <component :is="cameraStates.participant4 ? 'VideoCameraFilled' : 'VideoCamera'" />
                      </el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleFullscreen('participant4')">
                      <el-icon><FullScreen /></el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleMute('participant4')">
                      <el-icon><Mute /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="video-player">
                  <div v-if="cameraStates.participant4" class="video-placeholder">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">参会者画面</div>
                  </div>
                  <div v-else class="video-placeholder camera-off-state">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">摄像头已关闭</div>
                  </div>
                </div>
              </div>

              <!-- 参会者区域 5 -->
              <div class="video-cell participant" @click="selectVideoCell('participant5')">
                <div class="video-controls">
                  <div class="video-title">参会者5</div>
                  <div class="video-actions">
                    <el-button
                      circle
                      size="small"
                      :class="{ 'camera-off': !cameraStates.participant5 }"
                      :disabled="!meetingStore.activeMeeting.topic || meetingStore.activeMeeting.status !== '进行中'"
                      @click.stop="toggleCamera('participant5')"
                    >
                      <el-icon>
                        <component :is="cameraStates.participant5 ? 'VideoCameraFilled' : 'VideoCamera'" />
                      </el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleFullscreen('participant5')">
                      <el-icon><FullScreen /></el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleMute('participant5')">
                      <el-icon><Mute /></el-icon>
                    </el-button>
                  </div>
                </div>
                <div class="video-player">
                  <div v-if="cameraStates.participant5" class="video-placeholder">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">参会者画面</div>
                  </div>
                  <div v-else class="video-placeholder camera-off-state">
                    <el-icon :size="32"><VideoCamera /></el-icon>
                    <div class="placeholder-text">摄像头已关闭</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 已结束的会议 - 显示会议总结 -->
          <div v-else-if="meetingStore.activeMeeting.status === '已结束'" class="meeting-ended-view">
            <div class="meeting-summary">
              <div class="summary-header">
                <el-icon :size="48" color="#909399"><DocumentChecked /></el-icon>
                <h3>会议已结束</h3>
                <p>会议已于 {{ meetingStore.activeMeeting.endTime }} 结束</p>
              </div>

              <div class="summary-content">
                <el-descriptions :column="2" border size="default">
                  <el-descriptions-item label="会议主题" :span="2">
                    <span class="topic-text">{{ meetingStore.activeMeeting.topic }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="主持人">
                    <div class="host-info">
                      <el-avatar :size="20">{{ meetingStore.activeMeeting.host?.[0] }}</el-avatar>
                      <span>{{ meetingStore.activeMeeting.host }}</span>
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item label="参会人数">
                    {{ meetingStore.activeMeeting.members?.length || 0 }}人
                  </el-descriptions-item>
                  <el-descriptions-item label="开始时间">
                    {{ meetingStore.activeMeeting.startTime }}
                  </el-descriptions-item>
                  <el-descriptions-item label="结束时间">
                    {{ meetingStore.activeMeeting.endTime }}
                  </el-descriptions-item>
                  <el-descriptions-item label="会议时长">
                    <span class="duration-highlight">{{ formatDuration(meetingStore.activeMeeting.duration) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="录像状态">
                    <el-tag v-if="meetingStore.activeMeeting.hasRecording" type="success" size="small">
                      <el-icon><VideoCamera /></el-icon>已录制
                    </el-tag>
                    <el-tag v-else type="info" size="small">未录制</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 录像回放区域 -->
              <div v-if="meetingStore.activeMeeting.hasRecording" class="recording-section">
                <div class="section-header">
                  <h4><el-icon><VideoPlay /></el-icon>会议录像</h4>
                </div>
                <div class="recording-card">
                  <div class="recording-info">
                    <div class="info-item">
                      <span class="label">录像时长：</span>
                      <span class="value">{{ formatDuration(meetingStore.activeMeeting.duration) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">文件大小：</span>
                      <span class="value">{{ formatFileSize(meetingStore.activeMeeting.fileSize) || '156.8 MB' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">分辨率：</span>
                      <span class="value">{{ meetingStore.activeMeeting.resolution || '1920x1080' }}</span>
                    </div>
                  </div>
                  <div class="recording-actions">
                    <el-button type="primary" @click="playRecording(meetingStore.activeMeeting)">
                      <el-icon><VideoPlay /></el-icon>播放录像
                    </el-button>
                    <el-button @click="downloadRecording(meetingStore.activeMeeting)">
                      <el-icon><Download /></el-icon>下载录像
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 参会者统计 -->
              <div class="participants-section">
                <div class="section-header">
                  <h4><el-icon><User /></el-icon>参会者统计</h4>
                </div>
                <div class="participants-grid">
                  <div v-for="member in meetingStore.activeMeeting.members"
                       :key="member.id"
                       class="participant-card">
                    <el-avatar :size="32">{{ member.name[0] }}</el-avatar>
                    <div class="participant-info">
                      <div class="name">{{ member.name }}</div>
                      <div class="status">
                        <el-tag :type="member.status === 'online' ? 'success' : 'info'" size="small">
                          {{ member.status === 'online' ? '已参会' : '未参会' }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 会议操作区域 -->
              <div class="ended-meeting-actions">
                <el-button @click="exportMeetingReport(meetingStore.activeMeeting)">
                  <el-icon><Document /></el-icon>导出会议报告
                </el-button>
                <el-button type="danger" @click="deleteMeeting(meetingStore.activeMeeting)">
                  <el-icon><Delete /></el-icon>删除会议
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 成员列表美化 - 只在进行中的会议显示 -->
        <div class="member-list beautified" v-if="meetingStore.activeMeeting.topic && meetingStore.activeMeeting.status === '进行中'">
          <div class="member-list-header">
            <div class="member-list-title large-screen-text-primary">成员列表</div>
            <div class="member-count-badge large-screen-tag">{{ meetingStore.activeMeeting.members?.length || 0 }}人</div>
          </div>
          <div class="member-list-table">
            <div class="member-row member-header">
              <div class="member-col name large-screen-text-primary">成员</div>
              <div class="member-col status large-screen-text-primary">状态</div>
              <div class="member-col ops large-screen-text-primary">操作</div>
            </div>
            <div v-for="m in meetingStore.activeMeeting.members" :key="m.id" class="member-row">
              <div class="member-col name">
                <el-avatar :size="18" class="large-screen-avatar" :style="getMemberAvatarStyle(m)">{{ m.name[0] }}</el-avatar>
                <span class="large-screen-text-secondary">{{ m.name }}</span>
                <span v-if="m.id === meetingStore.activeMeeting.hostId" class="host-badge large-screen-tag">主持</span>
              </div>
              <div class="member-col status">
                <el-tag :type="m.status === 'online' ? 'success' : 'info'" class="large-screen-tag">{{ m.status === 'online' ? '在线' : '离线' }}</el-tag>
                <el-tag v-if="m.speaking" type="warning" class="large-screen-tag">发言中</el-tag>
                <el-tag v-if="m.muted" type="info" class="large-screen-tag">禁言</el-tag>
              </div>
              <div class="member-col ops">
                <el-button-group>
                  <el-button
                    :type="meetingStore.activeMeeting.status !== '进行中' ? 'info' : (getMemberCameraState(m) ? 'success' : 'danger')"
                    :class="['large-screen-button', 'member-action-btn', 'camera-btn', { 'is-camera-off': !getMemberCameraState(m) }]"
                    @click="toggleMemberCamera(m)"
                    :disabled="meetingStore.activeMeeting.status !== '进行中'"
                  >
                    <el-icon>
                      <component :is="getMemberCameraState(m) ? 'VideoCameraFilled' : 'VideoCamera'" />
                    </el-icon>
                    {{ getMemberCameraState(m) ? '关闭摄像头' : '开启摄像头' }}
                  </el-button>
                  <el-button
                    :type="m.muted ? 'success' : 'primary'"
                    :class="['large-screen-button', 'member-action-btn', 'mute-btn', { 'is-muted': m.muted }]"
                    @click="toggleMuteMember(m)"
                    :disabled="meetingStore.activeMeeting.status !== '进行中'"
                  >
                    <el-icon>
                      <component :is="m.muted ? 'MicrophoneSlash' : 'Microphone'" />
                    </el-icon>
                    {{ m.muted ? '解禁' : '禁言' }}
                  </el-button>
                  <el-button
                    :type="m.silenced ? 'info' : 'warning'"
                    :class="['large-screen-button', 'member-action-btn', 'silence-btn', { 'is-silenced': m.silenced }]"
                    @click="toggleSilenceMember(m)"
                    :disabled="meetingStore.activeMeeting.status !== '进行中'"
                  >
                    <el-icon>
                      <component :is="m.silenced ? 'VideoPlay' : 'Mute'" />
                    </el-icon>
                    {{ m.silenced ? '解音' : '静音' }}
                  </el-button>
                  <el-button type="success" class="large-screen-button member-action-btn host-btn" @click="confirmSetHost(m)" :disabled="meetingStore.activeMeeting.status !== '进行中' || m.id === meetingStore.activeMeeting.hostId">
                    <el-icon><TopRight /></el-icon>转主持
                  </el-button>
                  <el-button type="danger" class="large-screen-button member-action-btn remove-btn" @click="removeMember(m)" :disabled="meetingStore.activeMeeting.status !== '进行中'">
                    <el-icon><Delete /></el-icon>移除
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>

          <!-- 邀请状态列表 - 暂时移除 -->
          <!-- <div class="invite-status-list" v-if="activeMeeting.topic && getInviteStatuses(activeMeeting.id).length > 0">
            ...
          </div> -->
        </div>
      </div>
    </div>
    <!-- 右侧会议聊天 -->
    <div class="conference-chat large-screen-card">
      <div class="chat-area">
        <div class="chat-header">
          <div class="chat-title large-screen-text-primary">会议聊天</div>
        </div>
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-if="chatMessages.length === 0" class="no-messages">
            <el-icon :size="40"><ChatDotRound /></el-icon>
            <div class="large-screen-text-tertiary">暂无消息</div>
          </div>
          <div v-for="msg in chatMessages" :key="msg.id" :class="['chat-msg', { 'chat-msg-self': msg.user === '我' }]">
            <div class="chat-msg-header">
              <span class="chat-user large-screen-text-primary">{{ msg.user }}</span>
              <span class="chat-time large-screen-text-tertiary">{{ msg.time }}</span>
            </div>
            <div class="chat-msg-content large-screen-text-secondary">{{ msg.text }}</div>
          </div>
        </div>
        <!-- 聊天输入框 - 只在进行中的会议显示 -->
        <div v-if="meetingStore.activeMeeting.status === '进行中'" class="chat-input-container">
          <div class="chat-input-row">
            <el-input
              v-model="chatInput"
              placeholder="输入消息..."
              @keyup.enter="sendChat"
            />
            <el-button
              type="primary"
              class="large-screen-button"
              @click="sendChat"
            >发送</el-button>
          </div>
          <div class="chat-tools">
            <el-tooltip content="发送图片" placement="top">
              <el-button
                size="small"
                circle
              >
                <el-icon><PictureFilled /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="发送文件" placement="top">
              <el-button
                size="small"
                circle
              >
                <el-icon><Document /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="发送表情" placement="top">
              <el-button
                size="small"
                circle
              >
                <el-icon><Promotion /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <!-- 已结束会议显示提示信息 -->
        <div v-else-if="meetingStore.activeMeeting.status === '已结束'" class="chat-ended-notice">
          <el-icon><DocumentChecked /></el-icon>
          <span>会议已结束，无法发送消息</span>
        </div>
      </div>
    </div>

    <!-- 发起会议对话框 -->
    <el-dialog v-model="createDialogVisible" title="发起会议" width="400px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="会议主题">
          <el-input v-model="createForm.topic" placeholder="请输入会议主题" />
        </el-form-item>
        <el-form-item label="主持人">
          <el-input v-model="createForm.host" placeholder="请输入主持人" />
        </el-form-item>
        <el-form-item label="选择成员">
          <el-select v-model="createForm.members" multiple filterable placeholder="请选择成员" style="width: 100%">
            <el-option v-for="u in allUsers" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreate">确定</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 邀请成员对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="邀请成员" width="400px">
      <el-select v-model="inviteMembers" multiple filterable placeholder="请选择成员" style="width: 100%">
        <el-option v-for="u in allUsers" :key="u.id" :label="u.name" :value="u.id" />
      </el-select>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="inviteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="doInviteMembers">邀请</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 会议邀请弹窗已移至AppHeader组件中 -->

    <!-- 会议详细信息弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`会议详情 - ${selectedMeetingForDetail?.topic || ''}`"
      width="800px"
      class="meeting-detail-dialog"
    >
      <div v-if="selectedMeetingForDetail" class="meeting-detail-content">
        <el-tabs v-model="activeDetailTab" class="detail-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="会议主题" :span="2">
                <span class="detail-topic">{{ selectedMeetingForDetail.topic }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="主持人">
                <div class="host-info">
                  <el-avatar :size="20">{{ selectedMeetingForDetail.host[0] }}</el-avatar>
                  <span>{{ selectedMeetingForDetail.host }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="会议状态">
                <el-tag :type="selectedMeetingForDetail.status === '进行中' ? 'success' : 'info'">
                  {{ selectedMeetingForDetail.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">
                {{ selectedMeetingForDetail.startTime }}
              </el-descriptions-item>
              <el-descriptions-item label="结束时间">
                {{ selectedMeetingForDetail.endTime || '进行中' }}
              </el-descriptions-item>
              <el-descriptions-item label="会议时长">
                {{ formatDuration(selectedMeetingForDetail.duration) }}
              </el-descriptions-item>
              <el-descriptions-item label="参会人数">
                {{ selectedMeetingForDetail.members?.length || 0 }}人
              </el-descriptions-item>
              <el-descriptions-item label="录像状态">
                <el-tag v-if="selectedMeetingForDetail.hasRecording" type="success" size="small">
                  <el-icon><VideoCamera /></el-icon>已录制
                </el-tag>
                <el-tag v-else type="info" size="small">未录制</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="参会成员" name="members">
            <div class="members-detail">
              <div v-for="member in selectedMeetingForDetail.members" :key="member.id" class="member-detail-card">
                <el-avatar :size="40">{{ member.name[0] }}</el-avatar>
                <div class="member-detail-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-status">
                    <el-tag :type="member.status === 'online' ? 'success' : 'info'" size="small">
                      {{ member.status === 'online' ? '已参会' : '未参会' }}
                    </el-tag>
                  </div>
                </div>
                <div class="member-stats">
                  <div class="stat-item">
                    <span class="stat-label">发言次数</span>
                    <span class="stat-value">{{ Math.floor(Math.random() * 10) + 1 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">在线时长</span>
                    <span class="stat-value">{{ Math.floor(Math.random() * 60) + 30 }}分钟</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane v-if="selectedMeetingForDetail.hasRecording" label="录像信息" name="recording">
            <div class="recording-detail">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="录像文件">
                  <div class="recording-file-info">
                    <el-icon><VideoCamera /></el-icon>
                    <span>{{ selectedMeetingForDetail.topic }}_录像.mp4</span>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item label="文件大小">
                  {{ formatFileSize(selectedMeetingForDetail.fileSize) }}
                </el-descriptions-item>
                <el-descriptions-item label="分辨率">
                  {{ selectedMeetingForDetail.resolution }}
                </el-descriptions-item>
                <el-descriptions-item label="帧率">
                  {{ selectedMeetingForDetail.frameRate }}
                </el-descriptions-item>
                <el-descriptions-item label="编码格式">
                  {{ selectedMeetingForDetail.codec }}
                </el-descriptions-item>
                <el-descriptions-item label="录像时长">
                  {{ formatDuration(selectedMeetingForDetail.duration) }}
                </el-descriptions-item>
              </el-descriptions>
              <div class="recording-actions-detail">
                <el-button type="primary" @click="playRecording(selectedMeetingForDetail)">
                  <el-icon><VideoPlay /></el-icon>播放录像
                </el-button>
                <el-button @click="downloadRecording(selectedMeetingForDetail)">
                  <el-icon><Download /></el-icon>下载录像
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 导出会议报告弹窗 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出会议报告"
      width="600px"
      class="export-dialog"
    >
      <div class="export-options">
        <el-form :model="exportForm" label-width="120px">
          <el-form-item label="报告格式">
            <el-radio-group v-model="exportForm.format">
              <el-radio label="pdf">PDF格式</el-radio>
              <el-radio label="word">Word文档</el-radio>
              <el-radio label="excel">Excel表格</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="包含内容">
            <el-checkbox-group v-model="exportForm.content">
              <el-checkbox label="basic">基本信息</el-checkbox>
              <el-checkbox label="members">参会成员</el-checkbox>
              <el-checkbox label="chat">聊天记录</el-checkbox>
              <el-checkbox label="recording" v-if="selectedMeetingForExport?.hasRecording">录像信息</el-checkbox>
              <el-checkbox label="statistics">统计数据</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="报告模板">
            <el-select v-model="exportForm.template" placeholder="选择报告模板">
              <el-option label="标准模板" value="standard" />
              <el-option label="详细模板" value="detailed" />
              <el-option label="简洁模板" value="simple" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmExportReport" :loading="exportLoading">
            <el-icon><Download /></el-icon>导出报告
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 录像播放弹窗 -->
    <el-dialog
      v-model="recordingDialogVisible"
      :title="`会议录像 - ${selectedMeetingForRecording?.topic || ''}`"
      width="90%"
      top="5vh"
      class="recording-dialog"
      :close-on-click-modal="false"
      @close="handleCloseRecording"
    >
      <div v-if="selectedMeetingForRecording" class="recording-content">
        <!-- 录像信息 -->
        <div class="recording-info">
          <div class="info-left">
            <div class="meeting-title">{{ selectedMeetingForRecording.topic }}</div>
            <div class="meeting-meta">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                主持人：{{ selectedMeetingForRecording.host }}
              </span>
              <span class="meta-item">
                <el-icon><Timer /></el-icon>
                时长：{{ formatDuration(selectedMeetingForRecording.duration) }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                时间：{{ selectedMeetingForRecording.startTime }}
              </span>
            </div>
          </div>
          <div class="info-right">
            <el-tag type="success">
              <el-icon><VideoCamera /></el-icon>
              有录像
            </el-tag>
          </div>
        </div>

        <!-- 视频播放器 -->
        <div class="video-player-container">
          <div class="video-wrapper">
            <video
              ref="videoPlayerRef"
              class="video-player"
              controls
              preload="metadata"
              @loadedmetadata="onVideoLoaded"
              @timeupdate="onTimeUpdate"
              @ended="onVideoEnded"
              @error="onVideoError"
            >
              <source :src="recordingUrl" type="video/mp4">
              您的浏览器不支持视频播放。
            </video>

            <!-- 加载状态 -->
            <div v-if="videoLoading" class="video-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>正在加载录像...</span>
            </div>

            <!-- 错误状态 -->
            <div v-if="videoError" class="video-error">
              <el-icon class="error-icon"><Warning /></el-icon>
              <span>录像加载失败，请稍后重试</span>
            </div>
          </div>

          <!-- 播放控制栏 -->
          <div class="video-controls-bar">
            <div class="controls-left">
              <el-button-group>
                <el-button @click="togglePlay" :disabled="videoError">
                  <el-icon>
                    <component :is="isPlaying ? 'VideoPause' : 'VideoPlay'" />
                  </el-icon>
                  {{ isPlaying ? '暂停' : '播放' }}
                </el-button>
                <el-button @click="stopVideo" :disabled="videoError">
                  <el-icon><Close /></el-icon>
                  停止
                </el-button>
                <el-button @click="reloadVideo" :disabled="videoLoading">
                  <el-icon><Refresh /></el-icon>
                  重新加载
                </el-button>
              </el-button-group>
            </div>

            <div class="controls-center">
              <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}</span>
            </div>

            <div class="controls-right">
              <div class="volume-control">
                <el-button @click="toggleVideoMute" size="small">
                  <el-icon>
                    <component :is="isMuted ? 'Mute' : 'Microphone'" />
                  </el-icon>
                </el-button>
                <el-slider
                  v-model="volume"
                  :min="0"
                  :max="100"
                  :show-tooltip="false"
                  @change="setVolume"
                  style="width: 80px; margin-left: 8px;"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useMeetingStore } from '@/store/meeting';
import {
  Plus, Calendar, Delete, UserFilled, Microphone, CircleClose,
  VideoCamera, ChatDotRound, Timer, TopRight, Mute,
  PictureFilled, Document, Promotion, Refresh, Close,
  MicrophoneSlash, VideoPlay, VideoPause, FullScreen, VideoCameraFilled,
  DocumentChecked, User, View, Download, Loading, Warning
} from '@element-plus/icons-vue';
// 暂时移除所有新添加的导入
// import { useMeetingStore } from '@/store/meeting';
// import MeetingInviteDialog from '@/components/MeetingInviteDialog.vue';
// import NotificationPermission from '@/components/NotificationPermission.vue';
// import wsService from '@/services/websocket';
// import webrtcService from '@/services/webrtc';

// 使用meeting store
const meetingStore = useMeetingStore();

const allUsers = [
  { id: 'u1', name: '张三' },
  { id: 'u2', name: '李四' },
  { id: 'u3', name: '王五' },
  { id: 'u4', name: '赵六' },
  { id: 'u5', name: '陈七' },
  { id: 'u6', name: '孙八' }
];
const createDialogVisible = ref(false);
const inviteDialogVisible = ref(false);
const inviteMembers = ref([]);
// 使用meeting store的聊天消息
const chatMessages = meetingStore.chatMessages;
const chatInput = ref('');
const chatMessagesRef = ref<HTMLElement | null>(null);
const createForm = reactive({ topic: '', host: '', members: [] as string[] });

// 会议详情弹窗相关
const detailDialogVisible = ref(false);
const selectedMeetingForDetail = ref<any>(null);
const activeDetailTab = ref('basic');

// 导出报告弹窗相关
const exportDialogVisible = ref(false);
const selectedMeetingForExport = ref<any>(null);
const exportLoading = ref(false);
const exportForm = reactive({
  format: 'pdf',
  content: ['basic', 'members', 'chat'],
  template: 'standard'
});

// 录像播放弹窗相关
const recordingDialogVisible = ref(false);
const selectedMeetingForRecording = ref<any>(null);
const videoPlayerRef = ref<HTMLVideoElement | null>(null);
const recordingUrl = ref('');
const videoLoading = ref(false);
const videoError = ref(false);
const isPlaying = ref(false);
const currentTime = ref(0);
const totalTime = ref(0);
const volume = ref(50);
const isMuted = ref(false);

// 使用meeting store的数据（保持响应式）
const meetings = meetingStore.meetings;
// 直接使用store中的响应式数据，在模板中通过meetingStore访问
const showInviteDialog = ref(false);
const currentInvite = ref(null);

// 摄像头状态管理
const cameraStates = reactive({
  main: true,
  participant1: true,
  participant2: true,
  participant3: true,
  participant4: true,
  participant5: true
});

// 录像功能相关
const isRecording = ref(false);
const recordingStartTime = ref<Date | null>(null);
const recordingDuration = ref(0);
const recordingTimer = ref<NodeJS.Timeout | null>(null);
const pendingInvites = ref([]);
const inviteStatuses = ref([]);

const meetingTab = ref('active');

// 会议邀请相关数据（弹窗模式不需要列表）
// const pendingInvitations = ref([]);

// 使用meeting store的加入会议状态
const joinMeetingStatus = meetingStore.joinMeetingStatus;

// 移除弹窗相关状态，现在在AppHeader中处理
// const showInvitationDialog = ref(false);
// const currentInvitation = ref(null);

// 初始化聊天消息
onMounted(async () => {
  // 暂时移除WebSocket相关初始化
  // meetingStore.initWebSocketListeners();
  // await wsService.requestNotificationPermission();

  // 初始化一些示例聊天消息
  if (meetingStore.activeMeeting && meetingStore.activeMeeting.status === '进行中' && chatMessages.length === 0) {
    meetingStore.addChatMessage({
      id: Date.now() - 1000,
      user: '张三',
      text: '大家好，会议开始了',
      time: '10:00'
    });
    meetingStore.addChatMessage({
      id: Date.now() - 500,
      user: '李四',
      text: '收到，我已准备好',
      time: '10:01'
    });
  }
});

// 聊天消息自动滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

function openCreateDialog() {
  createForm.topic = '';
  createForm.host = '';
  createForm.members = [];
  createDialogVisible.value = true;
}

function submitCreate() {
  if (!createForm.topic || !createForm.host) {
    ElMessage.error('请填写完整信息');
    return;
  }
  const hostUser = allUsers.find(u => u.name === createForm.host);
  const memberIds = Array.from(new Set([hostUser?.id, ...createForm.members]));
  const members = memberIds.map(id => {
    const u = allUsers.find(x => x.id === id);
    return u ? { ...u, status: 'online' } : null;
  }).filter(Boolean);
  const newId = 'm' + Date.now();
  const newMeeting = {
    id: newId,
    topic: createForm.topic,
    host: createForm.host,
    hostId: hostUser?.id,
    status: '进行中' as const,
    members,
    startTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    muted: false
  };

  meetings.unshift(newMeeting);
  meetingStore.activeMeetingId = newId;
  createDialogVisible.value = false;
  ElMessage.success('会议发起成功');

  // 清空聊天记录
  chatMessages.length = 0;
}

function selectMeeting(id: string) {
  // 使用meeting store的方法设置活动会议
  meetingStore.activeMeetingId = id;

  // 如果是已结束会议，显示历史聊天记录
  const meeting = meetings.find(m => m.id === id);
  if (meeting && meeting.status === '已结束') {
    // 清空当前聊天记录
    chatMessages.length = 0;

    // 添加历史聊天记录
    meetingStore.addChatMessage({
      id: Date.now() - 3000,
      user: meeting.host,
      text: '会议开始',
      time: meeting.startTime.split(' ')[1]
    });
    meetingStore.addChatMessage({
      id: Date.now() - 2000,
      user: '系统',
      text: '会议已结束',
      time: meeting.endTime ? meeting.endTime.split(' ')[1] : '--:--'
    });
  } else if (meeting && meeting.status === '进行中') {
    // 如果是进行中的会议，初始化一些示例消息
    if (chatMessages.length === 0) {
      meetingStore.addChatMessage({
        id: Date.now() - 1000,
        user: meeting.host,
        text: '大家好，会议开始了',
        time: '10:00'
      });
    }
  }
  
  scrollToBottom();
}

function deleteMeeting(row: any) {
  const index = meetings.findIndex(m => m.id === row.id);
  if (index > -1) {
    meetings.splice(index, 1);
  }

  if (meetingStore.activeMeetingId === row.id) {
    meetingStore.activeMeetingId = meetings[0]?.id || '';
    chatMessages.length = 0; // 清空聊天记录
  }
  ElMessage.success('会议已删除');
}

function openInviteDialog() {
  inviteMembers.value = [];
  inviteDialogVisible.value = true;
}

function doInviteMembers() {
  if (!meetingStore.activeMeeting) return;

  // 过滤出新成员（未在会议中的成员）
  const newMemberIds = inviteMembers.value
    .filter((id: string) => !meetingStore.activeMeeting.members.some((m: any) => m.id === id));

  if (newMemberIds.length === 0) {
    ElMessage.warning('所选成员已在会议中');
    return;
  }

  // 暂时移除WebSocket邀请发送
  // meetingStore.sendMeetingInvite(meetingStore.activeMeeting.id, newMemberIds);

  // 直接添加成员到会议（临时方案）
  const newMembers = newMemberIds
    .map((id: string) => {
      const u = allUsers.find(x => x.id === id);
      return u ? { ...u, status: 'online' } : null;
    }).filter(Boolean);
  meetingStore.activeMeeting.members.push(...newMembers);

  inviteDialogVisible.value = false;
  inviteMembers.value = [];

  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  const memberNames = newMemberIds.map(id => {
    const user = allUsers.find(u => u.id === id);
    return user ? user.name : `用户${id}`;
  });

  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `已向 ${memberNames.join('、')} 发送会议邀请`,
    time
  });
  scrollToBottom();

  ElMessage.success(`已向 ${memberNames.length} 位成员发送邀请`);
}

function toggleMuteAll(meeting: any) {
  meeting.muted = !meeting.muted;
  meeting.members.forEach((m: any) => m.muted = meeting.muted);
  
  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: meeting.muted ? '主持人开启了全体禁言' : '主持人解除了全体禁言',
    time
  });
  scrollToBottom();
  
  ElMessage.success(meeting.muted ? '已全体禁言' : '已解除全体禁言');
}

// 录像功能相关方法
function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  if (!meetingStore.activeMeeting || meetingStore.activeMeeting.status !== '进行中') {
    ElMessage.warning('只能在进行中的会议中开始录像');
    return;
  }

  isRecording.value = true;
  recordingStartTime.value = new Date();
  recordingDuration.value = 0;

  // 启动录像计时器
  recordingTimer.value = setInterval(() => {
    if (recordingStartTime.value) {
      recordingDuration.value = Math.floor((Date.now() - recordingStartTime.value.getTime()) / 1000);
    }
  }, 1000);

  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: '会议录像已开始',
    time
  });
  scrollToBottom();

  ElMessage.success('会议录像已开始');
  console.log('开始录像会议:', meetingStore.activeMeeting.topic);
}

function stopRecording() {
  if (!isRecording.value) return;

  isRecording.value = false;

  // 清除计时器
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
    recordingTimer.value = null;
  }

  const duration = recordingDuration.value;
  const startTime = recordingStartTime.value;

  // 更新会议记录，添加录像信息
  if (meetingStore.activeMeeting && startTime) {
    // 这里可以添加保存录像文件的逻辑
    const recordingUrl = `https://sample-videos.com/zip/10/mp4/meeting_${meetingStore.activeMeeting.id}_${Date.now()}.mp4`;

    // 如果会议还在进行中，暂时保存录像信息到临时字段
    // 当会议结束时，这些信息会被正式保存
    meetingStore.activeMeeting.tempRecording = {
      hasRecording: true,
      recordingUrl,
      fileSize: Math.floor(duration * 1024 * 100), // 模拟文件大小
      resolution: '1920x1080',
      frameRate: '30fps',
      codec: 'H.264',
      recordingDuration: duration
    };
  }

  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  const durationText = formatRecordingDuration(duration);

  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `会议录像已停止，录像时长：${durationText}`,
    time
  });
  scrollToBottom();

  ElMessage.success(`会议录像已停止，录像时长：${durationText}`);
  console.log('停止录像，时长:', durationText);

  // 重置录像状态
  recordingStartTime.value = null;
  recordingDuration.value = 0;
}

function formatRecordingDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

function toggleMuteMember(member: any) {
  member.muted = !member.muted;
  
  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `${member.name} 被${member.muted ? '禁言' : '解除禁言'}`,
    time
  });
  scrollToBottom();
  
  ElMessage.success(member.muted ? '已禁言' : '已解除禁言');
}

function toggleSilenceMember(member: any) {
  member.silenced = !member.silenced;
  ElMessage.success(member.silenced ? '已静音' : '已解除静音');
}

function endMeeting(meeting: any) {
  // 如果正在录像，先停止录像
  if (isRecording.value) {
    stopRecording();
  }

  meeting.status = '已结束';
  meeting.endTime = new Date().toLocaleString('zh-CN', { hour12: false });

  // 计算会议时长
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // 分钟
  meeting.duration = duration;

  // 保存录像信息（如果有的话）
  if (meeting.tempRecording) {
    meeting.hasRecording = meeting.tempRecording.hasRecording;
    meeting.recordingUrl = meeting.tempRecording.recordingUrl;
    meeting.fileSize = meeting.tempRecording.fileSize;
    meeting.resolution = meeting.tempRecording.resolution;
    meeting.frameRate = meeting.tempRecording.frameRate;
    meeting.codec = meeting.tempRecording.codec;

    // 清除临时录像信息
    delete meeting.tempRecording;

    console.log('会议录像信息已保存:', {
      hasRecording: meeting.hasRecording,
      recordingUrl: meeting.recordingUrl,
      fileSize: meeting.fileSize
    });
  }

  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: meeting.hasRecording ? '会议已结束，录像已保存' : '会议已结束',
    time
  });
  scrollToBottom();

  ElMessage.success(meeting.hasRecording ? '会议已结束，录像已保存' : '会议已结束');
}

function removeMember(member: any) {
  if (!meetingStore.activeMeeting) return;
  meetingStore.activeMeeting.members = meetingStore.activeMeeting.members.filter((m: any) => m.id !== member.id);
  
  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `${member.name} 被移出会议`,
    time
  });
  scrollToBottom();
  
  ElMessage.success('成员已移除');
}

// 视频控制相关方法
function selectVideoCell(cellId: string) {
  console.log('选择视频画面:', cellId);
  // 这里可以添加视频画面选择逻辑
}

function toggleFullscreen(cellId: string) {
  console.log('切换全屏:', cellId);
  ElMessage.info(`${cellId} 全屏功能开发中`);
  // 这里可以添加全屏切换逻辑
}

function toggleMute(cellId: string) {
  console.log('切换静音:', cellId);
  ElMessage.info(`${cellId} 静音功能开发中`);
  // 这里可以添加静音切换逻辑
}

function toggleCamera(cellId: string) {
  const currentState = cameraStates[cellId as keyof typeof cameraStates];
  cameraStates[cellId as keyof typeof cameraStates] = !currentState;

  const action = currentState ? '关闭' : '开启';
  const participantName = cellId === 'main' ? '主讲人' : cellId.replace('participant', '参会者');

  console.log(`${action}摄像头:`, cellId);
  ElMessage.success(`${participantName}摄像头已${action}`);

  // 这里可以添加实际的摄像头控制逻辑
}

// 获取成员摄像头状态
function getMemberCameraState(member: any): boolean {
  // 主持人对应main，其他成员按顺序对应participant1-5
  if (member.id === meetingStore.activeMeeting?.hostId) {
    return cameraStates.main;
  }

  // 根据成员在列表中的位置确定对应的participant编号
  const memberIndex = meetingStore.activeMeeting?.members.findIndex((m: any) => m.id === member.id);
  if (memberIndex >= 0 && memberIndex < 5) {
    const participantKey = `participant${memberIndex + 1}` as keyof typeof cameraStates;
    return cameraStates[participantKey];
  }

  return true; // 默认开启
}

// 播放录像
function playRecording(meeting: any) {
  if (!meeting.hasRecording) {
    ElMessage.warning('该会议没有录像');
    return;
  }

  selectedMeetingForRecording.value = meeting;
  recordingDialogVisible.value = true;

  // 模拟录像URL（实际项目中应该从API获取）
  recordingUrl.value = meeting.recordingUrl || `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4?meeting=${meeting.id}`;

  // 重置播放状态
  resetVideoState();

  // 等待DOM更新后初始化视频
  nextTick(() => {
    initializeVideo();
  });
}

// 下载录像
function downloadRecording(meeting: any) {
  ElMessage.info('正在准备下载录像文件...');
  // 这里可以触发录像文件下载
  console.log('下载会议录像:', meeting.topic);
}

// 导出会议报告
function exportMeetingReport(meeting: any) {
  selectedMeetingForExport.value = meeting;
  exportForm.format = 'pdf';
  exportForm.content = ['basic', 'members', 'chat'];
  if (meeting.hasRecording) {
    exportForm.content.push('recording');
  }
  exportForm.template = 'standard';
  exportDialogVisible.value = true;
}

// 确认导出报告
function confirmExportReport() {
  if (!selectedMeetingForExport.value) return;

  exportLoading.value = true;

  // 模拟导出过程
  setTimeout(() => {
    const meeting = selectedMeetingForExport.value;
    const formatText = exportForm.format === 'pdf' ? 'PDF' :
                     exportForm.format === 'word' ? 'Word' : 'Excel';

    ElMessage.success(`会议报告已生成！格式：${formatText}`);

    // 这里可以触发实际的文件下载
    const fileName = `${meeting.topic}_会议报告_${new Date().toLocaleDateString()}.${exportForm.format}`;
    console.log('导出文件:', fileName);
    console.log('导出内容:', exportForm.content);
    console.log('使用模板:', exportForm.template);

    exportLoading.value = false;
    exportDialogVisible.value = false;
  }, 2000);
}

// 查看会议详细信息
function viewMeetingDetails(meeting: any) {
  selectedMeetingForDetail.value = meeting;
  activeDetailTab.value = 'basic';
  detailDialogVisible.value = true;
}

// 格式化时长显示
function formatDuration(minutes: number): string {
  if (!minutes) return '0分钟';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时间显示（秒转为 mm:ss 格式）
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 重置视频状态
function resetVideoState() {
  videoLoading.value = true;
  videoError.value = false;
  isPlaying.value = false;
  currentTime.value = 0;
  totalTime.value = 0;
  volume.value = 50;
  isMuted.value = false;
}

// 初始化视频
function initializeVideo() {
  if (!videoPlayerRef.value) return;

  const video = videoPlayerRef.value;
  video.volume = volume.value / 100;
  video.muted = isMuted.value;
}

// 视频加载完成
function onVideoLoaded() {
  if (!videoPlayerRef.value) return;

  videoLoading.value = false;
  totalTime.value = Math.floor(videoPlayerRef.value.duration);
  ElMessage.success('录像加载完成');
}

// 时间更新
function onTimeUpdate() {
  if (!videoPlayerRef.value) return;
  currentTime.value = Math.floor(videoPlayerRef.value.currentTime);
}

// 视频播放结束
function onVideoEnded() {
  isPlaying.value = false;
  currentTime.value = 0;
  ElMessage.info('录像播放完成');
}

// 视频加载错误
function onVideoError() {
  videoLoading.value = false;
  videoError.value = true;
  ElMessage.error('录像加载失败，请检查网络连接');
}

// 切换播放/暂停
function togglePlay() {
  if (!videoPlayerRef.value || videoError.value) return;

  if (isPlaying.value) {
    videoPlayerRef.value.pause();
  } else {
    videoPlayerRef.value.play().catch(err => {
      console.error('播放失败:', err);
      ElMessage.error('播放失败，请重试');
    });
  }
  isPlaying.value = !isPlaying.value;
}

// 停止播放
function stopVideo() {
  if (!videoPlayerRef.value) return;

  videoPlayerRef.value.pause();
  videoPlayerRef.value.currentTime = 0;
  isPlaying.value = false;
  currentTime.value = 0;
}

// 重新加载视频
function reloadVideo() {
  if (!videoPlayerRef.value) return;

  resetVideoState();
  videoPlayerRef.value.load();
}

// 切换录像静音
function toggleVideoMute() {
  if (!videoPlayerRef.value) return;

  isMuted.value = !isMuted.value;
  videoPlayerRef.value.muted = isMuted.value;
}

// 设置音量
function setVolume(vol: number) {
  if (!videoPlayerRef.value) return;

  volume.value = vol;
  videoPlayerRef.value.volume = vol / 100;

  // 如果音量大于0，取消静音
  if (vol > 0 && isMuted.value) {
    isMuted.value = false;
    videoPlayerRef.value.muted = false;
  }
}

// 关闭录像播放弹窗
function handleCloseRecording() {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.pause();
  }
  recordingDialogVisible.value = false;
  resetVideoState();
}

// 控制成员摄像头
function toggleMemberCamera(member: any) {
  // 确定对应的视频画面ID
  let cellId: string;
  if (member.id === meetingStore.activeMeeting?.hostId) {
    cellId = 'main';
  } else {
    const memberIndex = meetingStore.activeMeeting?.members.findIndex((m: any) => m.id === member.id);
    if (memberIndex >= 0 && memberIndex < 5) {
      cellId = `participant${memberIndex + 1}`;
    } else {
      ElMessage.warning('无法控制该成员的摄像头');
      return;
    }
  }

  // 调用视频画面的摄像头控制方法
  toggleCamera(cellId);

  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  const currentState = cameraStates[cellId as keyof typeof cameraStates];
  const action = currentState ? '开启' : '关闭';

  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `${member.name} ${action}了摄像头`,
    time
  });
  scrollToBottom();
}

// 转主持确认对话框
function confirmSetHost(member: any) {
  if (!meetingStore.activeMeeting) return;

  // 构建权限列表HTML
  const permissionsList = `
    <div style="text-align: left; margin: 16px 0;">
      <p style="margin-bottom: 12px; font-weight: 600; color: #303133;">转让的主要权限包括：</p>
      <ul style="margin: 0; padding-left: 20px; color: #606266; line-height: 1.8;">
        <li><strong>会议管理权限：</strong>结束会议、邀请/移除成员</li>
        <li><strong>音视频控制权限：</strong>全体禁言、单独禁言/静音、摄像头控制</li>
        <li><strong>录像管理权限：</strong>开始/停止录像</li>
        <li><strong>会议秩序维护权限：</strong>话权管理、发言控制</li>
      </ul>
    </div>
  `;

  ElMessageBox.confirm(
    `
    <div style="text-align: center;">
      <p style="margin-bottom: 16px; font-size: 16px; color: #303133;">
        确定要将主持人权限转让给 <strong style="color: #409EFF;">${member.name}</strong> 吗？
      </p>
      ${permissionsList}
      <p style="margin-top: 16px; color: #909399; font-size: 14px;">
        转让后，您将失去主持人权限，该操作不可撤销。
      </p>
    </div>
    `,
    '转让主持人权限',
    {
      confirmButtonText: '确认转让',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: true,
      confirmButtonClass: 'el-button--warning',
      customClass: 'transfer-host-dialog',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true;
          instance.confirmButtonText = '转让中...';

          // 模拟转让过程
          setTimeout(() => {
            setHost(member);
            instance.confirmButtonLoading = false;
            done();
          }, 500);
        } else {
          done();
        }
      }
    }
  ).catch(() => {
    // 用户取消操作
    console.log('用户取消转让主持人权限');
  });
}

function setHost(member: any) {
  if (!meetingStore.activeMeeting) return;
  const oldHost = meetingStore.activeMeeting.host;
  meetingStore.activeMeeting.host = member.name;
  meetingStore.activeMeeting.hostId = member.id;

  // 添加系统消息
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '系统',
    text: `🔄 ${oldHost} 已将主持人权限转让给 ${member.name}，${member.name} 现在是会议主持人`,
    time
  });
  scrollToBottom();

  ElMessage.success(`已成功转让主持人权限给 ${member.name}`);
}

function getMemberAvatarStyle(m: any) {
  if (m.id === meetingStore.activeMeeting?.hostId) {
    return 'border:2px solid #409EFF;';
  }
  if (m.speaking) {
    return 'border:2px solid #e6a23c;';
  }
  return '';
}

// 聊天功能
function sendChat() {
  if (!chatInput.value.trim() || !meetingStore.activeMeeting || meetingStore.activeMeeting.status !== '进行中') return;
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  meetingStore.addChatMessage({
    id: Date.now(),
    user: '我',
    text: chatInput.value.trim(),
    time
  });
  chatInput.value = '';
  scrollToBottom();
}



function calcMeetingDuration(meeting: any) {
  // 假设startTime/endTime为'YYYY-MM-DD HH:mm'字符串
  if (!meeting.startTime || !meeting.endTime) return '--';
  const start = new Date(meeting.startTime.replace(/-/g, '/'));
  const end = new Date(meeting.endTime.replace(/-/g, '/'));
  const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return '--';
  
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  
  if (h > 0) {
    return `${h}小时${m}分钟`;
  } else {
    return `${m}分钟${s}秒`;
  }
}

// 移除演示相关方法，现在通过头部铃铛图标触发
// function simulateInvitation() { ... }
// function showJoinMeetingDemo() { ... }

// 弹窗处理方法已移至AppHeader组件中
// function acceptInvitationDialog() { ... }
// function rejectInvitationDialog() { ... }

// 暂时移除邀请处理函数
// async function handleAcceptInvite(meetingId: string) { ... }
// function handleRejectInvite(meetingId: string) { ... }

// 暂时移除邀请状态相关函数
// function getPendingInviteCount(meetingId: string) { ... }
// function getInviteStatuses(meetingId: string) { ... }
// function getInviteStatusType(status: string) { ... }
// function getInviteStatusText(status: string) { ... }
// function refreshInviteStatus() { ... }
</script>

<style scoped>
.conference-main {
  display: flex;
  height: calc(100vh - var(--header-height) - 40px); /* 使用相对高度 */
  background: #f5f7fa;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
  /* 轻微整体上移，避免影响其它页面 */
  transform: translateY(-6px);
}

.conference-list {
  width: 280px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px 0 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.conference-center {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conference-chat {
  width: 320px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  overflow: hidden;
}

.meeting-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 15px 20px;
}

.meeting-list-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.meeting-list-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: #409EFF;
  border-radius: 2px;
}

.meeting-tabs {
  margin-bottom: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin-bottom: 12px;
  flex-shrink: 0;
}

:deep(.el-tabs__nav) {
  width: 100%;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
}

.meeting-list-scrollbar {
  height: calc(100vh - var(--header-height) - 200px);
  min-height: 400px;
  max-height: 700px;
}

:deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  font-size: 15px;
}

.meeting-card {
  margin: 0 12px 12px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
  padding: 15px;
  position: relative;
}

.meeting-card.active {
  border-color: #409EFF !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3) !important;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%) !important;
  transform: translateY(-1px) !important;
}

.meeting-card.active .meeting-topic {
  color: #409EFF !important;
  font-weight: 600 !important;
}

.meeting-card.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #409EFF;
  border-radius: 2px 0 0 2px;
}

.meeting-card.meeting-card-shadow {
  box-shadow: 0 4px 16px 0 rgba(64, 158, 255, 0.15);
}

.meeting-card:hover:not(.active) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08);
}

.meeting-card.active:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.4) !important;
}

.meeting-topic {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}

.meeting-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 8px;
}

.meeting-time {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.meeting-duration {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.meeting-members {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.member-count {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.meeting-actions {
  position: absolute;
  top: 10px;
  right: 10px;
}

.host {
  color: #606266;
}

.meeting-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f2f5;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-text {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.detail-ops {
  display: flex;
  align-items: center;
  gap: 10px;
}

.video-area {
  flex: 1;
  margin-bottom: 4px; /* 进一步减少底部间距 */
  min-height: 300px;
  max-height: calc(100vh - 260px); /* 进一步调整最大高度，增加视频区域空间 */
  overflow: hidden; /* 隐藏超出部分 */
  display: flex;
  flex-direction: column;
}

.main-video {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: #222;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  overflow: hidden;
}

.video-placeholder, .no-meeting-selected {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: #909399;
}

.member-list.beautified {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.member-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}



/* 录像按钮样式 */
.recording-btn {
  position: relative;
  transition: all 0.3s ease;
}

.recording-btn.el-button--primary {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-color: #1890ff;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.recording-btn.el-button--primary:hover {
  background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.recording-btn.el-button--danger {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-color: #ff4d4f;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
  animation: recording-pulse 2s ease-in-out infinite;
}

.recording-btn.el-button--danger:hover {
  background: linear-gradient(135deg, #d9363e 0%, #ff4d4f 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

.recording-btn.el-button--danger::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #ff4d4f, #ff7875, #ff4d4f);
  border-radius: 6px;
  z-index: -1;
  animation: recording-glow 2s ease-in-out infinite alternate;
}

@keyframes recording-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes recording-glow {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0.8; transform: scale(1.02); }
}

.recording-btn.el-button--danger .el-icon {
  animation: recording-icon-blink 1s ease-in-out infinite;
}

@keyframes recording-icon-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.7; }
}

.member-list-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.member-count-badge {
  background: #f2f6fc;
  color: #409EFF;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 10px;
}

.member-list-table {
  width: 100%;
  border-radius: 8px;
  background: #fafbfc;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.member-row {
  display: flex;
  align-items: center;
  min-height: 50px;
  border-bottom: 1px solid #f0f2f5;
  padding: 0 12px;
}

.member-row:last-child {
  border-bottom: none;
}

.member-header {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
  height: 40px;
  min-height: 40px;
}

.member-col {
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 0 6px;
  min-width: 0; /* 允许收缩，避免各行起点不一致 */
}

.member-col.name {
  flex: 0 0 200px; /* 固定“成员”列宽，确保各行对齐 */
}

.member-col.status {
  flex: 0 0 180px; /* 固定“状态”列宽，避免因标签数量不同而挤压 */
  justify-content: flex-start; /* 左对齐 */
  gap: 6px; /* 标签之间留空 */
  white-space: nowrap; /* 防止换行导致行高不一致 */
}

.member-col.ops {
  flex: 1;
  display: flex; /* 显式flex容器，避免内部布局受影响 */
  align-items: center;
  min-width: 620px; /* 确保可容纳5个按钮+间距，防止最后一个换行 */
}
.member-col.ops > .el-button-group {
  display: flex; /* 改回单行flex布局 */
  flex-wrap: nowrap; /* 禁止换行，避免按钮掉到下一行 */
  gap: 6px;
  width: 100%;
}
.member-col.ops > .el-button-group .el-button {
  flex: 0 0 100px; /* 基础按钮宽度缩小 */
}

:deep(.el-button-group .el-button) {
  min-width: auto;
  font-size: 12px;
  padding: 6px 8px;
}

:deep(.el-tag) {
  border-radius: 4px;
  font-size: 12px;
  margin-right: 4px;
}

.host-badge {
  background: #409EFF;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  padding: 1px 6px;
  margin-left: 6px;
}

.chat-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.chat-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: #409EFF;
  border-radius: 2px;
}

.chat-messages {
  flex: 1;
  height: calc(100vh - 280px);
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.no-messages {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #909399;
  font-size: 14px;
}

.chat-msg {
  margin-bottom: 15px;
  max-width: 85%;
}

.chat-msg-self {
  margin-left: auto;
}

.chat-msg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.chat-user {
  color: #409EFF;
  font-weight: 500;
  font-size: 13px;
}

.chat-time {
  color: #909399;
  font-size: 12px;
}

.chat-msg-content {
  background: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  word-break: break-word;
}

.chat-msg-self .chat-msg-content {
  background: #ecf5ff;
  color: #409EFF;
}

.chat-input-container {
  margin-top: auto;
}

.chat-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.chat-tools {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

:deep(.el-avatar) {
  background: #409EFF;
  color: #fff;
}

:deep(.el-button--small) {
  padding: 6px 10px; /* 统一小按钮的内边距 */
}

:deep(.el-button.is-circle) {
  padding: 6px; /* 圆形按钮与小按钮一致 */
}

@media (max-width: 1400px) {
  .conference-main {
    padding: 15px;
    gap: 15px;
  }
  
  .conference-list {
    width: 260px;
  }
  
  .conference-chat {
    width: 300px;
  }
}

@media (max-width: 1200px) {
  .conference-main {
    flex-direction: column;
    height: auto;
  }

  .conference-list, .conference-center, .conference-chat {
    width: 100%;
    margin-bottom: 20px;
  }

  .conference-list {
    height: 500px;
  }

  .meeting-list-scrollbar {
    height: calc(500px - 120px);
    min-height: 300px;
  }

  .chat-messages {
    height: 400px;
  }
}

/* 邀请状态相关样式 */
.invite-badge {
  margin-left: 8px;
}

/* 已结束会议头部样式 */
.ended-meeting-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 聊天结束提示样式 */
.chat-ended-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
  font-size: 14px;
  border: 1px solid #e4e7ed;
}

/* 已结束会议展示样式 */
.meeting-ended-view {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

/* 优化滚动条样式 */
.meeting-ended-view::-webkit-scrollbar {
  width: 6px;
}

.meeting-ended-view::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.meeting-ended-view::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.meeting-ended-view::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.meeting-summary {
  max-width: 1000px;
  margin: 0 auto;
}

.summary-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
}

.summary-header h3 {
  margin: 16px 0 8px 0;
  font-size: 24px;
  color: #303133;
  font-weight: 600;
}

.summary-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.summary-content {
  margin-bottom: 30px;
}

.topic-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-highlight {
  font-weight: 600;
  color: #67c23a;
  font-size: 16px;
}

/* 录像区域样式 */
.recording-section {
  margin-bottom: 20px; /* 调矮一丢丢：从30px减少到20px */
}

.section-header {
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recording-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px; /* 调矮一丢丢：从20px减少到16px */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recording-info {
  display: flex;
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
}

.info-item .value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.recording-actions {
  display: flex;
  gap: 12px;
}

/* 参会者统计样式 */
.participants-section {
  margin-bottom: 30px;
}

.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.participant-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.participant-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.participant-info {
  flex: 1;
}

.participant-info .name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.participant-info .status {
  font-size: 12px;
}

/* 操作按钮区域 */
.ended-meeting-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .meeting-ended-view {
    padding: 16px;
  }

  .recording-card {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .recording-info {
    justify-content: space-around;
  }

  .participants-grid {
    grid-template-columns: 1fr;
  }

  .ended-meeting-actions {
    flex-direction: column;
  }
}

/* 会议详情弹窗样式 */
.meeting-detail-dialog .detail-topic {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.meeting-detail-dialog .host-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.members-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

/* 成员详情滚动条优化 */
.members-detail::-webkit-scrollbar {
  width: 6px;
}

.members-detail::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.members-detail::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.members-detail::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.member-detail-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.member-detail-info {
  flex: 1;
}

.member-detail-info .member-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.member-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-item .stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.recording-detail {
  display: flex;
  flex-direction: column;
  gap: 16px; /* 调矮一丢丢：从20px减少到16px */
}

.recording-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recording-actions-detail {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

/* 导出弹窗样式 */
.export-options {
  padding: 20px 0;
}

.export-dialog .el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-dialog .el-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 录像播放弹窗样式 */
.recording-dialog {
  .el-dialog__body {
    padding: 20px;
  }
}

.recording-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recording-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.info-left .meeting-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.meeting-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.info-right {
  display: flex;
  align-items: center;
}

/* 视频播放器容器 */
.video-player-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 450px; /* 调矮一丢丢：从500px减少到450px */
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-loading,
.video-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #909399;
  font-size: 14px;
}

.loading-icon,
.error-icon {
  font-size: 32px;
}

.loading-icon {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  color: #f56c6c;
}

/* 播放控制栏 */
.video-controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.controls-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.time-display {
  font-size: 14px;
  color: #606266;
  font-family: monospace;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recording-info {
    flex-direction: column;
    gap: 12px;
  }

  .meeting-meta {
    flex-direction: column;
    gap: 8px;
  }

  .video-wrapper {
    height: 270px; /* 调矮一丢丢：从300px减少到270px */
  }

  .video-controls-bar {
    flex-direction: column;
    gap: 12px;
  }

  .controls-left,
  .controls-right {
    width: 100%;
    justify-content: center;
  }
}

.invite-status-list {
  margin-top: 20px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.invite-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.invite-status-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.invite-status-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invite-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.invite-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-col.name {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.invite-col.status {
  flex-shrink: 0;
}

.invite-col.time {
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.invite-time {
  font-size: 12px;
  color: #6b7280;
}

.response-time {
  font-size: 11px;
  color: #9ca3af;
}

.invite-row:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* 移除旧的邀请通知样式，现在使用弹窗模式 */

/* 演示控制按钮样式 */
.demo-controls {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.demo-controls .el-button {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .invitation-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .invitation-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .demo-controls {
    flex-direction: column;
  }
}

/* 弹窗样式已移至AppHeader组件中 */

/* 视频网格布局样式 */
.video-grid-container {
  width: 100%;
  height: 100%;
  max-height: 100%; /* 确保不超出父容器 */
  padding: 8px 12px 4px 12px; /* 进一步减少内边距 */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* 隐藏超出部分 */
  box-sizing: border-box; /* 包含padding在内的尺寸计算 */
}

.video-grid.asymmetric-layout {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 10px; /* 减少网格间距 */
  width: 100%;
  height: calc(100% - 12px); /* 调整为新的padding总和：8px + 4px = 12px */
  max-height: calc(100% - 12px); /* 确保不超出容器 */
  min-height: 350px; /* 减小最小高度 */
}

/* 主讲人区域 - 占据左侧大部分空间 */
.video-cell.main-speaker {
  grid-column: 1 / 2;
  grid-row: 1 / 4;
  background: #222;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-cell.main-speaker:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* 参会者区域 - 右侧小画面 */
.video-cell.participant {
  background: #222;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-cell.participant:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* 视频控制栏 */
.video-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.video-cell:hover .video-controls {
  opacity: 1;
}

.video-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.main-speaker .video-title {
  font-size: 16px;
}

.video-actions {
  display: flex;
  gap: 8px;
}

.video-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.video-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

/* 视频播放器区域 */
.video-player {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  text-align: center;
  gap: 12px;
}

.main-speaker .video-placeholder {
  gap: 16px;
}

.placeholder-text {
  font-size: 14px;
  font-weight: 500;
  color: #888;
}

.main-speaker .placeholder-text {
  font-size: 18px;
  font-weight: 600;
}

.placeholder-subtitle {
  font-size: 12px;
  color: #666;
  opacity: 0.8;
}

/* 视频画面图标 */
.video-placeholder .el-icon {
  color: #555;
  opacity: 0.6;
}

.main-speaker .video-placeholder .el-icon {
  color: #666;
  opacity: 0.8;
}

/* 大屏模式下的视频网格优化 */
.large-screen-container .video-grid-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(116, 185, 255, 0.2);
}

.large-screen-container .video-cell {
  border: 1px solid rgba(116, 185, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4),
              0 0 20px rgba(116, 185, 255, 0.1);
}

.large-screen-container .video-cell:hover {
  border-color: rgba(116, 185, 255, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5),
              0 0 30px rgba(116, 185, 255, 0.2);
}

.large-screen-container .video-title {
  color: #74b9ff;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.5);
}

.large-screen-container .video-actions .el-button {
  background: rgba(116, 185, 255, 0.2);
  border-color: rgba(116, 185, 255, 0.4);
  color: #74b9ff;
}

.large-screen-container .video-actions .el-button:hover {
  background: rgba(116, 185, 255, 0.3);
  border-color: rgba(116, 185, 255, 0.6);
  box-shadow: 0 0 15px rgba(116, 185, 255, 0.4);
}

.large-screen-container .placeholder-text {
  color: #74b9ff;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.3);
}

.large-screen-container .placeholder-subtitle {
  color: #5dade2;
}

.large-screen-container .video-placeholder .el-icon {
  color: #74b9ff;
  filter: drop-shadow(0 0 10px rgba(116, 185, 255, 0.3));
}

/* 摄像头控制按钮样式 */
.video-actions .el-button.camera-off {
  background: rgba(255, 77, 79, 0.2) !important;
  border-color: rgba(255, 77, 79, 0.4) !important;
  color: #ff4d4f !important;
}

.video-actions .el-button.camera-off:hover {
  background: rgba(255, 77, 79, 0.3) !important;
  border-color: rgba(255, 77, 79, 0.6) !important;
  transform: scale(1.05) !important;
}

/* 摄像头关闭状态的视频画面 */
.video-placeholder.camera-off-state {
  background: rgba(0, 0, 0, 0.8);
  border: 2px dashed rgba(255, 77, 79, 0.3);
  border-radius: 8px;
  padding: 20px;
}

.video-placeholder.camera-off-state .el-icon {
  color: #ff4d4f !important;
  opacity: 0.6;
  animation: camera-off-pulse 2s ease-in-out infinite;
}

.video-placeholder.camera-off-state .placeholder-text {
  color: #ff4d4f !important;
  font-weight: 600;
}

.video-placeholder.camera-off-state .placeholder-subtitle {
  color: #ff7875 !important;
  opacity: 0.8;
}

@keyframes camera-off-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 大屏模式下的摄像头控制按钮 */
.large-screen-container .video-actions .el-button.camera-off {
  background: rgba(255, 77, 79, 0.3) !important;
  border-color: rgba(255, 77, 79, 0.5) !important;
  color: #ff4d4f !important;
  box-shadow: 0 0 15px rgba(255, 77, 79, 0.4) !important;
}

.large-screen-container .video-actions .el-button.camera-off:hover {
  background: rgba(255, 77, 79, 0.4) !important;
  border-color: rgba(255, 77, 79, 0.7) !important;
  box-shadow: 0 0 20px rgba(255, 77, 79, 0.6) !important;
}

.large-screen-container .video-placeholder.camera-off-state {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 77, 79, 0.5);
  box-shadow: inset 0 0 20px rgba(255, 77, 79, 0.2);
}

.large-screen-container .video-placeholder.camera-off-state .el-icon {
  color: #ff4d4f !important;
  filter: drop-shadow(0 0 10px rgba(255, 77, 79, 0.5));
}

.large-screen-container .video-placeholder.camera-off-state .placeholder-text {
  color: #ff4d4f !important;
  text-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
}

.large-screen-container .video-placeholder.camera-off-state .placeholder-subtitle {
  color: #ff7875 !important;
  text-shadow: 0 0 8px rgba(255, 120, 117, 0.4);
}

/* 摄像头按钮状态切换动画 */
.video-actions .el-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.video-actions .el-button .el-icon {
  transition: all 0.3s ease !important;
}

.video-actions .el-button.camera-off .el-icon {
  animation: camera-button-warning 1.5s ease-in-out infinite;
}

@keyframes camera-button-warning {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 禁用状态的摄像头按钮样式 */
.video-actions .el-button.is-disabled,
.video-actions .el-button:disabled {
  background: rgba(144, 147, 153, 0.2) !important;
  border-color: rgba(144, 147, 153, 0.3) !important;
  color: rgba(144, 147, 153, 0.6) !important;
  cursor: not-allowed !important;
  opacity: 0.6 !important;
}

.video-actions .el-button.is-disabled:hover,
.video-actions .el-button:disabled:hover {
  background: rgba(144, 147, 153, 0.2) !important;
  border-color: rgba(144, 147, 153, 0.3) !important;
  color: rgba(144, 147, 153, 0.6) !important;
  transform: none !important;
  box-shadow: none !important;
}

.video-actions .el-button.is-disabled .el-icon,
.video-actions .el-button:disabled .el-icon {
  animation: none !important;
  opacity: 0.5 !important;
}

/* 大屏模式下禁用状态的摄像头按钮 */
.large-screen-container .video-actions .el-button.is-disabled,
.large-screen-container .video-actions .el-button:disabled {
  background: rgba(144, 147, 153, 0.3) !important;
  border-color: rgba(144, 147, 153, 0.4) !important;
  color: rgba(144, 147, 153, 0.7) !important;
  box-shadow: none !important;
}

.large-screen-container .video-actions .el-button.is-disabled:hover,
.large-screen-container .video-actions .el-button:disabled:hover {
  background: rgba(144, 147, 153, 0.3) !important;
  border-color: rgba(144, 147, 153, 0.4) !important;
  color: rgba(144, 147, 153, 0.7) !important;
  box-shadow: none !important;
}

/* 视频画面状态切换动画 */
.video-placeholder {
  transition: all 0.4s ease-in-out;
}

.video-placeholder.camera-off-state {
  animation: camera-off-fade-in 0.4s ease-in-out;
}

@keyframes camera-off-fade-in {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .video-grid.asymmetric-layout {
    grid-template-columns: 1.8fr 1fr 1fr;
    gap: 10px;
  }

  .video-controls {
    padding: 10px 12px;
  }

  .video-title {
    font-size: 13px;
  }

  .main-speaker .video-title {
    font-size: 15px;
  }
}

@media (max-width: 1200px) {
  .video-grid.asymmetric-layout {
    grid-template-columns: 1.6fr 1fr 1fr;
    gap: 8px;
    min-height: 300px; /* 减小最小高度 */
    max-height: calc(100% - 32px); /* 确保不超出容器 */
  }

  .video-actions .el-button {
    width: 28px;
    height: 28px;
    padding: 0;
  }

  .placeholder-text {
    font-size: 12px;
  }

  .main-speaker .placeholder-text {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .video-grid.asymmetric-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 1fr 1fr 1fr 1fr 1fr;
    min-height: 500px; /* 减小最小高度 */
    max-height: calc(100% - 24px); /* 确保不超出容器 */
  }

  .video-cell.main-speaker {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
  }

  .video-grid-container {
    padding: 6px 8px 3px 8px; /* 响应式下进一步减少内边距 */
  }
}


/* 成员操作按钮状态优化 */
/* 禁言按钮状态样式 */
.mute-btn.is-muted {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%) !important;
  border-color: #67c23a !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3) !important;
  position: relative !important;
}

.mute-btn.is-muted::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #67c23a, #85ce61, #67c23a);
  border-radius: 6px;
  z-index: -1;
  animation: mute-glow 2s ease-in-out infinite alternate;
}

@keyframes mute-glow {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0.8; transform: scale(1.02); }
}

.mute-btn.is-muted:hover {
  background: linear-gradient(135deg, #5daf34 0%, #73c556 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4) !important;
}

.mute-btn.is-muted .el-icon {
  animation: mute-icon-pulse 1.5s ease-in-out infinite;
}

@keyframes mute-icon-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 静音按钮状态样式 */
.silence-btn.is-silenced {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%) !important;
  border-color: #909399 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(144, 147, 153, 0.3) !important;
  position: relative !important;
}

.silence-btn.is-silenced::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #909399, #a6a9ad, #909399);
  border-radius: 6px;
  z-index: -1;
  animation: silence-glow 2s ease-in-out infinite alternate;
}

@keyframes silence-glow {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0.8; transform: scale(1.02); }
}

.silence-btn.is-silenced:hover {
  background: linear-gradient(135deg, #82848a 0%, #95989c 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.4) !important;
}

.silence-btn.is-silenced .el-icon {
  animation: silence-icon-blink 2s ease-in-out infinite;
}

@keyframes silence-icon-blink {
  0%, 70% { opacity: 1; }
  71%, 100% { opacity: 0.3; }
}

/* 大屏模式下的按钮状态增强 */
.large-screen-container .mute-btn.is-muted {
  background: linear-gradient(135deg, #00d4aa 0%, #52c41a 100%) !important;
  border-color: #00d4aa !important;
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.4),
              0 0 15px rgba(0, 212, 170, 0.3) !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

.large-screen-container .mute-btn.is-muted::before {
  background: linear-gradient(45deg, #00d4aa, #52c41a, #00d4aa);
  animation: large-mute-glow 2s ease-in-out infinite alternate;
}

@keyframes large-mute-glow {
  0% {
    opacity: 0.7;
    transform: scale(1);
    box-shadow: 0 0 20px rgba(0, 212, 170, 0.5);
  }
  100% {
    opacity: 0.9;
    transform: scale(1.03);
    box-shadow: 0 0 30px rgba(0, 212, 170, 0.7);
  }
}

.large-screen-container .silence-btn.is-silenced {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%) !important;
  border-color: #74b9ff !important;
  box-shadow: 0 4px 12px rgba(116, 185, 255, 0.4),
              0 0 15px rgba(116, 185, 255, 0.3) !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

.large-screen-container .silence-btn.is-silenced::before {
  background: linear-gradient(45deg, #74b9ff, #0984e3, #74b9ff);
  animation: large-silence-glow 2s ease-in-out infinite alternate;
}

@keyframes large-silence-glow {
  0% {
    opacity: 0.7;
    transform: scale(1);
    box-shadow: 0 0 20px rgba(116, 185, 255, 0.5);
  }
  100% {
    opacity: 0.9;
    transform: scale(1.03);
    box-shadow: 0 0 30px rgba(116, 185, 255, 0.7);
  }
}

/* 按钮状态切换过渡动画 */
.mute-btn, .silence-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative !important;
  overflow: hidden !important;
}

.mute-btn:not(.is-muted):hover,
.silence-btn:not(.is-silenced):hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 按钮点击效果 */
.mute-btn:active, .silence-btn:active {
  transform: translateY(0) !important;
  transition: transform 0.1s ease !important;
}

/* 状态指示器 */
.mute-btn.is-muted::after {
  content: '●';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 50%;
  font-size: 6px;
  line-height: 8px;
  text-align: center;
  color: #67c23a;
  animation: status-indicator-pulse 1.5s ease-in-out infinite;
}

.silence-btn.is-silenced::after {
  content: '●';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 50%;
  font-size: 6px;
  line-height: 8px;
  text-align: center;
  color: #909399;
  animation: status-indicator-blink 2s ease-in-out infinite;
}

@keyframes status-indicator-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

@keyframes status-indicator-blink {
  0%, 70% { opacity: 1; }
  71%, 100% { opacity: 0.3; }
}

/* 成员列表摄像头按钮样式 */
.member-action-btn.camera-btn.is-camera-off {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%) !important;
  border-color: #ff4d4f !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3) !important;
  position: relative !important;
}

.member-action-btn.camera-btn.is-camera-off::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #ff4d4f, #ff7875, #ff4d4f);
  border-radius: 6px;
  z-index: -1;
  animation: camera-off-glow 2s ease-in-out infinite alternate;
}

@keyframes camera-off-glow {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0.8; transform: scale(1.02); }
}

.member-action-btn.camera-btn.is-camera-off:hover {
  background: linear-gradient(135deg, #d9363e 0%, #ff6b70 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4) !important;
}

.member-action-btn.camera-btn.is-camera-off .el-icon {
  animation: camera-off-icon-pulse 1.5s ease-in-out infinite;
}

@keyframes camera-off-icon-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 摄像头开启状态按钮样式 */
.member-action-btn.camera-btn:not(.is-camera-off) {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%) !important;
  border-color: #52c41a !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3) !important;
}

.member-action-btn.camera-btn:not(.is-camera-off):hover {
  background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4) !important;
}

/* 大屏模式下的成员摄像头按钮 */
.large-screen-container .member-action-btn.camera-btn.is-camera-off {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%) !important;
  border-color: #ff4d4f !important;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4),
              0 0 15px rgba(255, 77, 79, 0.3) !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

.large-screen-container .member-action-btn.camera-btn.is-camera-off::before {
  background: linear-gradient(45deg, #ff4d4f, #ff7875, #ff4d4f);
  animation: large-camera-off-glow 2s ease-in-out infinite alternate;
}

@keyframes large-camera-off-glow {
  0% {
    opacity: 0.7;
    transform: scale(1);
    box-shadow: 0 0 20px rgba(255, 77, 79, 0.5);
  }
  100% {
    opacity: 0.9;
    transform: scale(1.03);
    box-shadow: 0 0 30px rgba(255, 77, 79, 0.7);
  }
}

.large-screen-container .member-action-btn.camera-btn:not(.is-camera-off) {
  background: linear-gradient(135deg, #00d4aa 0%, #52c41a 100%) !important;
  border-color: #00d4aa !important;
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.4),
              0 0 15px rgba(0, 212, 170, 0.3) !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

/* 成员摄像头按钮状态指示器 */
.member-action-btn.camera-btn.is-camera-off::after {
  content: '●';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 50%;
  font-size: 6px;
  line-height: 8px;
  text-align: center;
  color: #ff4d4f;
  animation: camera-status-indicator-blink 2s ease-in-out infinite;
}

.member-action-btn.camera-btn:not(.is-camera-off)::after {
  content: '●';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 50%;
  font-size: 6px;
  line-height: 8px;
  text-align: center;
  color: #52c41a;
  animation: camera-status-indicator-pulse 1.5s ease-in-out infinite;
}

@keyframes camera-status-indicator-blink {
  0%, 70% { opacity: 1; }
  71%, 100% { opacity: 0.3; }
}

@keyframes camera-status-indicator-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

/* 禁用状态下的摄像头按钮强制灰色样式 */
.member-action-btn.camera-btn.is-disabled,
.member-action-btn.camera-btn:disabled {
  background: var(--large-screen-bg-quaternary) !important;
  border-color: var(--large-screen-border-light) !important;
  color: var(--large-screen-text-disabled) !important;
  cursor: not-allowed !important;
  opacity: 0.6 !important;
  pointer-events: none !important;
}

.member-action-btn.camera-btn.is-disabled:hover,
.member-action-btn.camera-btn:disabled:hover {
  background: var(--large-screen-bg-quaternary) !important;
  border-color: var(--large-screen-border-light) !important;
  color: var(--large-screen-text-disabled) !important;
  transform: none !important;
  box-shadow: none !important;
}

.member-action-btn.camera-btn.is-disabled::before,
.member-action-btn.camera-btn:disabled::before {
  display: none !important;
}

.member-action-btn.camera-btn.is-disabled::after,
.member-action-btn.camera-btn:disabled::after {
  display: none !important;
}

.member-action-btn.camera-btn.is-disabled .el-icon,
.member-action-btn.camera-btn:disabled .el-icon {
  animation: none !important;
  opacity: 0.5 !important;
}

/* 覆盖所有按钮类型的禁用状态 */
.member-action-btn.el-button--success.is-disabled,
.member-action-btn.el-button--success:disabled,
.member-action-btn.el-button--danger.is-disabled,
.member-action-btn.el-button--danger:disabled,
.member-action-btn.el-button--info.is-disabled,
.member-action-btn.el-button--info:disabled {
  background: var(--large-screen-bg-quaternary) !important;
  border-color: var(--large-screen-border-light) !important;
  color: var(--large-screen-text-disabled) !important;
}

.member-action-btn.el-button--success.is-disabled:hover,
.member-action-btn.el-button--success:disabled:hover,
.member-action-btn.el-button--danger.is-disabled:hover,
.member-action-btn.el-button--danger:disabled:hover,
.member-action-btn.el-button--info.is-disabled:hover,
.member-action-btn.el-button--info:disabled:hover {
  background: var(--large-screen-bg-quaternary) !important;
  border-color: var(--large-screen-border-light) !important;
  color: var(--large-screen-text-disabled) !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 转主持确认对话框样式 */
:deep(.transfer-host-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.transfer-host-dialog .el-message-box__header) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 1px solid #e1e8ed;
  padding: 20px 24px 16px;
}

:deep(.transfer-host-dialog .el-message-box__title) {
  color: #1f2937;
  font-weight: 600;
  font-size: 18px;
}

:deep(.transfer-host-dialog .el-message-box__content) {
  padding: 20px 24px;
}

:deep(.transfer-host-dialog .el-message-box__btns) {
  padding: 16px 24px 20px;
  border-top: 1px solid #e1e8ed;
  background: #fafbfc;
}

:deep(.transfer-host-dialog ul li) {
  margin-bottom: 8px;
}

:deep(.transfer-host-dialog ul li:last-child) {
  margin-bottom: 0;
}

/* 成员操作按钮组布局优化 */
.member-col.ops .el-button-group {
  display: flex; /* 使用单行flex，避免换行导致错位 */
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  height: 28px; /* 统一按钮组高度 */
}
/* 清理 Element Plus 按钮组伪元素，避免占位 */
.member-col.ops .el-button-group::before,
.member-col.ops .el-button-group::after {
  display: none !important;
  content: none !important;
}

.member-col.ops .el-button-group .el-button {
  margin: 0 !important;
  flex: 0 0 100px; /* 基础按钮宽度缩小 */
  height: 28px;
  font-size: 11px;
  padding: 4px 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-sizing: border-box;
}
/* 针对不同按钮微调宽度 */
.member-col.ops .el-button-group .camera-btn { flex-basis: 120px; }
.member-col.ops .el-button-group .mute-btn { flex-basis: 88px; }
.member-col.ops .el-button-group .silence-btn { flex-basis: 88px; }
.member-col.ops .el-button-group .host-btn { flex-basis: 88px; }
.member-col.ops .el-button-group .remove-btn { flex-basis: 88px; }

/* 响应式优化 - 成员操作按钮 */
@media (max-width: 1400px) {
  .member-action-btn.camera-btn {
    padding: 0 8px !important;
    font-size: 12px !important;
  }
}

@media (max-width: 1200px) {
  .member-col.ops .el-button-group {
    flex-wrap: nowrap;
    gap: 4px;
    height: 26px;
  }
  .member-col.ops .el-button-group .el-button {
    flex: 0 0 92px; /* 小屏下缩小基础宽度 */
    height: 26px;
    font-size: 10px !important;
    padding: 3px 4px !important;
  }
  .member-col.ops .el-button-group .camera-btn { flex-basis: 108px; }
  .member-col.ops .el-button-group .mute-btn,
  .member-col.ops .el-button-group .silence-btn,
  .member-col.ops .el-button-group .host-btn,
  .member-col.ops .el-button-group .remove-btn { flex-basis: 82px; }
}
</style>