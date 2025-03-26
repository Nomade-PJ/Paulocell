import { sql } from '@vercel/postgres';

/**
 * Executa uma consulta SQL no Vercel Postgres
 * @param {string} query - Consulta SQL a ser executada
 * @param {Array} params - Parâmetros para a consulta (opcional)
 * @returns {Promise<any>} Resultado da consulta
 */
export async function executeQuery(query, params = []) {
  try {
    // Executa a consulta SQL usando o cliente do Vercel Postgres
    const result = await sql.query(query, params);
    console.log(`✅ Query executada com sucesso: ${query.substring(0, 50)}...`);
    return result.rows;
  } catch (error) {
    console.error('Erro ao executar query no Vercel Postgres:', error);
    throw error;
  }
}

/**
 * Verifica se o banco de dados Vercel Postgres está disponível
 * @returns {Promise<boolean>} true se a conexão for bem-sucedida
 */
export async function checkConnection() {
  try {
    // Tenta executar uma consulta simples
    const result = await sql`SELECT NOW()`;
    console.log('✅ Conexão com Vercel Postgres bem-sucedida');
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com Vercel Postgres:', error);
    return false;
  }
}

/**
 * Cria as tabelas necessárias no banco de dados se não existirem
 * Função útil para inicialização do banco de dados em ambientes de desenvolvimento
 */
export async function initializeDatabase() {
  try {
    console.log('🔍 Verificando banco de dados Vercel Postgres...');
    
    // Verifica se as tabelas existem, caso contrário as cria
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      console.log('🏗️ Criando tabelas no Vercel Postgres...');
      await createTables();
      console.log('✅ Tabelas criadas com sucesso!');
    } else {
      console.log('✅ Tabelas já existem no banco de dados');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    return false;
  }
}

/**
 * Verifica se as tabelas principais existem no banco de dados
 */
async function checkTablesExist() {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'services', 'inventory_items')
    `;
    
    return result.rows.length >= 3;
  } catch (error) {
    console.error('Erro ao verificar existência das tabelas:', error);
    return false;
  }
}

/**
 * Cria as tabelas necessárias para a aplicação
 */
async function createTables() {
  // Cria todas as tabelas em uma única transação
  try {
    await sql.begin(async (sql) => {
      // Tabela de usuários
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user' NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;
      
      // Tabela de keywords (para autenticação)
      await sql`
        CREATE TABLE IF NOT EXISTS keywords (
          id SERIAL PRIMARY KEY,
          hash VARCHAR(255) UNIQUE NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS keyword_user_id_idx ON keywords(user_id)
      `;
      
      // Tabela de tokens
      await sql`
        CREATE TABLE IF NOT EXISTS tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_type VARCHAR(50) NOT NULL,
          token_value VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          refresh_token VARCHAR(255) UNIQUE,
          session_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS token_user_id_idx ON tokens(user_id)
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS token_value_idx ON tokens(token_value)
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS refresh_token_idx ON tokens(refresh_token)
      `;
      
      // Tabela de serviços
      await sql`
        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          description TEXT NOT NULL,
          client_name VARCHAR(255) NOT NULL,
          client_phone VARCHAR(50),
          status VARCHAR(50) DEFAULT 'pending' NOT NULL,
          total_price DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          completed_at TIMESTAMP
        )
      `;
      
      // Tabela de itens de serviço
      await sql`
        CREATE TABLE IF NOT EXISTS service_items (
          id SERIAL PRIMARY KEY,
          service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          quantity INTEGER DEFAULT 1 NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;
      
      // Tabela de itens de inventário
      await sql`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          quantity INTEGER DEFAULT 0 NOT NULL,
          min_quantity INTEGER DEFAULT 5 NOT NULL,
          price DECIMAL(10, 2),
          category VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;
      
      // Criação de usuário admin padrão se não existir nenhum
      const usersCount = await sql`SELECT COUNT(*) FROM users`;
      if (usersCount[0].count === '0') {
        await sql`
          INSERT INTO users (username, name, role) 
          VALUES ('admin', 'Administrador', 'admin')
        `;
        
        // Senha padrão: paulo123
        await sql`
          INSERT INTO keywords (hash, user_id) 
          VALUES ('$2a$10$HX0gDNf2.gqoTiYMtNVdpODx/KliuSl5n2c29lJakXHNtjMRpj8vG', 1)
        `;
        
        console.log('✅ Usuário administrador padrão criado');
      }
    });
    
    return true;
  } catch (error) {
    console.error('Erro durante a criação de tabelas:', error);
    throw error;
  }
}

/**
 * Limpa todas as tabelas do banco de dados (para testes)
 * CUIDADO: Esta função apaga todos os dados
 */
export async function clearDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Não é permitido limpar o banco de dados em produção');
  }
  
  try {
    await sql`DROP TABLE IF EXISTS service_items CASCADE`;
    await sql`DROP TABLE IF EXISTS services CASCADE`;
    await sql`DROP TABLE IF EXISTS tokens CASCADE`;
    await sql`DROP TABLE IF EXISTS keywords CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS inventory_items CASCADE`;
    
    return true;
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    return false;
  }
}

export default {
  sql,
  executeQuery,
  checkConnection,
  initializeDatabase,
  clearDatabase
}; 