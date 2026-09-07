import { Request, Response, NextFunction } from 'express';
import { SaaSUser } from '../saasTypes';
import { organizationRepository } from '../organizationRepository';
import { getAdminAuth } from '../../../config/firebaseAdmin';

declare global {
  namespace Express {
    interface Request {
      saasUser?: SaaSUser;
    }
  }
}

/**
 * Middleware de Autenticação Segura Server-Side (Firebase Auth).
 * Exige um Firebase ID Token válido no cabeçalho Authorization: Bearer <token>.
 * Rejeita qualquer tentativa de bypass por headers arbitrários (ex: x-user-id) ou tokens falsos.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Cabeçalho Authorization no formato "Bearer <token>" é obrigatório.'
      });
    }

    const idToken = authHeader.substring(7).trim();

    if (!idToken) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Token de autenticação não fornecido.'
      });
    }

    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (authError: any) {
      // Rejeição esperada de token inválido, expirado ou forjado (HTTP 401)
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Token de autenticação inválido ou expirado.'
      });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    if (!uid) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Token inválido: UID ausente.'
      });
    }

    // Busca usuário real no repositório de dados pelo UID autenticado
    let user: SaaSUser | null = null;
    try {
      user = await organizationRepository.getUserById(uid);
      if (!user && email) {
        user = await organizationRepository.getUserByEmail(email);
      }
    } catch (dbError: any) {
      console.warn('⚠️ [AuthMiddleware] Erro ao consultar repositório de usuários:', dbError?.message || dbError);
    }

    if (user) {
      if (user.status !== 'active') {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Usuário inativo no sistema.'
        });
      }
      req.saasUser = user;
    } else {
      // Perfil básico derivado estritamente do token verificado
      const newUser: SaaSUser = {
        userId: uid,
        organizationId: (decodedToken.organizationId as string) || 'org_dev_default',
        propertyIds: Array.isArray(decodedToken.propertyIds) ? decodedToken.propertyIds : ['prop_dev_default'],
        name: decodedToken.name || email.split('@')[0] || 'Usuário Autenticado',
        email: email,
        role: (decodedToken.role as any) || 'staff',
        permissions: Array.isArray(decodedToken.permissions) ? decodedToken.permissions : ['view_dashboard'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      req.saasUser = newUser;
    }

    return next();
  } catch (err: any) {
    console.error('❌ [AuthMiddleware] Erro inesperado de autenticação:', err?.message || err);
    return res.status(500).json({ error: 'Erro interno de autenticação.' });
  }
}

