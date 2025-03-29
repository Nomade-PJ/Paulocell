const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal que serve o HTML
app.get('/', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'index.html');
    
    if (fs.existsSync(htmlPath)) {
      // Se o arquivo existir, envia-o
      res.sendFile(htmlPath);
    } else {
      // Caso contrário, envia uma resposta HTML gerada
      res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Paulo Cell Sistema PDV</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 500px;
              }
              h1 { color: #2c3e50; }
              p { color: #7f8c8d; margin-bottom: 2rem; }
              .btn {
                display: inline-block;
                background-color: #3498db;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                text-decoration: none;
                font-weight: bold;
              }
              .btn:hover { background-color: #2980b9; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Paulo Cell Sistema</h1>
              <p>Sistema de Gerenciamento para Assistência Técnica de Celulares</p>
              <p>Site em manutenção. Use o link abaixo para acessar o sistema.</p>
              <a href="https://paulocell-antiga.vercel.app/" class="btn">Acessar o Sistema</a>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Erro ao servir a página:', error);
    res.status(500).send('Erro ao carregar a página');
  }
});

// Middleware para tratar erros 404
app.use((req, res) => {
  res.status(404).send(`
    <h1>Página não encontrada</h1>
    <p>A página que você está procurando não existe.</p>
    <a href="/">Voltar para a página inicial</a>
  `);
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// Para o Vercel
module.exports = app; 