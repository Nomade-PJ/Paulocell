/**
 * Serviço para gerenciar dados do usuário no servidor
 * Este serviço permite salvar e recuperar dados vinculados ao ID do usuário logado
 */

export interface SyncResult {
  success: boolean;
  message?: string;
  syncedItems?: number;
  errors?: Array<{ key: string; error: string }>;
}

/**
 * Função para salvar dados no servidor
 * @param {string} userId - ID do usuário
 * @param {string} store - Nome do armazenamento (ex: 'customers', 'settings')
 * @param {string} key - Chave única para o item
 * @param {object|string} data - Dados a serem salvos
 * @returns {Promise<object>} - Resposta da API
 */
export async function saveUserData(
  userId: string, 
  store: string, 
  key: string, 
  data: any
): Promise<any> {
  try {
    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    // Validar store e key
    if (!store || typeof store !== 'string') {
      throw new Error('Nome do armazenamento (store) é obrigatório e deve ser uma string');
    }

    if (!key || typeof key !== 'string') {
      throw new Error('Chave (key) é obrigatória e deve ser uma string');
    }

    if (data === undefined || data === null) {
      throw new Error('Dados não podem ser null ou undefined');
    }

    console.log(`[UserData] Salvando dados para usuário ${userId} na store ${store}, key ${key}`);
    
    // Verificar se estamos online - se não, salvar localmente com flag de pendente
    if (!navigator.onLine) {
      console.warn('[UserData] Dispositivo offline. Salvando apenas localmente.');
      // Salvar no localStorage como pendente para sincronização
      const storageKey = `${userId}_${store}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        updatedAt: new Date().toISOString(),
        pendingSync: true
      }));
      
      return { 
        success: true, 
        id: key, 
        fromLocalStorage: true,
        needsSync: true,
        message: 'Salvo localmente. Será sincronizado quando online.' 
      };
    }
    
    // Enviar para o servidor usando a API REST
    const response = await fetch(`/api/user-data/${userId}/${store}/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ data }),
    });

    // Verificar erro HTTP
    if (!response.ok) {
      // Tentar obter detalhes do erro
      let errorMessage = 'Erro ao salvar dados no servidor';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Se não conseguir parse do JSON, usar mensagem genérica
      }
      throw new Error(`${errorMessage} (HTTP ${response.status})`);
    }

    const result = await response.json();
    console.log('[UserData] Dados salvos com sucesso no servidor:', result);
    
    // Salvar uma cópia local para acesso offline também
    try {
      const storageKey = `${userId}_${store}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        updatedAt: new Date().toISOString(),
        pendingSync: false, // Não está pendente, pois foi salvo com sucesso
        id: result.id // Armazenar o ID do registro para futuras atualizações
      }));
      console.log('[UserData] Cópia local dos dados atualizada');
    } catch (localError) {
      console.warn('[UserData] Não foi possível salvar cópia local:', localError);
      // Não lançar erro, pois os dados foram salvos com sucesso no servidor
    }
    
    return result;
  } catch (error: any) {
    console.error('[UserData] Erro ao salvar dados do usuário:', error);
    
    // Salvar no localStorage como fallback para caso offline
    try {
      const storageKey = `${userId}_${store}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        updatedAt: new Date().toISOString(),
        pendingSync: true,
        error: error.message
      }));
      console.log('[UserData] Dados salvos no localStorage como fallback (pendentes para sincronização)');
    } catch (localError) {
      console.error('[UserData] Erro crítico: Falha ao salvar no servidor E no localStorage:', localError);
    }
    
    throw error;
  }
}

/**
 * Função para buscar dados do servidor
 * @param {string} userId - ID do usuário
 * @param {string} store - Nome do armazenamento
 * @returns {Promise<Array>} - Dados do usuário
 */
