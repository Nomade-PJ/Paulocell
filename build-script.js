const fs = require('fs');
const path = require('path');

// Cria a pasta dist se não existir
function createDist() {
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
    console.log('✅ Pasta dist criada');
  } else {
    console.log('✅ Pasta dist já existe');
  }
}

// Copia o index.html para a pasta dist
function copyIndexHtml() {
  try {
    if (fs.existsSync('index.html')) {
      fs.copyFileSync('index.html', 'dist/index.html');
      console.log('✅ index.html copiado para dist');
    } else {
      console.error('❌ index.html não encontrado');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Erro ao copiar index.html:', err);
    process.exit(1);
  }
}

// Copia a pasta public para dist se existir
function copyPublicFolder() {
  try {
    if (fs.existsSync('public')) {
      // Cria a pasta public em dist
      if (!fs.existsSync('dist/public')) {
        fs.mkdirSync('dist/public', { recursive: true });
      }
      
      // Copia todos os arquivos de public para dist/public
      const files = fs.readdirSync('public');
      for (const file of files) {
        const srcPath = path.join('public', file);
        const destPath = path.join('dist/public', file);
        
        if (fs.lstatSync(srcPath).isDirectory()) {
          // Se for uma pasta, copia recursivamente
          fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
          // Se for um arquivo, copia normalmente
          fs.copyFileSync(srcPath, destPath);
        }
      }
      console.log('✅ Pasta public copiada para dist');
    } else {
      console.log('ℹ️ Pasta public não encontrada, ignorando');
    }
  } catch (err) {
    console.error('❌ Erro ao copiar pasta public:', err);
  }
}

// Função principal que executa todo o build
function build() {
  console.log('🚀 Iniciando processo de build manual...');
  
  // Lista os arquivos no diretório atual para debug
  console.log('📂 Arquivos no diretório atual:');
  console.log(fs.readdirSync('.').join(', '));
  
  createDist();
  copyIndexHtml();
  copyPublicFolder();
  
  console.log('✨ Build concluído com sucesso!');
}

// Executa o build
build(); 