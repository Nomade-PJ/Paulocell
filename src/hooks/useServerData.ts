import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  saveUserData, 
  getUserData,
  removeUserData,
  syncPendingData
} from '../services/userDataService';
import { toast } from 'sonner';

interface UseServerDataReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  reloadData: (forceRefresh?: boolean) => Promise<T[]>;
  saveItem: (key: string, itemData: any) => Promise<any>;
  removeItem: (key: string) => Promise<any>;
  syncData: () => Promise<any>;
  lastSync: Date | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
}

/**
 * Hook para gerenciar dados persistentes no servidor 
 * vinculados ao ID do usuário atual
 * 
 * @param {string} store - Nome do armazenamento (ex: 'customers', 'configurations')
 * @param {boolean} autoLoad - Se deve carregar automaticamente os dados ao montar
 * @returns {Object} - Métodos e estado para manipular os dados
 */
export function useServerData<T = any>(
  store: string, 
  autoLoad = true
): UseServerDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'offline'>('idle');
  const { user } = useContext(AuthContext);
  
  /**
   * Função para carregar dados do servidor
   */
  const loadData = useCallback(async (forceRefresh = false): Promise<T[]> => {
    if (!user?.id) {
      setError(new Error('Usuário não autenticado'));
      setLoading(false);
      return [];
    }
    
    if (!store) {
      setError(new Error('Nome do armazenamento é obrigatório'));
      setLoading(false);
      return [];
    }
    
    console.log(`[useServerData] Carregando dados da store '${store}' para usuário ${user.id}${forceRefresh ? ' (forçando atualização)' : ''}`);
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserData(user.id, store);
      setData(result as T[]);
      setLastSync(new Date());
      setLoading(false);
      return result as T[];
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      console.error(`[useServerData] Erro ao carregar dados para ${store}:`, error);
      setError(error);
      setLoading(false);
      return [];
    }
  }, [user, store]);
  
  /**
   * Função para salvar um item no servidor
   */
  const saveItem = useCallback(async (key: string, itemData: any): Promise<any> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }
    
    if (!store) {
      throw new Error('Nome do armazenamento é obrigatório');
    }
    
    if (!key) {
      throw new Error('Chave do item é obrigatória');
    }
    
    try {
      setSyncStatus('syncing');
      const result = await saveUserData(user.id, store, key, itemData);
      
      if (result.success) {
        // Recarregar dados para atualizar a lista
        await loadData(true);
        setSyncStatus('success');
        
        // Resetar status após 3 segundos
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } else {
        setSyncStatus('error');
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      console.error(`[useServerData] Erro ao salvar item ${key} na store ${store}:`, error);
      setSyncStatus('error');
      
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
      
      throw error;
    }
  }, [user, store, loadData]);
  
  /**
   * Função para remover um item do servidor
   */
  const removeItem = useCallback(async (key: string): Promise<any> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }
    
    if (!store) {
      throw new Error('Nome do armazenamento é obrigatório');
    }
    
    if (!key) {
      throw new Error('Chave do item é obrigatória');
    }
    
    try {
      setSyncStatus('syncing');
      const result = await removeUserData(user.id, store, key);
      
      if (result.success) {
        // Se for bem-sucedido, remover o item do estado local também
        setData(prevData => prevData.filter((item: any) => item.id !== key));
        setSyncStatus('success');
        
        // Resetar status após 3 segundos
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } else {
        setSyncStatus('error');
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      console.error(`[useServerData] Erro ao remover item ${key} da store ${store}:`, error);
      setSyncStatus('error');
      
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
      
      throw error;
    }
  }, [user, store]);
  
  /**
   * Função para sincronizar dados pendentes
   */
  const syncData = useCallback(async (): Promise<any> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      setSyncStatus('syncing');
      const result = await syncPendingData(user.id);
      
      if (result.success) {
        // Recarregar dados após sincronização
        await loadData(true);
        setSyncStatus('success');
        setLastSync(new Date());
        
        // Reseta status após 3 segundos
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
        
        toast.success(`Sincronização completa: ${result.syncedItems} itens sincronizados`);
      } else {
        setSyncStatus('error');
        toast.error(`Erro na sincronização: ${result.message}`);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      console.error('[useServerData] Erro ao sincronizar dados:', error);
      setSyncStatus('error');
      
      toast.error(`Erro ao sincronizar: ${error.message}`);
      
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
      
      throw error;
    }
  }, [user, loadData]);
  
  // Verificar status de rede
  useEffect(() => {
    const handleOffline = () => {
      setSyncStatus('offline');
    };
    
    const handleOnline = () => {
      setSyncStatus('idle');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Carregar dados automaticamente quando o componente montar
  useEffect(() => {
    if (autoLoad && user?.id) {
      loadData();
    }
  }, [autoLoad, user, loadData]);
  
  return {
    data,
    loading,
    error,
    reloadData: loadData,
    saveItem,
    removeItem,
    syncData,
    lastSync,
    syncStatus
  };
} 