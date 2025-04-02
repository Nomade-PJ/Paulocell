#!/bin/bash
# Script de configuração e inicialização do Paulo Cell em servidor VPS

echo "=== Configurando Paulo Cell para servidor VPS ==="

# Atualizar sistema
echo "Atualizando o sistema..."
apt-get update
apt-get upgrade -y

# Instalar Node.js e npm (se ainda não estiverem instalados)
echo "Verificando instalação do Node.js..."
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js e npm..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Instalar PM2 para gerenciamento de processos
echo "Instalando PM2..."
npm install -g pm2

# Configurar diretório de uploads
echo "Configurando diretório de uploads..."
mkdir -p /var/www/uploads
chmod 755 /var/www/uploads

# Instalar dependências do projeto
echo "Instalando dependências do projeto..."
npm install

# Configurar variáveis de ambiente
echo "Configurando variáveis de ambiente..."
cp .env.production .env

# Construir o frontend
echo "Construindo o frontend..."
npm run build

# Inicializar banco de dados
echo "Inicializando banco de dados MongoDB..."
node -e "require('./api/_lib/database-config.js').initializeDatabase(process.env.DB_INIT_KEY)"

# Iniciar o servidor com PM2
echo "Iniciando o servidor com PM2..."
pm2 start server.js --name "paulo-cell"
pm2 save

# Configurar PM2 para iniciar automaticamente com o sistema
echo "Configurando inicialização automática..."
pm2 startup

echo "====================================="
echo "Paulo Cell configurado com sucesso!"
echo "Verifique o status com: pm2 status"
echo "====================================="

# Exibindo status final
pm2 status 