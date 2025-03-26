const { getDatabaseClient } = require('../_lib/database-config');

export default async function handler(req, res) {
  const db = getDatabaseClient();
  const { id } = req.query;

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
      const customer = await db.customer.findUnique({
        where: { id: parseInt(id) }
      });
      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      return res.status(200).json(customer);
    }

    if (req.method === 'PUT') {
      const customer = await db.customer.update({
        where: { id: parseInt(id) },
        data: req.body
      });
      return res.status(200).json(customer);
    }

    if (req.method === 'DELETE') {
      await db.customer.delete({
        where: { id: parseInt(id) }
      });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}