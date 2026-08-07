import { Request, Response, NextFunction } from 'express';
import { SaaSUser } from '../saasTypes';
import { organizationRepository } from '../organizationRepository';

declare global {
  namespace Express {
    interface Request {
      saasUser?: SaaSUser;
    }
  }
}

/**
 * Middleware com responsabilidade única: Autenticação do Usuário.
 * Extrai o ID do usuário dos headers `x-user-id` ou `authorization`.
 * Em desenvolvimento, caso não informado, injeta o proprietário dev padrão.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.headers['authorization']?.replace('Bearer ', ''));

    if (userId) {
      const user = await organizationRepository.getUserById(userId);
      if (user && user.status === 'active') {
        req.saasUser = user;
        return next();
      }
    }

    // Em ambiente de desenvolvimento, aceita usuário dev padrão caso não fornecido
    if (process.env.NODE_ENV !== 'production') {
      const devOwner = await organizationRepository.getUserById('user_dev_owner');
      if (devOwner) {
        req.saasUser = devOwner;
        return next();
      }
    }

    return res.status(401).json({
      error: 'Não autenticado',
      message: 'Header x-user-id ou token de autenticação válido é obrigatório.'
    });
  } catch (err: any) {
    console.error('❌ [AuthMiddleware] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno de autenticação.' });
  }
}
