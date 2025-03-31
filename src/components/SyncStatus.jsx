import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { syncPendingData } from '../services/userDataService';

/**
 * Componente que mostra o status de sincronização com o servidor
 * e permite forçar uma sincronização manual
 */
const SyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [pendingItems, setPendingItems] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const { user, isAuthenticated } = useContext(AuthContext);

  // Verificar itens pendentes
  useEffect(() => {
    if (!isAuthenticated) return;

    // Contar itens pendentes de sincronização
    const checkPendingItems = () => {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${user?.id}_`) && !key.endsWith('_delete')) {
          try {
            const value = JSON.parse(localStorage.getItem(key));
            if (value && value.pendingSync) {
              count++;
            }
          } catch (e) {
            // Ignorar itens inválidos
          }
        }
      }
      setPendingItems(count);
    };

    checkPendingItems();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkPendingItems, 30000);
    
    // Verificar quando o status da rede mudar
    const handleOnline = () => {
      setSyncStatus(prev => prev === 'offline' ? 'idle' : prev);
      checkPendingItems();
    };
    
    const handleOffline = () => {
      setSyncStatus('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, user]);
  
  // Sincronizar dados pendentes
  const handleSync = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      setSyncStatus('syncing');
      const result = await syncPendingData(user.id);
      
      if (result.success) {
        setSyncStatus('success');
        setPendingItems(0);
        setLastSync(new Date());
        
        // Resetar para idle após 3 segundos
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      setSyncStatus('error');
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }
  };
  
  // Se não estiver autenticado, não mostrar nada
  if (!isAuthenticated) return null;
  
  // Status de cores
  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'offline': return 'text-yellow-500';
      default: return pendingItems > 0 ? 'text-yellow-500' : 'text-green-500';
    }
  };
  
  // Texto do status
  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Sincronizando...';
      case 'success': return 'Sincronizado!';
      case 'error': return 'Erro ao sincronizar';
      case 'offline': return 'Offline';
      default: return pendingItems > 0 ? `${pendingItems} pendentes` : 'Tudo sincronizado';
    }
  };
  
  // Ícone do status
  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'offline': return '📴';
      default: return pendingItems > 0 ? '⚠️' : '✓';
    }
  };
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`font-medium ${getStatusColor()}`}>
        {getStatusIcon()} {getStatusText()}
      </span>
      
      {pendingItems > 0 && syncStatus !== 'syncing' && (
        <button 
          onClick={handleSync}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          disabled={syncStatus === 'syncing' || syncStatus === 'offline'}
        >
          Sincronizar
        </button>
      )}
      
      {lastSync && (
        <span className="text-xs text-gray-500">
          {`Última: ${lastSync.toLocaleTimeString()}`}
        </span>
      )}
    </div>
  );
};

export default SyncStatus; 