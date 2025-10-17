import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SecurityAlertsScreen = () => {
    const navigation = useNavigation();
    const [alerts, setAlerts] = useState([]);
    const [alertSettings, setAlertSettings] = useState({
        highRiskApps: true,
        newPermissions: true,
        suspiciousActivity: true,
        dataUsageSpikes: false,
        backgroundActivity: true,
    });

    useEffect(() => {
        loadSecurityAlerts().catch(error => {
            console.error('Failed to load security alerts:', error);
        });
    }, []);

    const loadSecurityAlerts = async () => {
        try {
            // TODO: Implement real security monitoring service
            // For now, start with empty alerts until proper monitoring is implemented
            console.log('Loading security alerts...');
            
            // This would connect to a real security monitoring service
            // const realAlerts = await SecurityMonitoringService.getAlerts();
            
            setAlerts([]);
        } catch (error) {
            console.error('Error loading security alerts:', error);
            setAlerts([]);
        }
    };

    const handleAlertPress = (alert) => {
        Alert.alert(
            alert.title,
            `${alert.description}\n\nApp: ${alert.appName}\nRecommended Action: ${alert.action}`,
            [
                {
                    text: 'Dismiss',
                    onPress: () => markAsRead(alert.id)
                },
                {
                    text: 'View App Details',
                    onPress: () => {
                        markAsRead(alert.id);
                        navigation.navigate('AppDetailScreen', { 
                            app: { 
                                name: alert.appName, 
                                packageName: alert.packageName 
                            } 
                        });
                    }
                }
            ]
        );
    };

    const markAsRead = (alertId) => {
        setAlerts(prevAlerts => 
            prevAlerts.map(alert => 
                alert.id === alertId ? { ...alert, isRead: true } : alert
            )
        );
    };

    const dismissAlert = (alertId) => {
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
    };

    const clearAllAlerts = () => {
        Alert.alert(
            'Clear All Alerts',
            'Are you sure you want to clear all security alerts?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Clear All', 
                    onPress: () => setAlerts([]),
                    style: 'destructive'
                }
            ]
        );
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'HIGH':
                return '#ff4757';
            case 'MEDIUM':
                return '#ffa502';
            case 'LOW':
                return '#ffb142';
            default:
                return '#2ed573';
        }
    };

    const getSeverityIcon = (type) => {
        switch (type) {
            case 'HIGH_RISK_PERMISSION':
                return '🔒';
            case 'SUSPICIOUS_ACTIVITY':
                return '⚠️';
            case 'DATA_USAGE_SPIKE':
                return '📊';
            case 'NEW_APP_INSTALLED':
                return '📱';
            case 'PERMISSION_CHANGE':
                return '🔄';
            default:
                return '🛡️';
        }
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
    };

    const renderAlert = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.alertItem,
                !item.isRead && styles.unreadAlert
            ]}
            onPress={() => handleAlertPress(item)}
        >
            <View style={styles.alertHeader}>
                <View style={styles.alertTitleContainer}>
                    <Text style={styles.alertIcon}>{getSeverityIcon(item.type)}</Text>
                    <View style={styles.alertTitleText}>
                        <Text style={[
                            styles.alertTitle,
                            !item.isRead && styles.unreadTitle
                        ]}>
                            {item.title}
                        </Text>
                        <Text style={styles.alertTimestamp}>
                            {formatTimestamp(item.timestamp)}
                        </Text>
                    </View>
                </View>
                <View style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(item.severity) }
                ]}>
                    <Text style={styles.severityText}>{item.severity}</Text>
                </View>
            </View>
            <Text style={styles.alertDescription}>{item.description}</Text>
            <Text style={styles.alertApp}>App: {item.appName}</Text>
            
            <TouchableOpacity
                style={styles.dismissButton}
                onPress={(e) => {
                    e.stopPropagation();
                    dismissAlert(item.id);
                }}
            >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderAlertSetting = (key, title, description) => (
        <View style={styles.settingItem} key={key}>
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                value={alertSettings[key]}
                onValueChange={(value) =>
                    setAlertSettings(prev => ({ ...prev, [key]: value }))
                }
                trackColor={{ false: '#767577', true: '#ff6347' }}
                thumbColor={alertSettings[key] ? '#fff' : '#f4f3f4'}
            />
        </View>
    );

    const unreadCount = alerts.filter(alert => !alert.isRead).length;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Security Alerts</Text>
                {alerts.length > 0 && (
                    <TouchableOpacity onPress={clearAllAlerts}>
                        <Text style={styles.clearButton}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Alerts Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>{alerts.length}</Text>
                    <Text style={styles.summaryLabel}>Total Alerts</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNumber, { color: '#ff4757' }]}>{unreadCount}</Text>
                    <Text style={styles.summaryLabel}>Unread</Text>
                </View>
            </View>

            {/* Alert Settings */}
            <View style={styles.settingsContainer}>
                <Text style={styles.sectionTitle}>Alert Settings</Text>
                {renderAlertSetting('highRiskApps', 'High-Risk Apps', 'Alert when apps request dangerous permissions')}
                {renderAlertSetting('newPermissions', 'New Permissions', 'Alert when apps request additional permissions')}
                {renderAlertSetting('suspiciousActivity', 'Suspicious Activity', 'Alert for unusual app behavior')}
                {renderAlertSetting('dataUsageSpikes', 'Data Usage Spikes', 'Alert for unusual data consumption')}
                {renderAlertSetting('backgroundActivity', 'Background Activity', 'Alert for excessive background usage')}
            </View>

            {/* Alerts List */}
            <View style={styles.alertsContainer}>
                <Text style={styles.sectionTitle}>Recent Alerts</Text>
                {alerts.length === 0 ? (
                    <View style={styles.noAlertsContainer}>
                        <Text style={styles.noAlertsIcon}>🛡️</Text>
                        <Text style={styles.noAlertsTitle}>All Clear!</Text>
                        <Text style={styles.noAlertsText}>
                            No security alerts at this time. Your apps are behaving normally.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={alerts}
                        renderItem={renderAlert}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.alertsList}
                    />
                )}
            </View>
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
        fontSize: 18,
        color: '#ff6347',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    clearButton: {
        fontSize: 14,
        color: '#ff4757',
        fontWeight: 'bold',
    },
    summaryContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 16,
        marginBottom: 8,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    settingsContainer: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    settingDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    alertsContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    alertsList: {
        paddingBottom: 20,
    },
    alertItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    unreadAlert: {
        backgroundColor: '#fff5f5',
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    alertTitleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    alertIcon: {
        fontSize: 20,
        marginRight: 8,
        marginTop: 2,
    },
    alertTitleText: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    unreadTitle: {
        color: '#ff4757',
    },
    alertTimestamp: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    severityText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    alertDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
        marginLeft: 28,
    },
    alertApp: {
        fontSize: 12,
        color: '#999',
        marginLeft: 28,
        marginBottom: 8,
    },
    dismissButton: {
        alignSelf: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
    },
    dismissButtonText: {
        fontSize: 12,
        color: '#666',
    },
    noAlertsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noAlertsIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    noAlertsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    noAlertsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default SecurityAlertsScreen;
