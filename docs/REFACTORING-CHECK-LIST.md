# Lista de Verificação para Refatoração

Este documento fornece uma lista de verificação para guiar os desenvolvedores durante a refatoração dos componentes existentes no projeto Paulo Cell, ajudando a garantir que todos os novos utilitários e hooks sejam utilizados de forma consistente.

## Pré-Requisitos para Refatoração

- [ ] Ler o documento `GUIA-UTILITARIOS.md` para compreender os utilitários e hooks disponíveis
- [ ] Configurar o ambiente ESLint conforme `CONFIG-ESLINT.md` para identificação automática de oportunidades
- [ ] Identificar os componentes que mais se beneficiariam da refatoração (priorizando os mais críticos)
- [ ] Garantir que existam testes automatizados para os componentes a serem refatorados ou criá-los antes

## Checklist por Categoria

### 1. Formatação de Data e Hora

- [ ] Substituir todos os usos de `new Date().toLocaleDateString()` por `formatDate()`
- [ ] Substituir todos os usos de `new Date().toLocaleTimeString()` por `formatTime()`
- [ ] Substituir implementações de parsing de data por `parseAnyDate()`
- [ ] Verificar cálculos de manipulação de data que podem ser simplificados

### 2. Formatação de Valores

- [ ] Substituir formatação manual de moeda por `formatCurrency()`
- [ ] Substituir formatação manual de CPF/CNPJ por `formatCpf()`, `formatCnpj()` ou `formatCpfCnpj()`
- [ ] Substituir formatação manual de telefones por `formatPhone()`
- [ ] Verificar outras formatações recorrentes que podem ser adicionadas aos utilitários

### 3. Estados de Carregamento

- [ ] Identificar componentes com múltiplos estados de carregamento (`loading`, `error`, etc.)
- [ ] Substituir pela utilização do hook `useLoadingState()`
- [ ] Implementar notificações de feedback com toast usando `useLoadingState().executeOperation()`
- [ ] Refatorar operações assíncronas para usar o padrão unificado

### 4. Formulários

- [ ] Substituir implementações manuais de gerenciamento de estado de formulários pelo hook `useForm()`
- [ ] Implementar validação de campos utilizando o sistema de validação do `useForm()`
- [ ] Refatorar o tratamento de campos tocados (touched) para usar o hook
- [ ] Unificar a lógica de submissão de formulários

### 5. Componentes de UI

- [ ] Substituir badges de status personalizadas pelo componente `StatusBadge`
- [ ] Verificar possibilidade de criar novos componentes reutilizáveis para padrões visuais comuns
- [ ] Padronizar o uso de componentes de feedback (loading spinners, mensagens de erro)

### 6. Sincronização Offline

- [ ] Refatorar operações de API para utilizar o `syncManager` para filas de operações
- [ ] Implementar detecção de estado de conexão em componentes relevantes
- [ ] Garantir que mudanças offline sejam visivelmente indicadas ao usuário
- [ ] Implementar estratégias de resolução de conflitos onde necessário

## Lista de Componentes/Páginas para Refatoração

Priorize os componentes abaixo, na ordem listada:

1. [ ] **ServiceDetail.tsx** - Alto potencial para refatoração de formatação e estados de carregamento
2. [ ] **ServiceForm.tsx** - Substituir por `useForm()` e melhorar validação
3. [ ] **CustomerList.tsx** - Melhorar formatação de dados e estados de carregamento
4. [ ] **CustomerDetail.tsx** - Aplicar `useLoadingState()` e formatação de documentos
5. [ ] **OrderDetail.tsx** - Aplicar formatação de datas e status badges
6. [ ] **PaymentForm.tsx** - Utilizar `useForm()` e formatação de moeda
7. [ ] **ReportPage.tsx** - Melhorar formatação de dados e gerenciamento de estados
8. [ ] **Dashboard.tsx** - Aplicar formatação e sincronização offline

## Processo de Refatoração

Para cada componente, siga este processo:

1. **Análise**
   - [ ] Identificar todas as oportunidades de refatoração
   - [ ] Listar os utilitários e hooks aplicáveis
   - [ ] Verificar dependências e impactos da refatoração

2. **Implementação**
   - [ ] Criar branch específica para a refatoração
   - [ ] Implementar as mudanças de forma gradual e testável
   - [ ] Atualizar ou criar testes unitários

3. **Validação**
   - [ ] Executar testes unitários
   - [ ] Verificar funcionalidade em ambiente de desenvolvimento
   - [ ] Validar comportamento offline (quando aplicável)
   - [ ] Revisar código com outro desenvolvedor

4. **Documentação**
   - [ ] Atualizar comentários no código quando necessário
   - [ ] Documentar decisões importantes ou padrões implementados
   - [ ] Atualizar esta lista de verificação marcando o componente como concluído

## Exemplo de Análise de Refatoração

### ServiceDetail.tsx

**Oportunidades identificadas:**
- Formatação manual de datas (3 ocorrências)
- Formatação manual de moeda (2 ocorrências)
- Gerenciamento manual de estados loading/error (1 ocorrência)
- Badges de status customizadas (1 ocorrência)

**Utilitários e hooks aplicáveis:**
- `formatDate()` e `formatDateTime()`
- `formatCurrency()`
- `useLoadingState()`
- `StatusBadge`

**Implementação recomendada:**
```tsx
// Antes
const formattedDate = new Date(service.createdAt).toLocaleDateString('pt-BR');
const formattedPrice = `R$ ${service.price.toFixed(2).replace('.', ',')}`;

// Depois
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatUtils';

const formattedDate = formatDate(service.createdAt);
const formattedPrice = formatCurrency(service.price);
```

## Avaliação de Progresso

Mantenha um registro do progresso de refatoração:

| Componente | Status | Data | Desenvolvedor | Notas |
|------------|--------|------|--------------|-------|
| ServiceDetail.tsx | Em andamento | 15/04/2023 | Carlos | Formatação de data concluída |
| ServiceForm.tsx | Não iniciado | - | - | - |
| CustomerList.tsx | Não iniciado | - | - | - |

## Considerações Finais

- Prefira refatorações pequenas e incrementais em vez de grandes mudanças
- Mantenha a equipe informada sobre as mudanças através do sistema de controle de versão
- Document qualquer problema encontrado durante a refatoração
- Considere adicionar novos utilitários se identificar padrões recorrentes adicionais 