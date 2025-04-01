import { useState } from 'react';
import { toast } from 'sonner'; // Ajuste para a biblioteca de toast que você estiver usando

/**
 * Interface que define o retorno do hook useLoadingState
 */
interface UseLoadingStateReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  setData: (data: T | null) => void;
  startLoading: () => void;
  stopLoading: (error?: string) => void;
  executeOperation: <R>(operation: () => Promise<R>, options?: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
  }) => Promise<R | null>;
}

/**
 * Hook personalizado para gerenciar estados de carregamento, dados e erros
 * Simplifica o padrão comum de gerenciar estados de UI durante operações assíncronas
 * 
 * @param initialData - Dados iniciais (opcional)
 * @returns Objeto com estado de carregamento, dados, erro e métodos para manipulação
 */
export function useLoadingState<T>(initialData: T | null = null): UseLoadingStateReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Inicia o estado de carregamento e limpa erros anteriores
   */
  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  /**
   * Finaliza o estado de carregamento e opcionalmente define uma mensagem de erro
   */
  const stopLoading = (errorMessage?: string) => {
    setLoading(false);
    if (errorMessage) {
      setError(errorMessage);
    }
  };

  /**
   * Executa uma operação assíncrona com gerenciamento automático de estados
   * @param operation - Função assíncrona a ser executada
   * @param options - Opções para mensagens de feedback ao usuário
   * @returns Resultado da operação ou null em caso de erro
   */
  const executeOperation = async <R>(
    operation: () => Promise<R>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    }
  ): Promise<R | null> => {
    try {
      startLoading();
      if (options?.loadingMessage) {
        toast.info(options.loadingMessage);
      }
      
      const result = await operation();
      
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      return result;
    } catch (e: any) {
      const errorMsg = e.message || options?.errorMessage || 'Ocorreu um erro na operação';
      console.error(errorMsg, e);
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    setData, 
    startLoading, 
    stopLoading,
    executeOperation
  };
} 