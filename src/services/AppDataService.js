import { Platform } from 'react-native';
import appCategorization from '../utils/appCategorization';
import { PermissionService } from './PermissionService';
import { DataValidationService } from './DataValidationService';
import { NativeBridgeService } from './NativeBridgeService';

export class AppDataService {
    constructor() {
        this.isNativeModuleAvailable = NativeBridgeService.isAvailable();
        this.platformInfo = NativeBridgeService.getPlatformInfo();
    }

    async getInstalledApps() {
        if (!this.isNativeModuleAvailable) {
            throw new Error('Native module not available. App monitoring features require platform-specific implementations.');
        }

        if (Platform.OS === 'android') {
            return await this.getAndroidApps();
        } else if (Platform.OS === 'ios') {
            return await this.getIOSApps();
        } else {
            throw new Error(`Unsupported platform: ${Platform.OS}`);
        }
    }

    async getAndroidApps() {
        try {
            const rawApps = await NativeBridgeService.getInstalledApps();
            return await this.processAppData(rawApps || []);
        } catch (error) {
            throw new Error(`Failed to retrieve Android apps: ${error.message}`);
        }
    }

    async getIOSApps() {
        try {
            const apps = await NativeBridgeService.getInstalledApps();
            return await this.processAppData(apps || []);
        } catch (error) {
            // iOS has limited app monitoring capabilities due to platform restrictions
            throw new Error(`Failed to retrieve iOS apps: ${error.message}`);
        }
    }

    async processAppData(rawApps) {
        // Validate and sanitize the raw app data
        const validatedApps = DataValidationService.validateAppArray(rawApps);

        // Process apps and enhance with network usage data
        const enhancedApps = [];
        for (const app of validatedApps) {
            try {
                // Normalize timestamp field names (Android uses lastTimeUsed, we want lastUsedTimestamp)
                if (app.lastTimeUsed && !app.lastUsedTimestamp) {
                    app.lastUsedTimestamp = app.lastTimeUsed;
                }

                // Normalize app name (Android uses appName, we want name)
                if (app.appName && !app.name) {
                    app.name = app.appName;
                }

                // Add category if not already set
                if (!app.category || app.category === 'Other') {
                    // Apply categorization
                    app.category = appCategorization.categorizeApp(app.packageName, app.name);
                }

                // Add risk analysis
                app.riskAnalysis = PermissionService.analyzeAppRisk(app.permissions);

                // Enhance with network usage data
                const enhancedApp = await NativeBridgeService.enhanceAppWithNetworkUsage(app);
                enhancedApps.push(enhancedApp);
            } catch (error) {
                // Add the app without enhancement if network data fails
                enhancedApps.push(app);
            }
        }

        return enhancedApps;
    }

    async getAppDetails(packageName) {
        if (!this.isNativeModuleAvailable) {
            throw new Error('Native module not available - cannot retrieve app details');
        }

        if (!packageName) {
            throw new Error('Package name is required to get app details');
        }

        try {
            const appDetails = await NativeBridgeService.getAppDetails(packageName);
            if (!appDetails) {
                return null;
            }

            return {
                ...appDetails,
                permissionDetails: PermissionService.getPermissionAnalysis(appDetails.permissions || []),
            };
        } catch (error) {
            throw new Error(`Failed to retrieve app details for ${packageName}: ${error.message}`);
        }
    }

    /**
     * Get apps categorized by risk level
     */
    categorizeAppsByRisk(apps) {
        const categories = {
            highRisk: [],
            mediumRisk: [],
            lowRisk: [],
            noRisk: [],
        };

        apps.forEach(app => {
            switch (app.riskAnalysis?.riskLevel) {
                case 'HIGH_RISK':
                    categories.highRisk.push(app);
                    break;
                case 'MEDIUM_RISK':
                    categories.mediumRisk.push(app);
                    break;
                case 'LOW_RISK':
                    categories.lowRisk.push(app);
                    break;
                default:
                    categories.noRisk.push(app);
            }
        });

        return categories;
    }

