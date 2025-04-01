/**
 * Utilitários para formatação de valores e strings
 */

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param value - Valor a ser formatado
 * @returns String formatada (ex: R$ 1.234,56)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

/**
 * Converte uma string de moeda para valor numérico
 * @param value - String de moeda (ex: "R$ 1.234,56")
 * @returns Valor numérico
 */
export const parseCurrency = (value: string): number => {
  // Remove formatação e converte para número
  return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
};

/**
 * Formata um número de telefone para o padrão brasileiro
 * @param phone - Número de telefone (apenas dígitos)
 * @returns String formatada (ex: (11) 98765-4321)
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove tudo que não for dígito
  const cleaned = phone.replace(/\D/g, '');
  
  // Formata de acordo com o tamanho
  if (cleaned.length === 11) {
    // Celular: (00) 00000-0000
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
  } else if (cleaned.length === 10) {
    // Fixo: (00) 0000-0000
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  return cleaned;
};

/**
 * Formata um CPF para o padrão brasileiro
 * @param cpf - CPF (apenas dígitos)
 * @returns String formatada (ex: 123.456.789-00)
 */
export const formatCpf = (cpf: string): string => {
  if (!cpf) return '';
  
  // Remove tudo que não for dígito
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return cleaned;
  
  // Formata: 000.000.000-00
  return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9, 11)}`;
};

/**
 * Formata um CNPJ para o padrão brasileiro
 * @param cnpj - CNPJ (apenas dígitos)
 * @returns String formatada (ex: 12.345.678/0001-90)
 */
export const formatCnpj = (cnpj: string): string => {
  if (!cnpj) return '';
  
  // Remove tudo que não for dígito
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return cleaned;
  
  // Formata: 00.000.000/0000-00
  return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}/${cleaned.substring(8, 12)}-${cleaned.substring(12, 14)}`;
};

/**
 * Formata um CPF ou CNPJ automaticamente
 * @param value - CPF ou CNPJ (apenas dígitos)
 * @returns String formatada de acordo com o tipo
 */
export const formatCpfCnpj = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo que não for dígito
  const cleaned = value.replace(/\D/g, '');
  
  // Se tiver mais de 11 dígitos, trata como CNPJ
  if (cleaned.length > 11) {
    return formatCnpj(cleaned);
  }
  
  // Senão, trata como CPF
  return formatCpf(cleaned);
}; 