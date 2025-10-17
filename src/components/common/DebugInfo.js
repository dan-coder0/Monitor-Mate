import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Debug component to display app data information
 */
const DebugInfo = ({ apps, recentApps }) => {
    if (!apps) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Debug Info</Text>
                <Text style={styles.text}>No apps data available</Text>
            </View>
        );
    }

    const totalApps = apps.length;
    const appsWithUsage = apps.filter(app =>
        (app.totalTimeInForeground > 0) || (app.launchCount > 0)
    ).length;
    const appsWithNetworkData = apps.filter(app =>
        app.dataUsage && app.dataUsage.total > 0
    ).length;
    const systemApps = apps.filter(app =>
        app.packageName.startsWith('com.android.')
    ).length;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Debug Info</Text>
            <Text style={styles.text}>Total Apps: {totalApps}</Text>
            <Text style={styles.text}>Apps with Usage Data: {appsWithUsage}</Text>
            <Text style={styles.text}>Apps with Network Data: {appsWithNetworkData}</Text>
            <Text style={styles.text}>System Apps: {systemApps}</Text>
            <Text style={styles.text}>Recent Apps Count: {recentApps ? recentApps.length : 0}</Text>
            {recentApps && recentApps.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.subtitle}>Recent Apps:</Text>
                    {recentApps.slice(0, 3).map((app, index) => (
                        <Text key={index} style={styles.appText}>
                            • {app.name} ({app.packageName})
                        </Text>
                    ))}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.subtitle}>Sample Apps (first 5):</Text>
                {apps.slice(0, 5).map((app, index) => (
                    <Text key={index} style={styles.appText}>
                        • {app.appName || app.name} - Usage: {app.totalTimeInForeground || 0}ms
                    </Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginTop: 8,
        marginBottom: 4,
    },
    text: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    appText: {
        fontSize: 11,
        color: '#777',
        marginLeft: 8,
        marginBottom: 1,
    },
    section: {
        marginTop: 8,
    },
});

export default DebugInfo;
