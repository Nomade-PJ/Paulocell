import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useLoadingState } from '../useLoadingState';
import { toast } from 'sonner';

// Mockar a biblioteca de toast
jest.mock('sonner', () => ({
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn()
}));

describe('useLoadingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('inicializa com valores padrão corretos', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('inicializa com dados iniciais', () => {
    const initialData = { name: 'Test', id: 1 };
    const { result } = renderHook(() => useLoadingState(initialData));
    
    expect(result.current.data).toEqual(initialData);
  });
  
  it('atualiza o estado de loading corretamente', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.startLoading();
    });
    
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    
    act(() => {
      result.current.stopLoading();
    });
    
    expect(result.current.loading).toBe(false);
  });
  
  it('define um erro corretamente', () => {
    const { result } = renderHook(() => useLoadingState());
    const errorMessage = 'Erro de teste';
    
    act(() => {
      result.current.stopLoading(errorMessage);
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });
  
  it('executa uma operação com sucesso', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLoadingState<number>());
    const testData = 42;
    const successMessage = 'Operação bem-sucedida';
    
    // Criar uma promise que será resolvida com sucesso
    const operation = jest.fn().mockResolvedValue(testData);
    
    let operationResult: number | null = null;
    
    act(() => {
      result.current.executeOperation(operation, {
        loadingMessage: 'Carregando...',
        successMessage
      }).then(data => {
        operationResult = data;
      });
    });
    
    // Verificar se o estado de loading foi ativado
    expect(result.current.loading).toBe(true);
    expect(toast.info).toHaveBeenCalledWith('Carregando...');
    
    // Aguardar que a promessa seja resolvida
    await waitForNextUpdate();
    
    // Verificar se a operação foi executada com sucesso
    expect(operation).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe(testData);
    expect(toast.success).toHaveBeenCalledWith(successMessage);
    expect(operationResult).toBe(testData);
  });
  
  it('lida com erros em operações', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLoadingState());
    const errorMessage = 'Erro durante a operação';
    
    // Criar uma promise que será rejeitada
    const operation = jest.fn().mockRejectedValue(new Error(errorMessage));
    
    let operationResult: any = null;
    
    act(() => {
      result.current.executeOperation(operation, {
        loadingMessage: 'Carregando...',
        errorMessage: 'Erro genérico'
      }).then(data => {
        operationResult = data;
      });
    });
    
    // Verificar se o estado de loading foi ativado
    expect(result.current.loading).toBe(true);
    
    // Aguardar que a promessa seja rejeitada
    await waitForNextUpdate();
    
    // Verificar se o erro foi tratado corretamente
    expect(operation).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
    expect(operationResult).toBeNull();
  });
}); 