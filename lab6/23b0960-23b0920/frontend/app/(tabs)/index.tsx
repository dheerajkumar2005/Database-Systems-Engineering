import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function Home() {
    const { user, logout } = useAuth();

    // useRouter: Navigation hook from expo-router (built on top of React Navigation).
    // Allows imperative navigation (e.g., router.push, router.replace).
    // Similar to next/router or react-router-dom's useHistory.
    const router = useRouter();

    return (
        // SafeAreaView: Automatically applies padding to avoid notches and home indicators.
        // It's a standard practice to wrap the top-level screen component in this.
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
            <Text style={styles.title}>Welcome, {user?.username || 'User'}!</Text>
            <Text style={styles.subtitle}>Explore our products and manage your cart.</Text>

            <View style={styles.buttonContainer}>
                {/* TouchableOpacity: Simple touch feedback. 
                    Reduces opacity of the child view when pressed. 
                    It's the most common "button" primitive in React Native. */}
                <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/products')}>
                    <Text style={styles.buttonText}>View Products</Text>
                </TouchableOpacity>

                {/* Array of styles: React Native supports passing an array of style objects.
                    The objects are merged from left to right.
                    Here, styles.logoutButton overwrites properties in styles.button. */}
                <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
                    <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // "flex: 1" is the standard way to fill the screen in RN (no "height: 100vh").
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    buttonContainer: {
        width: '100%',
        gap: 15
    },
    button: {
        backgroundColor: '#007AFF', // Standard iOS blue
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#FF3B30', // Standard iOS red
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
