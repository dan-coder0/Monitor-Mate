import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { AppDataService } from '../services/AppDataService';
import { PermissionService } from '../services/PermissionService';

export const useAppInfo = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const appDataService = new AppDataService();
    const permissionService = new PermissionService();

    const getInstalledApps = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Request permissions first
            const hasPermissions = await permissionService.requestAppPermissions();
            if (!hasPermissions) {
                throw new Error('Required permissions not granted');
            }

            // Get app data based on platform
            const apps = await appDataService.getInstalledApps();
            setLoading(false);
            return apps;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            throw err;
        }
    }, []);

    // ... rest of your hook methods

    return {
        loading,
        error,
        getInstalledApps,
        categorizeAppsByRisk,
        getAppDetails,
    };
};