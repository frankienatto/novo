import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foresthouse.pms',
  appName: 'Forest House PMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
