import developmentFirebaseConfig from '../firebase-applet-config.json';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

type PublicEnv = Record<string, string | boolean | undefined>;

const requiredPublicConfig = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function resolveFirebaseWebConfig(
  publicEnv: PublicEnv,
  developmentFallback: FirebaseWebConfig = developmentFirebaseConfig,
): FirebaseWebConfig {
  const hasCompletePublicConfig = requiredPublicConfig.every((key) => Boolean(publicEnv[key]));

  if (hasCompletePublicConfig) {
    return {
      apiKey: String(publicEnv.VITE_FIREBASE_API_KEY),
      authDomain: String(publicEnv.VITE_FIREBASE_AUTH_DOMAIN),
      projectId: String(publicEnv.VITE_FIREBASE_PROJECT_ID),
      appId: String(publicEnv.VITE_FIREBASE_APP_ID),
      storageBucket: publicEnv.VITE_FIREBASE_STORAGE_BUCKET ? String(publicEnv.VITE_FIREBASE_STORAGE_BUCKET) : undefined,
      messagingSenderId: publicEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ? String(publicEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) : undefined,
      measurementId: publicEnv.VITE_FIREBASE_MEASUREMENT_ID ? String(publicEnv.VITE_FIREBASE_MEASUREMENT_ID) : undefined,
      firestoreDatabaseId: publicEnv.VITE_FIRESTORE_DATABASE_ID ? String(publicEnv.VITE_FIRESTORE_DATABASE_ID) : undefined,
    };
  }

  if (publicEnv.PROD) {
    throw new Error('FIREBASE_WEB_CONFIG_REQUIRED');
  }

  return developmentFallback;
}

export const firebaseWebConfig = resolveFirebaseWebConfig((import.meta as any).env ?? {});
