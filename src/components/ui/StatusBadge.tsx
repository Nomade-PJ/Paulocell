import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * Tipos de entidades que podem ter status diferentes no sistema
 */
export type StatusEntityType = 'service' | 'document' | 'payment' | 'order';

/**
 * Props para o componente StatusBadge
 */
interface StatusBadgeProps {
  /** Status atual (ex: 'waiting', 'pendente', 'concluido') */
  status: string;
  
  /** Tipo de entidade que determina o mapeamento de status para exibição */
  type?: StatusEntityType;
  
  /** Classe CSS adicional para customização */
  className?: string;
}

/**
 * Componente para exibir badges de status padronizados para diferentes entidades
 * Mapeia valores internos de status para textos amigáveis ao usuário e cores apropriadas
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type = 'service',
  className = '' 
}) => {
  // Mapear status para tipo de serviço
  if (type === 'service') {
    switch (status.toLowerCase()) {
      case 'waiting':
      case 'pendente':
      case 'em_espera':
        return <Badge className={`bg-blue-500 ${className}`}>Em espera</Badge>;
        
      case 'in_progress':
      case 'em_analise':
      case 'em_reparo':
      case 'em_andamento':
        return <Badge className={`bg-amber-500 ${className}`}>Em andamento</Badge>;
        
      case 'completed':
      case 'concluido':
      case 'finalizado':
        return <Badge className={`bg-green-500 ${className}`}>Concluído</Badge>;
        
      case 'delivered':
      case 'entregue':
        return <Badge className={`bg-purple-500 ${className}`}>Entregue</Badge>;
        
      case 'canceled':
      case 'cancelado':
        return <Badge className={`bg-red-500 ${className}`}>Cancelado</Badge>;
        
      case 'orcamento':
      case 'budget':
        return <Badge className={`bg-teal-500 ${className}`}>Orçamento</Badge>;
        
      case 'aprovado':
      case 'approved':
        return <Badge className={`bg-emerald-500 ${className}`}>Aprovado</Badge>;
        
      default:
        return <Badge className={className}>{status}</Badge>;
    }
  }
  
  // Mapear status para documentos
  if (type === 'document') {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendente':
        return <Badge className={`bg-yellow-500 ${className}`}>Pendente</Badge>;
        
      case 'emitido':
      case 'issued':
        return <Badge className={`bg-green-500 ${className}`}>Emitido</Badge>;
        
      case 'canceled':
      case 'cancelado':
        return <Badge className={`bg-red-500 ${className}`}>Cancelado</Badge>;
        
      default:
        return <Badge className={className}>{status}</Badge>;
    }
  }
  
  // Mapear status para pagamentos
  if (type === 'payment') {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendente':
        return <Badge className={`bg-yellow-500 ${className}`}>Pendente</Badge>;
        
      case 'paid':
      case 'pago':
        return <Badge className={`bg-green-500 ${className}`}>Pago</Badge>;
        
      case 'partial':
      case 'parcial':
        return <Badge className={`bg-blue-500 ${className}`}>Parcial</Badge>;
        
      case 'canceled':
      case 'cancelado':
        return <Badge className={`bg-red-500 ${className}`}>Cancelado</Badge>;
        
      case 'refunded':
      case 'reembolsado':
        return <Badge className={`bg-purple-500 ${className}`}>Reembolsado</Badge>;
        
      default:
        return <Badge className={className}>{status}</Badge>;
    }
  }
  
  // Para qualquer outro tipo, apenas exibe o status como está
  return <Badge className={className}>{status}</Badge>;
}; 