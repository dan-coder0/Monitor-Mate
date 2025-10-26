import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';

export class PermissionService {
    // Permission risk levels
    static RISK_LEVELS = {
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW',
    };

    // Permission categories with risk assessments
    static PERMISSION_RISKS = {
        CAMERA: {
            level: PermissionService.RISK_LEVELS.HIGH,
            description: 'Can take photos and videos without your knowledge',
            category: 'Privacy Critical',
        },
        LOCATION: {
            level: PermissionService.RISK_LEVELS.HIGH,
            description: 'Can track your location and movement patterns',
            category: 'Privacy Critical',
        },
        MICROPHONE: {
            level: PermissionService.RISK_LEVELS.HIGH,
            description: 'Can record audio and conversations',
            category: 'Privacy Critical',
        },
        CONTACTS: {
            level: PermissionService.RISK_LEVELS.HIGH,
            description: 'Can access your personal contacts and relationships',
            category: 'Personal Data',
        },
        PHONE: {
            level: PermissionService.RISK_LEVELS.HIGH,
            description: 'Can access phone numbers and call information',
            category: 'Personal Data',
        },
        SMS: {
            level: PermissionService.RISK_LEVELS.HIGH,
            description: 'Can read and send text messages',
            category: 'Communications',
        },
        STORAGE: {
            level: PermissionService.RISK_LEVELS.MEDIUM,
            description: 'Can access files and photos on your device',
            category: 'Data Access',
        },
        CALENDAR: {
            level: PermissionService.RISK_LEVELS.MEDIUM,
            description: 'Can view and modify your calendar events',
            category: 'Personal Data',
        },
        SENSORS: {
            level: PermissionService.RISK_LEVELS.MEDIUM,
            description: 'Can access body sensors and health data',
            category: 'Health Data',
        },
        USAGE_ACCESS: {
            level: PermissionService.RISK_LEVELS.MEDIUM,
            description: 'Can access app usage statistics and screen time data',
            category: 'Privacy Monitoring',
        },
        CALL_LOG: {
            level: PermissionService.RISK_LEVELS.HIGH,
            description: 'Can access call history and phone logs',
            category: 'Privacy Critical',
        },
        ACTIVITY_RECOGNITION: {
            level: PermissionService.RISK_LEVELS.MEDIUM,
            description: 'Can access physical activity and step tracking',
            category: 'Health Data',
        },
        NOTIFICATIONS: {
            level: PermissionService.RISK_LEVELS.LOW,
            description: 'Can show notifications on your device',
            category: 'User Experience',
        },
        BLUETOOTH: {
            level: PermissionService.RISK_LEVELS.MEDIUM,
            description: 'Can access nearby Bluetooth devices',
            category: 'Device Access',
        },
        NEARBY_DEVICES: {
            level: PermissionService.RISK_LEVELS.MEDIUM,
            description: 'Can access nearby Wi-Fi and Bluetooth devices',
            category: 'Device Access',
        },
    };

    /**
     * Analyze the risk level of an app based on its permissions
     */
    static analyzeAppRisk(permissions = []) {
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return {
                riskLevel: 'NO_RISK',
                riskScore: 0,
                highRiskCount: 0,
                mediumRiskCount: 0,
                lowRiskCount: 0,
                riskFactors: [],
            };
        }

        let riskScore = 0;
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;
        const riskFactors = [];

        permissions.forEach(permission => {
            const risk = this.PERMISSION_RISKS[permission];
            if (risk) {
                riskFactors.push({
                    permission,
                    ...risk,
                });

                switch (risk.level) {
                    case this.RISK_LEVELS.HIGH:
                        riskScore += 3;
                        highRiskCount++;
                        break;
                    case this.RISK_LEVELS.MEDIUM:
                        riskScore += 2;
                        mediumRiskCount++;
                        break;
                    case this.RISK_LEVELS.LOW:
                        riskScore += 1;
                        lowRiskCount++;
                        break;
                }
            }
        });

        // Determine overall risk level
        let overallRiskLevel;
        if (highRiskCount >= 3 || riskScore >= 8) {
            overallRiskLevel = 'HIGH_RISK';
        } else if (highRiskCount >= 1 || riskScore >= 4) {
            overallRiskLevel = 'MEDIUM_RISK';
        } else if (riskScore >= 1) {
            overallRiskLevel = 'LOW_RISK';
        } else {
            overallRiskLevel = 'NO_RISK';
        }

