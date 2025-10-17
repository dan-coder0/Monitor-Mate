import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Component to display the risk level of an app
 * 
 * @param {string} risk - The risk level ('high', 'medium', 'low', 'none')
 * @param {object} style - Additional styles for the badge
 */
const RiskBadge = ({ risk, style }) => {
    const getBadgeStyle = () => {
        switch (risk) {
            case 'high':
                return styles.highRisk;
            case 'medium':
                return styles.mediumRisk;
            case 'low':
                return styles.lowRisk;
            case 'none':
                return styles.noRisk;
            default:
                return styles.unknown;
        }
    };

    const getRiskText = () => {
        switch (risk) {
            case 'high':
                return 'High Risk';
            case 'medium':
                return 'Medium Risk';
            case 'low':
                return 'Low Risk';
            case 'none':
                return 'No Risk';
            default:
                return 'Unknown';
        }
    };

    return (
        <View style={[styles.badge, getBadgeStyle(), style]}>
            <Text style={styles.text}>{getRiskText()}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    text: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    highRisk: {
        backgroundColor: '#ff4d4d',
    },
    mediumRisk: {
        backgroundColor: '#ff9933',
    },
    lowRisk: {
        backgroundColor: '#ffcc00',
    },
    noRisk: {
        backgroundColor: '#33cc66',
    },
    unknown: {
        backgroundColor: '#999999',
    },
});

export default RiskBadge;