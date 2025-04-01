import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { useServerData } from '../hooks/useServerData';
import { AuthContext } from '../contexts/AuthContext';
import { useContext } from 'react';

interface ServiceFormProps {
  isEdit?: boolean;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ isEdit = false }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { data: customers, loading: loadingCustomers } = useServerData('customers');
  const { data: devices, loading: loadingDevices } = useServerData('devices');
  const { data: services, loading: loadingServices, saveItem, getItemById } = useServerData('services');

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerDevices, setCustomerDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [initialDiagnosis, setInitialDiagnosis] = useState<string>('');
  const [status, setStatus] = useState<string>('pendente');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Efeito para carregar dados de edição se for modo de edição
  useEffect(() => {
    if (isEdit && id && !loadingServices) {
      const service = getItemById(id);
      
      if (service) {
        // Preencher o formulário com os dados do serviço
        setSelectedCustomer(service.customerId || '');
        setSelectedDevice(service.deviceId || '');
        setProblemDescription(service.problemDescription || '');
        setInitialDiagnosis(service.initialDiagnosis || '');
        setStatus(service.status || 'pendente');
        setEstimatedCost(service.estimatedCost?.toString() || '');
      } else {
        toast.error('Serviço não encontrado');
        navigate('/services');
      }
    }
  }, [id, isEdit, loadingServices, getItemById, navigate]);

  // Efeito para filtrar dispositivos do cliente selecionado
  useEffect(() => {
    if (selectedCustomer && !loadingDevices) {
      const filteredDevices = devices.filter(
        (device) => device.customerId === selectedCustomer
      );
      setCustomerDevices(filteredDevices);
      
      // Se for modo de edição e já temos um dispositivo selecionado, verificamos
      // se ele pertence ao cliente selecionado
      if (isEdit && selectedDevice) {
        const deviceExists = filteredDevices.some(
          (device) => device.id === selectedDevice
        );
        
        if (!deviceExists) {
          setSelectedDevice('');
        }
      }
    } else {
      setCustomerDevices([]);
    }
  }, [selectedCustomer, devices, loadingDevices, isEdit, selectedDevice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !selectedDevice || !problemDescription) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setIsLoading(true);
      
      const now = new Date();
      const technicianName = user?.name || 'Técnico não identificado';
      
      // Formatar para data brasileira
      const dateFormatted = now.toLocaleDateString('pt-BR');
      const timeFormatted = now.toLocaleTimeString('pt-BR');
      
      // Dados básicos do serviço
      const serviceData = {
        id: isEdit ? id : uuidv4(),
        customerId: selectedCustomer,
        deviceId: selectedDevice,
        problemDescription,
        initialDiagnosis,
        status,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
        createdAt: isEdit ? undefined : now.toISOString(),
        updatedAt: now.toISOString(),
        technicianId: user?.id || 'unknown',
        technicianName,
        updates: isEdit ? undefined : [
          {
            date: dateFormatted,
            time: timeFormatted,
            message: 'Serviço registrado no sistema.',
            technicianId: user?.id || 'unknown',
            technicianName
          }
        ]
      };
      
      // Salvar usando o hook useServerData
      const success = await saveItem(serviceData);
      
      if (success) {
        toast.success(`Serviço ${isEdit ? 'atualizado' : 'registrado'} com sucesso!`);
        navigate(`/services/${serviceData.id}`);
      } else {
        throw new Error('Falha ao salvar o serviço');
      }
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      toast.error(`Erro ao ${isEdit ? 'atualizar' : 'registrar'} serviço: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingCustomers || loadingDevices || loadingServices) {
    return <div className="p-4 text-center">Carregando dados...</div>;
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">
        {isEdit ? 'Editar Serviço' : 'Novo Serviço'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* Cliente */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="customer">
            Cliente *
          </label>
          <select
            id="customer"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            required
            disabled={isEdit}
          >
            <option value="">Selecione um cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Dispositivo */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="device">
            Dispositivo *
          </label>
          <select
            id="device"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            required
            disabled={!selectedCustomer || isEdit}
          >
            <option value="">Selecione um dispositivo</option>
            {customerDevices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.brand} {device.model} ({device.serialNumber || 'S/N não informado'})
              </option>
            ))}
          </select>
          
          {selectedCustomer && customerDevices.length === 0 && (
            <p className="text-sm text-red-500 mt-1">
              Este cliente não possui dispositivos cadastrados.{' '}
              <button
                type="button"
                className="text-blue-500 underline"
                onClick={() => navigate(`/customers/${selectedCustomer}/devices/new`)}
              >
                Cadastrar dispositivo
              </button>
            </p>
          )}
        </div>

        {/* Descrição do problema */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="problemDescription">
            Descrição do problema *
          </label>
          <textarea
            id="problemDescription"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            rows={3}
            required
          />
        </div>

        {/* Diagnóstico inicial */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="initialDiagnosis">
            Diagnóstico inicial
          </label>
          <textarea
            id="initialDiagnosis"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={initialDiagnosis}
            onChange={(e) => setInitialDiagnosis(e.target.value)}
            rows={3}
          />
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pendente">Pendente</option>
            <option value="em_analise">Em análise</option>
            <option value="orcamento">Orçamento enviado</option>
            <option value="aprovado">Aprovado pelo cliente</option>
            <option value="em_reparo">Em reparo</option>
            <option value="concluido">Concluído</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {/* Custo estimado */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="estimatedCost">
            Custo estimado (R$)
          </label>
          <input
            id="estimatedCost"
            type="number"
            step="0.01"
            min="0"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 mr-2"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm; 