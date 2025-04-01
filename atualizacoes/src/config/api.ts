import axios from 'axios';
import { toast } from 'react-toastify';

// Definir URL base da API dependendo do ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001' 
  : 'https://api.paulocell.com.br';

// Criar instância do axios com configurações padrão
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratar erros comuns
    if (error.response) {
      // Erro do servidor com resposta
      const { status } = error.response;
      
      if (status === 401) {
        // Erro de autenticação
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        localStorage.removeItem('token');
        // Redirecionar para a página de login se necessário
        // window.location.href = '/login';
      } else if (status === 403) {
        toast.error('Você não tem permissão para realizar esta operação.');
      } else if (status === 404) {
        toast.error('Recurso não encontrado.');
      } else if (status === 500) {
        toast.error('Erro no servidor. Por favor, tente novamente mais tarde.');
      } else {
        // Outros erros HTTP
        toast.error(`Erro na requisição: ${error.response.data?.message || 'Erro desconhecido'}`);
      }
    } else if (error.request) {
      // Erro na requisição (sem resposta do servidor)
      toast.error('Não foi possível conectar ao servidor. Verifique sua conexão.');
    } else {
      // Erro ao configurar a requisição
      toast.error(`Erro na requisição: ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

// Função para verificar se o dispositivo está online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Exportar função utilitária para verificar se o token está expirado
export const isTokenExpired = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  // Em uma implementação real, decodificaria o token JWT e verificaria a expiração
  // Para simplificar, vamos apenas verificar a existência do token
  return false;
};

export default api; 