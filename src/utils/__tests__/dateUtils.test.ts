import { formatDate, formatTime, formatDateTime, parseAnyDate } from '../dateUtils';

describe('dateUtils', () => {
  // Definir uma data fixa para testar (15 de março de 2025, 14:30:45)
  const testDate = new Date(2025, 2, 15, 14, 30, 45);
  
  describe('formatDate', () => {
    it('formata uma data no padrão brasileiro', () => {
      expect(formatDate(testDate)).toBe('15/03/2025');
    });
    
    it('aceita uma string de data como entrada', () => {
      expect(formatDate('2025-03-15T14:30:45')).toBe('15/03/2025');
    });
    
    it('retorna a string original quando a entrada é inválida', () => {
      expect(formatDate('data inválida')).toBe('data inválida');
    });
  });
  
  describe('formatTime', () => {
    it('formata uma hora no padrão brasileiro', () => {
      expect(formatTime(testDate)).toBe('14:30');
    });
    
    it('aceita uma string de data como entrada', () => {
      expect(formatTime('2025-03-15T14:30:45')).toBe('14:30');
    });
    
    it('retorna a string original quando a entrada é inválida', () => {
      expect(formatTime('hora inválida')).toBe('hora inválida');
    });
  });
  
  describe('formatDateTime', () => {
    it('retorna um objeto com data e hora formatados', () => {
      const result = formatDateTime(testDate);
      expect(result).toEqual({
        date: '15/03/2025',
        time: '14:30'
      });
    });
    
    it('aceita uma string de data como entrada', () => {
      const result = formatDateTime('2025-03-15T14:30:45');
      expect(result).toEqual({
        date: '15/03/2025',
        time: '14:30'
      });
    });
  });
  
  describe('parseAnyDate', () => {
    it('converte data no formato ISO', () => {
      const date = parseAnyDate('2025-03-15');
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(2); // Mês é zero-indexed (março = 2)
      expect(date?.getDate()).toBe(15);
    });
    
    it('converte data no formato brasileiro', () => {
      const date = parseAnyDate('15/03/2025');
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(2); // Mês é zero-indexed (março = 2)
      expect(date?.getDate()).toBe(15);
    });
    
    it('retorna null para uma string vazia', () => {
      expect(parseAnyDate('')).toBeNull();
    });
    
    it('retorna null para uma data inválida', () => {
      expect(parseAnyDate('data inválida')).toBeNull();
    });
  });
}); 