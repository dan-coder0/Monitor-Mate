import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RiskCategoryButton = ({ title, count, style, onPress }) => {
    // Get appropriate icon based on title
    const getIcon = () => {
        if (title.includes('High Risk')) return '🚨';
        if (title.includes('Medium Risk')) return '⚠️';
        if (title.includes('Low Risk')) return '🟢 ';
        if (title.includes('No Risk')) return '🛡️';
        return '📱';
    };

    return (
        <TouchableOpacity 
            style={[styles.container, style]} 
            onPress={onPress}
            activeOpacity={0.85}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{getIcon()}</Text>
                </View>
                <Text style={styles.count}>{count}</Text>
                <Text style={styles.title}>{title}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 120,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        fontSize: 20,
    },
    count: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 18,
        opacity: 0.9,
    },
});

export default RiskCategoryButton;