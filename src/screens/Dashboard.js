import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAppInfo } from '../hooks/useAppInfo';
import RecentApps from '../components/dashboard/RecentApps';
import { useNavigation } from '@react-navigation/native';
import RiskCategoryButton from '../components/common/RiskCategoryButton';
import DebugInfo from '../components/common/DebugInfo';

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { getInstalledApps, categorizeAppsByRisk, getRecentApps, loading, error, appDataService } = useAppInfo();
    const [appCategories, setAppCategories] = useState({
        highRisk: [],
        mediumRisk: [],
        lowRisk: [],
        noRisk: [],
    });
    const [recentApps, setRecentApps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

    useEffect(() => {
        const checkPermissionAndFetchApps = async () => {
            try {
                setIsLoading(true);
                // Check usage stats permission
                const hasPermission = await appDataService.checkUsageStatsPermission();
                if (!hasPermission) {
                    setShowPermissionPrompt(true);
                }
                const apps = await getInstalledApps();

                if (apps && apps.length > 0) {
                    const categorizedApps = categorizeAppsByRisk(apps);
                    setAppCategories(categorizedApps);

                    // Get most recently used apps using the service method
                    const recent = getRecentApps(apps, 5);
                    setRecentApps(recent);
                } else {
                    // Handle empty apps case
                    setAppCategories({
                        highRisk: [],
                        mediumRisk: [],
                        lowRisk: [],
                        noRisk: [],
                    });
                    setRecentApps([]);
                }
            } catch (fetchError) {
                Alert.alert(
                    'Error',
                    'Failed to load apps. Please check permissions and try again.',
                    [
                        { text: 'OK', onPress: () => { } },
                    ]
                );
            } finally {
                setIsLoading(false);
            }
        };

        checkPermissionAndFetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty - functions are stable via useCallback

    const handleRequestUsagePermission = async () => {
        try {
            await appDataService.requestUsageStatsPermission();
            Alert.alert(
                'Permission Required',
                'Please grant Usage Access permission in the Settings app, then return to this app. The app will refresh automatically.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Check permission again after user returns
                            setTimeout(async () => {
                                const hasPermission = await appDataService.checkUsageStatsPermission();
                                if (hasPermission) {
                                    setShowPermissionPrompt(false);
                                    // Refresh the app data
                                    const apps = await getInstalledApps();
                                    if (apps && apps.length > 0) {
                                        const categorizedApps = categorizeAppsByRisk(apps);
                                        setAppCategories(categorizedApps);
                                        const recent = getRecentApps(apps, 5);
                                        setRecentApps(recent);
                                    }
                                }
                            }, 1000);
                        },
                    },
                ]
            );
        } catch (err) {
            Alert.alert('Error', 'Failed to request permission: ' + err.message);
        }
    };

    const navigateToAppList = (riskLevel) => {
        navigation.navigate('AppListScreen', { riskLevel });
    };

    const navigateToSettings = () => {
        navigation.navigate('Settings');
    };

    const navigateToAppListScreen = () => {
        navigation.navigate('AppListScreen');
    };

    const navigateToSettingsScreen = () => {
        navigation.navigate('SettingsScreen');
    };

    // Get total app count
    const getTotalApps = () => {
        return (appCategories.highRisk?.length || 0) +
               (appCategories.mediumRisk?.length || 0) +
               (appCategories.lowRisk?.length || 0) +
               (appCategories.noRisk?.length || 0);
    };

    // Show loading state
    if (loading || isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff6347" />
                    <Text style={styles.loadingText}>Loading your apps...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Error Loading Apps</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setIsLoading(true);
                            getInstalledApps().then(apps => {
                                if (apps) {
                                    const categorizedApps = categorizeAppsByRisk(apps);
                                    setAppCategories(categorizedApps);
                                    const recent = getRecentApps(apps, 5);
                                    setRecentApps(recent);
                                }
                                setIsLoading(false);
                            }).catch(() => {
                                setIsLoading(false);
                            });
                        }}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Welcome to Monitor Mate</Text>
                </View>
                {/* <TouchableOpacity onPress={navigateToSettings} style={styles.profileIconContainer}>
                    <View style={styles.profileIcon}>
                        <Text style={styles.profileIconText}>👤</Text>
                    </View>
                </TouchableOpacity> */}
            </View>

            {/* Usage Permission Prompt */}
            {showPermissionPrompt && (
                <View style={styles.permissionPrompt}>
                    <Text style={styles.permissionTitle}>⚠️ Usage Access Required</Text>
                    <Text style={styles.permissionText}>
                        To show recent apps and usage data, please grant Usage Access permission.
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={handleRequestUsagePermission}
                    >
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modern Dashboard Cards */}
            <View style={styles.dashboardCards}>
                <View style={styles.statsCard}>
                    <View style={styles.statsCardContent}>
                        <Text style={styles.statsNumber}>{getTotalApps()}</Text>
                        <Text style={styles.statsLabel}>Total Apps</Text>
                    </View>
                    <View style={styles.statsIcon}>
                        <Text style={styles.statsIconText}>📱</Text>
                    </View>
                </View>

                <View style={styles.securityCard}>
                    <View style={styles.securityCardContent}>
                        <Text style={styles.securityStatus}>
                            {(appCategories.highRisk?.length || 0) === 0 ? 'Secure' : 'At Risk'}
                        </Text>
                        <Text style={styles.securityLabel}>Security Status</Text>
                    </View>
                    <View style={[styles.securityIndicator,
                        (appCategories.highRisk?.length || 0) === 0 ? styles.secureIndicator : styles.riskIndicator]}>
                        <Text style={styles.securityIndicatorText}>
                            {(appCategories.highRisk?.length || 0) === 0 ? '✓' : '⚠'}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Risk Categories Grid */}
                <View style={styles.riskCategoriesContainer}>
                    <View style={styles.riskCategoriesRow}>
                        <RiskCategoryButton
                            title="High Risk Apps"
                            count={appCategories.highRisk?.length || 0}
                            style={[styles.riskButton, styles.highRisk]}
                            onPress={() => navigateToAppList('high')}
                        />
                        <RiskCategoryButton
                            title="Medium Risk Apps"
                            count={appCategories.mediumRisk?.length || 0}
                            style={[styles.riskButton, styles.mediumRisk]}
                            onPress={() => navigateToAppList('medium')}
                        />
                    </View>

                    <View style={styles.riskCategoriesRow}>
                        <RiskCategoryButton
                            title="Low Risk Apps"
                            count={appCategories.lowRisk?.length || 0}
                            style={[styles.riskButton, styles.lowRisk]}
                            onPress={() => navigateToAppList('low')}
                        />
                        <RiskCategoryButton
                            title="No Risk"
                            count={appCategories.noRisk?.length || 0}
                            style={[styles.riskButton, styles.noRisk]}
                            onPress={() => navigateToAppList('none')}
                        />
                    </View>
                </View>

                {/* Recent Apps Section */}
                <View style={styles.recentAppsContainer}>
                    <View style={styles.recentAppsHeader}>
                        <Text style={styles.sectionTitle}>Recent Apps</Text>
                        <TouchableOpacity onPress={navigateToAppListScreen}>
                            <View style={styles.viewAllButton}>
                                <Text style={styles.viewAllButtonText}>View All</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <RecentApps apps={recentApps} isLoading={false} />
                    {/* Debug Info - temporary for troubleshooting */}
                    {/* <DebugInfo apps={Object.values(appCategories).flat()} recentApps={recentApps} /> */}
                </View>
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNavBar}>
                <TouchableOpacity
                    style={[styles.navBarItem, styles.activeNavItem]}
                    onPress={() => navigation.navigate('Dashboard')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.navIconContainer, styles.activeNavIcon]}>
                        <Text style={[styles.navBarIcon, styles.activeIconText]}>🏠</Text>
                    </View>
                    <Text style={[styles.navBarText, styles.activeNavText]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navBarItem}
                    onPress={navigateToAppListScreen}
                    activeOpacity={0.8}
                >
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navBarIcon}>📱</Text>
                    </View>
                    <Text style={styles.navBarText}>Apps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navBarItem}
                    onPress={navigateToSettingsScreen}
                    activeOpacity={0.8}
                >
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navBarIcon}>⚙️</Text>
                    </View>
                    <Text style={styles.navBarText}>Settings</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#f8fafc',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#3b82f6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    headerLeft: {
        flex: 1,
    },
    greetingText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    profileIconContainer: {
        padding: 4,
    },
    profileIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    profileIconText: {
        fontSize: 20,
    },
    dashboardCards: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 12,
    },
    statsCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statsCardContent: {
        flex: 1,
    },
    statsNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    statsLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    statsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsIconText: {
        fontSize: 24,
    },
    securityCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    securityCardContent: {
        flex: 1,
    },
    securityStatus: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    securityLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    securityIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secureIndicator: {
        backgroundColor: '#dcfce7',
    },
    riskIndicator: {
        backgroundColor: '#fef3c7',
    },
    securityIndicatorText: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    riskCategoriesContainer: {
        marginVertical: 8,
    },
    riskCategoriesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    riskButton: {
        flex: 1,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    highRisk: {
        backgroundColor: '#ef4444',
    },
    mediumRisk: {
        backgroundColor: '#f59e0b',
    },
    lowRisk: {
        backgroundColor: '#eab308',
    },
    noRisk: {
        backgroundColor: '#22c55e',
    },
    recentAppsContainer: {
        marginTop: 8,
        marginBottom: 20,
    },
    recentAppsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    viewAllButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#3b82f6',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    viewAllButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    bottomNavBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 85,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        paddingBottom: 8,
        paddingTop: 8,
    },
    navBarItem: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    navBarIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    navBarText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    activeNavText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    navIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    activeNavItem: {
        backgroundColor: '#f1f5f9',
    },
    activeNavIcon: {
        backgroundColor: '#3b82f6',
    },
    activeIconText: {
        fontSize: 22,
    },
    permissionPrompt: {
        backgroundColor: '#fff3cd',
        borderColor: '#ffeaa7',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        margin: 16,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    permissionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 8,
    },
    permissionText: {
        fontSize: 14,
        color: '#856404',
        marginBottom: 12,
        lineHeight: 20,
    },
    permissionButton: {
        backgroundColor: '#ffc107',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    permissionButtonText: {
        color: '#212529',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default DashboardScreen;
