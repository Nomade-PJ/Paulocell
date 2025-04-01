import { formatCurrency, parseCurrency, formatPhone, formatCpf, formatCnpj, formatCpfCnpj } from '../formatUtils';

describe('formatUtils', () => {
  describe('formatCurrency', () => {
    it('formata um número para moeda brasileira', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
    });
    
    it('formata um número inteiro corretamente', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00');
    });
    
    it('formata zero corretamente', () => {
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });
  });
  
  describe('parseCurrency', () => {
    it('converte uma string de moeda para número', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
    });
    
    it('ignora símbolos e formatação', () => {
      expect(parseCurrency('R$ 1,000.50')).toBe(1000.5);
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
    });
    
    it('retorna 0 para string inválida', () => {
      expect(parseCurrency('não é um número')).toBe(0);
    });
  });
  
  describe('formatPhone', () => {
    it('formata número de celular com 11 dígitos', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });
    
    it('formata número fixo com 10 dígitos', () => {
      expect(formatPhone('1123456789')).toBe('(11) 2345-6789');
    });
    
    it('retorna o valor original se não for um formato reconhecido', () => {
      expect(formatPhone('123')).toBe('123');
    });
    
    it('retorna string vazia se entrada for vazia', () => {
      expect(formatPhone('')).toBe('');
    });
  });
  
  describe('formatCpf', () => {
    it('formata CPF corretamente', () => {
      expect(formatCpf('12345678901')).toBe('123.456.789-01');
    });
    
    it('retorna o valor original se não tiver 11 dígitos', () => {
      expect(formatCpf('1234567890')).toBe('1234567890');
    });
    
    it('retorna string vazia se entrada for vazia', () => {
      expect(formatCpf('')).toBe('');
    });
  });
  
  describe('formatCnpj', () => {
    it('formata CNPJ corretamente', () => {
      expect(formatCnpj('12345678901234')).toBe('12.345.678/9012-34');
    });
    
    it('retorna o valor original se não tiver 14 dígitos', () => {
      expect(formatCnpj('1234567890123')).toBe('1234567890123');
    });
    
    it('retorna string vazia se entrada for vazia', () => {
      expect(formatCnpj('')).toBe('');
    });
  });
  
  describe('formatCpfCnpj', () => {
    it('formata CPF se tiver 11 dígitos ou menos', () => {
      expect(formatCpfCnpj('12345678901')).toBe('123.456.789-01');
    });
    
    it('formata CNPJ se tiver mais de 11 dígitos', () => {
      expect(formatCpfCnpj('12345678901234')).toBe('12.345.678/9012-34');
    });
    
    it('remove caracteres não numéricos antes de formatar', () => {
      expect(formatCpfCnpj('123.456.789-01')).toBe('123.456.789-01');
      expect(formatCpfCnpj('12.345.678/9012-34')).toBe('12.345.678/9012-34');
    });
    
    it('retorna string vazia se entrada for vazia', () => {
      expect(formatCpfCnpj('')).toBe('');
    });
  });
}); 