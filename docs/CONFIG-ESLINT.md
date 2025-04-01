# Configuração do ESLint para Padronização de Código

Este documento detalha as configurações recomendadas para o ESLint no projeto Paulo Cell, com foco em incentivar o uso dos utilitários compartilhados, promover boas práticas de código e garantir consistência em toda a base de código.

## Instalação e Configuração Básica

Caso ainda não tenha o ESLint configurado no projeto, siga estes passos:

1. Instale as dependências necessárias:

```bash
npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

2. Crie um arquivo `.eslintrc.js` na raiz do projeto

## Regras Customizadas para Nossos Utilitários

Adicione as seguintes regras ao arquivo `.eslintrc.js` para incentivar o uso dos utilitários e hooks personalizados:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    // Plugin customizado (opcional)
    'custom-rules',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Regras básicas de linting
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Regras de React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Regras customizadas para nossos utilitários
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['date-fns', 'dayjs', 'moment'],
          message: "Não importe bibliotecas de data diretamente. Use os utilitários em '@/utils/dateUtils' para manter a consistência."
        },
        {
          group: ['react-hook-form'],
          message: "Para validação de formulários, use nosso hook personalizado '@/hooks/useForm'."
        }
      ]
    }],
    
    // Regras para evitar duplicação de código
    'no-duplicate-imports': 'error',
    
    // Regras para incentivar o uso de hooks e componentes personalizados
    'custom-rules/use-loading-state-hook': 'warn',
    'custom-rules/use-status-badge': 'warn',
    'custom-rules/use-format-utils': 'warn',
  },
  overrides: [
    {
      files: ['**/*.tsx', '**/*.ts'],
      rules: {
        // Regras específicas para TypeScript
      }
    }
  ]
};
```

## Plugin Personalizado (Opcional)

Para implementar regras mais específicas que incentivem o uso de nossos componentes, você pode criar um plugin ESLint personalizado.

### Estrutura do Plugin

1. Crie um diretório `eslint-plugin-custom-rules`:

```
eslint-plugin-custom-rules/
├── index.js
└── rules/
    ├── use-loading-state-hook.js
    ├── use-status-badge.js
    └── use-format-utils.js
```

2. Implemente as regras personalizadas. Exemplo para o arquivo `rules/use-format-utils.js`:

```javascript
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Incentivar o uso de utilitários de formatação',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // sem opções
  },
  create(context) {
    return {
      // Detecta padrões de formatação de data feitos manualmente
      CallExpression(node) {
        // Verifica padrões como new Date().toLocaleDateString('pt-BR')
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'toLocaleDateString' &&
          node.arguments.length > 0 &&
          node.arguments[0].value === 'pt-BR'
        ) {
          context.report({
            node,
            message: 'Use formatDate() do módulo @/utils/dateUtils em vez de toLocaleDateString',
            fix(fixer) {
              // Implementar correção automática se possível
              return fixer.replaceText(
                node,
                `formatDate(${context.getSourceCode().getText(node.callee.object)})`
              );
            },
          });
        }
        
        // Verificar outros padrões semelhantes
      },
      
      // Alertar sobre formatação manual de moeda
      Literal(node) {
        // Verifica strings com padrão de formatação de moeda R$
        if (
          typeof node.value === 'string' &&
          node.value.match(/R\$\s?[\d,.]+/)
        ) {
          context.report({
            node,
            message: 'Considere usar formatCurrency() do módulo @/utils/formatUtils para valores monetários',
          });
        }
      },
    };
  },
};
```

3. Configure o arquivo `index.js` do plugin:

```javascript
module.exports = {
  rules: {
    'use-loading-state-hook': require('./rules/use-loading-state-hook'),
    'use-status-badge': require('./rules/use-status-badge'),
    'use-format-utils': require('./rules/use-format-utils'),
  },
};
```

4. Instale o plugin localmente:

```bash
npm install --save-dev ./eslint-plugin-custom-rules
```

## Scripts do Package.json

Adicione estes scripts ao seu `package.json` para facilitar o linting:

```json
{
  "scripts": {
    "lint": "eslint 'src/**/*.{ts,tsx}'",
    "lint:fix": "eslint 'src/**/*.{ts,tsx}' --fix"
  }
}
```

## Integração com VSCode

Para melhorar a experiência de desenvolvimento, configure o VSCode para mostrar erros de linting em tempo real:

1. Instale a extensão ESLint no VSCode
2. Adicione a seguinte configuração ao seu `settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

## Exemplos de Uso

### Exemplo 1: Detectando Formatação de Data Manual

**Código problemático:**
```tsx
// Formatação manual de data (será detectada pelo linter)
const formattedDate = new Date(user.createdAt).toLocaleDateString('pt-BR');
```

**Solução sugerida pelo linter:**
```tsx
// Usando nosso utilitário de data
import { formatDate } from '@/utils/dateUtils';
const formattedDate = formatDate(user.createdAt);
```

### Exemplo 2: Incentivando o Uso do Hook useLoadingState

**Código problemático:**
```tsx
// Gerenciamento manual de estados de carregamento
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetchData()
    .then(result => setData(result))
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);
```

**Solução sugerida pelo linter:**
```tsx
// Usando nosso hook personalizado
import { useLoadingState } from '@/hooks/useLoadingState';

const { data, loading, error, executeOperation } = useLoadingState();

useEffect(() => {
  executeOperation(
    () => fetchData(),
    {
      loadingMessage: "Carregando dados...",
      errorMessage: "Erro ao carregar dados"
    }
  );
}, []);
```

## Exceções

Em alguns casos, pode ser necessário desabilitar regras específicas. Isso pode ser feito usando comentários especiais:

```tsx
// eslint-disable-next-line custom-rules/use-format-utils
const formattedValue = `R$ ${value.toFixed(2).replace('.', ',')}`;
```

No entanto, essas exceções devem ser usadas com moderação e apenas quando necessário.

## Conclusão

Estas configurações ajudarão a equipe a manter um código consistente e seguir as melhores práticas estabelecidas para o projeto Paulo Cell. A adoção dessas regras evitará duplicação de código e garantirá que os utilitários compartilhados sejam usados em toda a base de código.

Para mais informações sobre ESLint e como configurar regras personalizadas, consulte a [documentação oficial do ESLint](https://eslint.org/docs/developer-guide/working-with-rules). 