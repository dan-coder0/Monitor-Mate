import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

/**
 * A reusable loading indicator component
 * 
 * @param {string} message - Optional loading message to display
 * @param {string} size - Size of the activity indicator ('small' or 'large')
 * @param {string} color - Color of the activity indicator
 */
const LoadingIndicator = ({
    message = 'Loading...',
    size = 'small',
    color = '#0066cc'
}) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={color} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default LoadingIndicator;