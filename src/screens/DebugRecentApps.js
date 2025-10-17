import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { NativeBridgeService } from '../services/NativeBridgeService';
/**
 * Debug screen to test recent apps functionality
 * This screen helps diagnose issues with app data retrieval and processing
 */
const DebugRecentApps = () => {
    const [rawApps, setRawApps] = useState([]);
    const [processedApps, setProcessedApps] = useState([]);
    const [recentApps, setRecentApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [diagnostics, setDiagnostics] = useState(null);
    const runDiagnostics = async () => {
        setLoading(true);
        try {
            console.log('=== Debug: Starting app diagnostics ===');
            // 1. Test native module connectivity
            const connectivity = await NativeBridgeService.testConnectivity();
            console.log('Native module connectivity:', connectivity);
            // 2. Get raw apps from native module
            const apps = await NativeBridgeService.getInstalledApps();
            console.log('Raw apps from native:', apps?.length || 0);
            setRawApps(apps || []);
            // 3. Test processing with a few sample apps
            const sampleApps = (apps || []).slice(0, 5);
            const enhanced = [];
            for (const app of sampleApps) {
                console.log('Processing app:', app.packageName || app.appName);
                const enhancedApp = await NativeBridgeService.enhanceAppWithNetworkUsage(app);
                enhanced.push(enhancedApp);
            }
            setProcessedApps(enhanced);
            // 4. Filter for recent apps
            const recent = enhanced.filter(app => {
                const lastUsed = app.lastUsedTimestamp || app.lastTimeUsed || 0;
                const hasUsage = app.totalTimeInForeground > 0 || app.launchCount > 0;
                console.log(`App ${app.appName}: lastUsed=${lastUsed}, hasUsage=${hasUsage}`);
                return lastUsed > 0 && hasUsage;
            });
            setRecentApps(recent);
            setDiagnostics({
                connectivity,
                totalApps: apps?.length || 0,
                processedApps: enhanced.length,
                recentApps: recent.length,
                hasNativeModule: NativeBridgeService.isAvailable(),
                platform: NativeBridgeService.getPlatformInfo(),
            });
        } catch (error) {
            console.error('Debug error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        runDiagnostics();
    }, []);
    const formatTimestamp = (timestamp) => {
        if (!timestamp || timestamp === 0) {
            return 'Never';
        }
        return new Date(timestamp).toLocaleString();
    };
    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) {
            return '0 B';
        }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Recent Apps Debug</Text>
                <Button title="Refresh" onPress={runDiagnostics} disabled={loading} />
            </View>
            {diagnostics && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Diagnostics</Text>
                    <Text>Native Module Available: {diagnostics.hasNativeModule ? 'Yes' : 'No'}</Text>
                    <Text>Platform: {diagnostics.platform.platform}</Text>
                    <Text>Total Apps: {diagnostics.totalApps}</Text>
                    <Text>Processed Apps: {diagnostics.processedApps}</Text>
                    <Text>Recent Apps: {diagnostics.recentApps}</Text>
                </View>
            )}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Apps ({recentApps.length})</Text>
                {recentApps.map((app, index) => (
                    <View key={index} style={styles.appItem}>
                        <Text style={styles.appName}>{app.appName || app.name}</Text>
                        <Text>Package: {app.packageName}</Text>
                        <Text>Last Used: {formatTimestamp(app.lastUsedTimestamp || app.lastTimeUsed)}</Text>
                        <Text>Foreground Time: {Math.round((app.totalTimeInForeground || 0) / 60000)}m</Text>
                        <Text>Launch Count: {app.launchCount || 0}</Text>
                        {app.dataUsage && (
                            <Text>Data Usage: {formatBytes(app.dataUsage.total)}
                                (M: {formatBytes(app.dataUsage.mobile)}, W: {formatBytes(app.dataUsage.wifi)})
                            </Text>
                        )}
                    </View>
                ))}
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Raw Sample Apps (First 3)</Text>
                {rawApps.slice(0, 3).map((app, index) => (
                    <View key={index} style={styles.appItem}>
                        <Text style={styles.appName}>{app.appName || app.name}</Text>
                        <Text>Package: {app.packageName}</Text>
                        <Text>Last Time Used: {formatTimestamp(app.lastTimeUsed)}</Text>
                        <Text>First Install: {formatTimestamp(app.firstInstallTime)}</Text>
                        <Text>Permissions: {app.permissions ? app.permissions.length : 0}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    appItem: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
});
export default DebugRecentApps;
