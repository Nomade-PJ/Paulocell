import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Definição do schema de usuário
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: { 
    type: String, 
    default: 'user',
    enum: ['user', 'admin', 'technician'] 
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Definição do schema de cliente
const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String 
  },
  phone: { 
    type: String 
  },
  address: { 
    type: String 
  },
  notes: { 
    type: String 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, {
  timestamps: true
});

// Definição do schema de serviço
const serviceSchema = new mongoose.Schema({
  description: { 
    type: String, 
    required: true 
  },
  clientName: { 
    type: String, 
    required: true 
  },
  clientPhone: { 
    type: String 
  },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'] 
  },
  totalPrice: { 
    type: Number 
  },
  completedAt: { 
    type: Date 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, {
  timestamps: true
});

// Definição do schema de item de serviço
const serviceItemSchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service',
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    default: 1 
  },
  price: { 
    type: Number, 
    required: true 
  }
}, {
  timestamps: true
});

// Definição do schema de item de inventário
const inventoryItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  quantity: { 
    type: Number, 
    default: 0 
  },
  minQuantity: { 
    type: Number, 
    default: 5 
  },
  price: { 
    type: Number 
  },
  category: { 
    type: String 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, {
  timestamps: true
});

// Definição do schema para dados do usuário
const userDataSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  store: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice composto para garantir unicidade de userId + store + key
userDataSchema.index({ userId: 1, store: 1, key: 1 }, { unique: true });

// Criar os modelos apenas se mongoose estiver pronto para evitar erros em ambiente serverless
const getModels = () => {
  if (mongoose.connection.readyState) {
    return {
      User: mongoose.models.User || mongoose.model('User', userSchema),
      Customer: mongoose.models.Customer || mongoose.model('Customer', customerSchema),
      Service: mongoose.models.Service || mongoose.model('Service', serviceSchema),
      ServiceItem: mongoose.models.ServiceItem || mongoose.model('ServiceItem', serviceItemSchema),
      InventoryItem: mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema),
      UserData: mongoose.models.UserData || mongoose.model('UserData', userDataSchema)
    };
  }
  return null;
};

export default getModels;