    /**
     * Get recently used apps
     */
    getRecentApps(apps, limit = 5) {
        const filtered = apps
            .filter(app => {
                const lastUsed = app.lastUsedTimestamp || app.lastTimeUsed || 0;
                const hasUsageData = app.totalTimeInForeground > 0 || app.launchCount > 0;
                const hasNetworkUsage = app.dataUsage && (app.dataUsage.total > 0);
                // Identify system apps to potentially exclude (more restrictive)
                const isSystemApp = app.packageName.startsWith('com.android.') &&
                                   app.packageName !== 'com.android.chrome' &&
                                   app.packageName !== 'com.android.vending';
                // Simplified and more inclusive definition of user apps
                const isLikelyUserApp = !isSystemApp &&
                    app.packageName.includes('.') &&
                    (app.appName || app.name) &&
                    (app.appName || app.name).length > 1;

                // Very permissive inclusion criteria:
                // 1. Our own app should always be included for testing
                // 2. Any app with usage data (indicates recent use)
                // 3. Any app with network usage (indicates it's been used)
                // 4. User apps (non-system) that were recently installed
                const isOurApp = app.packageName === 'com.mobilemonitor';
                const isRecentlyInstalled = app.firstInstallTime &&
                    (Date.now() - app.firstInstallTime < 30 * 24 * 60 * 60 * 1000); // 30 days

                // Include apps if ANY of these conditions are met:
                const shouldInclude = isOurApp ||
                    hasUsageData ||
                    hasNetworkUsage ||
                    (isLikelyUserApp && (lastUsed > 0 || isRecentlyInstalled));
                return shouldInclude;
            })
            .sort((a, b) => {
                // Enhanced sorting with multiple criteria
                const aLastUsed = a.lastUsedTimestamp || a.lastTimeUsed || 0;
                const bLastUsed = b.lastUsedTimestamp || b.lastTimeUsed || 0;
                const aUsageScore = (a.totalTimeInForeground || 0) + (a.launchCount || 0) * 1000;
                const bUsageScore = (b.totalTimeInForeground || 0) + (b.launchCount || 0) * 1000;
                const aNetworkScore = (a.dataUsage?.total || 0);
                const bNetworkScore = (b.dataUsage?.total || 0);
                // Our app gets priority for testing
                if (a.packageName === 'com.mobilemonitor') {
                    return -1;
                }
                if (b.packageName === 'com.mobilemonitor') {
                    return 1;
                }
                // Primary sort: by last used time (if available)
                if (aLastUsed !== bLastUsed) {
                    return bLastUsed - aLastUsed;
                }
                // Secondary sort: by network usage (indicates recent activity)
                if (aNetworkScore !== bNetworkScore) {
                    return bNetworkScore - aNetworkScore;
                }
                // Tertiary sort: by usage score
                return bUsageScore - aUsageScore;
            })
            .slice(0, limit);
        return filtered;
    }

    /**
     * Search apps by name or package name
     */
    searchApps(apps, query) {
        if (!query) {
            return apps;
        }

        const lowercaseQuery = query.toLowerCase();
        return apps.filter(app =>
            app.name.toLowerCase().includes(lowercaseQuery) ||
            app.packageName.toLowerCase().includes(lowercaseQuery)
        );
    }

    /**
     * Get apps by category
     */
    getAppsByCategory(apps, category) {
        return apps.filter(app => app.category === category);
    }

    /**
     * Get system statistics
     */
    getSystemStats(apps) {
        const totalApps = apps.length;
        const riskDistribution = this.categorizeAppsByRisk(apps);

        return {
            totalApps,
            highRiskApps: riskDistribution.highRisk.length,
            mediumRiskApps: riskDistribution.mediumRisk.length,
            lowRiskApps: riskDistribution.lowRisk.length,
            safeApps: riskDistribution.noRisk.length,
            riskPercentage: Math.round((riskDistribution.highRisk.length / totalApps) * 100) || 0,
        };
    }

    /**
     * Check if usage stats permission is granted
     */
    async checkUsageStatsPermission() {
        if (!this.isNativeModuleAvailable) {
            return false;
        }
        try {
            return await NativeBridgeService.hasUsageStatsPermission();
        } catch (error) {
            return false;
        }
    }

    /**
     * Request usage stats permission
     */
    async requestUsageStatsPermission() {
        if (!this.isNativeModuleAvailable) {
            throw new Error('Native module not available');
        }
        try {
            return await NativeBridgeService.requestUsageStatsPermission();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get service status for production monitoring
     */
    async getServiceStatus() {
        const hasUsagePermission = await this.checkUsageStatsPermission();
        return {
            isNativeModuleAvailable: this.isNativeModuleAvailable,
            platform: Platform.OS,
            nativeModuleInfo: this.nativeModuleInfo,
            serviceVersion: '1.0.0',
            hasUsageStatsPermission: hasUsagePermission,
            capabilities: {
                appListRetrieval: this.isNativeModuleAvailable,
                appDetails: this.isNativeModuleAvailable,
                permissionAnalysis: true,
                riskAssessment: true,
                dataUsageMonitoring: this.isNativeModuleAvailable,
                usageStatsMonitoring: hasUsagePermission,
                realTimeMonitoring: false,   // TODO: Implement when real-time monitoring is added
            },
            lastError: null, // TODO: Track last error for monitoring
        };
    }

    /**
     * Production-ready error handling
     */
    handleError(error, context) {
        const errorInfo = {
            message: error.message,
            context,
            timestamp: new Date().toISOString(),
            platform: Platform.OS,
            nativeModuleAvailable: this.isNativeModuleAvailable,
        };

        // TODO: In production, send to error monitoring service
        // ErrorMonitoringService.reportError(errorInfo);

        return errorInfo;
    }
}
