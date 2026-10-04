import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiCall } from '../../utils/api';
import ProductItem, { Product } from '../../components/ProductItem';
import { useFocusEffect } from 'expo-router';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cartItems, setCartItems] = useState<{ [key: string]: number }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // useFocusEffect: Specific to navigation (like expo-router/react-navigation).
    // It runs the effect when the screen comes into focus, similar to valid focus events in web.
    // Useful for refreshing data when navigating back to this screen.
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsData, cartData] = await Promise.all([
                apiCall('/list-products'),
                apiCall('/display-cart', { silent: true }).catch(e => ({ cart: [] }))
            ]);

            setProducts(productsData.products);

            const cartMap: { [key: string]: number } = {};
            if (cartData && cartData.cart) {
                cartData.cart.forEach((item: any) => {
                    cartMap[item.product_id] = item.quantity;
                });
            }
            setCartItems(cartMap);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (productId: string | number, newQuantity: number) => {
        // "Pessimistic Update": We wait for the backend to confirm before updating the UI.
        // In mobile apps, you might often see "Optimistic Updates" (update UI immediately, revert if fails)
        // because mobile networks can be flaky/slow, making the app feel more responsive.
        // We are using pessimistic here for simplicity.

        try {
            if (newQuantity === 0) {
                await apiCall('/remove-from-cart', {
                    method: 'POST',
                    body: { product_id: productId },
                    silent: true
                });
            } else {
                await apiCall('/add-to-cart', {
                    method: 'POST',
                    body: { product_id: productId, quantity: newQuantity },
                    silent: true
                });
            }

            setCartItems(prev => ({
                ...prev,
                [productId]: newQuantity
            }));

        } catch (error: any) {
            console.error("Update failed", error);
            Alert.alert('Error', error.message || 'Failed to update cart');
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            // View is the fundamental building block of UI, similar to a <div> in web.
            // Unlike <div>, it's not focusable/interactive by default and doesn't scroll logic.
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        // SafeAreaView: Essential in mobile to handle notches, status bars, and home indicators.
        // It applies padding so content isn't obscured by hardware features.
        // edges prop controls which sides are protected.
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
            <Text style={styles.title}>Products</Text>
            <View style={styles.searchContainer}>
                {/* TextInput is the native equivalent of <input type="text">. 
                    It doesn't share the same CSS styling properties (e.g., no outline: none). */}
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* FlatList: The standard way to render lists in React Native.
                Unlike .map() in web which renders all DOM nodes, FlatList virtualizes items.
                It only renders items currently on screen + a buffer, recycling views for performance.
                Essential for mobile memory management with long lists. */}
            <FlatList
                data={filteredProducts}
                renderItem={({ item }) => (
                    <ProductItem
                        item={item}
                        quantity={cartItems[item.product_id] || 0}
                        onUpdateQuantity={handleUpdateQuantity}
                    />
                )}
                keyExtractor={(item) => item.product_id.toString()}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

// StyleSheet.create: Not strictly required (you can use plain objects), 
// but it validates styles at runtime and can offer performance optimizations.
// React Native styles are not CSS, but they look similar (camelCase, no units like 'px').
// Flexbox is the default layout model and defaults to flexDirection: 'column'.
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    searchInput: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        fontSize: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 15,
        paddingBottom: 100, // Padding inside the scroll view, useful to avoid content being hidden behind bottom navigation
    },
});
