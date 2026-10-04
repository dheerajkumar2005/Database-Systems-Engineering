import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';

import ErrorScreen from '../components/ErrorScreen';

function RootLayoutNav() {
    const { user, isLoading, error, retry } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        if (rootNavigationState?.key) {
            setIsNavigationReady(true);
        }
    }, [rootNavigationState]);

    useEffect(() => {
        if (isLoading || !isNavigationReady) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (error) {
            return;
        }

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading, isNavigationReady, error]);

    if (isLoading || !isNavigationReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (error) {
        return <ErrorScreen message={error} onRetry={retry} />;
    }

    // Stack: Expo Router's implementation of Native Stack Navigator.
    // It pushes screens on top of each other, providing native platform animations/gestures.
    // Similar to a browser history stack but with visual transitions.
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
    );
}

export default function RootLayout() {
    // SafeAreaProvider: Must be at the root of the app to provide insets context
    // for all SafeAreaView components in the tree.
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <RootLayoutNav />
            </AuthProvider>
        </SafeAreaProvider>
    );
}
