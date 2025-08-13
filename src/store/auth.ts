import { defineStore } from 'pinia';
import { User } from '@/types';
import router from '@/router';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo') || '{}') : null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token')
  }),
  
  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    isLoggedIn: (state) => state.isAuthenticated
  },
  
  actions: {
    setUser(user: User) {
      this.user = user;
      localStorage.setItem('userInfo', JSON.stringify(user));
    },
    
    login(token: string, user: User) {
      // 先存储数据到localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
      
      // 再更新状态
      this.token = token;
      this.user = user;
      this.isAuthenticated = true;
    },
    
    logout() {
      // 清除状态
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('captchaCode');
      
      // 跳转到登录页
      setTimeout(() => {
        router.push('/login');
      }, 0);
    }
  }
}); 