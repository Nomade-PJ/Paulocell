/**
 * Configuração centralizada para carregar variáveis de ambiente
 * Prioriza o arquivo .env.production quando em ambiente de produção
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Determinar o ambiente
const NODE_ENV = process.env.NODE_ENV || 'development';

// Carregar o arquivo de ambiente adequado
function loadEnvConfig() {
  try {
    // Tentar carregar .env.production primeiro em ambiente de produção
    if (NODE_ENV === 'production') {
      const prodEnvPath = path.resolve(process.cwd(), '.env.production');
      
      if (fs.existsSync(prodEnvPath)) {
        console.log('📋 Carregando configurações de produção (.env.production)');
        dotenv.config({ path: prodEnvPath });
        return true;
      } else {
        console.warn('⚠️ Arquivo .env.production não encontrado');
      }
    }
    
    // Fallback para o arquivo .env padrão
    const defaultEnvPath = path.resolve(process.cwd(), '.env');
    
    if (fs.existsSync(defaultEnvPath)) {
      console.log('📋 Carregando configurações de ambiente (.env)');
      dotenv.config({ path: defaultEnvPath });
      return true;
    } else {
      console.warn('⚠️ Arquivo .env não encontrado');
    }
    
    // Se nenhum arquivo for encontrado, carrega sem path
    dotenv.config();
    return true;
  } catch (error) {
    console.error('❌ Erro ao carregar arquivo de ambiente:', error);
    return false;
  }
}

// Executar carregamento de configuração
loadEnvConfig();

// Exportar variáveis de ambiente já carregadas para uso em outros módulos
export default {
  NODE_ENV,
  DB_URI: process.env.DB_URI,
  DB_NAME: process.env.DB_NAME,
  DB_TYPE: process.env.DB_TYPE || 'mongoose',
  API_URL: process.env.API_URL,
  SITE_APP_URL: process.env.SITE_APP_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10)
}; 