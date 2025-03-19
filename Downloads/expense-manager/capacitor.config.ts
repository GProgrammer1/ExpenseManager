import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'FinWise',
  webDir: 'www/browser',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
    },
    Keyboard: {
      resize: KeyboardResize.Body, // Options: "native", "body", "ionic", "none"
      style: KeyboardStyle.Dark, // Optional: "light" or "dark"
      resizeOnFullScreen: true
    }
  },server: {
    cleartext: true
  }
};

export default config;
