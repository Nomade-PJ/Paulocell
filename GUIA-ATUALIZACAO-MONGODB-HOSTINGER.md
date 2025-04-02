# Guia de Atualização do Paulo Cell para MongoDB na Hostinger

Este guia detalha o processo de atualização do projeto Paulo Cell para usar o MongoDB instalado no VPS da Hostinger.

## 1. Atualizar o Repositório GitHub

### 1.1. Clone o repositório (se ainda não tiver uma cópia local)

```bash
git clone https://github.com/seu-usuario/paulocell.git
cd paulocell
```

### 1.2. Atualize o arquivo .env.production

Edite o arquivo `.env.production` para usar a nova string de conexão do MongoDB e a URL da API:

```
# Configuração do MongoDB para VPS
DB_URI=mongodb://paulocelladmin:paulocell44h@92.112.176.152:27017/paulocell
DB_NAME=paulocell
DB_TYPE=mongoose

# URL da API para o frontend
REACT_APP_API_URL=http://92.112.176.152/api
API_URL=http://92.112.176.152/api

# URL da aplicação
SITE_APP_URL=http://92.112.176.152
```

### 1.3. Confirme e envie as alterações para o GitHub

```bash
git add .env.production
git commit -m "Atualizar configuração para MongoDB na VPS"
git push origin main
```

## 2. Implantar no VPS Hostinger via Terminal do Navegador

### 2.1. Acesse o Terminal do VPS

1. Faça login no painel da Hostinger
2. Navegue até VPS > Seu Servidor > Terminal Web
3. Login com suas credenciais (normalmente como root)

### 2.2. Navegue até a pasta do seu projeto

```bash
cd /caminho/para/seu/projeto
```

### 2.3. Obtenha as últimas alterações do repositório

```bash
git pull origin main
```

### 2.4. Instale as dependências (se necessário)

```bash
npm install
```

### 2.5. Compile o projeto (se necessário)

```bash
npm run build
```

### 2.6. Reinicie o serviço

Se estiver usando PM2:

```bash
pm2 restart paulocell
```

Ou reinicie manualmente o serviço:

```bash
systemctl restart paulocell
```

## 3. Verificar a Implantação

### 3.1. Verifique o status do serviço

```bash
pm2 status
```

ou

```bash
systemctl status paulocell
```

### 3.2. Verifique os logs para confirmar a conexão com o MongoDB

```bash
pm2 logs paulocell
```

ou

```bash
journalctl -u paulocell -f
```

### 3.3. Teste a aplicação

Acesse a aplicação em seu navegador para confirmar que está funcionando corretamente com o MongoDB.

## 4. Resolução de Problemas

### 4.1. Problemas de Conexão com o MongoDB

Se encontrar problemas de conexão:

1. Verifique se o MongoDB está em execução:
   ```bash
   systemctl status mongod
   ```

2. Confirme se a porta 27017 está aberta no firewall:
   ```bash
   sudo ufw status
   ```

3. Teste a conexão diretamente:
   ```bash
   mongosh mongodb://paulocelladmin:paulocell44h@92.112.176.152:27017/paulocell
   ```

### 4.2. Problemas com a Aplicação

1. Verifique os logs da aplicação para identificar erros específicos
2. Certifique-se de que todas as dependências estão instaladas
3. Verifique se as variáveis de ambiente estão configuradas corretamente

### 4.3. Rollback (se necessário)

Se precisar reverter para a configuração anterior:

1. Restaure o arquivo `.env.production` anterior
2. Implante novamente seguindo os passos 2.3 a 2.6

## 5. Monitoramento e Manutenção

### 5.1. Backup do MongoDB

Configure backups regulares para seu banco de dados MongoDB:

```bash
# Crie um diretório para os backups
mkdir -p /var/backups/mongodb

# Crie um script de backup
echo '#!/bin/bash
mongodump --uri="mongodb://paulocelladmin:paulocell44h@92.112.176.152:27017/paulocell" --out=/var/backups/mongodb/$(date +"%Y-%m-%d")
find /var/backups/mongodb -type d -mtime +7 -exec rm -rf {} \;' > /usr/local/bin/backup-mongodb.sh

# Torne o script executável
chmod +x /usr/local/bin/backup-mongodb.sh

# Adicione ao crontab para execução diária às 2h da manhã
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-mongodb.sh") | crontab -
```

### 5.2. Monitoramento do MongoDB

Verifique regularmente o estado do MongoDB:

```bash
# Verificar status do serviço
systemctl status mongod

# Verificar uso de recursos
mongo --eval "db.serverStatus()"

# Verificar uso de disco
df -h /var/lib/mongodb
```

## Conclusão

Parabéns! Seu projeto Paulo Cell agora está configurado para usar o MongoDB na sua VPS da Hostinger. Esta configuração oferece melhor desempenho e escalabilidade para sua aplicação.

Se precisar de ajuda adicional ou tiver dúvidas sobre a manutenção do banco de dados, consulte a documentação oficial do MongoDB ou entre em contato com o suporte técnico. 