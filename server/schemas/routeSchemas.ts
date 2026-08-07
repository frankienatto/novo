import { z } from 'zod';

// Shared Tenant Query Schema
export const tenantQuerySchema = z.object({
  organizationId: z.string().optional(),
  propertyId: z.string().optional()
});

// PMS Schemas
export const pmsSchemas = {
  createCategory: z.object({
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    name: z.string().min(2, 'Nome da categoria é obrigatório'),
    code: z.string().min(2, 'Código da categoria é obrigatório'),
    basePrice: z.number().positive('Preço base deve ser um valor positivo'),
    capacity: z.object({
      standardAdults: z.number().int().nonnegative(),
      maxAdults: z.number().int().positive(),
      maxChildren: z.number().int().nonnegative(),
      totalCapacity: z.number().int().positive()
    }).optional(),
    description: z.string().optional()
  }),
  createUnit: z.object({
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    categoryId: z.string().min(1, 'ID da categoria é obrigatório'),
    unitNumber: z.string().min(1, 'Número da UH é obrigatório'),
    floor: z.string().optional(),
    status: z.enum(['clean', 'dirty', 'maintenance', 'out_of_service', 'occupied']).optional()
  }),
  updateUnitStatus: z.object({
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    status: z.enum(['clean', 'dirty', 'maintenance', 'out_of_service', 'occupied'], {
      message: 'Status de UH inválido'
    })
  })
};

// Reservation Schemas
export const reservationSchemas = {
  createReservation: z.object({
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    guest: z.object({
      guestId: z.string().optional(),
      fullName: z.string().min(2, 'Nome do hóspede é obrigatório'),
      email: z.string().email('E-mail do hóspede inválido').optional().or(z.literal('')),
      phone: z.string().optional()
    }),
    categoryId: z.string().min(1, 'ID da categoria é obrigatório'),
    unitId: z.string().optional(),
    checkInDate: z.string().min(1, 'Data de check-in é obrigatória'),
    checkOutDate: z.string().min(1, 'Data de check-out é obrigatória'),
    adults: z.number().int().positive().default(1),
    children: z.number().int().nonnegative().default(0),
    totalAmount: z.number().nonnegative(),
    channel: z.enum(['direct', 'ota_aloha', 'ical', 'manual']).optional().default('direct'),
    notes: z.string().optional()
  })
};

// CRM Schemas
export const crmSchemas = {
  createGuest: z.object({
    organizationId: z.string().optional(),
    fullName: z.string().min(2, 'Nome completo do hóspede é obrigatório'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    documentNumber: z.string().optional(),
    notes: z.string().optional()
  })
};

// Housekeeping Schemas
export const housekeepingSchemas = {
  createTask: z.object({
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    unitId: z.string().min(1, 'ID da UH é obrigatório'),
    taskType: z.enum(['cleaning', 'checkout_cleaning', 'deep_cleaning', 'inspection', 'touchup']).optional().default('cleaning'),
    assignedHousekeeperId: z.string().optional(),
    assignedHousekeeperName: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
    notes: z.string().optional()
  }),
  updateTaskStatus: z.object({
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    status: z.enum(['dirty', 'assigned', 'cleaning', 'clean', 'inspection', 'available', 'cancelled'], {
      message: 'Status de governança inválido'
    }),
    assignedHousekeeperId: z.string().optional(),
    assignedHousekeeperName: z.string().optional(),
    notes: z.string().optional()
  })
};

// Maintenance Schemas
export const maintenanceSchemas = {
  createTask: z.object({
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    unitId: z.string().min(1, 'ID da UH é obrigatório'),
    unitNumber: z.string().optional(),
    reservationId: z.string().optional(),
    guestId: z.string().optional(),
    category: z.enum(['plumbing', 'electrical', 'hvac', 'furniture', 'appliances', 'structure', 'lock_key', 'general'], {
      message: 'Categoria de manutenção inválida'
    }),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
    description: z.string().min(3, 'Descrição do problema é obrigatória'),
    reportedBy: z.string().optional(),
    slaMinutes: z.number().int().positive().optional(),
    assignedTechnicianId: z.string().optional(),
    assignedTechnicianName: z.string().optional(),
    notes: z.string().optional()
  }),
  updateTaskStatus: z.object({
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    status: z.enum(['reported', 'triage', 'assigned', 'in_progress', 'waiting_parts', 'inspection', 'completed', 'closed', 'cancelled']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    category: z.enum(['plumbing', 'electrical', 'hvac', 'furniture', 'appliances', 'structure', 'lock_key', 'general']).optional(),
    assignedTechnicianId: z.string().optional(),
    assignedTechnicianName: z.string().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
    changedBy: z.string().optional()
  })
};

// AI Schemas
export const aiSchemas = {
  processChat: z.object({
    message: z.string().min(1, 'Mensagem não pode ser vazia'),
    organizationId: z.string().optional(),
    propertyId: z.string().optional(),
    sessionId: z.string().optional(),
    forcedAgentId: z.string().optional()
  })
};
