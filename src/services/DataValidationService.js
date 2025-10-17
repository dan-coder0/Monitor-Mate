/**
 * DataValidationService - Handles data validation and sanitization
 * for production app data
 */

export class DataValidationService {
    /**
     * Validate and sanitize app data
     */
    static validateAppData(appData) {
        if (!appData || typeof appData !== 'object') {
            return null;
        }

        // Required fields
        if (!appData.packageName && !appData.bundleId) {
            return null;
        }

        const validatedApp = {
            id: appData.packageName || appData.bundleId || `app_${Date.now()}`,
            name: this.sanitizeString(appData.appName || appData.name) || 'Unknown App',
            packageName: appData.packageName || appData.bundleId,
            icon: this.validateIcon(appData.icon),
            version: this.sanitizeString(appData.versionName || appData.version) || 'Unknown',
            category: this.sanitizeString(appData.category) || 'Other',
            installDate: this.validateDate(appData.firstInstallTime || appData.installDate),
            lastUsedTimestamp: this.validateTimestamp(appData.lastTimeUsed || appData.lastUsedTimestamp),
            permissions: this.validatePermissions(appData.permissions),
            size: this.validateNumber(appData.size),
            totalTimeInForeground: this.validateNumber(appData.totalTimeInForeground) || 0,
        };

        return validatedApp;
    }

    /**
     * Validate permissions array
     */
    static validatePermissions(permissions) {
        if (!Array.isArray(permissions)) {
            return [];
        }

        return permissions
            .filter(permission => typeof permission === 'string' && permission.length > 0)
            .map(permission => permission.trim());
    }

    /**
     * Validate and sanitize string fields
     */
    static sanitizeString(value) {
        if (typeof value !== 'string') {
            return null;
        }

        return value.trim().substring(0, 200); // Limit length to prevent issues
    }

    /**
     * Validate timestamp
     */
    static validateTimestamp(timestamp) {
        if (!timestamp) {
            return null;
        }

        const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
        if (isNaN(numTimestamp) || numTimestamp < 0) {
            return null;
        }

        // Check if timestamp is reasonable (not in the future, not too old)
        const now = Date.now();
        const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
        if (numTimestamp > now || numTimestamp < oneYearAgo) {
            return null;
        }

        return numTimestamp;
    }

    /**
     * Validate date string
     */
    static validateDate(dateValue) {
        if (!dateValue) {
            return null;
        }

        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return null;
        }

        return date.toISOString();
    }

    /**
     * Validate numeric values
     */
    static validateNumber(value) {
        if (value === null || value === undefined) {
            return null;
        }

        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num) || num < 0) {
            return null;
        }

        return num;
    }

    /**
     * Validate app icon data
     */
    static validateIcon(icon) {
        if (!icon) {
            return null;
        }

        if (typeof icon === 'string') {
            // Check if it's a base64 string or URI
            if (icon.startsWith('data:image/') || icon.length > 100) {
                return icon;
            }
        }

        return null;
    }

    /**
     * Validate entire app array
     */
    static validateAppArray(apps) {
        if (!Array.isArray(apps)) {
            return [];
        }

        return apps
            .map(app => this.validateAppData(app))
            .filter(app => app !== null);
    }

    /**
     * Check if native modules are available
     */
    static checkNativeModuleAvailability(nativeModule) {
        return {
            available: !!nativeModule,
            methods: nativeModule ? Object.keys(nativeModule) : [],
            message: nativeModule
                ? 'Native module is available'
                : 'Native module not available - limited functionality',
        };
    }
}
