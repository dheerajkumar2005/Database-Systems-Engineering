import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface Product {
    product_id: string | number;
    name: string;
    description: string;
    price: number | string;
    stock_quantity: number;
    image_url?: string;
}

interface ProductItemProps {
    item: Product;
    quantity?: number;
    onUpdateQuantity: (id: string | number, quantity: number) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({ item, quantity = 0, onUpdateQuantity }) => {

    return (
        // View maps to platform-specific UI view (UIView on iOS, android.view.View on Android).
        // It doesn't have semantic meaning like <section> or <article>, it's purely structural.
        <View style={styles.card}>
            <View style={styles.content}>
                {/* Text: All text strings must be wrapped in a <Text> component. 
                    You cannot put text strings directly inside a <View> like you can with <div>. */}
                <Text style={styles.productName}>{item.name}</Text>

                {/* numberOfLines: Native truncation. Replaces classic CSS 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis' */}
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

                <Text style={styles.price}>₹{item.price}</Text>
                <Text style={styles.stock}>Stock: {item.stock_quantity}</Text>

                {item.stock_quantity > 0 ? (
                    <View style={styles.actionContainer}>
                        <View style={styles.quantityContainer}>
                            {/* TouchableOpacity: A wrapper that reduces opacity when pressed.
                                Unlike web, there are no built-in :hover states. 
                                We use specific components (TouchableHighlight, Pressable) for touch feedback. */}
                            <TouchableOpacity
                                onPress={() => onUpdateQuantity(item.product_id, Math.max(0, quantity - 1))}
                                style={styles.qtyButton}
                            >
                                <Text style={styles.qtyButtonText}>-</Text>
                            </TouchableOpacity>

                            <Text style={styles.qtyText}>{quantity}</Text>

                            <TouchableOpacity
                                onPress={() => onUpdateQuantity(item.product_id, quantity + 1)}
                                style={styles.qtyButton}
                            >
                                <Text style={styles.qtyButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.button, styles.disabledButton]}>
                        <Text style={styles.buttonText}>Out of Stock</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        flexDirection: 'row',
        // Shadow props: iOS specific (shadowColor, shadowOffset, etc.)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Elevation: Android specific way to create shadows/depth
        elevation: 3,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    description: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    price: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
        marginBottom: 2,
    },
    stock: {
        fontSize: 12,
        color: '#888',
        marginBottom: 10,
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    qtyButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    qtyButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '600',
        marginHorizontal: 10,
        minWidth: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ProductItem;
