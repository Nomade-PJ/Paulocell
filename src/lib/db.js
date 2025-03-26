/**
 * Arquivo de utilidades para acesso ao banco de dados a partir do frontend
 * Faz chamadas para os endpoints da API que lidam com o banco de dados
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Executa uma requisição autenticada para a API
 * @param {string} endpoint - O endpoint da API
 * @param {Object} options - Opções para a requisição fetch
 * @returns {Promise<any>} Resposta da API
 */
async function fetchWithAuth(endpoint, options = {}) {
  // Recupera o token JWT do localStorage
  const token = localStorage.getItem('token');
  
  // Configura os headers com o token de autenticação se disponível
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Executa a requisição
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Se a resposta não for bem-sucedida, lança um erro
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erro ao acessar a API');
  }
  
  // Retorna os dados da resposta
  return response.json();
}

/**
 * Métodos para interação com diferentes entidades do banco de dados
 */
const db = {
  // Operações de usuário
  users: {
    // Retorna os dados do usuário atual
    current: () => fetchWithAuth('/api/user'),
    
    // Busca um usuário pelo ID
    getById: (id) => fetchWithAuth(`/api/users/${id}`),
    
    // Atualiza um usuário
    update: (id, data) => fetchWithAuth(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },
  
  // Operações de serviço
  services: {
    // Lista todos os serviços
    list: (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return fetchWithAuth(`/api/services${queryString}`);
    },
    
    // Busca um serviço pelo ID
    getById: (id) => fetchWithAuth(`/api/services/${id}`),
    
    // Cria um novo serviço
    create: (data) => fetchWithAuth('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // Atualiza um serviço
    update: (id, data) => fetchWithAuth(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    // Remove um serviço
    delete: (id) => fetchWithAuth(`/api/services/${id}`, {
      method: 'DELETE',
    }),
  },
  
  // Operações de inventário
  inventory: {
    // Lista todos os itens de inventário
    list: (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return fetchWithAuth(`/api/inventory${queryString}`);
    },
    
    // Busca um item de inventário pelo ID
    getById: (id) => fetchWithAuth(`/api/inventory/${id}`),
    
    // Cria um novo item de inventário
    create: (data) => fetchWithAuth('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
    // Atualiza um item de inventário
    update: (id, data) => fetchWithAuth(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    // Remove um item de inventário
    delete: (id) => fetchWithAuth(`/api/inventory/${id}`, {
      method: 'DELETE',
    }),
  },
  
  // Estatísticas do dashboard
  dashboard: {
    // Obtém as estatísticas gerais
    stats: () => fetchWithAuth('/api/dashboard/stats'),
  },
};

export default db; 