const { getDatabaseClient } = require('../_lib/database-config');

export default async function handler(req, res) {
  const db = getDatabaseClient();
  
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const customers = await db.customer.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(customers);
    }

    if (req.method === 'POST') {
      const customer = await db.customer.create({
        data: req.body
      });
      return res.status(201).json(customer);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de clientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}