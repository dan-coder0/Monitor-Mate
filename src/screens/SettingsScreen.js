import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Switch,
    Alert,
    Linking,
    Share,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NotificationService from '../services/NotificationService';

// Components defined outside to avoid re-renders
const SettingItem = ({ title, subtitle, value, onToggle, type = 'switch' }) => (
    <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {type === 'switch' && (
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#ddd', true: '#ff6347' }}
                thumbColor={value ? '#fff' : '#f4f3f4'}
            />
        )}
        {type === 'button' && (
            <TouchableOpacity onPress={onToggle} style={styles.settingButton}>
                <Text style={styles.settingButtonText}>›</Text>
            </TouchableOpacity>
        )}
    </View>
);

const SectionHeader = ({ title }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
);

const SettingsScreen = () => {
    const navigation = useNavigation();

    // Settings state
    const [settings, setSettings] = useState({
        notifications: true,
        autoScan: true,
        dataCollection: false,
        riskAlerts: true,
        backgroundScanning: false,
        analyticsSharing: false,
    });

    // Load settings from storage on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('appSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            // Error loading settings - will use defaults
        }
    };

    const saveSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
        } catch (error) {
            // Error saving settings
        }
    };

    const toggleSetting = async (settingKey) => {
        // Special handling for notifications
        if (settingKey === 'notifications' && !settings.notifications) {
            const hasPermission = await NotificationService.requestPermission();
            if (!hasPermission) {
                return; // Don't toggle if permission denied
            }
        }

        const newSettings = {
            ...settings,
            [settingKey]: !settings[settingKey],
        };
        setSettings(newSettings);
        await saveSettings(newSettings);

        // Handle notification cancellation
        if (settingKey === 'notifications' && settings.notifications) {
            await NotificationService.cancelAllNotifications();
            showAlert('Notifications Disabled', 'All scheduled notifications have been cancelled.');
        } else if (settingKey === 'notifications' && !settings.notifications) {
            showAlert('Notifications Enabled', 'You will now receive security alerts and updates.');
        }

        // Handle background scanning
        if (settingKey === 'backgroundScanning') {
            if (!settings.backgroundScanning) {
                showAlert(
                    'Background Scanning Enabled',
                    'The app will now continuously monitor app behavior. This may affect battery life.'
                );
            } else {
                showAlert(
                    'Background Scanning Disabled',
                    'The app will only scan when manually opened.'
                );
            }
        }
    };

    const showAlert = (title, message) => {
        Alert.alert(title, message, [{ text: 'OK' }]);
    };

    const handlePrivacyPolicy = async () => {
        const privacyPolicyURL = 'https://docs.google.com/document/d/1234567890/edit'; // Replace with your actual privacy policy URL
        Alert.alert(
            'Privacy Policy',
            'Would you like to view our privacy policy?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'View Online',
                    onPress: async () => {
                        try {
                            const supported = await Linking.canOpenURL(privacyPolicyURL);
                            if (supported) {
                                await Linking.openURL(privacyPolicyURL);
                            } else {
                                showAlert('Error', 'Cannot open privacy policy link');
                            }
                        } catch (error) {
                            showAlert('Error', 'Failed to open privacy policy');
                        }
                    },
                },
                {
                    text: 'View Summary',
                    onPress: () => {
                        showAlert(
                            'Privacy Policy Summary',
                            '• We collect minimal data necessary for app functionality\n' +
                            '• No personal information is shared with third parties\n' +
                            '• All data is stored securely on your device\n' +
                            '• You can export or delete your data anytime'
                        );
                    },
                },
            ]
        );
    };

    const handleTermsOfService = async () => {
        const termsURL = 'https://docs.google.com/document/d/0987654321/edit'; // Replace with your actual terms URL
        Alert.alert(
            'Terms of Service',
            'Would you like to view our terms of service?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'View Online',
                    onPress: async () => {
                        try {
                            const supported = await Linking.canOpenURL(termsURL);
                            if (supported) {
                                await Linking.openURL(termsURL);
                            } else {
                                showAlert('Error', 'Cannot open terms of service link');
                            }
                        } catch (error) {
                            showAlert('Error', 'Failed to open terms of service');
                        }
                    },
                },
                {
                    text: 'View Summary',
                    onPress: () => {
                        showAlert(
                            'Terms of Service Summary',
                            '• Use the app responsibly and legally\n' +
                            '• App is provided "as is" without warranties\n' +
                            '• Users are responsible for their device security\n' +
                            '• Terms may be updated periodically'
                        );
                    },
                },
            ]
        );
    };

    const handleAbout = () => {
        Alert.alert(
            'About Mobile Monitor',
            'App Privacy Scanner v1.0.0\n\n' +
            '🛡️ Protecting your privacy by analyzing app permissions and data usage patterns.\n\n' +
            '📱 Features:\n' +
            '• Real-time app monitoring\n' +
            '• Permission analysis\n' +
            '• Data usage tracking\n' +
            '• Security alerts\n\n' +
            '📧 Support: support@mobilemonitor.com\n' +
            '🌐 Website: www.mobilemonitor.com',
            [
                { text: 'OK' },
                {
                    text: 'Rate App',
                    onPress: () => {
                        const storeURL = Platform.OS === 'ios'
                            ? 'https://apps.apple.com/app/your-app-id'
                            : 'https://play.google.com/store/apps/details?id=com.mobilemonitor';
                        Linking.openURL(storeURL).catch(() => {
                            showAlert('Error', 'Cannot open app store');
                        });
                    },
                },
            ]
        );
    };

    const handleDataExport = async () => {
        try {
            // Get app data for export
            const appData = await AsyncStorage.getItem('appSettings');
            const scanData = await AsyncStorage.getItem('scanResults') || '{}';
            const exportData = {
                settings: JSON.parse(appData || '{}'),
                scanResults: JSON.parse(scanData),
                exportDate: new Date().toISOString(),
                appVersion: '1.0.0',
            };

            const exportText = `Mobile Monitor Data Export
Generated: ${new Date().toLocaleDateString()}

Settings:
${JSON.stringify(exportData.settings, null, 2)}

Scan Results:
${JSON.stringify(exportData.scanResults, null, 2)}

This data was exported from Mobile Monitor v${exportData.appVersion}`;

            // Share the data
            await Share.share({
                message: exportText,
                title: 'Mobile Monitor Data Export',
            });

        } catch (error) {
            showAlert('Export Failed', 'Unable to export your data. Please try again.');
        }
    };

    const handleResetSettings = () => {
        Alert.alert(
            'Reset Settings',
            'Are you sure you want to reset all settings to default? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        const defaultSettings = {
                            notifications: true,
                            autoScan: true,
                            dataCollection: false,
                            riskAlerts: true,
                            backgroundScanning: false,
                            analyticsSharing: false,
                        };
                        setSettings(defaultSettings);
                        await saveSettings(defaultSettings);
                        // Also clear any other stored data if needed
                        try {
                            await AsyncStorage.removeItem('scanResults');
                            await AsyncStorage.removeItem('userPreferences');
                        } catch (error) {
                            // Error clearing additional data
                        }
                        showAlert('Settings Reset', 'All settings have been reset to default values and stored data has been cleared.');
                    },
                },
            ]
        );
    };

    const navigateBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content}>
                {/* Privacy & Security Section */}
                <SectionHeader title="Privacy & Security" />
                <View style={styles.section}>
                    <SettingItem
                        title="Risk Alerts"
                        subtitle="Get notified when high-risk apps are detected"
                        value={settings.riskAlerts}
                        onToggle={() => toggleSetting('riskAlerts')}
                    />
                    <SettingItem
                        title="Background Scanning"
                        subtitle="Continuously monitor app behavior"
                        value={settings.backgroundScanning}
                        onToggle={() => toggleSetting('backgroundScanning')}
                    />
                    <SettingItem
                        title="Data Collection"
                        subtitle="Allow collection of anonymous usage data"
                        value={settings.dataCollection}
                        onToggle={() => toggleSetting('dataCollection')}
                    />
                </View>

                {/* App Behavior Section */}
                <SectionHeader title="App Behavior" />
                <View style={styles.section}>
                    <SettingItem
                        title="Auto Scan"
                        subtitle="Automatically scan new apps when installed"
                        value={settings.autoScan}
                        onToggle={() => toggleSetting('autoScan')}
                    />
                    <SettingItem
                        title="Notifications"
                        subtitle="Enable push notifications"
                        value={settings.notifications}
                        onToggle={() => toggleSetting('notifications')}
                    />
                    <SettingItem
                        title="Analytics Sharing"
                        subtitle="Share anonymous analytics to improve the app"
                        value={settings.analyticsSharing}
                        onToggle={() => toggleSetting('analyticsSharing')}
                    />
                </View>

                {/* Data Management Section */}
                <SectionHeader title="Data Management" />
                <View style={styles.section}>
                    <SettingItem
                        title="Export Data"
                        subtitle="Download your app analysis data"
                        type="button"
                        onToggle={handleDataExport}
                    />
                    <SettingItem
                        title="Reset Settings"
                        subtitle="Restore all settings to default"
                        type="button"
                        onToggle={handleResetSettings}
                    />
                </View>

                {/* Legal & Support Section */}
                <SectionHeader title="Legal & Support" />
                <View style={styles.section}>
                    <SettingItem
                        title="Privacy Policy"
                        subtitle="Read our privacy policy"
                        type="button"
                        onToggle={handlePrivacyPolicy}
                    />
                    <SettingItem
                        title="Terms of Service"
                        subtitle="View terms and conditions"
                        type="button"
                        onToggle={handleTermsOfService}
                    />
                    <SettingItem
                        title="About"
                        subtitle="App version and information"
                        type="button"
                        onToggle={handleAbout}
                    />
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>App Privacy Scanner</Text>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNavBar}>
                <TouchableOpacity style={styles.navBarItem} onPress={() => navigation.navigate('Dashboard')}>
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navBarIcon}>🏠</Text>
                    </View>
                    <Text style={styles.navBarText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBarItem} onPress={() => navigation.navigate('AppListScreen')}>
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navBarIcon}>📱</Text>
                    </View>
                    <Text style={styles.navBarText}>Apps</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBarItem, styles.activeNavItem]}>
                    <View style={[styles.navIconContainer, styles.activeNavIcon]}>
                        <Text style={[styles.navBarIcon, styles.activeIconText]}>⚙️</Text>
                    </View>
                    <Text style={[styles.navBarText, styles.activeNavText]}>Settings</Text>
                </TouchableOpacity>
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
        marginLeft: 12,
        flex: 1,
    },
    headerSpacer: {
        width: 32,
    },
    content: {
        flex: 1,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    section: {
        backgroundColor: '#fff',
        marginBottom: 1,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    settingButton: {
        padding: 4,
    },
    settingButtonText: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    appInfo: {
        alignItems: 'center',
        padding: 24,
        marginTop: 16,
    },
    appInfoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    versionText: {
        fontSize: 14,
        color: '#666',
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

export default SettingsScreen;
