// src/services/configs/app.config.ts
interface AppConfig {
  publicDomain: string;
  backendUrl: string;
  apiPrefix: string;
  imgUrlPrefix: string;
  authenticatedEntryPath: string;
  unAuthenticatedEntryPath: string;
  auth: {
    tokenKey: string;
    refreshTokenKey: string;
    tokenType: string;
  };
  endpoints: {
    auth: {
      login: string;
      register: string;
      validateToken: string;
      refreshToken: string;
    };
    admin: {
      users: string;
      createUser: string;
      softDeleteUser: (id: string) => string;
      restoreUser: (id: string) => string;
      hardDeleteUser: (id: string) => string;
      adjustWallet: (userId: string) => string;
    };
    diamonds: {
      list: string;
      details: (id: string) => string;
      create: string;
      update: (id: string) => string;
      softDelete: (id: string) => string;
      restore: (id: string) => string;
      hardDelete: (id: string) => string;
      cleanupImages: string;
      updatePrices: string;
      createTestUsers: string;
    };
    bids: {
      list: string;
      details: (id: string) => string;
      create: string;
      current: (id: string) => string;
      history: (id: string) => string;
      completed: string;
      start: (id: string) => string;
      close: (id: string) => string;
      place: (id: string) => string;
      auto: (id: string) => string;
      softDelete: (id: string) => string;
      restore: (id: string) => string;
      hardDelete: (id: string) => string;
    };
    wallet: {
      balance: string;
      topup: string;
      history: string;
    };
  };
}

const appConfig: AppConfig = {
  publicDomain: import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin,
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001',
  apiPrefix: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api`,
  imgUrlPrefix: import.meta.env.VITE_IMG_PREFIX || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/uploads`,
  authenticatedEntryPath: '/user',
  unAuthenticatedEntryPath: '/login',
  auth: {
    tokenKey: 'token',
    refreshTokenKey: 'refreshToken',
    tokenType: 'Bearer ',
  },
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      validateToken: '/auth/validate',
      refreshToken: '/auth/refresh-token',
    },
    admin: {
      users: '/admin/users',
      createUser: '/admin/users',
      softDeleteUser: (id) => `/admin/users/${id}/soft`,
      restoreUser: (id) => `/admin/users/${id}/restore`,
      hardDeleteUser: (id) => `/admin/users/${id}/hard`,
      adjustWallet: (userId) => `/admin/wallet/${userId}`,
    },
    diamonds: {
      list: '/diamonds',
      details: (id) => `/diamonds/${id}`,
      create: '/diamonds',
      update: (id) => `/diamonds/${id}`,
      softDelete: (id) => `/diamonds/${id}/soft`,
      restore: (id) => `/diamonds/${id}/restore`,
      hardDelete: (id) => `/diamonds/${id}/hard`,
      cleanupImages: '/diamonds/cleanup-images',
      updatePrices: '/diamonds/update-prices',
      createTestUsers: '/diamonds/create-test-users',
    },
    bids: {
      list: '/bids',
      details: (id) => `/bids/${id}`,
      create: '/bids',
      current: (id) => `/bids/${id}/current`,
      history: (id) => `/bids/${id}/history`,
      completed: '/bids/history/completed',
      start: (id) => `/bids/${id}/start`,
      close: (id) => `/bids/${id}/close`,
      place: (id) => `/bids/${id}/place`,
      auto: (id) => `/bids/${id}/auto`,
      softDelete: (id) => `/bids/${id}/soft`,
      restore: (id) => `/bids/${id}/restore`,
      hardDelete: (id) => `/bids/${id}/hard`,
    },
    wallet: {
      balance: '/wallet/balance',
      topup: '/wallet/topup',
      history: '/wallet/history',
    },
  },
};

export default appConfig;