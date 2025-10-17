import { NativeModules, Platform } from 'react-native';
const { InstalledApps } = NativeModules;
/**
 * Native Bridge Service - Handles communication with native modules
 * Provides cross-platform compatibility and error handling
 */
export class NativeBridgeService {
    static isAvailable() {
        return !!InstalledApps;
    }
    static getPlatformInfo() {
        return {
            platform: Platform.OS,
            version: Platform.Version,
            isNativeModuleAvailable: this.isAvailable(),
        };
    }
    /**
     * Get installed apps from native module
     */
    static async getInstalledApps() {
        if (!this.isAvailable()) {
            throw new Error('Native module InstalledApps not available');
        }
        try {
            const apps = await InstalledApps.getInstalledApps();
            return apps || [];
        } catch (error) {
            throw new Error(`Failed to get installed apps: ${error.message}`);
        }
    }
    /**
     * Get detailed information about a specific app
     */
    static async getAppDetails(packageName) {
        if (!this.isAvailable()) {
            throw new Error('Native module InstalledApps not available');
        }
        if (!packageName) {
            throw new Error('Package name is required');
        }
        try {
            const appDetails = await InstalledApps.getAppDetails(packageName);
            return appDetails;
        } catch (error) {
            throw new Error(`Failed to get app details: ${error.message}`);
        }
    }
    /**
     * Get network usage data for a specific app
     */
    static async getNetworkUsage(packageName) {
        if (!this.isAvailable()) {
            throw new Error('Native module InstalledApps not available');
        }
        if (!packageName) {
            throw new Error('Package name is required');
        }
        try {
            // Check if the method exists before calling it
            if (typeof InstalledApps.getNetworkUsage !== 'function') {
                return {
                    mobileRx: 0,
                    mobileTx: 0,
                    wifiRx: 0,
                    wifiTx: 0,
                    totalRx: 0,
                    totalTx: 0,
                    error: 'Method not available - rebuild needed',
                };
            }

            const usage = await InstalledApps.getNetworkUsage(packageName);
            return usage;
        } catch (error) {
            // Return default values instead of throwing, so apps can still be listed
            return {
                mobileRx: 0,
                mobileTx: 0,
                wifiRx: 0,
                wifiTx: 0,
                totalRx: 0,
                totalTx: 0,
                error: error.message,
            };
        }
    }
    /**
     * Get network usage for all apps (Android only)
     */
    static async getAllAppsNetworkUsage() {
        if (!this.isAvailable()) {
            throw new Error('Native module InstalledApps not available');
        }
        if (Platform.OS !== 'android') {
            return [];
        }
        try {
            const usage = await InstalledApps.getAllAppsNetworkUsage();
            return usage || [];
        } catch (error) {
            return [];
        }
    }
    /**
     * Check if usage stats permission is granted (Android only)
     */
    static async hasUsageStatsPermission() {
        if (!this.isAvailable()) {
            return false;
        }
        try {
            const hasPermission = await InstalledApps.hasUsageStatsPermission();
            return hasPermission;
        } catch (error) {
            return false;
        }
    }
    /**
     * Request usage stats permission (Android only)
     */
    static async requestUsageStatsPermission() {
        if (!this.isAvailable()) {
            throw new Error('Native module InstalledApps not available');
        }
        if (Platform.OS !== 'android') {
            return false;
        }
        try {
            const result = await InstalledApps.requestUsageStatsPermission();
            return result;
        } catch (error) {
            throw new Error(`Failed to request usage stats permission: ${error.message}`);
        }
    }
    /**
     * Format network usage data for display
     */
    static formatNetworkUsage(usage) {
        if (!usage || typeof usage !== 'object') {
            return {
                mobile: { rx: '0 B', tx: '0 B' },
                wifi: { rx: '0 B', tx: '0 B' },
                total: { rx: '0 B', tx: '0 B' },
            };
        }
        const formatBytes = (bytes) => {
            if (bytes === 0) {
                return '0 B';
            }
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        return {
            mobile: {
                rx: formatBytes(usage.mobileRx || 0),
                tx: formatBytes(usage.mobileTx || 0),
            },
            wifi: {
                rx: formatBytes(usage.wifiRx || 0),
                tx: formatBytes(usage.wifiTx || 0),
            },
            total: {
                rx: formatBytes((usage.mobileRx || 0) + (usage.wifiRx || 0)),
                tx: formatBytes((usage.mobileTx || 0) + (usage.wifiTx || 0)),
            },
        };
    }
    /**
     * Get diagnostic information about the native module
     */
    static getDiagnosticInfo() {
        const info = {
            isNativeModuleAvailable: this.isAvailable(),
            platform: Platform.OS,
            platformVersion: Platform.Version,
            availableMethods: [],
        };
        if (this.isAvailable()) {
            // List available methods
            const methods = Object.keys(InstalledApps).filter(key =>
                typeof InstalledApps[key] === 'function'
            );
            info.availableMethods = methods;
        }
        return info;
    }
    /**
     * Test native module connectivity
     */
    static async testConnectivity() {
        const results = {
            moduleAvailable: this.isAvailable(),
            methods: {},
        };
        if (!this.isAvailable()) {
            return results;
        }
        // Test each method
        const testMethods = [
            'hasUsageStatsPermission',
            'getInstalledApps',
        ];
        for (const method of testMethods) {
            try {
                if (method === 'hasUsageStatsPermission') {
                    const result = await this.hasUsageStatsPermission();
                    results.methods[method] = { success: true, result };
                } else if (method === 'getInstalledApps') {
                    const result = await this.getInstalledApps();
                    results.methods[method] = {
                        success: true,
                        result: `Retrieved ${result.length} apps`,
                    };
                }
            } catch (error) {
                results.methods[method] = {
                    success: false,
                    error: error.message,
                };
            }
        }
        return results;
    }
    /**
     * Enhanced app data processing with network usage
     */
    static async enhanceAppWithNetworkUsage(app) {
        if (!app.packageName) {
            return app;
        }
        try {
            const networkUsage = await this.getNetworkUsage(app.packageName);
            const formattedUsage = this.formatNetworkUsage(networkUsage);
            return {
                ...app,
                networkUsage,
                formattedNetworkUsage: formattedUsage,
                dataUsage: {
                    total: (networkUsage.totalRx || 0) + (networkUsage.totalTx || 0),
                    mobile: (networkUsage.mobileRx || 0) + (networkUsage.mobileTx || 0),
                    wifi: (networkUsage.wifiRx || 0) + (networkUsage.wifiTx || 0),
                    sent: (networkUsage.mobileTx || 0) + (networkUsage.wifiTx || 0),
                    received: (networkUsage.mobileRx || 0) + (networkUsage.wifiRx || 0),
                },
            };
        } catch (error) {
            return app;
        }
    }
}
