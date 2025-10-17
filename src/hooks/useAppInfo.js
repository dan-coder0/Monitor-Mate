import { useState, useCallback, useEffect } from 'react';
import { AppDataService } from '../services/AppDataService';
import { PermissionService } from '../services/PermissionService';

export const useAppInfo = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appDataService] = useState(() => new AppDataService());

    // Initialize permissions on hook creation
    useEffect(() => {
        const initializePermissions = async () => {
            try {
                await PermissionService.checkPermissions();
            } catch (err) {
                // Failed to check initial permissions
            }
        };
        initializePermissions();
    }, []);

    // Function to get installed apps
    const getInstalledApps = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const apps = await appDataService.getInstalledApps();
            setLoading(false);
            return apps;
        } catch (err) {
            setError(err.message || 'Failed to get installed apps');
            setLoading(false);
            throw err;
        }
    }, [appDataService]);

    // Function to categorize apps by risk level
    const categorizeAppsByRisk = useCallback((apps) => {
        return appDataService.categorizeAppsByRisk(apps);
    }, [appDataService]);

    // Function to get app details
    const getAppDetails = useCallback(async (packageName) => {
        try {
            return await appDataService.getAppDetails(packageName);
        } catch (err) {
            return null;
        }
    }, [appDataService]);

    // Function to get recent apps
    const getRecentApps = useCallback((apps, limit = 5) => {
        return appDataService.getRecentApps(apps, limit);
    }, [appDataService]);

    // Function to search apps
    const searchApps = useCallback((apps, query) => {
        return appDataService.searchApps(apps, query);
    }, [appDataService]);

    // Function to get apps by category
    const getAppsByCategory = useCallback((apps, category) => {
        return appDataService.getAppsByCategory(apps, category);
    }, [appDataService]);

    // Function to get system statistics
    const getSystemStats = useCallback((apps) => {
        return appDataService.getSystemStats(apps);
    }, [appDataService]);

    // Function to request permissions
    const requestPermissions = useCallback(async () => {
        setLoading(true);
        try {
            const granted = await PermissionService.requestPermissions();
            setLoading(false);
            return granted;
        } catch (err) {
            setError('Failed to request permissions');
            setLoading(false);
            return {};
        }
    }, []);

    // Function to check usage stats permission
    const checkUsageStatsPermission = useCallback(async () => {
        try {
            return await PermissionService.checkUsageStatsPermission();
        } catch (err) {
            return false;
        }
    }, []);

    // Function to request usage stats permission
    const requestUsageStatsPermission = useCallback(async () => {
        try {
            return await PermissionService.requestUsageStatsPermission();
        } catch (err) {
            return false;
        }
    }, []);

    // Function to analyze app permissions
    const analyzeAppPermissions = useCallback((permissions) => {
        return PermissionService.getPermissionAnalysis(permissions);
    }, []);

    // Function to get permission risk info
    const getPermissionRisk = useCallback((permission) => {
        return PermissionService.PERMISSION_RISKS[permission] || {
            level: 'LOW',
            description: 'System permission',
            category: 'System',
        };
    }, []);

    return {
        loading,
        error,
        appDataService,
        getInstalledApps,
        categorizeAppsByRisk,
        getAppDetails,
        getRecentApps,
        searchApps,
        getAppsByCategory,
        getSystemStats,
        requestPermissions,
        checkUsageStatsPermission,
        requestUsageStatsPermission,
        analyzeAppPermissions,
        getPermissionRisk,
    };
};
