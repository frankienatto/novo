import { Request, Response, NextFunction } from 'express';
import { Permission, UserRole } from '../saasTypes';

/**
 * Middleware com responsabilidade única: Controle de Acesso Baseado em Permissões (RBAC).
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.saasUser;

    if (!user) {
      return res.status(401).json({
        error: 'Não Autorizado',
        message: 'Usuário não autenticado no contexto da requisição.'
      });
    }

    // Owner tem permissão irrestrita
    if (user.role === 'owner' || user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      error: 'Acesso Negado',
      message: `A permissão '${permission}' é necessária para executar esta ação.`
    });
  };
}

/**
 * Middleware de restrição por papel (Role).
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.saasUser;

    if (!user) {
      return res.status(401).json({
        error: 'Não Autorizado',
        message: 'Usuário não autenticado no contexto da requisição.'
      });
    }

    if (allowedRoles.includes(user.role)) {
      return next();
    }

    return res.status(403).json({
      error: 'Acesso Negado',
      message: `Role insuficiente. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`
    });
  };
}
