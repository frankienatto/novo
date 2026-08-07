import { Router, Request, Response } from 'express';
import { maintenanceService } from './maintenanceService.ts';
import { validateRequest } from '../../middlewares/validationMiddleware.ts';
import { maintenanceSchemas } from '../../schemas/routeSchemas.ts';

export const maintenanceRouter = Router();

/**
 * GET /api/maintenance/tasks
 * Listar ordens de manutenção com filtros
 */
maintenanceRouter.get('/tasks', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');

    const filters = {
      status: req.query.status as any,
      category: req.query.category as any,
      priority: req.query.priority as any,
      unitId: req.query.unitId ? String(req.query.unitId) : undefined,
      assignedTechnicianId: req.query.assignedTechnicianId ? String(req.query.assignedTechnicianId) : undefined
    };

    const tasks = await maintenanceService.listTasks(organizationId, propertyId, filters);

    return res.status(200).json({
      status: 'SUCCESS',
      count: tasks.length,
      data: tasks
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao listar ordens de manutenção.',
      message: err?.message || err
    });
  }
});

/**
 * POST /api/maintenance/tasks
 * Criar nova ordem de manutenção
 */
maintenanceRouter.post('/tasks', validateRequest({ body: maintenanceSchemas.createTask }), async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.body.organizationId || 'org_dev_default');
    const propertyId = String(req.body.propertyId || 'prop_dev_default');

    const task = await maintenanceService.createTask(organizationId, propertyId, req.body);

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Ordem de manutenção criada com sucesso e UH bloqueada para manutenção.',
      data: task
    });
  } catch (err: any) {
    return res.status(400).json({
      error: 'Erro ao criar ordem de manutenção.',
      message: err?.message || err
    });
  }
});

/**
 * PATCH /api/maintenance/tasks/:id
 * Atualizar status / transição de estado da ordem de manutenção
 */
maintenanceRouter.patch('/tasks/:id', validateRequest({ body: maintenanceSchemas.updateTaskStatus }), async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.body.organizationId || req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.body.propertyId || req.query.propertyId || 'prop_dev_default');
    const taskId = String(req.params.id);

    const updatedTask = await maintenanceService.updateTaskStatus(organizationId, propertyId, taskId, req.body);

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Ordem de manutenção '${taskId}' atualizada para o status '${updatedTask.status}'.`,
      data: updatedTask
    });
  } catch (err: any) {
    return res.status(400).json({
      error: 'Erro ao atualizar ordem de manutenção.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/maintenance/dashboard
 * Obter resumo estatístico para o dashboard de manutenção
 */
maintenanceRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');

    const summary = await maintenanceService.getDashboardSummary(organizationId, propertyId);

    return res.status(200).json({
      status: 'SUCCESS',
      data: summary
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao obter dados do dashboard de manutenção.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/maintenance/history
 * Obter histórico de alterações de uma ordem de manutenção
 */
maintenanceRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const taskId = String(req.query.taskId || '');
    if (!taskId) {
      return res.status(400).json({ error: 'O parâmetro taskId é obrigatório.' });
    }

    const history = await maintenanceService.getTaskHistory(taskId);

    return res.status(200).json({
      status: 'SUCCESS',
      count: history.length,
      data: history
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao obter histórico da ordem de manutenção.',
      message: err?.message || err
    });
  }
});
