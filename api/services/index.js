import { verifyAuthHeader } from '../_lib/auth';
import prisma from '../_lib/prisma-client';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Lidar com requisição OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verificar autenticação
    const user = verifyAuthHeader(req);
    
    // Rota GET - Listar serviços
    if (req.method === 'GET') {
      // Extrair parâmetros de filtro
      const { status, clientName, page = 1, limit = 10 } = req.query;
      
      // Construir condições de filtro
      const where = {};
      if (status) where.status = status;
      if (clientName) where.clientName = { contains: clientName };
      
      // Calcular paginação
      const skip = (page - 1) * Number(limit);
      
      // Consultar serviços com paginação
      const services = await prisma.service.findMany({
        where,
        include: {
          serviceItems: true
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Contar o total de registros para paginação
      const total = await prisma.service.count({ where });
      
      return res.status(200).json({
        success: true,
        data: services,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    }
    
    // Rota POST - Criar serviço
    if (req.method === 'POST') {
      const { description, clientName, clientPhone, status, serviceItems } = req.body;
      
      // Validar campos obrigatórios
      if (!description || !clientName) {
        return res.status(400).json({
          success: false,
          message: 'Descrição e nome do cliente são obrigatórios'
        });
      }
      
      // Calcular preço total se houver itens
      let totalPrice = 0;
      if (serviceItems && serviceItems.length > 0) {
        totalPrice = serviceItems.reduce((total, item) => (
          total + (item.price * (item.quantity || 1))
        ), 0);
      }
      
      // Criar serviço com itens relacionados
      const newService = await prisma.service.create({
        data: {
          description,
          clientName,
          clientPhone,
          status: status || 'pending',
          totalPrice,
          serviceItems: {
            create: serviceItems || []
          }
        },
        include: {
          serviceItems: true
        }
      });
      
      return res.status(201).json({
        success: true,
        data: newService,
        message: 'Serviço criado com sucesso'
      });
    }
    
    // Método não permitido
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição de serviços:', error);
    
    // Erro de autenticação
    if (error.message === 'Token não fornecido ou inválido' || error.message === 'Token inválido ou expirado') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    // Outros erros
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
} 