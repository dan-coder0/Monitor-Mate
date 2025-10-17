import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    FlatList,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppInfo } from '../hooks/useAppInfo.js';
import LoadingIndicator from '../components/common/LoadingIndicator.js';
import RiskBadge from '../components/common/RiskBadge.js';

const DataUsageScreen = () => {
    const navigation = useNavigation();
    const { getInstalledApps } = useAppInfo();
    const [apps, setApps] = useState([]);
    const [filteredApps, setFilteredApps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState('dataUsage'); // 'dataUsage', 'name', 'lastUsed'
    const [filterPeriod, setFilterPeriod] = useState('30'); // '7', '30', '90' days
    const [totalDataUsage, setTotalDataUsage] = useState(0);

    useEffect(() => {
        fetchAppsWithDataUsage();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [apps, sortBy, filterPeriod]);

    const fetchAppsWithDataUsage = async () => {
        try {
            setIsLoading(true);
            const installedApps = await getInstalledApps();
            
            // TODO: Implement real data usage monitoring
            // For now, use only real data from the apps (if available)
            const appsWithDataUsage = installedApps.map(app => ({
                ...app,
                dataUsage: app.dataUsage || {
                    total: 0,
                    mobile: 0,
                    wifi: 0,
                    sent: 0,
                    received: 0,
                },
                dailyUsage: app.dailyUsage || [],
            }));

            setApps(appsWithDataUsage);
            // Calculate total data usage from real data only
            const total = appsWithDataUsage.reduce((sum, app) => sum + (app.dataUsage?.total || 0), 0);
            setTotalDataUsage(total);
        } catch (error) {
            console.error('Error fetching apps with data usage:', error);
            Alert.alert('Error', 'Failed to load app data usage information. Data usage monitoring requires native implementation.');
        } finally {
            setIsLoading(false);
        }
    };



    const applyFiltersAndSort = () => {
        let filtered = [...apps];

        // Sort apps
        switch (sortBy) {
            case 'dataUsage':
                filtered.sort((a, b) => b.dataUsage.total - a.dataUsage.total);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'lastUsed':
                filtered.sort((a, b) => b.lastUsedTimestamp - a.lastUsedTimestamp);
                break;
        }

        setFilteredApps(filtered);
    };

    const formatDataSize = (bytes) => {
        if (bytes === 0) return '0 MB';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDataUsage = (mb) => {
        if (mb < 1024) {
            return `${mb.toFixed(1)} MB`;
        } else {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
    };

    const getRiskLevel = (app) => {
        const permissionsCount = app.permissions ? app.permissions.length : 0;
        const hasHighRiskPermissions = app.permissions && (
            app.permissions.includes('CAMERA') &&
            app.permissions.includes('LOCATION') &&
            app.permissions.includes('CONTACTS')
        );

        if (hasHighRiskPermissions || permissionsCount >= 5) {
            return 'High Risk';
        } else if (permissionsCount >= 3) {
            return 'Medium Risk';
        } else if (permissionsCount >= 1) {
            return 'Low Risk';
        } else {
            return 'No Risk';
        }
    };

    const handleAppPress = (app) => {
        const appData = {
            name: app.name,
            version: '1.0.0',
            packageName: app.packageName,
            riskLevel: getRiskLevel(app),
            lastUsed: formatLastUsed(app.lastUsedTimestamp),
            dataUsage: formatDataUsage(app.dataUsage.total),
            category: app.category,
            permissions: app.permissions || [],
            networkActivity: {
                dataSent: formatDataUsage(app.dataUsage.sent),
                dataReceived: formatDataUsage(app.dataUsage.received),
            },
            storage: {
                appSize: formatDataSize(app.size),
                dataSize: '350 MB',
            },
        };

        navigation.navigate('AppDetailScreen', { appData });
    };

    const formatLastUsed = (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes} minutes ago`;
        } else if (hours < 24) {
            return `${hours} hours ago`;
        } else {
            return `${days} days ago`;
        }
    };

    const renderAppItem = ({ item }) => (
        <TouchableOpacity
            style={styles.appItem}
            onPress={() => handleAppPress(item)}
        >
            <View style={styles.appIconContainer}>
                {item.icon ? (
                    <Image
                        source={typeof item.icon === 'string' ? { uri: item.icon } : item.icon}
                        style={styles.appIcon}
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
                        Total: {formatDataUsage(item.dataUsage.total)}
                    </Text>
                    <Text style={styles.dataBreakdown}>
                        Mobile: {formatDataUsage(item.dataUsage.mobile)} |
                        WiFi: {formatDataUsage(item.dataUsage.wifi)}
                    </Text>
                </View>
            </View>
            <View style={styles.dataUsageBar}>
                <View style={styles.dataUsageBarContainer}>
                    <View
                        style={[
                            styles.dataUsageBarFill,
                            { 
                                width: (() => {
                                    const maxUsage = Math.max(...filteredApps.map(a => a.dataUsage?.total || 0));
                                    if (maxUsage === 0) return '0%';
                                    return `${Math.min(((item.dataUsage?.total || 0) / maxUsage) * 100, 100)}%`;
                                })()
                            }
                        ]}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderFilterButton = (period, label) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                filterPeriod === period && styles.filterButtonActive
            ]}
            onPress={() => setFilterPeriod(period)}
        >
            <Text style={[
                styles.filterButtonText,
                filterPeriod === period && styles.filterButtonTextActive
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderSortButton = (sort, label) => (
        <TouchableOpacity
            style={[
                styles.sortButton,
                sortBy === sort && styles.sortButtonActive
            ]}
            onPress={() => setSortBy(sort)}
        >
            <Text style={[
                styles.sortButtonText,
                sortBy === sort && styles.sortButtonTextActive
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const navigateBack = () => {
        navigation.goBack();
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingIndicator />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Data Usage</Text>
                <View style={styles.headerSpace} />
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Data Usage</Text>
                <Text style={styles.summaryValue}>{formatDataUsage(totalDataUsage)}</Text>
                <Text style={styles.summaryPeriod}>Last {filterPeriod} days</Text>
            </View>

            {/* Filter Period Buttons */}
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Period:</Text>
                <View style={styles.filterButtons}>
                    {renderFilterButton('7', '7 days')}
                    {renderFilterButton('30', '30 days')}
                    {renderFilterButton('90', '90 days')}
                </View>
            </View>

            {/* Sort Buttons */}
            <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <View style={styles.sortButtons}>
                    {renderSortButton('dataUsage', 'Data Usage')}
                    {renderSortButton('name', 'Name')}
                    {renderSortButton('lastUsed', 'Last Used')}
                </View>
            </View>

            {/* Apps List */}
            <FlatList
                data={filteredApps}
                renderItem={renderAppItem}
                keyExtractor={(item) => item.packageName}
                style={styles.appsList}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
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
        padding: 4,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSpace: {
        width: 24,
    },
    summaryCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    summaryTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    summaryPeriod: {
        fontSize: 14,
        color: '#888',
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 12,
    },
    filterButtons: {
        flexDirection: 'row',
        flex: 1,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#e0e0e0',
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: '#ff6347',
    },
    filterButtonText: {
        fontSize: 12,
        color: '#666',
    },
    filterButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sortLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 12,
    },
    sortButtons: {
        flexDirection: 'row',
        flex: 1,
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#e0e0e0',
        marginRight: 8,
    },
    sortButtonActive: {
        backgroundColor: '#ff6347',
    },
    sortButtonText: {
        fontSize: 12,
        color: '#666',
    },
    sortButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    appsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    appItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
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
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#888',
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    appMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    lastUsed: {
        fontSize: 12,
        color: '#888',
        marginLeft: 8,
    },
    dataUsageInfo: {
        marginTop: 4,
    },
    dataUsageText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    dataBreakdown: {
        fontSize: 12,
        color: '#666',
    },
    dataUsageBar: {
        width: 60,
        marginLeft: 12,
    },
    dataUsageBarContainer: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    dataUsageBarFill: {
        height: '100%',
        backgroundColor: '#ff6347',
        borderRadius: 2,
    },
});

export default DataUsageScreen;