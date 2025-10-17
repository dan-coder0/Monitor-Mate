import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AppDataService } from '../../services/AppDataService';

/**
 * ServiceStatusScreen - Shows service health and capabilities for production monitoring
 * This screen helps diagnose issues in production environments
 */
const ServiceStatusScreen = ({ navigation }) => {
    const [serviceStatus, setServiceStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadServiceStatus();
    }, []);

    const loadServiceStatus = () => {
        try {
            setIsLoading(true);
            const appDataService = new AppDataService();
            const status = appDataService.getServiceStatus();
            setServiceStatus(status);
        } catch (error) {
            console.error('Error loading service status:', error);
            Alert.alert('Error', 'Failed to load service status');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (isAvailable) => {
        return isAvailable ? '#4CAF50' : '#f44336';
    };

    const getStatusText = (isAvailable) => {
        return isAvailable ? 'Available' : 'Unavailable';
    };

    const renderCapability = (name, isAvailable, description) => (
        <View key={name} style={styles.capabilityItem}>
            <View style={styles.capabilityHeader}>
                <Text style={styles.capabilityName}>{name}</Text>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(isAvailable) }]} />
            </View>
            <Text style={styles.capabilityDescription}>{description}</Text>
            <Text style={[styles.capabilityStatus, { color: getStatusColor(isAvailable) }]}>
                {getStatusText(isAvailable)}
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading service status...</Text>
            </View>
        );
    }

    if (!serviceStatus) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Failed to load service status</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadServiceStatus}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service Status</Text>
                <TouchableOpacity onPress={loadServiceStatus}>
                    <Text style={styles.refreshButton}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {/* Overall Status */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overall Status</Text>
                <View style={styles.overallStatus}>
                    <View style={[
                        styles.statusCard,
                        { borderLeftColor: getStatusColor(serviceStatus.isNativeModuleAvailable) }
                    ]}>
                        <Text style={styles.statusTitle}>Native Module</Text>
                        <Text style={[
                            styles.statusValue,
                            { color: getStatusColor(serviceStatus.isNativeModuleAvailable) }
                        ]}>
                            {getStatusText(serviceStatus.isNativeModuleAvailable)}
                        </Text>
                        <Text style={styles.statusDetail}>
                            Platform: {serviceStatus.platform}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Service Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service Information</Text>
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Version</Text>
                        <Text style={styles.infoValue}>{serviceStatus.serviceVersion}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Platform</Text>
                        <Text style={styles.infoValue}>{serviceStatus.platform}</Text>
                    </View>
                </View>
            </View>

            {/* Capabilities */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service Capabilities</Text>
                {renderCapability(
                    'App List Retrieval',
                    serviceStatus.capabilities.appListRetrieval,
                    'Ability to retrieve installed apps from the system'
                )}
                {renderCapability(
                    'App Details',
                    serviceStatus.capabilities.appDetails,
                    'Detailed information about individual applications'
                )}
                {renderCapability(
                    'Permission Analysis',
                    serviceStatus.capabilities.permissionAnalysis,
                    'Analysis of app permissions and risk assessment'
                )}
                {renderCapability(
                    'Risk Assessment',
                    serviceStatus.capabilities.riskAssessment,
                    'Security risk evaluation for installed apps'
                )}
                {renderCapability(
                    'Data Usage Monitoring',
                    serviceStatus.capabilities.dataUsageMonitoring,
                    'Real-time data usage tracking (requires implementation)'
                )}
                {renderCapability(
                    'Real-time Monitoring',
                    serviceStatus.capabilities.realTimeMonitoring,
                    'Live monitoring of app activities (requires implementation)'
                )}
            </View>

            {/* Native Module Details */}
            {serviceStatus.nativeModuleInfo && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Native Module Details</Text>
                    <View style={styles.moduleDetails}>
                        <Text style={styles.moduleMessage}>
                            {serviceStatus.nativeModuleInfo.message}
                        </Text>
                        {serviceStatus.nativeModuleInfo.methods.length > 0 && (
                            <>
                                <Text style={styles.methodsTitle}>Available Methods:</Text>
                                {serviceStatus.nativeModuleInfo.methods.map(method => (
                                    <Text key={method} style={styles.methodItem}>• {method}</Text>
                                ))}
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* Production Notes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Production Notes</Text>
                <View style={styles.productionNotes}>
                    <Text style={styles.noteText}>
                        • Ensure native modules are properly built for the target platform
                    </Text>
                    <Text style={styles.noteText}>
                        • Some features require specific system permissions
                    </Text>
                    <Text style={styles.noteText}>
                        • iOS has platform restrictions on app monitoring capabilities
                    </Text>
                    <Text style={styles.noteText}>
                        • Data usage monitoring requires platform-specific implementation
                    </Text>
                </View>
            </View>
        </ScrollView>
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
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        fontSize: 18,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    refreshButton: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: '#fff',
        marginVertical: 8,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    overallStatus: {
        paddingHorizontal: 16,
    },
    statusCard: {
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderLeftWidth: 4,
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statusDetail: {
        fontSize: 12,
        color: '#666',
    },
    infoGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
    },
    infoItem: {
        flex: 1,
        marginRight: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    capabilityItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    capabilityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    capabilityName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    capabilityDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    capabilityStatus: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    moduleDetails: {
        paddingHorizontal: 16,
    },
    moduleMessage: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
    },
    methodsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    methodItem: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    productionNotes: {
        paddingHorizontal: 16,
    },
    noteText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        lineHeight: 16,
    },
    loadingText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 50,
    },
    errorText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#f44336',
        marginTop: 50,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ServiceStatusScreen;