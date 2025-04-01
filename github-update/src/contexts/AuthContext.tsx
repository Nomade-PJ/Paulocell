import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { loginWithKeyword, logout as apiLogout } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

// Intervalo de verificação para renovação do token (a cada 5 minutos)
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000;

// Define o tipo User
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Interface para o contexto de autenticação
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithKeyword: (keyword: string) => Promise<boolean>;
  logout: (logoutFromAllDevices?: boolean) => Promise<void>;
  checkTokenValidity: () => Promise<boolean>;
}

// Valor padrão para o contexto
const defaultValue: AuthContextType = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  login: async () => false,
  loginWithKeyword: async () => false,
  logout: async () => {},
  checkTokenValidity: async () => false
};

// Criar o contexto
export const AuthContext = createContext<AuthContextType>(defaultValue);

// Hook para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenCheckTimer, setTokenCheckTimer] = useState<NodeJS.Timeout | null>(null);

  // Carregar usuário da sessão ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar token armazenado
        const token = localStorage.getItem('token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Para fins de demonstração, usando um usuário mockado
        // Em produção, validaria o token com o servidor
        const mockUser: User = {
          id: '1',
          name: 'Usuário de Teste',
          email: 'teste@paulocell.com.br',
          role: 'admin'
        };
        
        setUser(mockUser);
      } catch (err: any) {
        console.error('Erro ao carregar usuário:', err);
        setError(err.message || 'Erro ao verificar autenticação');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Login com email e senha
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular validação (em produção, chamaríamos uma API)
      if (email === 'teste@paulocell.com.br' && password === 'senha123') {
        // Usuário mockado para fins de demonstração
        const mockUser: User = {
          id: '1',
          name: 'Usuário de Teste',
          email: 'teste@paulocell.com.br',
          role: 'admin'
        };
        
        // Simular token JWT
        localStorage.setItem('token', 'mock-jwt-token');
        
        setUser(mockUser);
        return true;
      } else {
        setError('Credenciais inválidas');
        return false;
      }
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError(err.message || 'Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Login com palavra-chave (funcionalidade simplificada)
  const loginWithKeyword = async (keyword: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular validação (em produção, chamaríamos uma API)
      if (keyword === 'paulocell') {
        // Usuário mockado para fins de demonstração
        const mockUser: User = {
          id: '1',
          name: 'Usuário de Teste',
          email: 'teste@paulocell.com.br',
          role: 'admin'
        };
        
        // Simular token JWT
        localStorage.setItem('token', 'mock-jwt-token');
        
        setUser(mockUser);
        return true;
      } else {
        setError('Palavra-chave inválida');
        return false;
      }
    } catch (err: any) {
      console.error('Erro ao fazer login com palavra-chave:', err);
      setError(err.message || 'Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Fazer logout
  const logout = async (logoutFromAllDevices: boolean = false): Promise<void> => {
    try {
      setLoading(true);
      
      // Remover token do localStorage
      localStorage.removeItem('token');
      
      // Em produção, chamaríamos uma API para invalidar o token
      if (logoutFromAllDevices) {
        // Simulação: chamar API para invalidar todos os tokens do usuário
        console.log('Logout de todos os dispositivos solicitado');
      }
      
      setUser(null);
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
      setError(err.message || 'Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar validade do token
  const checkTokenValidity = async (): Promise<boolean> => {
    try {
      // Verificar token armazenado
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return false;
      }
      
      // Em produção, validaria o token com o servidor
      // Para fins de demonstração, consideramos válido
      return true;
    } catch (err: any) {
      console.error('Erro ao verificar token:', err);
      return false;
    }
  };
  
  // Valor do contexto
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    loginWithKeyword,
    logout,
    checkTokenValidity
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
