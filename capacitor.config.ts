import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fc9bf4c25143427083ecc7de4b1ed612',
  appName: 'bayareacleaningpros',
  webDir: 'dist',
  server: {
    url: 'https://fc9bf4c2-5143-4270-83ec-c7de4b1ed612.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;