/**
 * Utilitários para formatação de data e hora no padrão brasileiro
 */

/**
 * Formata uma data para o formato brasileiro (DD/MM/AAAA)
 * @param date - Data para formatar (string ou objeto Date)
 * @returns String formatada no padrão brasileiro
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('pt-BR');
  } catch (e) {
    return String(date);
  }
};

/**
 * Formata uma hora para o formato brasileiro (HH:MM)
 * @param date - Data para extrair a hora (string ou objeto Date)
 * @returns String formatada como hora no padrão brasileiro
 */
export const formatTime = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return String(date);
  }
};

/**
 * Formata data e hora para o formato brasileiro
 * @param date - Data para formatar (string ou objeto Date)
 * @returns Objeto com data e hora formatadas
 */
export const formatDateTime = (date: Date | string): { date: string, time: string } => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return {
    date: formatDate(dateObj),
    time: formatTime(dateObj)
  };
};

/**
 * Converte uma string de data de qualquer formato para um objeto Date
 * @param dateString - String de data em qualquer formato
 * @returns Objeto Date ou null se inválido
 */
export const parseAnyDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    // Se for no formato ISO (YYYY-MM-DD)
    if (dateString.includes('-')) {
      return new Date(dateString);
    }
    
    // Se for no formato brasileiro (DD/MM/AAAA)
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    
    // Tenta converter diretamente
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error("Erro ao converter data:", e);
    return null;
  }
}; 