import { Router, Request, Response } from 'express';
import { receptionService } from './receptionService.ts';

export const receptionRouter = Router();

/**
 * GET /api/reception/dashboard
 * Obter o resumo operacional completo e sugestões inteligentes da recepção
 */
receptionRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');

    const dashboard = await receptionService.getDashboardData(organizationId, propertyId);

    return res.status(200).json({
      status: 'SUCCESS',
      data: dashboard
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao obter o dashboard da recepção.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/reception/checkins/today
 * Listar check-ins previstos para hoje
 */
receptionRouter.get('/checkins/today', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');

    const checkins = await receptionService.getTodayCheckins(organizationId, propertyId);

    return res.status(200).json({
      status: 'SUCCESS',
      count: checkins.length,
      data: checkins
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao listar check-ins de hoje.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/reception/checkouts/today
 * Listar check-outs previstos para hoje
 */
receptionRouter.get('/checkouts/today', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');

    const checkouts = await receptionService.getTodayCheckouts(organizationId, propertyId);

    return res.status(200).json({
      status: 'SUCCESS',
      count: checkouts.length,
      data: checkouts
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao listar check-outs de hoje.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/reception/alerts
 * Listar alertas operacionais da recepção
 */
receptionRouter.get('/alerts', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');

    const alerts = await receptionService.getOperationalAlerts(organizationId, propertyId);

    return res.status(200).json({
      status: 'SUCCESS',
      count: alerts.length,
      data: alerts
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao listar alertas operacionais.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/reception/vips
 * Listar chegadas VIP previstas para hoje
 */
receptionRouter.get('/vips', async (req: Request, res: Response) => {
  try {
    const organizationId = String(req.query.organizationId || 'org_dev_default');
    const propertyId = String(req.query.propertyId || 'prop_dev_default');

    const vips = await receptionService.getVipArrivals(organizationId, propertyId);

    return res.status(200).json({
      status: 'SUCCESS',
      count: vips.length,
      data: vips
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao listar chegadas VIP de hoje.',
      message: err?.message || err
    });
  }
});
