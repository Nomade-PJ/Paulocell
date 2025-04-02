import axios from 'axios';

// Obter a URL da API da variável de ambiente ou usar valor padrão
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.paulocell.com.br/api'  // URL de produção atualizada
    : 'http://localhost:3000/api');

// Importar o gerenciador de sincronização
import { syncManager } from './syncManager';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Aumentar timeout para operações que podem demorar mais
  timeout: 15000
});

// Interceptor para adicionar token de autenticação (se disponível)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Adicionar timestamp para evitar cache
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: new Date().getTime()
    };
  }
  
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    // Extrair informações da requisição para possível uso offline
    const { config, response } = error;
    
    // Se não tiver config, não podemos processar
    if (!config) {
      return Promise.reject(error);
    }
    
    // Tratamento específico para erros de conexão (útil para modo offline)
    if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      console.warn('Operação offline detectada, armazenando para sincronização posterior');
      
      // Identificar o tipo de entidade com base na URL
      let entityType = 'unknown';
      const url = config.url;
      
      if (url.includes('/customers')) {
        entityType = 'customers';
      } else if (url.includes('/services')) {
        entityType = 'services';
      } else if (url.includes('/inventory')) {
        entityType = 'inventory';
      } else if (url.includes('/user-data')) {
        // Extrair o tipo de store da URL de user-data
        const matches = url.match(/\/user-data\/[^\/]+\/([^\/]+)/);
        if (matches && matches[1]) {
          entityType = matches[1];
        }
      }
      
      // Adicionar à fila de sincronização
      if (config.method !== 'get') {
        syncManager.addPendingOperation(
          entityType,
          async () => {
            // Remover o timeout para evitar problemas na sincronização
            const syncConfig = { ...config, timeout: 30000 };
            return axios(syncConfig);
          },
          false // Não executar imediatamente
        );
        
        // Retornar uma resposta simulada para não quebrar o fluxo da aplicação
        if (config.method === 'post' || config.method === 'put') {
          return Promise.resolve({
            data: {
              ...config.data,
              id: `offline_${Date.now()}`,
              _offlineGenerated: true,
              message: 'Dados salvos offline. Serão sincronizados quando houver conexão.'
            },
            status: 200,
            statusText: 'OK (Offline Mode)',
            headers: {},
            config
          });
        }
      }
    } else if (response && response.status === 401) {
      // Token expirado ou inválido
      console.warn('Token de autenticação expirado ou inválido');
      // Aqui você pode adicionar lógica para renovar o token ou redirecionar para login
    }
    
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Métodos auxiliares para operações comuns
api.saveCustomer = async (customerData) => {
  return api.post('/customers', customerData);
};

api.updateCustomer = async (id, customerData) => {
  return api.put(`/customers/${id}`, customerData);
};

api.saveService = async (serviceData) => {
  return api.post('/services', serviceData);
};

api.updateInventoryItem = async (id, itemData) => {
  return api.put(`/inventory/${id}`, itemData);
};

// Método para verificar status da conexão com o servidor
api.checkServerStatus = async () => {
  try {
    const response = await api.get('/health-check', { timeout: 5000 });
    return { online: true, status: response.status, data: response.data };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

export default api;