        return {
            riskLevel: overallRiskLevel,
            riskScore,
            highRiskCount,
            mediumRiskCount,
            lowRiskCount,
            riskFactors: riskFactors.sort((a, b) => {
                const levelOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                return levelOrder[b.level] - levelOrder[a.level];
            }),
        };
    }

    /**
     * Get detailed permission analysis for an app
     */
    static getPermissionAnalysis(permissions = []) {
        const riskAnalysis = this.analyzeAppRisk(permissions);
        const permissionDetails = permissions.map(permission => {
            const risk = this.PERMISSION_RISKS[permission] || {
                level: this.RISK_LEVELS.LOW,
                description: 'System permission',
                category: 'System',
            };

            return {
                name: permission,
                ...risk,
                recommendation: this.getPermissionRecommendation(permission, risk.level),
            };
        });

        return {
            ...riskAnalysis,
            permissionDetails,
            recommendations: this.getAppRecommendations(riskAnalysis),
        };
    }

    /**
     * Get recommendation for specific permission
     */
    static getPermissionRecommendation(permission, riskLevel) {
        switch (riskLevel) {
            case this.RISK_LEVELS.HIGH:
                return `⚠️ High Risk: Review why this app needs ${permission.toLowerCase()} access. Consider alternatives or disable if not essential.`;
            case this.RISK_LEVELS.MEDIUM:
                return `⚠️ Medium Risk: Monitor usage of ${permission.toLowerCase()} access and review periodically.`;
            case this.RISK_LEVELS.LOW:
                return `ℹ️ Low Risk: ${permission.toLowerCase()} access is generally safe for this type of app.`;
            default:
                return '✅ Safe: This permission is typically safe.';
        }
    }

    /**
     * Get overall app security recommendations
     */
    static getAppRecommendations(riskAnalysis) {
        const recommendations = [];

        if (riskAnalysis.highRiskCount >= 3) {
            recommendations.push({
                type: 'critical',
                title: 'High Privacy Risk',
                message: 'This app has multiple high-risk permissions. Consider if you really need all these features.',
                action: 'Review permissions in device settings',
            });
        }

        if (riskAnalysis.highRiskCount >= 1) {
            recommendations.push({
                type: 'warning',
                title: 'Privacy Sensitive',
                message: 'This app can access sensitive data. Monitor its behavior regularly.',
                action: 'Check app activity periodically',
            });
        }

        if (riskAnalysis.riskScore === 0) {
            recommendations.push({
                type: 'safe',
                title: 'Low Privacy Impact',
                message: 'This app has minimal privacy risks.',
                action: 'No immediate action needed',
            });
        }

        return recommendations;
    }

    /**
     * Check if usage stats permission is granted (Android specific)
     */
    static async checkUsageStatsPermission() {
        if (Platform.OS !== 'android') {
            return false;
        }

        // This would need to be implemented in native code
        // For now, we'll assume it's not granted
        return false;
    }

    /**
     * Request usage stats permission (Android specific)
     */
    static async requestUsageStatsPermission() {
        if (Platform.OS !== 'android') {
            return false;
        }

        Alert.alert(
            'Permission Required',
            'To monitor app behavior, this app needs access to usage statistics. You will be redirected to settings.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Open Settings',
                    onPress: () => {
                        // Open usage access settings
                        Linking.openSettings();
                    },
                },
            ]
        );

        return false;
    }

    /**
     * Check standard permissions
     */
    static async checkPermissions() {
        if (Platform.OS !== 'android') {
            return {};
        }

        try {
            const permissions = {};
            // Check permissions that exist in the PermissionsAndroid module
            if (PermissionsAndroid.PERMISSIONS.ACCESS_NETWORK_STATE) {
                permissions.accessNetworkState = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_NETWORK_STATE);
            }

            return permissions;
        } catch (error) {
            return {};
        }
    }

    /**
     * Request standard permissions
     */
    static async requestPermissions() {
        if (Platform.OS !== 'android') {
            return {};
        }

        try {
            const permissionsToRequest = [];
            // Only request permissions that exist
            if (PermissionsAndroid.PERMISSIONS.ACCESS_NETWORK_STATE) {
                permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.ACCESS_NETWORK_STATE);
            }

            if (permissionsToRequest.length === 0) {
                return {};
            }

            const grants = await PermissionsAndroid.requestMultiple(permissionsToRequest);
            return grants;
        } catch (error) {
            return {};
        }
    }

    /**
     * Format permissions for display
     */
    static formatPermissionName(permission) {
        return permission.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Get permission icon based on type
     */
    static getPermissionIcon(permission) {
        switch (permission) {
            case 'CAMERA': return '📷';
            case 'LOCATION': return '📍';
            case 'MICROPHONE': return '🎤';
            case 'CONTACTS': return '👥';
            case 'PHONE': return '📞';
            case 'SMS': return '💬';
            case 'STORAGE': return '💾';
            case 'CALENDAR': return '📅';
            case 'SENSORS': return '⌚';
            case 'USAGE_ACCESS': return '📊';
            case 'CALL_LOG': return '📋';
            case 'ACTIVITY_RECOGNITION': return '🏃';
            case 'NOTIFICATIONS': return '🔔';
            case 'BLUETOOTH': return '📡';
            case 'NEARBY_DEVICES': return '📶';
            default: return '⚙️';
        }
    }
}