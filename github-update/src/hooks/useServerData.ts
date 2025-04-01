import { useState, useEffect, useCallback, useContext } from 'react';
import { toast } from 'sonner';
import type { User } from '../contexts/AuthContext';
import * as userDataService from '../services/userDataService';
import { getUserData, saveUserData, removeUserData } from '../services/userDataService';

// Importando o AuthContext usando require para evitar erros de exportação
const AuthContext = require('../contexts/AuthContext').AuthContext;

// Interface para o contexto de autenticação
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithKeyword: (keyword: string) => Promise<boolean>;
  logout: (logoutFromAllDevices?: boolean) => Promise<void>;
  checkTokenValidity: () => Promise<boolean>;
}

// Interfaces para retornos e parâmetros
export interface ServerData {
  id?: string;
  [key: string]: any;
}

export interface UseServerDataReturn<T extends ServerData> {
  data: T[];
  loading: boolean;
  error: string | null;
  saveItem: (item: T) => Promise<boolean>;
  removeItem: (id: string) => Promise<boolean>;
  getItemById: (id: string) => T | undefined;
  refreshData: () => Promise<void>;
}

/**
 * Hook para gerenciar dados através do serviço de sincronização com servidor
 * @param dataType - Tipo de dado a ser gerenciado (customers, devices, services)
 * @returns Objeto com dados e funções para manipulação
 */
export function useServerData<T extends ServerData>(dataType: string): UseServerDataReturn<T> {
  const { user } = useContext(AuthContext) as AuthContextType;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar dados
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getUserData<T[]>(dataType);
      if (result) {
        setData(result);
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error(`Erro ao carregar ${dataType}:`, err);
      setError(err.message || `Erro ao carregar ${dataType}`);
      toast.error(`Erro ao carregar dados: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar item
  const saveItem = async (item: T): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se já existe (para atualização)
      const isUpdate = data.some(d => d.id === item.id);
      
      // Salvar no serviço
      const success = await saveUserData(dataType, item);
      
      if (success) {
        // Atualizar estado local
        if (isUpdate) {
          setData(prev => prev.map(d => d.id === item.id ? item : d));
        } else {
          setData(prev => [...prev, item]);
        }
        
        toast.success(`${isUpdate ? 'Atualizado' : 'Adicionado'} com sucesso!`);
        return true;
      } else {
        throw new Error('Falha ao salvar dados');
      }
    } catch (err: any) {
      console.error(`Erro ao salvar ${dataType}:`, err);
      setError(err.message || `Erro ao salvar ${dataType}`);
      toast.error(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para remover item
  const removeItem = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se existe
      const itemExists = data.some(d => d.id === id);
      if (!itemExists) {
        throw new Error(`Item com ID ${id} não encontrado`);
      }
      
      // Remover no serviço
      const success = await removeUserData(dataType, id);
      
      if (success) {
        // Atualizar estado local
        setData(prev => prev.filter(d => d.id !== id));
        toast.success('Removido com sucesso!');
        return true;
      } else {
        throw new Error('Falha ao remover item');
      }
    } catch (err: any) {
      console.error(`Erro ao remover ${dataType}:`, err);
      setError(err.message || `Erro ao remover ${dataType}`);
      toast.error(`Erro ao remover: ${err.message || 'Erro desconhecido'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar item por ID
  const getItemById = (id: string): T | undefined => {
    return data.find(item => item.id === id);
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, [dataType]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    saveItem,
    removeItem,
    getItemById,
    refreshData: fetchData
  };
} 