# Comandos para Atualizar o Projeto Paulo Cell na Hostinger

Este guia contém os comandos necessários para atualizar o projeto Paulo Cell na Hostinger através do terminal do navegador.

## Passos para Atualização

### 1. Acesse o Terminal da Hostinger

1. Faça login no painel de controle da Hostinger
2. Vá para a seção de Terminal/SSH

### 2. Execute os Comandos de Atualização

```bash
# 1. Navegue até o diretório do projeto
cd /var/www/paulocell

# 2. Verifique o status atual do repositório
git status

# 3. Caso tenha alterações locais que deseja descartar (opcional)
git reset --hard

# 4. Atualize o código do repositório GitHub
git pull

# 5. Instale as dependências (caso haja novas)
npm install

# 6. Construa o projeto (se necessário)
npm run build

# 7. Reinicie a aplicação com PM2
pm2 restart paulocell

# 8. Verifique se a aplicação está rodando corretamente
pm2 status
```

### 3. Verificação e Monitoramento

```bash
# Verificar os logs para confirmar que não há erros
pm2 logs paulocell

# Monitorar a aplicação em tempo real
pm2 monit

# Verificar o uso de recursos
pm2 list
```

## Comandos Adicionais Úteis

```bash
# Salvar a configuração atual do PM2 (após alterações)
pm2 save

# Configurar o PM2 para iniciar automaticamente após reinicialização do servidor
pm2 startup

# Verificar a versão atual do código
git log -1 --pretty=format:"%h - %an, %ar : %s"
```

## Solução de Problemas

Se encontrar problemas durante a atualização:

```bash
# Verificar erros nos logs do PM2
pm2 logs paulocell

# Reiniciar completamente o PM2 (use apenas se necessário)
pm2 delete paulocell
pm2 start server.js --name paulocell
pm2 save

# Verificar o status do serviço Node.js
systemctl status node
```

## Observações Importantes

- O repositório está configurado para: https://github.com/Nomade-PJ/paulocell-10
- O sistema utiliza PM2 para gerenciar o processo Node.js
- O diretório padrão da aplicação é `/var/www/paulocell`
- O serviço é nomeado como "paulocell" no PM2

Este guia assume que o projeto já está configurado e rodando no servidor, e você apenas precisa atualizá-lo com as últimas alterações do GitHub.