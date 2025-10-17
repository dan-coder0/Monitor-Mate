import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoadingIndicator from '../common/LoadingIndicator.js';
import RiskBadge from '../common/RiskBadge.js';

/**
 * Component to display recently used apps with data usage information
 *
 * @param {Array} apps - List of recent apps to display with data usage
 * @param {boolean} isLoading - Whether app data is still loading
 */
const RecentApps = ({ apps, isLoading }) => {
    const navigation = useNavigation();

    const handleAppPress = (app) => {
        // Use only real data - no fallback generation
        const dataUsage = app.dataUsage || {
            total: 0,
            sent: 0,
            received: 0,
        };

        // Map the app data to match AppDetails screen expectations
        const appData = {
            ...app, // Include all original app data
            name: app.name,
            version: app.version || 'Unknown',
            packageName: app.packageName,
            icon: app.icon, // Include the icon data
            riskLevel: getRiskLevel(app),
            lastUsed: formatLastUsed(app.lastUsedTimestamp || app.lastTimeUsed),
            dataUsageSummary: dataUsage.total > 0 ? `${formatDataUsage(dataUsage.total)} (last 30 days)` : 'No data available',
            category: app.category,
            permissions: app.permissions || [],
            networkActivity: {
                dataSent: formatDataUsage(dataUsage.sent),
                dataReceived: formatDataUsage(dataUsage.received),
            },
            storage: {
                appSize: formatSize(app.size),
                dataSize: 'Unknown',
            },
        };

        navigation.navigate('AppDetailScreen', { appData });
    };

    // Helper function to determine risk level based on permissions
    const getRiskLevel = (app) => {
        // Use the risk analysis from PermissionService if available
        if (app.riskAnalysis && app.riskAnalysis.riskLevel) {
            switch (app.riskAnalysis.riskLevel) {
                case 'HIGH_RISK':
                    return 'high';
                case 'MEDIUM_RISK':
                    return 'medium';
                case 'LOW_RISK':
                    return 'low';
                case 'NO_RISK':
                    return 'none';
                default:
                    return 'none';
            }
        }

        // Fallback to simple permission-based analysis
        const permissionsCount = app.permissions ? app.permissions.length : 0;
        const hasHighRiskPermissions = app.permissions && (
            app.permissions.includes('CAMERA') ||
            app.permissions.includes('LOCATION') ||
            app.permissions.includes('MICROPHONE')
        );

        if (hasHighRiskPermissions && permissionsCount >= 3) {
            return 'high';
        } else if (permissionsCount >= 3) {
            return 'medium';
        } else if (permissionsCount >= 1) {
            return 'low';
        } else {
            return 'none';
        }
    };

    // Helper function to format last used timestamp
    const formatLastUsed = (timestamp) => {
        if (!timestamp || timestamp === 0) {
            return 'Usage stats unavailable';
        }
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return `${Math.floor(days / 7)}w ago`;
        }
    };

    // Helper function to format data usage (handles bytes and MB)
    const formatDataUsage = (bytes) => {
        if (!bytes || bytes === 0) {
            return '0 B';
        }

        // Convert bytes to appropriate unit
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = bytes / Math.pow(k, i);

        if (i === 0) {
            return `${bytes} B`;
        }
        return `${size.toFixed(i > 1 ? 1 : 0)} ${sizes[i]}`;
    };

    if (isLoading) {
        return <LoadingIndicator />;
    }

    if (!apps || apps.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recent apps found</Text>
            </View>
        );
    }

    const renderAppItem = ({ item }) => (
        <TouchableOpacity
            style={styles.appItem}
            onPress={() => handleAppPress(item)}
        >
            <View style={styles.appIconContainer}>
                {item.icon && item.icon !== 'default' ? (
                    <Image
                        source={{
                            uri: item.icon.startsWith('data:') ? item.icon : `data:image/png;base64,${item.icon}`,
                        }}
                        style={styles.appIcon}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.placeholderIcon}>
                        <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
                    </View>
                )}
            </View>
            <View style={styles.appInfo}>
                <Text style={styles.appName} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                </Text>
                <View style={styles.appMeta}>
                    <RiskBadge risk={getRiskLevel(item)} />
                    <Text style={styles.lastUsed}>{formatLastUsed(item.lastUsedTimestamp)}</Text>
                </View>
                <View style={styles.dataUsageInfo}>
                    <Text style={styles.dataUsageText}>
                        {item.dataUsage && item.dataUsage.total > 0
                            ? formatDataUsage(item.dataUsage.total)
                            : 'No data usage'
                        }
                    </Text>
                    {item.dataUsage && item.dataUsage.total > 0 && (
                        <Text style={styles.dataBreakdown}>
                            Mobile: {formatDataUsage(item.dataUsage.mobile || 0)} |
                            WiFi: {formatDataUsage(item.dataUsage.wifi || 0)}
                        </Text>
                    )}
                    {item.totalTimeInForeground > 0 && (
                        <Text style={styles.usageTime}>
                            Used: {Math.round(item.totalTimeInForeground / 60000)}m today
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.dataUsageIndicator}>
                <View style={styles.dataUsageBar}>
                    <View
                        style={[
                            styles.dataUsageBarFill,
                            { width: getDataUsagePercentage(item, apps) },
                        ]}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={apps}
                renderItem={renderAppItem}
                keyExtractor={(item) => item.packageName}
                scrollEnabled={false}
            />
        </View>
    );
};

// Helper function to format app size
const formatSize = (bytes) => {
    if (!bytes || bytes === 0) {
        return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to calculate data usage percentage for visual bar
const getDataUsagePercentage = (currentApp, allApps) => {
    if (!allApps || allApps.length === 0) {
        return '0%';
    }

    const appsWithData = allApps.filter(app => app.dataUsage?.total > 0);
    if (appsWithData.length === 0) {
        return '0%';
    }

    const maxUsage = Math.max(...appsWithData.map(app => app.dataUsage.total));
    if (maxUsage === 0) {
        return '0%';
    }

    const currentUsage = currentApp.dataUsage?.total || 0;
    const percentage = Math.min((currentUsage / maxUsage) * 100, 100);
    return `${percentage}%`;
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    },
    appItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    appIconContainer: {
        marginRight: 12,
    },
    appIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
    },
    placeholderIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#64748b',
    },
    appInfo: {
        flex: 1,
        marginLeft: 4,
    },
    appName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 6,
    },
    appMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    lastUsed: {
        fontSize: 12,
        color: '#64748b',
        marginLeft: 8,
        fontWeight: '500',
    },
    dataUsageInfo: {
        marginTop: 4,
    },
    dataUsageText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    dataBreakdown: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    usageTime: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 2,
    },
    dataUsageIndicator: {
        width: 48,
        marginLeft: 12,
        alignItems: 'center',
    },
    dataUsageBar: {
        height: 4,
        width: '100%',
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    dataUsageBarFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 2,
    },
});

export default RecentApps;
