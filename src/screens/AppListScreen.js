import React, { useState, useEffect } from 'react';
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
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppInfo } from '../hooks/useAppInfo';

const AppListScreen = ({ route }) => {
    const navigation = useNavigation();
    const { getInstalledApps, categorizeAppsByRisk } = useAppInfo();

    // Get the risk level filter from navigation params
    const riskLevel = route?.params?.riskLevel;

    const [allApps, setAllApps] = useState([]);
    const [filteredApps, setFilteredApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name'); // name, lastUsed, category, riskLevel

    // Filter categories
    const categories = ['all', 'Social', 'Communication', 'Productivity', 'Entertainment', 'Music'];

    // Sort options
    const sortOptions = [
        { key: 'name', label: 'Name' },
        { key: 'lastUsed', label: 'Last Used' },
        { key: 'category', label: 'Category' },
        { key: 'riskLevel', label: 'Risk Level' },
    ];

    useEffect(() => {
        const fetchApps = async () => {
        try {
            setLoading(true);
            const apps = await getInstalledApps();

            if (!apps || apps.length === 0) {
                setAllApps([]);
                return;
            }

            // Add risk level to each app
            const categorizedApps = categorizeAppsByRisk(apps);
            const appsWithRisk = apps.map(app => {
                let risk = 'No Risk';
                if (categorizedApps.highRisk.find(a => a.id === app.id)) {
                    risk = 'High Risk';
                } else if (categorizedApps.mediumRisk.find(a => a.id === app.id)) {
                    risk = 'Medium Risk';
                } else if (categorizedApps.lowRisk.find(a => a.id === app.id)) {
                    risk = 'Low Risk';
                }

                return { ...app, riskLevel: risk };
            });

            setAllApps(appsWithRisk);
        } catch (error) {
            // Error fetching apps - will show empty state
        } finally {
            setLoading(false);
        }
        };

        fetchApps();
    }, [getInstalledApps, categorizeAppsByRisk]);

    useEffect(() => {
        const filterAndSortApps = () => {
            let filtered = [...allApps];

        // Filter by risk level if specified
        if (riskLevel) {
            const riskMap = {
                'high': 'High Risk',
                'medium': 'Medium Risk',
                'low': 'Low Risk',
                'none': 'No Risk',
            };
            filtered = filtered.filter(app => app.riskLevel === riskMap[riskLevel]);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(app =>
                app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(app => app.category === selectedCategory);
        }

        // Sort apps
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'lastUsed':
                    return b.lastUsedTimestamp - a.lastUsedTimestamp;
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'riskLevel':
                    const riskOrder = { 'High Risk': 3, 'Medium Risk': 2, 'Low Risk': 1, 'No Risk': 0 };
                    return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
                default:
                    return 0;
            }
        });

        setFilteredApps(filtered);
        };

        filterAndSortApps();
    }, [allApps, searchQuery, selectedCategory, sortBy, riskLevel]);

    const navigateToAppDetail = (app) => {
        const formatAppSize = (bytes) => {
            if (!bytes) {
                return 'Unknown';
            }
            const mb = bytes / (1024 * 1024);
            return `${Math.round(mb)} MB`;
        };

        // Enhanced app data with only real information
        const appData = {
            ...app,
            // Keep original dataUsage object for detailed breakdown
            dataUsageSummary: app.dataUsage?.total ? `${Math.round(app.dataUsage.total / (1024 * 1024))} MB (last 30 days)` : 'No data available',
            networkActivity: {
                dataSent: app.networkActivity?.dataSent || 'Unknown',
                dataReceived: app.networkActivity?.dataReceived || 'Unknown',
            },
            storage: {
                appSize: formatAppSize(app.size),
                dataSize: app.dataSize || 'Unknown',
            },
        };

        navigation.navigate('AppDetailScreen', { appData });
    };

    const navigateBack = () => {
        navigation.goBack();
    };

    const formatLastUsed = (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'High Risk':
                return '#ff4444';
            case 'Medium Risk':
                return '#ff8800';
            case 'Low Risk':
                return '#44aa44';
            default:
                return '#666';
        }
    };

    const getHeaderTitle = () => {
        if (riskLevel) {
            const riskTitles = {
                'high': 'High Risk Apps',
                'medium': 'Medium Risk Apps',
                'low': 'Low Risk Apps',
                'none': 'No Risk Apps',
            };
            return riskTitles[riskLevel];
        }
        return 'All Apps';
    };

    const renderAppItem = ({ item }) => (
        <TouchableOpacity
            style={styles.appItem}
            onPress={() => navigateToAppDetail(item)}
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
                    <View style={styles.iconPlaceholder}>
                        <Text style={styles.iconPlaceholderText}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.appInfo}>
                <Text style={styles.appName}>{item.name}</Text>
                <Text style={styles.appCategory}>{item.category}</Text>
                <Text style={styles.appLastUsed}>{formatLastUsed(item.lastUsedTimestamp)}</Text>
            </View>
            <View style={styles.appMeta}>
                <Text style={[styles.riskLevel, { color: getRiskColor(item.riskLevel) }]}>
                    {item.riskLevel}
                </Text>
                <Text style={styles.permissionCount}>
                    {[...new Set(item.permissions || [])].length} permissions
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderCategoryFilter = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
        >
            {categories.map((category) => (
                <TouchableOpacity
                    key={category}
                    style={[
                        styles.categoryButton,
                        selectedCategory === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                >
                    <Text style={[
                        styles.categoryButtonText,
                        selectedCategory === category && styles.categoryButtonTextActive,
                    ]}>
                        {category === 'all' ? 'All' : category}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderSortOptions = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortOptions}
            contentContainerStyle={styles.sortOptionsContent}
        >
            {sortOptions.map((option) => (
                <TouchableOpacity
                    key={option.key}
                    style={[
                        styles.sortButton,
                        sortBy === option.key && styles.sortButtonActive,
                    ]}
                    onPress={() => setSortBy(option.key)}
                >
                    <Text style={[
                        styles.sortButtonText,
                        sortBy === option.key && styles.sortButtonTextActive,
                    ]}>
                        {option.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹ Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading apps...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Search and Filter Section */}
            <View style={styles.searchAndFilterContainer}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search apps..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Category Filter */}
                {renderCategoryFilter()}
            </View>

            {/* Sort Options */}
            <View style={styles.sortContainer}>
                <View style={styles.sortLeft}>
                    <Text style={styles.sortLabel}>Sort by:</Text>
                    {renderSortOptions()}
                </View>
                <Text style={styles.appsCountText}>
                    {filteredApps.length} app{filteredApps.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {/* Apps List */}
            {filteredApps.length === 0 && !loading ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No apps found</Text>
                    <Text style={styles.emptySubText}>
                        {allApps.length === 0 ? 'Unable to load apps' : 'Try adjusting your filters'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredApps}
                    renderItem={renderAppItem}
                    keyExtractor={(item) => item.id}
                    style={styles.appsList}
                    contentContainerStyle={styles.appsListContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNavBar}>
                <TouchableOpacity style={styles.navBarItem} onPress={() => navigation.navigate('Dashboard')}>
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navBarIcon}>🏠</Text>
                    </View>
                    <Text style={styles.navBarText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBarItem, styles.activeNavItem]} onPress={() => navigation.navigate('AppListScreen')}>
                    <View style={[styles.navIconContainer, styles.activeNavIcon]}>
                        <Text style={[styles.navBarIcon, styles.activeIconText]}>📱</Text>
                    </View>
                    <Text style={[styles.navBarText, styles.activeNavText]}>Apps</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBarItem} onPress={() => navigation.navigate('SettingsScreen')}>
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
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
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
        color: '#000',
    },
    placeholder: {
        width: 24,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    searchAndFilterContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f8f8',
        fontSize: 16,
    },
    categoryFilter: {
        backgroundColor: '#fff',
        flexShrink: 0, // Prevents shrinking
    },
    categoryFilterContent: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    categoryButtonActive: {
        backgroundColor: '#007AFF',
    },
    categoryButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryButtonTextActive: {
        color: '#fff',
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 4,
    },
    sortLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 12,
        fontWeight: '500',
    },
    sortOptions: {
        flex: 1,
    },
    sortOptionsContent: {
        flexDirection: 'row',
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    sortButtonActive: {
        backgroundColor: '#ff6347',
    },
    sortButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    sortButtonTextActive: {
        color: '#fff',
    },
    appsCount: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        // borderBottomWidth: 1,
        // borderBottomColor: '#e0e0e0',
    },
    appsCountText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    appsList: {
        flex: 1,
    },
    appsListContent: {
        paddingTop: 0,
        paddingBottom: 8,
    },
    appItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 2,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    appIconContainer: {
        marginRight: 12,
    },
    appIcon: {
        width: 48,
        height: 48,
        borderRadius: 6,
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    iconPlaceholderText: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 2,
    },
    appCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    appLastUsed: {
        fontSize: 12,
        color: '#999',
    },
    appMeta: {
        alignItems: 'flex-end',
    },
    riskLevel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    permissionCount: {
        fontSize: 11,
        color: '#999',
    },
    bottomNavBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 80,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    navBarItem: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    activeNavItem: {
        backgroundColor: '#f1f5f9',
    },
    navIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    activeNavIcon: {
        backgroundColor: '#3b82f6',
    },
    navBarIcon: {
        fontSize: 22,
    },
    activeIconText: {
        color: '#fff',
    },
    navBarText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    activeNavText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
});

export default AppListScreen;