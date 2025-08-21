import { createRouter, createWebHistory, RouteRecordRaw, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/store/auth';

// 扩展 RouteMeta 类型
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    icon?: string;
    requiresAuth?: boolean;
    requiresLayout?: boolean;
    isPublic?: boolean;
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Root',
    redirect: '/dispatch/audio',
    meta: {
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresLayout: false,
      isPublic: true
    }
  },
  /* 设备管理路由已被注释
  {
    path: '/device',
    name: 'Device',
    redirect: '/device/products',
    meta: {
      title: '设备管理',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/device/products',
    name: 'Products',
    component: () => import('@/views/device/Products.vue'),
    meta: {
      title: '产品管理',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/device/sub-devices',
    name: 'SubDevices',
    component: () => import('@/views/device/SubDevices.vue'),
    meta: {
      title: '产品子设备管理',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  */
  {
    path: '/emergency-command',
    name: 'EmergencyCommand',
    component: () => import('@/views/emergency/EmergencyCommandScreen.vue'),
    meta: {
      title: '应急指挥调度大屏',
      requiresAuth: true,
      requiresLayout: false, // 大屏不需要侧边栏布局
      openInNewTab: true // 标记为新标签页打开
    }
  },
  {
    path: '/dispatch',
    name: 'Dispatch',
    redirect: '/dispatch/audio',
    meta: {
      title: '调度管理',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/dispatch/audio',
    name: 'AudioDispatch',
    component: () => import('@/views/dispatch/AudioDispatch.vue'),
    meta: {
      title: '音频调度',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/dispatch/call-records',
    name: 'CallRecords',
    component: () => import('@/views/dispatch/CallRecords.vue'),
    meta: {
      title: '通话记录',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/dispatch/video',
    name: 'VideoDispatch',
    component: () => import('@/views/dispatch/VideoDispatch.vue'),
    meta: {
      title: '视频调度',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/dispatch/recordings',
    name: 'VideoRecordings',
    component: () => import('@/views/dispatch/VideoRecordings.vue'),
    meta: {
      title: '视频录像',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/dispatch/conference',
    name: 'VideoConference',
    component: () => import('@/views/dispatch/VideoConference.vue'),
    meta: {
      title: '视频会商',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/dispatch/meeting-records',
    name: 'MeetingRecords',
    component: () => import('@/views/dispatch/MeetingRecords.vue'),
    meta: {
      title: '会商记录',
      requiresAuth: true,
      requiresLayout: true
    }
  },

  {
    path: '/system/users',
    name: 'Users',
    component: () => import('@/views/system/Users.vue'),
    meta: {
      title: '用户管理',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/system/roles',
    name: 'Roles',
    component: () => import('@/views/system/Roles.vue'),
    meta: {
      title: '角色管理',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/system/permissions',
    name: 'Permissions',
    component: () => import('@/views/system/Permissions.vue'),
    meta: {
      title: '权限管理',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Home.vue'), // 暂时使用Home组件
    meta: {
      title: '系统设置',
      requiresAuth: true,
      requiresLayout: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Home.vue'), // 暂时使用Home组件
    meta: {
      title: '页面不存在',
      requiresLayout: true
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  // 设置页面标题
  document.title = `${to.meta.title || '应急指挥调度系统'}`;
  
  const authStore = useAuthStore();
  
  // 需要认证但未登录 → 重定向登录页
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  
  // 已登录但访问登录页 → 重定向首页
  if (to.path === '/login' && authStore.isLoggedIn) {
    return { path: '/' };
  }
});

export default router; 