export async function getUserData(userId: string, store: string): Promise<any[]> {
  try {
    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    // Validar store
    if (!store || typeof store !== 'string') {
      throw new Error('Nome do armazenamento (store) é obrigatório e deve ser uma string');
    }

    console.log(`[UserData] Buscando dados para usuário ${userId} na store ${store}`);
    
    // Tentar buscar dados do servidor sempre primeiro, a menos que estejamos offline
    const serverPromise = fetch(`/api/user-data/${userId}/${store}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      // Definir timeout para evitar bloqueio
      signal: AbortSignal.timeout(10000) // 10 segundos de timeout
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar dados do servidor');
      }
      return response.json();
    });
    
    // Se estivermos offline, usar apenas dados locais
    if (!navigator.onLine) {
      console.warn('[UserData] Dispositivo offline, usando apenas dados locais');
      const localData = getLocalData(userId, store);
      return localData;
    }
    
    // Buscar dados do localStorage enquanto aguarda o servidor
    const localData = getLocalData(userId, store);
    
    // Tentar obter dados do servidor primeiro
    try {
      const result = await serverPromise;
      
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Formato de resposta inválido do servidor');
      }
      
      console.log(`[UserData] ${result.data.length} itens recuperados do servidor para ${store}`);
      
      // Atualizar localStorage com os dados mais recentes do servidor
      updateLocalCache(userId, store, result.data);
      
      return result.data;
    } catch (serverError) {
      console.warn(`[UserData] Falha ao buscar dados do servidor: ${serverError}. Usando dados locais.`);
      
      // Se o servidor falhar, usar os dados locais
      console.log(`[UserData] ${localData.length} itens recuperados do localStorage para ${store}`);
      return localData;
    }
  } catch (error) {
    console.error(`[UserData] Erro ao buscar dados do usuário para ${store}:`, error);
    
    // Em caso de erro geral, tentar retornar dados locais
    try {
      const localData = getLocalData(userId, store);
      console.log(`[UserData] Fallback: ${localData.length} itens recuperados do localStorage para ${store}`);
      return localData;
    } catch (localError) {
      console.error('[UserData] Erro crítico: Falha ao buscar do servidor E do localStorage:', localError);
      return [];
    }
  }
}

/**
 * Função para excluir dados do usuário
 * @param {string} userId - ID do usuário
 * @param {string} store - Nome do armazenamento
 * @param {string} key - Chave do item a ser removido
 * @returns {Promise<object>} - Resposta da API
 */
export async function removeUserData(userId: string, store: string, key: string): Promise<any> {
  try {
    if (!userId || !store || !key) {
      throw new Error('ID do usuário, store e key são obrigatórios');
    }

    console.log(`[UserData] Removendo dados: userId=${userId}, store=${store}, key=${key}`);
    
    // Se estiver offline, marcar para exclusão futura
    if (!navigator.onLine) {
      console.warn('[UserData] Dispositivo offline. Marcando para exclusão futura.');
      
      // Marcar para exclusão quando online novamente
      const deleteMarker = `${userId}_${store}_${key}_delete`;
      localStorage.setItem(deleteMarker, JSON.stringify({
        markedAt: new Date().toISOString()
      }));
      
      // Remover do localStorage também (se existir)
      const storageKey = `${userId}_${store}_${key}`;
      localStorage.removeItem(storageKey);
      
      return { 
        success: true, 
        fromLocalStorage: true,
        message: 'Marcado para exclusão quando online' 
      };
    }
    
    // Enviar solicitação de exclusão para o servidor
    const response = await fetch(`/api/user-data/${userId}/${store}/${key}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ao excluir dados (HTTP ${response.status})`);
    }
    
    const result = await response.json();
    
    // Remover do localStorage também
    const storageKey = `${userId}_${store}_${key}`;
    localStorage.removeItem(storageKey);
    
    console.log('[UserData] Dados removidos com sucesso:', result);
    return result;
  } catch (error) {
    console.error('[UserData] Erro ao remover dados:', error);
    
    // Em caso de erro, tentar marcar para exclusão futura
    try {
      const deleteMarker = `${userId}_${store}_${key}_delete`;
      localStorage.setItem(deleteMarker, JSON.stringify({
        markedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      
      console.log('[UserData] Marcado para exclusão futura após falha na API');
    } catch (localError) {
      console.error('[UserData] Erro ao marcar para exclusão futura:', localError);
    }
    
    throw error;
  }
}

/**
 * Função para sincronizar dados pendentes
 * @param {string} userId - ID do usuário
 * @returns {Promise<SyncResult>} - Resultado da sincronização
 */
export async function syncPendingData(userId: string): Promise<SyncResult> {
  if (!userId) {
    return {
      success: false,
      message: 'ID do usuário é obrigatório para sincronização'
    };
  }
  
  // Importar syncManager para verificar operações pendentes
  const { syncManager } = await import('./syncManager');
  const pendingCount = syncManager.getPendingOperationsCount();
  
  if (pendingCount > 0) {
    console.log(`[UserData] Processando ${pendingCount} operações pendentes via syncManager`);
    // Processar operações pendentes no syncManager
    await syncManager.processPendingOperations();
  }
  
  if (!navigator.onLine) {
    return {
      success: false,
      message: 'Dispositivo offline. Não é possível sincronizar.'
    };
  }
  
  console.log(`[UserData] Iniciando sincronização de dados para usuário ${userId}`);
  
  const pendingItems: Record<string, any> = {};
  const pendingDeletions: string[] = [];
  const errors: Array<{ key: string; error: string }> = [];
  let syncedCount = 0;
  
  // Coletar todos os itens pendentes
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (!key) continue;
      
      // Verificar se é um item para esse usuário
      if (key.startsWith(`${userId}_`)) {
        // Verificar se é um marcador de exclusão
        if (key.endsWith('_delete')) {
          pendingDeletions.push(key);
          continue;
        }
        
        // Verificar se é um item com sincronização pendente
        try {
          const valueStr = localStorage.getItem(key);
          if (!valueStr) continue;
          
          const value = JSON.parse(valueStr);
          if (value.pendingSync) {
            pendingItems[key] = value;
          }
        } catch (error) {
          console.warn(`[UserData] Item inválido no localStorage: ${key}`);
        }
      }
    }
    
    // Processar exclusões pendentes
    for (const deleteKey of pendingDeletions) {
      try {
        // Formato: userId_store_itemKey_delete
        const parts = deleteKey.split('_');
        // Remover o sufixo "_delete" e o userId do início
        const store = parts[1];
        // O itemKey pode conter underscores, então precisamos reconstruí-lo
        const itemKey = parts.slice(2, -1).join('_');
        
        console.log(`[UserData] Processando exclusão pendente: store=${store}, key=${itemKey}`);
        
        const response = await fetch(`/api/user-data/${userId}/${store}/${itemKey}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        
        if (response.ok) {
          // Remover o marcador de exclusão
          localStorage.removeItem(deleteKey);
          syncedCount++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[UserData] Erro ao processar exclusão pendente ${deleteKey}:`, error);
        errors.push({ key: deleteKey, error: errorMsg });
      }
    }
    
    // Processar atualizações pendentes
    for (const [storageKey, value] of Object.entries(pendingItems)) {
      try {
        // Formato: userId_store_itemKey
        const parts = storageKey.split('_');
        const store = parts[1];
        // O itemKey pode conter underscores, então precisamos reconstruí-lo
        const itemKey = parts.slice(2).join('_');
        
        console.log(`[UserData] Sincronizando item pendente: store=${store}, key=${itemKey}`);
        
        const response = await fetch(`/api/user-data/${userId}/${store}/${itemKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ data: value.data })
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Atualizar item no localStorage para não estar mais pendente
          localStorage.setItem(storageKey, JSON.stringify({
            ...value,
            pendingSync: false,
            id: result.id, // Atualizar com o ID do servidor
            updatedAt: new Date().toISOString()
          }));
          
          syncedCount++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[UserData] Erro ao sincronizar item pendente ${storageKey}:`, error);
        errors.push({ key: storageKey, error: errorMsg });
      }
    }
    
    // Retornar resultado da sincronização
    return {
      success: errors.length === 0,
      syncedItems: syncedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 
        ? `Sincronização concluída com ${errors.length} erros`
        : `${syncedCount} itens sincronizados com sucesso`
    };
  } catch (error) {
    console.error('[UserData] Erro durante sincronização:', error);
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return {
      success: false,
      message: `Erro durante sincronização: ${errorMsg}`,
      syncedItems: syncedCount,
      errors: [{
        key: 'sync_process',
        error: errorMsg
      }]
    };
  }
}

/**
 * Função auxiliar para buscar dados do localStorage
 * @param {string} userId - ID do usuário
 * @param {string} store - Nome do armazenamento
 * @returns {Array} - Dados locais
 */
function getLocalData(userId: string, store: string): any[] {
  try {
    const localData: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${userId}_${store}_`) && !key.endsWith('_delete')) {
        try {
          const valueStr = localStorage.getItem(key);
          if (!valueStr) continue;
          
          const value = JSON.parse(valueStr);
          const itemKey = key.replace(`${userId}_${store}_`, '');
          
          if (value && value.data) {
            localData.push({
              id: value.id || itemKey, // Usar ID do servidor se disponível
              key: itemKey,
              ...(typeof value.data === 'object' ? value.data : { data: value.data }),
              pendingSync: value.pendingSync === true,
              _localUpdatedAt: value.updatedAt
            });
          }
        } catch (e) {
          console.warn(`[UserData] Item inválido no localStorage: ${key}`);
        }
      }
    }
    return localData;
  } catch (error) {
    console.error('[UserData] Erro ao ler dados do localStorage:', error);
    return [];
  }
}

