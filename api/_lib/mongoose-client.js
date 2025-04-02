/**
 * Cliente de conexão para MongoDB usando Mongoose
 * Este módulo gerencia a conexão e operações com o MongoDB
 */

import mongoose from 'mongoose';
import config from './config.js';

// Configurações do MongoDB a partir do arquivo de configuração centralizado
const DB_URI = config.DB_URI || 'mongodb://localhost:27017/paulocell';
const DB_NAME = config.DB_NAME || 'paulocell';
const NODE_ENV = config.NODE_ENV || 'development';

// Armazenar referência à conexão
let connection = null;

/**
 * Conecta ao banco de dados MongoDB
 * @returns {Promise<mongoose.Connection>} Conexão mongoose
 */
async function connect() {
  if (connection) {
    return connection;
  }

  try {
    console.log(`🔌 Conectando ao MongoDB (${NODE_ENV})...`);
    
    // Configurações de conexão com melhorias de segurança para produção
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout para seleção de servidor
      socketTimeoutMS: 45000, // Timeout para operações
      family: 4, // Forçar uso de IPv4
    };
    
    // Adicionar configurações extras para produção
    if (NODE_ENV === 'production') {
      Object.assign(options, {
        ssl: true, // Habilitar SSL para produção
        retryWrites: true, // Permitir retentativas de operações de escrita
        maxPoolSize: 50, // Tamanho máximo do pool de conexões
        minPoolSize: 10, // Tamanho mínimo do pool de conexões
        maxIdleTimeMS: 30000, // Tempo máximo de conexão inativa
      });
    }
    
    // Conectar ao MongoDB
    await mongoose.connect(DB_URI, options);
    connection = mongoose.connection;
    
    // Configurar handlers de eventos para monitorar a conexão
    connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
      // Não tentamos reconectar automaticamente em caso de erro de autenticação
      if (err.name !== 'MongoServerSelectionError') {
        console.log('🔄 Tentando reconectar...');
        setTimeout(() => {
          mongoose.disconnect();
          connection = null;
        }, 5000);
      }
    });
    
    connection.on('disconnected', () => {
      console.warn('⚠️ Desconectado do MongoDB');
      // Se não estiver encerrando a aplicação, tenta reconectar
      if (mongoose.connection.readyState !== 0) {
        console.log('🔄 Tentando reconectar...');
        setTimeout(() => {
          mongoose.disconnect();
          connection = null;
        }, 5000);
      }
    });
    
    connection.on('reconnected', () => {
      console.log('✅ Reconectado ao MongoDB');
    });
    
    // Lidar com encerramento da aplicação
    process.on('SIGINT', async () => {
      await mongoose.disconnect();
      console.log('Conexão MongoDB fechada por término da aplicação');
      process.exit(0);
    });
    
    console.log('✅ Conectado ao MongoDB com sucesso');
    return connection;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    throw new Error(`Falha na conexão com MongoDB: ${error.message}`);
  }
}

/**
 * Verifica se a conexão com o MongoDB está disponível
 * @returns {Promise<boolean>} Status da conexão
 */
async function checkConnection() {
  try {
    const conn = await connect();
    return !!conn;
  } catch (error) {
    console.error('❌ Falha na verificação de conexão MongoDB:', error);
    throw error;
  }
}

/**
 * Inicializa as coleções e índices do MongoDB
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
  try {
    await connect();
    
    console.log('🏗️ Verificando e criando índices no MongoDB...');
    
    // Definir modelos e esquemas aqui
    // Exemplo:
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin', 'user', 'technician'], default: 'user' },
      active: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    // Adicionar índices se necessário
    userSchema.index({ email: 1 }, { unique: true });
    
    // Registrar modelo se ainda não existir
    if (!mongoose.models.User) {
      mongoose.model('User', userSchema);
    }
    
    // Definir outros modelos conforme necessário
    // ...
    
    console.log('✅ Banco de dados MongoDB inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados MongoDB:', error);
    throw error;
  }
}

/**
 * Cria um novo documento
 * @param {string} collection Nome da coleção
 * @param {Object} data Dados a serem salvos
 * @returns {Promise<Object>} Documento criado
 */
async function create(collection, data) {
  await connect();
  const Model = mongoose.model(collection);
  return await new Model(data).save();
}

/**
 * Busca documentos em uma coleção
 * @param {string} collection Nome da coleção
 * @param {Object} filter Filtro de busca
 * @param {Object} options Opções de busca (sort, limit, skip)
 * @returns {Promise<Array>} Lista de documentos
 */
async function find(collection, filter = {}, options = {}) {
  await connect();
  const Model = mongoose.model(collection);
  
  let query = Model.find(filter);
  
  if (options.sort) query = query.sort(options.sort);
  if (options.limit) query = query.limit(options.limit);
  if (options.skip) query = query.skip(options.skip);
  
  return await query.exec();
}

/**
 * Busca um documento pelo ID
 * @param {string} collection Nome da coleção
 * @param {string} id ID do documento
 * @returns {Promise<Object>} Documento encontrado
 */
async function findById(collection, id) {
  await connect();
  const Model = mongoose.model(collection);
  return await Model.findById(id).exec();
}

/**
 * Atualiza um documento
 * @param {string} collection Nome da coleção
 * @param {string} id ID do documento
 * @param {Object} data Dados a serem atualizados
 * @returns {Promise<Object>} Documento atualizado
 */
async function update(collection, id, data) {
  await connect();
  const Model = mongoose.model(collection);
  
  // Adiciona timestamp de atualização
  data.updatedAt = new Date();
  
  return await Model.findByIdAndUpdate(
    id, 
    data, 
    { new: true, runValidators: true }
  ).exec();
}

/**
 * Remove um documento
 * @param {string} collection Nome da coleção
 * @param {string} id ID do documento
 * @returns {Promise<Object>} Resultado da operação
 */
async function remove(collection, id) {
  await connect();
  const Model = mongoose.model(collection);
  return await Model.findByIdAndDelete(id).exec();
}

// Exportar funções
export default {
  connect,
  checkConnection,
  initializeDatabase,
  create,
  find,
  findById,
  update,
  remove
}; 