import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { firebaseWebConfig } from './firebaseWebConfig';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseWebConfig);

// Inicializa Firestore com auto-detect de Long Polling para garantir conectividade contínua em iframes
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firebaseWebConfig.firestoreDatabaseId);
} catch {
  firestoreDb = getFirestore(app, firebaseWebConfig.firestoreDatabaseId);
}
export const db = firestoreDb;

// Silencia logs do SDK do Firestore para evitar alertas benignos de stream ociosa (idle disconnects)
try {
  setLogLevel('silent');
} catch (e) {
  console.warn("Nao foi possivel definir setLogLevel no Firestore:", e);
}
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { firebaseWebConfig };

export { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity check
async function testConnection() {
  // Concede um pequeno intervalo para que o transporte de rede e Long Polling se estabeleçam no navegador/iframe
  await new Promise((resolve) => setTimeout(resolve, 800));
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      // Se na primeira fração de segundo der offline, tenta novamente após estabilização de rede
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (retryError) {
        if (retryError instanceof Error && retryError.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
  }
}
// Operational browser data is loaded through protected backend APIs in
// staging/production. Keep this development diagnostic out of those runtimes.
if (!import.meta.env.PROD) {
  testConnection();
}
