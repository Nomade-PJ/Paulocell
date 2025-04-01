/**
 * Gerenciador de Sincronização
 * 
 * Esta classe gerencia a sincronização de dados entre o armazenamento local
 * e o servidor, mantendo uma fila de operações pendentes quando offline.
 */

/**
 * Tipo para operações pendentes
 */
type PendingOperation = () => Promise<any>;

/**
 * Tipo para configurações de sincronização
 */
interface SyncConfig {
  /** Intervalo em ms para tentar sincronização automática */
  syncInterval?: number;
  /** Número máximo de tentativas para operações com falha */
  maxRetries?: number;
  /** Indicador para ativar logs detalhados */
  verbose?: boolean;
}

/**
 * Classe Singleton para gerenciar sincronização de dados
 */
export class SyncManager {
  private static instance: SyncManager;
  private pendingOperations: Map<string, Array<PendingOperation>> = new Map();
  private syncInterval: number;
  private maxRetries: number;
  private verbose: boolean;
  private retryCount: Map<string, number> = new Map();
  private autoSyncTimer: NodeJS.Timeout | null = null;
  
  /**
   * Construtor privado (Singleton)
   */
  private constructor(config: SyncConfig = {}) {
    this.syncInterval = config.syncInterval || 60000; // 1 minuto por padrão
    this.maxRetries = config.maxRetries || 3;
    this.verbose = config.verbose || false;
    
    // Configurar listeners para estado de conexão
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Iniciar sincronização automática se estiver online
    if (navigator.onLine) {
      this.startAutoSync();
    }
    
    this.log('SyncManager inicializado');
  }
  
  /**
   * Obtém a instância Singleton do SyncManager
   */
  public static getInstance(config?: SyncConfig): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(config);
    }
    return SyncManager.instance;
  }
  
  /**
   * Adiciona uma operação pendente à fila
   * @param entityType - Tipo de entidade (ex: 'customers', 'services')
   * @param operation - Função a ser executada quando online
   * @param immediate - Se true, tenta executar imediatamente se online
   */
  public addPendingOperation(
    entityType: string, 
    operation: PendingOperation,
    immediate: boolean = true
  ): void {
    if (!this.pendingOperations.has(entityType)) {
      this.pendingOperations.set(entityType, []);
      this.retryCount.set(entityType, 0);
    }
    
    this.pendingOperations.get(entityType)!.push(operation);
    this.log(`Operação adicionada para ${entityType}. Total: ${this.pendingOperations.get(entityType)!.length}`);
    
    // Se estiver online e immediate=true, tenta processar imediatamente
    if (navigator.onLine && immediate) {
      this.processPendingOperationsForEntity(entityType);
    }
  }
  
  /**
   * Processa todas as operações pendentes quando o dispositivo fica online
   */
  private handleOnline(): void {
    this.log('Conexão restabelecida. Iniciando sincronização...');
    this.startAutoSync();
    this.processPendingOperations();
  }
  
  /**
   * Manipula o evento de dispositivo ficando offline
   */
  private handleOffline(): void {
    this.log('Dispositivo offline. Sincronização pausada.');
    this.stopAutoSync();
  }
  
  /**
   * Inicia a sincronização automática periódica
   */
  private startAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }
    
    this.autoSyncTimer = setInterval(() => {
      this.log('Executando sincronização automática');
      this.processPendingOperations();
    }, this.syncInterval);
  }
  
  /**
   * Para a sincronização automática
   */
  private stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }
  
  /**
   * Processa todas as operações pendentes para todas as entidades
   */
  public async processPendingOperations(): Promise<void> {
    if (!navigator.onLine) {
      this.log('Dispositivo offline. Operações serão processadas quando online.');
      return;
    }
    
    const entityTypes = Array.from(this.pendingOperations.keys());
    this.log(`Processando operações para ${entityTypes.length} tipos de entidades`);
    
    for (const entityType of entityTypes) {
      await this.processPendingOperationsForEntity(entityType);
    }
  }
  
  /**
   * Processa operações pendentes para uma entidade específica
   */
  private async processPendingOperationsForEntity(entityType: string): Promise<void> {
    if (!navigator.onLine || !this.pendingOperations.has(entityType)) {
      return;
    }
    
    const operations = this.pendingOperations.get(entityType)!;
    if (operations.length === 0) {
      return;
    }
    
    this.log(`Processando ${operations.length} operações pendentes para ${entityType}`);
    
    // Fazer uma cópia e limpar a lista original
    const operationsCopy = [...operations];
    this.pendingOperations.set(entityType, []);
    
    for (const operation of operationsCopy) {
      try {
        await operation();
        // Resetar contagem de tentativas em caso de sucesso
        this.retryCount.set(entityType, 0);
      } catch (error) {
        console.error(`Erro ao processar operação para ${entityType}:`, error);
        
        // Incrementar contagem de tentativas
        const currentRetries = (this.retryCount.get(entityType) || 0) + 1;
        this.retryCount.set(entityType, currentRetries);
        
        if (currentRetries <= this.maxRetries) {
          // Adicionar de volta à fila para tentar novamente depois
          this.pendingOperations.get(entityType)!.push(operation);
          this.log(`Operação falhou. Tentativa ${currentRetries}/${this.maxRetries}`);
        } else {
          this.log(`Operação descartada após ${this.maxRetries} tentativas malsucedidas`);
          // Aqui poderia adicionar a operação a uma lista de "operações com falha"
          // para revisão posterior ou notificar o usuário
        }
      }
    }
  }
  
  /**
   * Retorna o número de operações pendentes
   */
  public getPendingOperationsCount(): number {
    let count = 0;
    this.pendingOperations.forEach(operations => {
      count += operations.length;
    });
    return count;
  }
  
  /**
   * Método para logging condicional
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[SyncManager] ${message}`);
    }
  }
  
  /**
   * Limpa todas as operações pendentes (cuidado!)
   */
  public clearAllPendingOperations(): void {
    this.pendingOperations.clear();
    this.retryCount.clear();
    this.log('Todas as operações pendentes foram limpas');
  }
}

/**
 * Instância Singleton exportada para uso em toda a aplicação
 */
export const syncManager = SyncManager.getInstance({
  syncInterval: 30000, // 30 segundos
  maxRetries: 5,
  verbose: true
}); 