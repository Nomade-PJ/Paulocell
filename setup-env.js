/**
 * Script para configurar o ambiente de produção
 * Copia o arquivo .env.production para .env quando em ambiente de produção
 */

const fs = require('fs');
const path = require('path');

// Função principal para configurar o ambiente
async function setupEnvironment() {
  console.log('=== Configurando ambiente do sistema Paulo Cell ===');
  
  // Detectar ambiente
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`Ambiente detectado: ${isProduction ? 'Produção' : 'Desenvolvimento'}`);
  
  // Caminhos dos arquivos
  const rootDir = process.cwd();
  const sourceEnvFile = path.join(rootDir, '.env.production');
  const targetEnvFile = path.join(rootDir, '.env');
  
  if (isProduction) {
    try {
      // Verificar se o arquivo .env.production existe
      if (!fs.existsSync(sourceEnvFile)) {
        console.error(`❌ Arquivo ${sourceEnvFile} não encontrado!`);
        process.exit(1);
      }
      
      // Ler o arquivo .env.production
      const envContent = fs.readFileSync(sourceEnvFile, 'utf8');
      
      // Escrever no arquivo .env
      fs.writeFileSync(targetEnvFile, envContent);
      
      console.log('✅ Arquivo .env atualizado com as configurações de produção');
      console.log(`📋 Configurações aplicadas de: ${sourceEnvFile}`);
      console.log(`📋 Configurações salvas em: ${targetEnvFile}`);
    } catch (error) {
      console.error('❌ Erro ao configurar ambiente:', error);
      process.exit(1);
    }
  } else {
    console.log('ℹ️ Ambiente de desenvolvimento detectado. Nenhuma alteração realizada.');
  }
  
  console.log('=== Configuração de ambiente concluída ===');
}

// Executar a função principal
setupEnvironment(); 