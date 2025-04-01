import React, { useState, useEffect, useContext } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeftIcon, PenIcon, TrashIcon, ClockIcon, ActivityIcon, CheckCircleIcon, PackageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useServerData } from '@/hooks/useServerData';
import { AuthContext } from '@/contexts/AuthContext';

/*
 * Componente convertido para usar o hook useServerData em vez de localStorage.
 * Há possíveis erros de linter a serem corrigidos relacionados ao AuthContext
 * e às propriedades do tipo em useServerData.
 */

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateText, setUpdateText] = useState('');
  
  // Usar o hook useServerData para gerenciar os dados
  const { 
    data: services,
    loading: loadingServices,
    error: servicesError,
    getItemById,
    saveItem: saveService,
    removeItem: removeService
  } = useServerData('services');
  
  // Carregar dados do servidor
  useEffect(() => {
    const loadServiceData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          toast.error("ID do serviço não especificado");
          navigate('/services');
          return;
        }
        
        // Carregar o serviço usando getItemById
        const serviceData = await getItemById(id);
        
        if (serviceData) {
          // Verificar se o serviço deve ser marcado como concluído automaticamente
          let updatedService = { ...serviceData };
          
          if (
            serviceData.estimatedCompletion && 
            serviceData.status !== 'completed' && 
            serviceData.status !== 'delivered'
          ) {
            const currentDate = new Date();
            const estimatedDate = new Date(serviceData.estimatedCompletion);
            
            // Se a data atual for posterior à data estimada, atualizar para concluído
            if (currentDate > estimatedDate) {
              updatedService = { ...serviceData, status: 'completed' };
              
              // Atualiza o serviço no servidor
              await saveService(updatedService);
              
              toast.info("O serviço foi marcado como concluído pois a data estimada foi ultrapassada.");
            }
          }
          
          setService(updatedService);
        } else {
          toast.error("Serviço não encontrado.");
        }
      } catch (error) {
        console.error('Error loading service data:', error);
        toast.error("Ocorreu um erro ao carregar os dados do serviço.");
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      loadServiceData();
    }
  }, [id, navigate, getItemById, saveService, user]);
  
  // Exibir erro se existir
  useEffect(() => {
    if (servicesError) {
      toast.error(`Erro ao carregar serviços: ${servicesError.message}`);
    }
  }, [servicesError]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!service) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <h2 className="text-2xl font-bold mb-4">Serviço não encontrado</h2>
          <Button onClick={() => navigate('/services')}>Voltar para Serviços</Button>
        </div>
      </MainLayout>
    );
  }
  
  const handleDelete = () => {
    if (!id) return;
    
    removeService(id)
      .then(() => {
        toast.success(`${service.type} para ${service.customer} foi removido com sucesso.`);
        navigate('/services');
      })
      .catch(error => {
        console.error('Error deleting service:', error);
        toast.error(`Ocorreu um erro ao excluir o serviço: ${error.message}`);
      });
  };
  
  const handleStatusChange = (newStatus: string) => {
    if (!id || !service) return;
    
    const updatedService = { ...service, status: newStatus };
    
    saveService(updatedService)
      .then(() => {
        setService(updatedService);
        toast.success(`Status alterado para ${getStatusText(newStatus)}`);
      })
      .catch(error => {
        console.error('Error updating service status:', error);
        toast.error(`Ocorreu um erro ao atualizar o status: ${error.message}`);
      });
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Em espera';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-blue-500">Em espera</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-500">Em andamento</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'delivered':
        return <Badge className="bg-purple-500">Entregue</Badge>;
      default:
        return null;
    }
  };
  
  const calculateTotalParts = () => {
    if (!service || !service.parts) return 0;
    
    // Use o valor manual das peças se estiver disponível
    if (service.manualPartsTotal !== undefined && service.manualPartsTotal !== null) {
      return service.manualPartsTotal;
    }
    
    // Caso contrário, calcule o valor com base nas peças
    return service.parts.reduce((total: number, part: any) => {
      return total + ((part.price || 0) * (part.quantity || 1));
    }, 0);
  };
  
  const handleAddUpdate = () => {
    if (!updateText.trim() || !service || !id) return;
    
    try {
      // Formatar data e hora atual
      const now = new Date();
      const date = now.toLocaleDateString('pt-BR');
      const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Criar objeto de atualização
      const newUpdate = {
        date,
        time,
        message: updateText.trim(),
        user: user?.name || 'Usuário do Sistema' // Usar nome do usuário logado se disponível
      };
      
      // Adicionar atualização ao serviço atual
      const updatedService = { 
        ...service, 
        updates: service.updates && Array.isArray(service.updates) 
          ? [...service.updates, newUpdate] 
          : [newUpdate] 
      };
      
      // Salvar serviço atualizado usando useServerData
      saveService(updatedService)
        .then(() => {
          // Atualizar o estado do serviço
          setService(updatedService);
          
          // Limpar o campo de texto
          setUpdateText('');
          
          toast.success("A atualização foi registrada com sucesso.");
        })
        .catch(error => {
          console.error('Error adding update:', error);
          toast.error(`Erro ao adicionar atualização: ${error.message || 'Erro desconhecido'}`);
        });
    } catch (error: any) {
      console.error('Error adding update:', error);
      toast.error(`Erro ao adicionar a atualização: ${error.message || 'Erro desconhecido'}`);
    }
  };
  
  return (
    <MainLayout>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/services')}
            className="h-8 w-8"
          >
            <ArrowLeftIcon size={16} />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Serviço</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{service.type}</h2>
                  {getStatusBadge(service.status)}
                </div>
                <p className="text-muted-foreground">{service.device} - {service.customer}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate(`/services/edit/${service.id}`)}
                >
                  <PenIcon size={16} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleDelete}
                >
                  <TrashIcon size={16} />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h3>
                {service.customerId ? (
                  <p className="font-medium cursor-pointer hover:text-primary transition-colors" 
                    onClick={() => navigate(`/customers/${service.customerId}`)}>
                    {service.customer}
                  </p>
                ) : (
                  <p className="font-medium">
                    {service.customer}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Dispositivo</h3>
                {service.deviceId ? (
                  <p className="font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/devices/${service.deviceId}`)}>
                    {service.device}
                  </p>
                ) : (
                  <p className="font-medium">
                    {service.device}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Técnico</h3>
                <p className="font-medium">{service.technician || "Não atribuído"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Criação</h3>
                <p className="font-medium">{service.createDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Previsão de Conclusão</h3>
                <p className="font-medium">{service.estimatedCompletion}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Conclusão</h3>
                <p className="font-medium">{service.completionDate || "Não concluído"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Garantia do Consumidor</h3>
                <p className="font-medium">
                  {service.warranty 
                    ? `${service.warranty} ${parseInt(service.warranty) === 1 ? 'Mês' : 'Meses'}` 
                    : "Sem garantia"}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Observações</h3>
              <p>{service.notes}</p>
            </div>
            
            {service.parts && service.parts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Peças Utilizadas</h3>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase py-3 px-4">Peça</th>
                        <th className="text-center text-xs font-medium text-muted-foreground uppercase py-3 px-4">Quantidade</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase py-3 px-4">Preço</th>
                      </tr>
                    </thead>
                    <tbody>
                      {service.parts.map((part: any, idx: number) => (
                        <tr key={part.id || idx} className={idx < service.parts.length - 1 ? "border-b" : ""}>
                          <td className="py-3 px-4">{part.name}</td>
                          <td className="py-3 px-4 text-center">{part.quantity}</td>
                          <td className="py-3 px-4 text-right">R$ {part.price?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-t-2">
                        <td colSpan={2} className="py-3 px-4 font-medium text-right">Total de Peças:</td>
                        <td className="py-3 px-4 text-right font-bold">R$ {calculateTotalParts().toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="py-3 px-4 font-medium text-right">Mão de Obra:</td>
                        <td className="py-3 px-4 text-right font-bold">R$ {((service.price || 0) - calculateTotalParts()).toFixed(2)}</td>
                      </tr>
                      <tr className="bg-muted/60">
                        <td colSpan={2} className="py-3 px-4 font-bold text-right">Valor Total:</td>
                        <td className="py-3 px-4 text-right font-bold text-primary">R$ {(service.price || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={service.status === 'waiting' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => handleStatusChange('waiting')}
              >
                <ClockIcon size={16} className="text-blue-600" />
                <span>Em espera</span>
              </Button>
              <Button
                variant={service.status === 'in_progress' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => handleStatusChange('in_progress')}
              >
                <ActivityIcon size={16} className="text-amber-500" />
                <span>Em andamento</span>
              </Button>
              <Button
                variant={service.status === 'completed' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => handleStatusChange('completed')}
              >
                <CheckCircleIcon size={16} className="text-green-600" />
                <span>Concluído</span>
              </Button>
              <Button
                variant={service.status === 'delivered' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => handleStatusChange('delivered')}
              >
                <PackageIcon size={16} className="text-purple-600" />
                <span>Entregue</span>
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Atualizações</h2>
            
            {service.updates && service.updates.length > 0 ? (
              <div className="space-y-4">
                {service.updates.map((update: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{update.date} às {update.time}</span>
                      <span className="text-sm font-medium">{update.user}</span>
                    </div>
                    <p className="mt-1">{update.message}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma atualização registrada.</p>
            )}
            
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Adicionar Atualização</h3>
              <textarea 
                className="w-full h-24 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite uma atualização sobre o andamento do serviço..."
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
              />
              <Button 
                className="w-full" 
                onClick={handleAddUpdate}
                disabled={!updateText.trim()}
              >
                Adicionar Atualização
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default ServiceDetail;