/**
 * Função auxiliar para atualizar o cache local com dados do servidor
 * @param {string} userId - ID do usuário
 * @param {string} store - Nome do armazenamento
 * @param {Array} serverData - Dados do servidor
 */
function updateLocalCache(userId: string, store: string, serverData: any[]) {
  try {
    // Para cada item do servidor, atualizar o localStorage
    serverData.forEach(item => {
      if (item && item.key) {
        const storageKey = `${userId}_${store}_${item.key}`;
        
        // Buscar item atual do localStorage
        let currentItem = null;
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            currentItem = JSON.parse(stored);
          }
        } catch (e) {
          // Ignorar se não conseguir ler
        }
        
        // Se tiver mudanças pendentes locais, não sobrescrever
        if (currentItem && currentItem.pendingSync) {
          console.log(`[UserData] Item ${item.key} tem alterações pendentes locais, não atualizando do servidor`);
          return;
        }
        
        // Extrair os dados do item sem os metadados
        const { id, key, pendingSync, _localUpdatedAt, ...data } = item;
        
        // Salvar no localStorage
        localStorage.setItem(storageKey, JSON.stringify({
          data,
          id: item.id,
          updatedAt: new Date().toISOString(),
          pendingSync: false
        }));
      }
    });
  } catch (error) {
    console.error('[UserData] Erro ao atualizar cache local:', error);
  }
}