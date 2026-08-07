import { Router, Request, Response } from 'express';
import { housekeepingService } from './housekeepingService.ts';
import { CleaningStatus, InspectionStatus, TaskPriority } from './housekeepingTypes.ts';
import { validateRequest } from '../../middlewares/validationMiddleware.ts';
import { housekeepingSchemas } from '../../schemas/routeSchemas.ts';

export const housekeepingRouter = Router();

/**
 * GET /api/housekeeping/tasks
 * Listar todas as tarefas de governança com suporte a filtros multi-tenant
 */
housekeepingRouter.get('/tasks', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');
    const cleaningStatus = req.query.cleaningStatus as CleaningStatus | undefined;
    const inspectionStatus = req.query.inspectionStatus as InspectionStatus | undefined;
    const priority = req.query.priority as TaskPriority | undefined;
    const unitId = req.query.unitId as string | undefined;

    const tasks = await housekeepingService.listTasks(organizationId, propertyId, {
      cleaningStatus,
      inspectionStatus,
      priority,
      unitId
    });

    return res.status(200).json({
      status: 'SUCCESS',
      count: tasks.length,
      data: tasks
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao listar tarefas de governança.',
      message: err?.message || err
    });
  }
});

/**
 * POST /api/housekeeping/tasks
 * Criar uma nova tarefa de governança/limpeza
 */
housekeepingRouter.post('/tasks', validateRequest({ body: housekeepingSchemas.createTask }), async (req: Request, res: Response) => {
  try {
    const organizationId = (req.body.organizationId as string) || 'org_dev_default';
    const propertyId = (req.body.propertyId as string) || 'prop_dev_default';
    const { unitId, unitNumber, reservationId, guestId, priority, notes, slaMinutes, assignedStaffId, assignedStaffName } = req.body;

    if (!unitId) {
      return res.status(400).json({ error: "O campo 'unitId' é obrigatório." });
    }

    const task = await housekeepingService.createTask(organizationId, propertyId, {
      unitId,
      unitNumber,
      reservationId,
      guestId,
      priority,
      notes,
      slaMinutes,
      assignedStaffId,
      assignedStaffName
    });

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Tarefa de governança criada com sucesso.',
      data: task
    });
  } catch (err: any) {
    return res.status(400).json({
      error: 'Erro ao criar tarefa de governança.',
      message: err?.message || err
    });
  }
});

/**
 * PATCH /api/housekeeping/tasks/:id
 * Atualizar status ou atribuição de uma tarefa de governança
 */
housekeepingRouter.patch('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = String(req.params.id);
    const organizationId = String(req.body.organizationId || req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.body.propertyId || req.query.propertyId || 'prop_dev_default');

    const { cleaningStatus, inspectionStatus, priority, assignedStaffId, assignedStaffName, notes } = req.body;

    const updatedTask = await housekeepingService.updateTaskStatus(organizationId, propertyId, taskId, {
      cleaningStatus,
      inspectionStatus,
      priority,
      assignedStaffId,
      assignedStaffName,
      notes
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Tarefa de governança atualizada com sucesso.',
      data: updatedTask
    });
  } catch (err: any) {
    return res.status(400).json({
      error: 'Erro ao atualizar tarefa de governança.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/housekeeping/dashboard
 * Obter o resumo do Dashboard de Governança
 */
housekeepingRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');

    const summary = await housekeepingService.getDashboardSummary(organizationId, propertyId);

    return res.status(200).json({
      status: 'SUCCESS',
      data: summary
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao obter dashboard de governança.',
      message: err?.message || err
    });
  }
});
