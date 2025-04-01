import { useState, useCallback, useEffect } from 'react';

/**
 * Tipo para representar erros de campos de formulário
 */
type FormErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Interface que define o retorno do hook useForm
 */
interface UseFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  setFieldError: (field: keyof T, error?: string) => void;
  reset: (newValues?: Partial<T>) => void;
  isValid: boolean;
  isDirty: boolean;
  resetField: (field: keyof T) => void;
}

/**
 * Hook personalizado para gerenciar estados e validação de formulários
 * @param initialValues - Valores iniciais do formulário
 * @param validate - Função opcional para validação de campos
 * @returns Objeto com valores, erros, métodos para manipulação de formulários
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => FormErrors<T>
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [initialFormValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  /**
   * Valida o formulário usando a função de validação fornecida
   */
  const validateForm = useCallback(() => {
    if (!validate) return {};
    return validate(values);
  }, [values, validate]);

  /**
   * Manipulador de mudanças para campos de formulário
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;

    // Tratamento especial para diferentes tipos de input
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setValues(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  /**
   * Define o valor de um campo programaticamente
   */
  const setFieldValue = (field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Define o estado "touched" de um campo
   */
  const setFieldTouched = (field: keyof T, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched
    }));
  };

  /**
   * Define um erro para um campo específico
   */
  const setFieldError = (field: keyof T, error?: string) => {
    setErrors(prev => {
      if (!error) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      
      return {
        ...prev,
        [field]: error
      };
    });
  };

  /**
   * Reseta o formulário para os valores iniciais ou novos valores
   */
  const reset = (newValues: Partial<T> = {}) => {
    setValues({ ...initialFormValues, ...newValues });
    setErrors({});
    setTouched({});
  };
  
  /**
   * Reseta um campo específico para seu valor inicial
   */
  const resetField = (field: keyof T) => {
    setFieldValue(field, initialFormValues[field]);
    
    // Remover erros e estado touched para o campo
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
    
    const newTouched = { ...touched };
    delete newTouched[field];
    setTouched(newTouched);
  };

  // Validar formulário quando valores ou campos tocados mudam
  useEffect(() => {
    if (validate) {
      const newErrors = validateForm();
      setErrors(newErrors);
    }
  }, [values, validateForm]);

  // Determinar se o formulário é válido (sem erros)
  const isValid = Object.keys(errors).length === 0;
  
  // Determinar se o formulário foi modificado
  const isDirty = Object.keys(values).some(key => 
    values[key] !== initialFormValues[key as keyof T]
  );

  return {
    values,
    errors,
    touched,
    handleChange,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    reset,
    isValid,
    isDirty,
    resetField
  };
} 