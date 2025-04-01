# Guia de Utilização das Bibliotecas de Utilitários

Este guia documenta as bibliotecas de utilitários e hooks personalizados criados para o projeto Paulo Cell, abordando como e quando usá-los para garantir consistência e reduzir duplicação de código.

## Índice

1. [Utilitários de Data e Hora](#utilitários-de-data-e-hora)
2. [Utilitários de Formatação](#utilitários-de-formatação)
3. [Componentes de UI Reutilizáveis](#componentes-de-ui-reutilizáveis)
4. [Hooks Personalizados](#hooks-personalizados)
5. [Gerenciamento de Sincronização](#gerenciamento-de-sincronização)
6. [Exemplos de Uso](#exemplos-de-uso)

## Utilitários de Data e Hora

**Arquivo**: `src/utils/dateUtils.ts`

Oferece funções para formatação e manipulação de datas no padrão brasileiro.

### Funções Disponíveis

#### `formatDate(date: Date | string): string`

Formata uma data para o padrão brasileiro (DD/MM/AAAA).

```typescript
import { formatDate } from '@/utils/dateUtils';

const hoje = new Date();
const dataFormatada = formatDate(hoje); // Exemplo: "31/03/2025"

// Também aceita strings de data
const dataString = formatDate('2025-03-31'); // "31/03/2025"
```

#### `formatTime(date: Date | string): string`

Formata a hora de uma data para o padrão brasileiro (HH:MM).

```typescript
import { formatTime } from '@/utils/dateUtils';

const agora = new Date();
const horaFormatada = formatTime(agora); // Exemplo: "14:30"
```

#### `formatDateTime(date: Date | string): { date: string, time: string }`

Retorna um objeto com a data e hora formatadas.

```typescript
import { formatDateTime } from '@/utils/dateUtils';

const agora = new Date();
const { date, time } = formatDateTime(agora);
// date: "31/03/2025", time: "14:30"
```

#### `parseAnyDate(dateString: string): Date | null`

Converte uma string de data em diversos formatos para um objeto Date.

```typescript
import { parseAnyDate } from '@/utils/dateUtils';

// Formato brasileiro
const data1 = parseAnyDate('31/03/2025'); // Date object

// Formato ISO
const data2 = parseAnyDate('2025-03-31'); // Date object

// Formato inválido
const dataInvalida = parseAnyDate('não é uma data'); // null
```

## Utilitários de Formatação

**Arquivo**: `src/utils/formatUtils.ts`

Oferece funções para formatação de valores monetários, telefones e documentos.

### Funções Disponíveis

#### `formatCurrency(value: number): string`

Formata um valor numérico para moeda brasileira.

```typescript
import { formatCurrency } from '@/utils/formatUtils';

const valor = formatCurrency(1234.56); // "R$ 1.234,56"
```

#### `parseCurrency(value: string): number`

Converte uma string de moeda para valor numérico.

```typescript
import { parseCurrency } from '@/utils/formatUtils';

const valor = parseCurrency('R$ 1.234,56'); // 1234.56
```

#### `formatPhone(phone: string): string`

Formata um número de telefone para o padrão brasileiro.

```typescript
import { formatPhone } from '@/utils/formatUtils';

const celular = formatPhone('11987654321'); // "(11) 98765-4321"
const fixo = formatPhone('1123456789'); // "(11) 2345-6789"
```

#### `formatCpf(cpf: string): string`

Formata um CPF para o padrão brasileiro.

```typescript
import { formatCpf } from '@/utils/formatUtils';

const cpf = formatCpf('12345678901'); // "123.456.789-01"
```

#### `formatCnpj(cnpj: string): string`

Formata um CNPJ para o padrão brasileiro.

```typescript
import { formatCnpj } from '@/utils/formatUtils';

const cnpj = formatCnpj('12345678901234'); // "12.345.678/9012-34"
```

#### `formatCpfCnpj(value: string): string`

Formata automaticamente como CPF ou CNPJ, dependendo do número de dígitos.

```typescript
import { formatCpfCnpj } from '@/utils/formatUtils';

const cpf = formatCpfCnpj('12345678901'); // "123.456.789-01"
const cnpj = formatCpfCnpj('12345678901234'); // "12.345.678/9012-34"
```

## Componentes de UI Reutilizáveis

**Arquivo**: `src/components/ui/StatusBadge.tsx`

### StatusBadge

Componente para exibir badges de status com cores e textos padronizados.

```tsx
import { StatusBadge } from '@/components/ui/StatusBadge';

// Para uso em serviços
<StatusBadge status="pendente" type="service" />

// Para uso em documentos
<StatusBadge status="emitido" type="document" />

// Para uso em pagamentos
<StatusBadge status="pago" type="payment" />

// Com classe personalizada
<StatusBadge status="pendente" type="service" className="text-sm" />
```

## Hooks Personalizados

### useLoadingState

**Arquivo**: `src/hooks/useLoadingState.ts`

Hook para gerenciar estados de carregamento, erros e dados.

```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

function MyComponent() {
  const { 
    data, 
    loading, 
    error, 
    setData,
    startLoading,
    stopLoading,
    executeOperation
  } = useLoadingState<MyDataType>();

  // Exemplo de uso básico
  useEffect(() => {
    startLoading();
    
    fetchData()
      .then(result => setData(result))
      .catch(err => stopLoading(err.message))
      .finally(() => stopLoading());
  }, []);

  // Exemplo de uso com executeOperation
  const handleSave = async () => {
    const result = await executeOperation(
      async () => {
        // Qualquer operação assíncrona
        const response = await api.saveData(data);
        return response.data;
      },
      {
        loadingMessage: "Salvando dados...",
        successMessage: "Dados salvos com sucesso!",
        errorMessage: "Erro ao salvar dados"
      }
    );
    
    if (result) {
      // Faça algo com o resultado
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>{/* Render your UI */}</div>
  );
}
```

### useForm

**Arquivo**: `src/hooks/useForm.ts`

Hook para gerenciar estados e validação de formulários.

```tsx
import { useForm } from '@/hooks/useForm';

function MyForm() {
  // Definir valores iniciais e função de validação
  const initialValues = { name: '', email: '', age: 0 };
  
  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Nome é obrigatório';
    if (!values.email) errors.email = 'Email é obrigatório';
    if (values.age < 18) errors.age = 'Precisa ser maior de 18 anos';
    return errors;
  };

  // Usar o hook
  const {
    values,
    errors,
    touched,
    handleChange,
    setFieldValue,
    setFieldTouched,
    reset,
    isValid,
    isDirty
  } = useForm(initialValues, validate);

  // Lidar com submissão
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      // Enviar formulário
      api.saveData(values);
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={values.name}
        onChange={handleChange}
        onBlur={() => setFieldTouched('name')}
      />
      {touched.name && errors.name && <span>{errors.name}</span>}
      
      {/* Mais campos */}
      
      <button type="submit" disabled={!isValid || !isDirty}>
        Salvar
      </button>
    </form>
  );
}
```

## Gerenciamento de Sincronização

**Arquivo**: `src/services/syncManager.ts`

Classe singleton para gerenciar sincronização de dados online/offline.

```typescript
import { syncManager } from '@/services/syncManager';

// Adicionar uma operação à fila de sincronização
syncManager.addPendingOperation(
  'customers', // Tipo de entidade
  async () => {
    // Operação a ser executada quando online
    await api.saveCustomer(customerData);
  },
  true // Executar imediatamente se estiver online
);

// Obter contagem de operações pendentes
const pendingCount = syncManager.getPendingOperationsCount();

// Processar manualmente todas as operações pendentes
await syncManager.processPendingOperations();
```

## Exemplos de Uso

### Exemplo 1: Tela de Detalhes de Serviço

```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useLoadingState } from '@/hooks/useLoadingState';
import { formatDate, formatCurrency } from '@/utils/formatUtils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/services/api';

function ServiceDetails() {
  const { id } = useParams();
  const { data: service, loading, error, executeOperation } = useLoadingState();
  
  useEffect(() => {
    executeOperation(
      async () => {
        const response = await api.getService(id);
        return response.data;
      },
      {
        loadingMessage: "Carregando detalhes do serviço...",
        errorMessage: "Erro ao carregar serviço"
      }
    );
  }, [id]);
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!service) return <NotFound />;
  
  return (
    <div>
      <h1>{service.title}</h1>
      <StatusBadge status={service.status} type="service" />
      <p>Data de criação: {formatDate(service.createdAt)}</p>
      <p>Valor: {formatCurrency(service.totalValue)}</p>
      {/* Resto da UI */}
    </div>
  );
}
```

### Exemplo 2: Formulário de Cliente com Validação

```tsx
import React from 'react';
import { useForm } from '@/hooks/useForm';
import { formatPhone, formatCpfCnpj } from '@/utils/formatUtils';

function CustomerForm() {
  const initialValues = {
    name: '',
    email: '',
    phone: '',
    document: ''
  };
  
  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Nome é obrigatório';
    if (!values.phone) errors.phone = 'Telefone é obrigatório';
    // Outras validações
    return errors;
  };
  
  const { values, errors, touched, handleChange, setFieldValue } = useForm(initialValues, validate);
  
  // Formatar telefone enquanto digita
  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value.replace(/\D/g, ''));
    setFieldValue('phone', formatted);
  };
  
  // Formatar CPF/CNPJ enquanto digita
  const handleDocumentChange = (e) => {
    const formatted = formatCpfCnpj(e.target.value.replace(/\D/g, ''));
    setFieldValue('document', formatted);
  };
  
  return (
    <form>
      <div>
        <label>Nome</label>
        <input
          name="name"
          value={values.name}
          onChange={handleChange}
        />
        {touched.name && errors.name && <span>{errors.name}</span>}
      </div>
      
      <div>
        <label>Telefone</label>
        <input
          name="phone"
          value={values.phone}
          onChange={handlePhoneChange}
        />
        {touched.phone && errors.phone && <span>{errors.phone}</span>}
      </div>
      
      <div>
        <label>CPF/CNPJ</label>
        <input
          name="document"
          value={values.document}
          onChange={handleDocumentChange}
        />
        {touched.document && errors.document && <span>{errors.document}</span>}
      </div>
      
      {/* Outros campos */}
    </form>
  );
}
```

## Boas Práticas

1. **Sempre use os utilitários existentes** em vez de recriar a funcionalidade
2. **Mantenha a consistência** usando os mesmos padrões em toda a aplicação
3. **Contribua para os utilitários** se identificar uma função comum que possa ser compartilhada
4. **Teste novos utilitários** antes de adicioná-los à base de código
5. **Documente novas funções** seguindo o padrão deste guia

## Solução de Problemas

Se encontrar erros ao usar os utilitários, verifique:

1. Se as importações estão corretas
2. Se está passando os tipos corretos de parâmetros
3. Se os caminhos de importação estão corretos no seu arquivo tsconfig.json

Para problemas mais complexos, consulte os testes unitários para exemplos de uso correto. 