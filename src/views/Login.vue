<template>
  <div class="login-page">
    <div class="login-left">
      <div class="login-left-content">
        <h1>应急指挥调度系统</h1>
      </div>
    </div>
    <div class="login-right">
      <div class="login-card">
        <div class="login-header">
          <h1>应急指挥调度系统</h1>
          <p>欢迎使用，请登录</p>
        </div>
        
        <el-alert
          title="示例账号：admin / 密码：123456"
          type="info"
          :closable="false"
          class="login-alert"
        />
        
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item prop="captcha">
            <div class="captcha-container">
              <el-input
                v-model="loginForm.captcha"
                placeholder="验证码"
                class="captcha-input"
              />
              <div class="captcha-image" @click="refreshCaptcha">
                {{ captchaCode }}
              </div>
            </div>
          </el-form-item>
          
          <div class="remember-forgot">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>
          
          <el-form-item>
            <el-button
              type="primary"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const captchaCode = ref('');

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: false
});

const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 5, max: 10, message: '用户名长度应为5-10个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 10, message: '密码长度应为5-10个字符', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 4, message: '验证码长度应为4位', trigger: 'blur' }
  ]
});

// 生成验证码
const generateCaptcha = () => {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  captchaCode.value = code;
  localStorage.setItem('captchaCode', code);
  return code;
};

// 刷新验证码
const refreshCaptcha = () => {
  generateCaptcha();
};

// 验证验证码
const validateCaptcha = () => {
  const storedCaptcha = localStorage.getItem('captchaCode');
  return storedCaptcha === loginForm.captcha;
};

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      // 先验证验证码
      if (!validateCaptcha()) {
        ElMessage.error('验证码错误');
        refreshCaptcha();
        return;
      }
      
      loading.value = true;
      
      try {
        // 模拟登录API调用
        setTimeout(() => {
          // 验证用户名和密码
          if (loginForm.username === 'admin' && loginForm.password === '123456') {
            // 登录成功
            const token = 'mock-token-' + Date.now();
            const user = {
              id: '1',
              username: loginForm.username,
              roles: ['admin']
            };
            
            authStore.login(token, user);
            
            // 如果有重定向，则跳转到重定向页面
            const redirectPath = route.query.redirect as string || '/dispatch/audio';
            router.push(redirectPath);
            
            ElMessage.success('登录成功');
          } else {
            // 登录失败
            ElMessage.error('用户名或密码错误');
            refreshCaptcha();
          }
          
          loading.value = false;
        }, 1000);
      } catch (error) {
        ElMessage.error('登录失败，请重试');
        loading.value = false;
        refreshCaptcha();
      }
    }
  });
};

onMounted(() => {
  generateCaptcha();
});
</script>

<style scoped>
.login-page {
  display: flex;
  height: 100vh;
  width: 100%;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}

.login-left-content {
  text-align: center;
}

.login-left-content h1 {
  font-size: 36px;
  margin-bottom: 16px;
}

.login-left-content p {
  font-size: 18px;
  opacity: 0.8;
}

.login-right {
  flex: 1;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  width: 420px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
}

.login-alert {
  margin-bottom: 20px;
}

.login-form {
  margin-top: 20px;
}

.captcha-container {
  display: flex;
  align-items: center;
}

.captcha-input {
  flex: 1;
  margin-right: 12px;
}

.captcha-image {
  width: 120px;
  height: 40px;
  background-color: #409EFF;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  letter-spacing: 4px;
  cursor: pointer;
  user-select: none;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 40px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .login-left {
    display: none;
  }
  
  .login-card {
    width: 90%;
  }
}
</style> 