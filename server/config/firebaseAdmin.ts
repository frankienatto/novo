import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let firebaseApp: App | undefined;

export function getFirebaseAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;

  if (!projectId) {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.projectId) {
          projectId = parsed.projectId;
        }
      }
    } catch (e) {
      console.warn('⚠️ [FirebaseAdmin] Não foi possível carregar firebase-applet-config.json:', e);
    }
  }

  if (!projectId) {
    projectId = 'gen-lang-client-0115946484';
  }

  try {
    firebaseApp = initializeApp({
      projectId,
    });
    console.log(`✅ [FirebaseAdmin] Firebase Admin SDK inicializado com sucesso para o projeto: ${projectId}`);
  } catch (error) {
    console.error('❌ [FirebaseAdmin] Erro ao inicializar Firebase Admin SDK:', error);
    throw error;
  }

  return firebaseApp;
}

export function getAdminAuth(): Auth {
  const app = getFirebaseAdminApp();
  return getAuth(app);
}

export function getAdminFirestore(): Firestore {
  const app = getFirebaseAdminApp();
  let databaseId = process.env.FIRESTORE_DATABASE_ID;

  if (!databaseId) {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.firestoreDatabaseId) {
          databaseId = parsed.firestoreDatabaseId;
        }
      }
    } catch (e) {
      console.warn('⚠️ [FirebaseAdmin] Não foi possível ler databaseId:', e);
    }
  }

  if (databaseId) {
    return getFirestore(app, databaseId);
  }
  return getFirestore(app);
}
