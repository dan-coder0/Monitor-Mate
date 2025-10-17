import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

/**
 * ErrorBoundary component for handling errors in production
 * Provides user-friendly error messages and recovery options
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo
        });

        // TODO: In production, report to error monitoring service
        // ErrorReportingService.reportError(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ 
            hasError: false, 
            error: null, 
            errorInfo: null 
        });
    }

    handleReportIssue = () => {
        Alert.alert(
            'Report Issue',
            'Would you like to report this issue to help us improve the app?',
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Yes', 
                    onPress: () => {
                        // TODO: Implement issue reporting
                        Alert.alert('Thank you', 'Your feedback helps us improve the app.');
                    }
                }
            ]
        );
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <View style={styles.errorContent}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                        <Text style={styles.errorMessage}>
                            The app encountered an unexpected error. This might be due to:
                        </Text>
                        <View style={styles.possibleCauses}>
                            <Text style={styles.causeItem}>• Missing system permissions</Text>
                            <Text style={styles.causeItem}>• Incompatible device configuration</Text>
                            <Text style={styles.causeItem}>• Temporary system issue</Text>
                        </View>
                        
                        <View style={styles.actionButtons}>
                            <TouchableOpacity 
                                style={[styles.button, styles.retryButton]}
                                onPress={this.handleRetry}
                            >
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.button, styles.reportButton]}
                                onPress={this.handleReportIssue}
                            >
                                <Text style={styles.reportButtonText}>Report Issue</Text>
                            </TouchableOpacity>
                        </View>

                        {__DEV__ && (
                            <View style={styles.debugInfo}>
                                <Text style={styles.debugTitle}>Debug Information:</Text>
                                <Text style={styles.debugText}>
                                    {this.state.error?.message}
                                </Text>
                                <Text style={styles.debugText}>
                                    {this.state.errorInfo?.componentStack?.slice(0, 200)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        maxWidth: 350,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    possibleCauses: {
        alignSelf: 'stretch',
        marginBottom: 24,
    },
    causeItem: {
        fontSize: 13,
        color: '#888',
        marginBottom: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    retryButton: {
        backgroundColor: '#007AFF',
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    reportButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    reportButtonText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 14,
    },
    debugInfo: {
        marginTop: 24,
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        alignSelf: 'stretch',
    },
    debugTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 10,
        color: '#888',
        fontFamily: 'monospace',
        marginBottom: 4,
    },
});

export default ErrorBoundary;