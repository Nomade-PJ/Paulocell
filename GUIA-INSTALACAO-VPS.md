# Guia de Instalação do Paulo Cell em Servidor VPS

Este guia detalha os passos necessários para instalar e configurar o sistema Paulo Cell em um servidor VPS, utilizando MongoDB como banco de dados.

## Pré-requisitos

- Servidor VPS com Ubuntu 20.04 ou superior
- Acesso root ou sudo ao servidor
- MongoDB instalado e configurado
- Node.js v16 ou superior

## 1. Preparação do Servidor

### Atualizar o sistema
```bash
sudo apt update
sudo apt upgrade -y
```

### Instalar dependências básicas
```bash
sudo apt install -y git curl build-essential
```

### Instalar Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Instalar PM2 (gerenciador de processos)
```bash
sudo npm install -g pm2
```

## 2. Instalação do MongoDB

### Adicionar repositório do MongoDB
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
```

### Instalar MongoDB
```bash
sudo apt install -y mongodb-org
```

### Iniciar e habilitar o serviço MongoDB
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Verificar se o MongoDB está funcionando
```bash
sudo systemctl status mongod
```

### Configurar segurança do MongoDB (Altamente recomendado)
```bash
# Criar usuário administrador
mongosh admin --eval '
  db.createUser({
    user: "adminUser",
    pwd: "senha_segura_aqui",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  })
'

# Criar banco de dados e usuário para a aplicação
mongosh admin -u adminUser -p senha_segura_aqui --eval '
  use paulocell;
  db.createUser({
    user: "paulocellApp",
    pwd: "outra_senha_segura_aqui",
    roles: [ { role: "readWrite", db: "paulocell" } ]
  })
'

# Editar arquivo de configuração do MongoDB para habilitar autenticação
sudo nano /etc/mongod.conf
```

Adicione as seguintes linhas na seção de segurança:
```yaml
security:
  authorization: "enabled"
```

Reinicie o MongoDB:
```bash
sudo systemctl restart mongod
```

## 3. Instalação da Aplicação Paulo Cell

### Clonar o repositório
```bash
cd /var/www
sudo git clone https://github.com/seu-usuario/paulo-cell.git
cd paulo-cell
```

### Configurar variáveis de ambiente
```bash
sudo cp .env.example .env
sudo nano .env
```

Edite o arquivo `.env` com as configurações corretas:
```
# Configuração do MongoDB para VPS
DB_URI=mongodb://paulocellApp:outra_senha_segura_aqui@localhost:27017/paulocell
DB_NAME=paulocell
DB_TYPE=mongoose

# URL da API para o frontend
REACT_APP_API_URL=http://seu-dominio.com/api
API_URL=http://seu-dominio.com/api

# Segurança
JWT_SECRET=sua_chave_secreta_altamente_segura_para_producao
JWT_EXPIRES_IN=7d

# Configuração do servidor
PORT=3000
HOST=0.0.0.0
```

### Instalar dependências e construir o projeto
```bash
sudo npm install
sudo npm run build
```

### Iniciar a aplicação com PM2
```bash
sudo pm2 start server.js --name "paulo-cell"
sudo pm2 save
```

### Configurar PM2 para iniciar com o sistema
```bash
sudo pm2 startup
sudo pm2 save
```

## 4. Configuração do Nginx (Recomendado)

### Instalar Nginx
```bash
sudo apt install -y nginx
```

### Configurar site do Nginx
```bash
sudo nano /etc/nginx/sites-available/paulo-cell
```

Adicione a seguinte configuração:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Configuração para arquivos estáticos
    location /static/ {
        alias /var/www/paulo-cell/dist/static/;
        expires 30d;
    }

    # Configuração para uploads
    location /uploads/ {
        alias /var/www/uploads/;
    }
}
```

### Ativar o site e reiniciar o Nginx
```bash
sudo ln -s /etc/nginx/sites-available/paulo-cell /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Configurar SSL com Let's Encrypt (Recomendado)

### Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obter certificado SSL
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### Verificar renovação automática
```bash
sudo certbot renew --dry-run
```

## 6. Verificação Final

### Verificar status do aplicativo
```bash
sudo pm2 status
```

### Verificar logs
```bash
sudo pm2 logs paulo-cell
```

### Testar a aplicação
Acesse `https://seu-dominio.com` em um navegador para verificar se a aplicação está funcionando corretamente.

## 7. Manutenção e Atualizações

### Atualizar a aplicação
```bash
cd /var/www/paulo-cell
sudo git pull
sudo npm install
sudo npm run build
sudo pm2 restart paulo-cell
```

### Backup do banco de dados
```bash
# Criar diretório para backups
sudo mkdir -p /var/backups/mongodb

# Realizar backup
sudo mongodump --uri="mongodb://paulocellApp:outra_senha_segura_aqui@localhost:27017/paulocell" --out=/var/backups/mongodb/$(date +"%Y-%m-%d")

# Compactar backup
sudo tar -zcvf /var/backups/mongodb/paulo-cell-$(date +"%Y-%m-%d").tar.gz /var/backups/mongodb/$(date +"%Y-%m-%d")
```

## Solução de Problemas Comuns

### Aplicação não inicia
- Verifique os logs: `sudo pm2 logs paulo-cell`
- Verifique as variáveis de ambiente: `cat .env`
- Verifique a conectividade com o MongoDB: `mongosh mongodb://paulocellApp:senha@localhost:27017/paulocell`

### Erro de conexão com o MongoDB
- Verifique se o serviço está rodando: `sudo systemctl status mongod`
- Verifique as credenciais: `mongosh admin -u adminUser -p senha`
- Verifique as permissões do usuário da aplicação

### Problemas com o Nginx
- Verifique a sintaxe da configuração: `sudo nginx -t`
- Verifique os logs: `sudo tail -f /var/log/nginx/error.log`

## Referências e Recursos Adicionais

- [Documentação do MongoDB](https://docs.mongodb.com/)
- [Documentação do PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Documentação do Nginx](https://nginx.org/en/docs/)
- [Segurança para servidores MongoDB em produção](https://docs.mongodb.com/manual/administration/security-checklist/) 