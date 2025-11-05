import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PermissionService } from '../services/PermissionService';
import { useAppInfo } from '../hooks/useAppInfo';

const AppDetailScreen = ({ route }) => {
    const navigation = useNavigation();
    const { analyzeAppPermissions } = useAppInfo();

    // Get app data from route params or use default data
    const appData = route?.params?.appData || {
        name: 'App Name',
        version: 'X.X XX',
        packageName: 'com.example.app',
        riskLevel: 'Medium Risk',
        lastUsed: 'Today, 10:30 AM',
        dataUsage: '500 MB (last 30 days)',
        category: 'Messaging',
        permissions: ['Camera', 'Microphone', 'Contacts', 'Location'],
        networkActivity: {
            dataSent: '100 MB',
            dataReceived: '400 MB',
        },
        storage: {
            appSize: '150 MB',
            dataSize: '350 MB',
        },
        icon: null,
    };

    // Helper function to format last used time
    const formatLastUsed = (timestamp) => {
        if (!timestamp || timestamp === 0) {
            return 'Never used';
        }

        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (days < 30) {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            return new Date(timestamp).toLocaleDateString();
        }
    };

    // Get the last used timestamp from multiple possible field names
    const getLastUsedTimestamp = (app) => {
        return app.lastUsedTimestamp || app.lastTimeUsed || app.lastUsed || 0;
    };

    // Helper function to format bytes
    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) {
            return '0 B';
        }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Helper function to format install date
    const formatInstallDate = (timestamp) => {
        if (!timestamp || timestamp === 0) {
            return 'Unknown';
        }
        try {
            return new Date(timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return 'Unknown';
        }
    };

    // Helper function to format usage stats
    const formatUsageStats = (app) => {
        const usage = [];
        if (app.totalTimeInForeground && app.totalTimeInForeground > 0) {
            const minutes = Math.floor(app.totalTimeInForeground / (1000 * 60));
            usage.push(`${minutes} min foreground`);
        }
        if (app.launchCount && app.launchCount > 0) {
            usage.push(`${app.launchCount} launches`);
        }
        return usage.length > 0 ? usage.join(', ') : 'No usage data';
    };

    // Get formatted data
    const lastUsedTimestamp = getLastUsedTimestamp(appData);
    const formattedLastUsed = formatLastUsed(lastUsedTimestamp);
    const formattedInstallDate = formatInstallDate(appData.firstInstallTime);
    const formattedUsageStats = formatUsageStats(appData);

    // Analyze app permissions
    const permissionAnalysis = useMemo(() => {
        return analyzeAppPermissions(appData.permissions || []);
    }, [appData.permissions, analyzeAppPermissions]);

    const navigateBack = () => {
        navigation.goBack();
    };

    const navigateToAllPermissions = () => {
        navigation.navigate('PermissionManagerScreen', { appData });
    };

    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'HIGH_RISK':
            case 'HIGH':
                return '#ff4757';
            case 'MEDIUM_RISK':
            case 'MEDIUM':
                return '#ffa502';
            case 'LOW_RISK':
            case 'LOW':
                return '#ffb142';
            default:
                return '#2ed573';
        }
    };

    const getRiskLabel = (riskLevel) => {
        switch (riskLevel) {
            case 'HIGH_RISK':
                return 'High Risk';
            case 'MEDIUM_RISK':
                return 'Medium Risk';
            case 'LOW_RISK':
                return 'Low Risk';
            default:
                return 'Safe';
        }
    };

    const getRiskLevelColor = (riskLevel) => {
        switch (riskLevel.toLowerCase()) {
            case 'high risk':
                return '#ff4444';
            case 'medium risk':
                return '#ff8800';
            case 'low risk':
                return '#44aa44';
            default:
                return '#666';
        }
    };

    const getRiskColorForLevel = (riskLevel) => {
        switch (riskLevel) {
            case 'HIGH':
                return '#ff4444';
            case 'MEDIUM':
                return '#ff8800';
            case 'LOW':
                return '#44aa44';
            default:
                return '#666';
        }
    };

    const handlePermissionInfo = (permission) => {
        const risk = PermissionService.PERMISSION_RISKS[permission];
        Alert.alert(
            `${PermissionService.getPermissionIcon(permission)} ${PermissionService.formatPermissionName(permission)}`,
            risk ? risk.description : 'System permission',
            [{ text: 'OK' }]
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f7f8fa" />
            {/* Header */}
            <View style={styles.headerModern}>
                <TouchableOpacity onPress={navigateBack} style={styles.backButtonModern} activeOpacity={0.7}>
                    <Text style={styles.backButtonTextModern}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitleModern}>{appData.name}</Text>
                <TouchableOpacity style={styles.menuButtonModern} activeOpacity={0.7}>
                    <Text style={styles.menuButtonTextModern}>⋮</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.contentModern} showsVerticalScrollIndicator={false}>
                {/* App Card */}
                <View style={styles.card}>
                    <View style={styles.cardRow}>
                        <View style={styles.appIconModern}>
                            {appData.icon && appData.icon !== 'default' ? (
                                <Image
                                    source={{
                                        uri: appData.icon.startsWith('data:') ? appData.icon : `data:image/png;base64,${appData.icon}`,
                                    }}
                                    style={styles.appIconImageModern}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={styles.iconPlaceholderModern}>
                                    <Text style={styles.iconPlaceholderText}>
                                        {appData.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.appBasicInfoModern}>
                            <Text style={styles.appNameModern}>{appData.name}</Text>
                            <Text style={styles.appVersionModern}>Version {appData.version}</Text>
                            <Text style={styles.packageNameModern}>{appData.packageName}</Text>
                        </View>
                    </View>
                </View>
                {/* Overview Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Overview</Text>
                    <View style={styles.cardRowBetween}>
                        <Text style={styles.label}>Risk Level</Text>
                        <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(appData.riskLevel) }]}>
                            <Text style={styles.riskBadgeText}>{appData.riskLevel}</Text>
                        </View>
                    </View>
                    <View style={styles.cardRowBetween}><Text style={styles.label}>Last Used</Text><Text style={styles.value}>{formattedLastUsed}</Text></View>
                    {formattedUsageStats !== 'No usage data' && (
                        <View style={styles.cardRowBetween}><Text style={styles.label}>Usage Stats</Text><Text style={styles.value}>{formattedUsageStats}</Text></View>
                    )}
                    <View style={styles.cardRowBetween}><Text style={styles.label}>Data Usage</Text><Text style={styles.value}>{appData.dataUsageSummary || 'No data available'}</Text></View>
                    <View style={styles.cardRowBetween}><Text style={styles.label}>Category</Text><Text style={styles.value}>{appData.category}</Text></View>
                    {formattedInstallDate !== 'Unknown' && (
                        <View style={styles.cardRowBetween}><Text style={styles.label}>Install Date</Text><Text style={styles.value}>{formattedInstallDate}</Text></View>
                    )}
                    <View style={styles.riskSummary}>
                        <Text style={styles.riskSummaryTitle}>Risk Assessment</Text>
                        <Text style={[
                            styles.overallRisk,
                            { color: getRiskColor(permissionAnalysis.riskLevel) },
                        ]}>
                            {getRiskLabel(permissionAnalysis.riskLevel)}
                        </Text>
                        <Text style={styles.riskScore}>
                            Risk Score: {permissionAnalysis.riskScore}
                        </Text>
                    </View>
                </View>
                {/* Permissions Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Permissions ({[...new Set(appData.permissions || [])].length})</Text>
                    <View style={styles.permissionsListModern}>
                        {[...new Set(appData.permissions || [])].map((permission, index) => {
                            const permissionRisk = PermissionService.PERMISSION_RISKS[permission];
                            const riskLevel = permissionRisk?.level || 'LOW';
                            return (
                                <TouchableOpacity
                                    key={permission}
                                    style={styles.permissionItemModern}
                                    onPress={() => handlePermissionInfo(permission)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.permissionIcon}>
                                        {PermissionService.getPermissionIcon(permission)}
                                    </Text>
                                    <View style={styles.permissionContent}>
                                        <Text style={styles.permissionName}>
                                            {PermissionService.formatPermissionName(permission)}
                                        </Text>
                                        <Text style={styles.permissionDescription}>
                                            {permissionRisk?.description || 'System permission'}
                                        </Text>
                                    </View>
                                    {/* <View style={[styles.riskIndicator, { backgroundColor: getRiskColorForLevel(riskLevel) }]}>
                                        <Text style={styles.riskIndicatorText}>{riskLevel}</Text>
                                    </View> */}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {/* <TouchableOpacity onPress={navigateToAllPermissions} style={styles.viewAllButtonModern} activeOpacity={0.8}>
                        <Text style={styles.viewAllButtonTextModern}>View All Permissions</Text>
                    </TouchableOpacity> */}
                </View>
                {/* Network Activity Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Network Activity</Text>
                    <View style={styles.cardRowBetween}>
                        <Text style={styles.label}>Mobile Data</Text>
                        <Text style={styles.value}>{formatBytes((appData.dataUsage?.mobile || 0))}</Text>
                    </View>
                    <View style={styles.cardRowBetween}>
                        <Text style={styles.label}>WiFi Data</Text>
                        <Text style={styles.value}>{formatBytes((appData.dataUsage?.wifi || 0))}</Text>
                    </View>
                    <View style={styles.cardRowBetween}>
                        <Text style={styles.label}>Total Data</Text>
                        <Text style={styles.value}>{formatBytes((appData.dataUsage?.total || 0))}</Text>
                    </View>
                    <View style={styles.cardRowBetween}>
                        <Text style={styles.label}>Data Sent</Text>
                        <Text style={styles.value}>{formatBytes((appData.dataUsage?.sent || 0))}</Text>
                    </View>
                    <View style={styles.cardRowBetween}>
                        <Text style={styles.label}>Data Received</Text>
                        <Text style={styles.value}>{formatBytes((appData.dataUsage?.received || 0))}</Text>
                    </View>
                </View>
                {/* Storage Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Storage</Text>
                    <View style={styles.cardRowBetween}>
                        <Text style={styles.label}>App Size</Text>
                        <Text style={styles.value}>{appData.storage?.appSize || formatBytes(appData.size) || 'Unknown'}</Text>
                    </View>
                    {appData.storage?.dataSize && appData.storage.dataSize !== 'Unknown' && (
                        <View style={styles.cardRowBetween}>
                            <Text style={styles.label}>Data Size</Text>
                            <Text style={styles.value}>{appData.storage.dataSize}</Text>
                        </View>
                    )}
                    {appData.versionName && (
                        <View style={styles.cardRowBetween}>
                            <Text style={styles.label}>Version</Text>
                            <Text style={styles.value}>{appData.versionName}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
            {/* Modern Bottom Navigation Bar */}
            <View style={styles.bottomNavBarModern}>
                <TouchableOpacity style={styles.navBarItemModern} onPress={() => navigation.navigate('Dashboard')} activeOpacity={0.8}>
                    <Text style={styles.navBarIconModern}>🏠</Text>
                    <Text style={styles.navBarTextModern}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBarItemModern} onPress={() => navigation.navigate('AppListScreen')} activeOpacity={0.8}>
                    <Text style={styles.navBarIconModern}>📱</Text>
                    <Text style={styles.navBarTextModern}>Apps</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBarItemModern} onPress={() => navigation.navigate('SettingsScreen')} activeOpacity={0.8}>
                    <Text style={styles.navBarIconModern}>⚙️</Text>
                    <Text style={styles.navBarTextModern}>Settings</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f8fa',
    },
    // Modern Header
    headerModern: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 0,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
    },
    backButtonModern: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f1f5',
    },
    backButtonTextModern: {
        fontSize: 22,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    headerTitleModern: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222',
        letterSpacing: 0.5,
    },
    menuButtonModern: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f1f5',
    },
    menuButtonTextModern: {
        fontSize: 22,
        color: '#222',
        fontWeight: 'bold',
    },
    // Content
    contentModern: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222',
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardRowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    // App Icon
    appIconModern: {
        marginRight: 18,
    },
    appIconImageModern: {
        width: 72,
        height: 72,
        borderRadius: 16,
        backgroundColor: '#f0f1f5',
    },
    iconPlaceholderModern: {
        width: 72,
        height: 72,
        borderRadius: 16,
        backgroundColor: '#f0f1f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    iconPlaceholderText: {
        fontSize: 24,
        color: '#666',
        fontWeight: 'bold',
    },
    // App Info
    appBasicInfoModern: {
        flex: 1,
    },
    appNameModern: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 4,
    },
    appVersionModern: {
        fontSize: 15,
        color: '#888',
        marginBottom: 2,
    },
    packageNameModern: {
        fontSize: 13,
        color: '#bbb',
    },
    // Labels & Values
    label: {
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
    },
    value: {
        fontSize: 15,
        color: '#666',
        fontWeight: '400',
    },
    // Risk Badge
    riskBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    riskBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    // Permissions
    permissionsListModern: {
        gap: 8,
        marginBottom: 8,
    },
    permissionItemModern: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    permissionIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    permissionContent: {
        flex: 1,
    },
    permissionName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 2,
    },
    permissionDescription: {
        fontSize: 13,
        color: '#6c757d',
        lineHeight: 18,
    },
    riskIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    riskIndicatorText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    permissionChip: {
        backgroundColor: '#f0f1f5',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    permissionChipText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '500',
    },
    viewAllButtonModern: {
        marginTop: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#eaf1ff',
    },
    viewAllButtonTextModern: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '600',
    },
    // Risk Summary
    riskSummary: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    riskSummaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    overallRisk: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    riskScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
    },
    // Modern Bottom NavBar
    bottomNavBarModern: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 70,
        backgroundColor: '#fff',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 8,
    },
    navBarItemModern: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 8,
    },
    navBarIconModern: {
        fontSize: 26,
        marginBottom: 2,
    },
    navBarTextModern: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
});

export default AppDetailScreen;
