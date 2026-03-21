import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.hidayetevin.brainspark',
    appName: 'Brain Spark',
    webDir: 'dist',
    bundledWebRuntime: false,
    server: {
        androidScheme: 'https'
    },
    plugins: {
        AdMob: {
            // Bu alanlar genellikle runtime'da doldurulsa da config'de de bulunabilir
            // Biz AdManager.ts içinde ID'leri yönettiğimiz için burayı boş bırakabiliriz
        }
    }
};

export default config;
