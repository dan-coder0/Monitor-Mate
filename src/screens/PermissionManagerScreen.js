import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppInfo } from '../hooks/useAppInfo';
import { PermissionService } from '../services/PermissionService';

const PermissionManagerScreen = () => {
    const navigation = useNavigation();
    const { getInstalledApps, analyzeAppPermissions, loading } = useAppInfo();
    const [apps, setApps] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [permissionAnalysis, setPermissionAnalysis] = useState(null);

    useEffect(() => {
        loadApps();
    }, [loadApps]);

    const loadApps = useCallback(async () => {
        try {
            const installedApps = await getInstalledApps();
            setApps(installedApps || []);
        } catch (error) {
            console.error('Error loading apps:', error);
            Alert.alert('Error', 'Failed to load apps');
        }
    }, [getInstalledApps]);

    const handleAppPress = async (app) => {
        setSelectedApp(app);
        const analysis = analyzeAppPermissions(app.permissions || []);
        setPermissionAnalysis(analysis);
    };

    const handlePermissionInfo = (permission) => {
        const risk = PermissionService.PERMISSION_RISKS[permission];
        Alert.alert(
            `${PermissionService.getPermissionIcon(permission)} ${PermissionService.formatPermissionName(permission)}`,
            risk ? risk.description : 'System permission',
            [{ text: 'OK' }]
        );
    };

    const renderApp = ({ item }) => (
        <TouchableOpacity
            style={styles.appItem}
            onPress={() => handleAppPress(item)}
        >
            <View style={styles.appInfo}>
                <Text style={styles.appName}>{item.name}</Text>
                <Text style={styles.appPackage}>{item.packageName}</Text>
                <View style={styles.riskContainer}>
                    <Text style={[
                        styles.riskText,
                        { color: getRiskColor(item.riskAnalysis?.riskLevel) },
                    ]}>
                        {getRiskLabel(item.riskAnalysis?.riskLevel)}
                    </Text>
                    <Text style={styles.permissionCount}>
                        {item.permissions?.length || 0} permissions
                    </Text>
                </View>
            </View>
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );

    const renderPermission = ({ item }) => (
        <TouchableOpacity
            style={styles.permissionItem}
            onPress={() => handlePermissionInfo(item.name)}
        >
            <Text style={styles.permissionIcon}>
                {PermissionService.getPermissionIcon(item.name)}
            </Text>
            <View style={styles.permissionInfo}>
                <Text style={styles.permissionName}>
                    {PermissionService.formatPermissionName(item.name)}
                </Text>
                <Text style={styles.permissionDescription}>
                    {item.description}
                </Text>
            </View>
            <View style={[
                styles.riskBadge,
                { backgroundColor: getRiskColor(item.level) },
            ]}>
                <Text style={styles.riskBadgeText}>{item.level}</Text>
            </View>
        </TouchableOpacity>
    );

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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff6347" />
                    <Text style={styles.loadingText}>Loading permissions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Permission Manager</Text>
                <View style={styles.spacer} />
            </View>

            {!selectedApp ? (
                // App List View
                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Apps by Risk Level</Text>
                    <FlatList
                        data={apps}
                        renderItem={renderApp}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.appList}
                    />
                </View>
            ) : (
                // Permission Detail View
                <View style={styles.content}>
                    <TouchableOpacity
                        style={styles.backToList}
                        onPress={() => {
                            setSelectedApp(null);
                            setPermissionAnalysis(null);
                        }}
                    >
                        <Text style={styles.backToListText}>‹ Back to Apps</Text>
                    </TouchableOpacity>

                    <View style={styles.appHeader}>
                        <Text style={styles.selectedAppName}>{selectedApp.name}</Text>
                        <Text style={styles.selectedAppPackage}>{selectedApp.packageName}</Text>
                    </View>

                    {permissionAnalysis && (
                        <View style={styles.riskSummary}>
                            <Text style={styles.riskSummaryTitle}>Risk Assessment</Text>
                            <Text style={[
                                styles.overallRisk,
                                { color: getRiskColor(permissionAnalysis.riskLevel) },
                            ]}>
                                {getRiskLabel(permissionAnalysis.riskLevel)}
                            </Text>
                            <Text style={styles.riskScore}>
                                Risk Score: {permissionAnalysis.riskScore}/15
                            </Text>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Permissions ({selectedApp.permissions?.length || 0})</Text>
                    <FlatList
                        data={permissionAnalysis?.permissionDetails || []}
                        renderItem={renderPermission}
                        keyExtractor={(item, index) => `${item.name}-${index}`}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.permissionList}
                    />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        fontSize: 18,
        color: '#ff6347',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    spacer: {
        width: 60,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    appList: {
        paddingBottom: 20,
    },
    appItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
        elevation: 1,
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    appPackage: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    riskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    riskText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 8,
    },
    permissionCount: {
        fontSize: 12,
        color: '#666',
    },
    arrow: {
        fontSize: 24,
        color: '#ccc',
        marginLeft: 8,
    },
    backToList: {
        marginBottom: 16,
    },
    backToListText: {
        fontSize: 16,
        color: '#ff6347',
        fontWeight: 'bold',
    },
    appHeader: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    selectedAppName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    selectedAppPackage: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    riskSummary: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    riskSummaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    overallRisk: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    riskScore: {
        fontSize: 14,
        color: '#666',
    },
    permissionList: {
        paddingBottom: 20,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 6,
        borderRadius: 8,
    },
    permissionIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    permissionInfo: {
        flex: 1,
    },
    permissionName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    permissionDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    riskBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    riskBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default PermissionManagerScreen;
