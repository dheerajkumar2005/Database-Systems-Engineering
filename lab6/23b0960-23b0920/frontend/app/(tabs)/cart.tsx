import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ListRenderItemInfo, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import CartItem from '../../components/CartItem';
import { apiCall } from '../../utils/api';
// import { FlatList } from 'react-native/types_generated/index';

// TODO: Define CartItemData interface
interface CartItemData{
  item_id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  stock_quantity: number;
}

export default function Cart() {
    // TODO: Define state variables (cartItems, totalPrice, loading)
    const router = useRouter();
    const [cartItems,setCartItems] = useState<CartItemData[]>([]);
    const [totalPrice,setTotalPrice] = useState<number>(0);
    const [loading,setLoading] = useState<boolean>(true);

    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [])
    );

    const fetchCart = async () => {
        // TODO: Implement fetchCart logic
        // Hint: You'll need to use the apiCall utility and set state
        try{
          setLoading(true);

          const resp = await apiCall('/display-cart',{method: 'GET',});
          setCartItems(resp.cart || []);
          setTotalPrice(resp.totalPrice || 0);
        } catch (error){
          console.error('Error: Cant Fetch cart.\n',error);
        } finally{
          setLoading(false);
        }
    };

    // Function to handle quantity updates
    const handleUpdateQuantity = async (productId: string | number, newQuantity: number) => {
        // TODO: Implement handleUpdateQuantity logic
        // Hint: This involves calling the API and updating local state
        try{
          if(newQuantity === 0){
            await apiCall('/remove-from-cart',{
              method:'POST',
              body:{product_id:productId},
            });
          }
          else{
            await apiCall('/update-cart',{
              method: 'POST',
              body:{
                product_id: productId,
                quantity: newQuantity
              }
            });
          }
          fetchCart(); 
        } catch (error){
          console.error('Error: Cant handle update.\n',error);
        }
    };

    const renderItem = ({ item }: ListRenderItemInfo<any>) => (
        <CartItem item={item} onUpdateQuantity={handleUpdateQuantity} />
    );

    const handleCheckout = () => (router.push('/checkout'));
    //
    // if (loading) {
    // //  TODO: Handle loading state (return ActivityIndicator)
    // }

    return (
        <SafeAreaView style={styles.container}
          edges={['top', 'left', 'right']}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{flex: 1}}
            >
                <Text style={styles.title}>My Cart</Text>

                {cartItems.length === 0 ? (
                  <View style={styles.center}>
                    <Text>Cart is empty</Text>
                  </View>
                ):(
                  <>
                    <FlatList
                        data = {cartItems}
                        renderItem = {renderItem}
                        keyExtractor={(item) => item.item_id.toString()}
                    />

                    <View style={styles.footer}>
                      <Text style={styles.totalText}>
                        Total Cost: ₹ {totalPrice}
                      </Text>

                      <TouchableOpacity 
                        style={styles.checkoutButton}
                        onPress={handleCheckout}
                      >
                        <Text style={styles.checkoutText}>Checkout</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// TODO: Define styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

{/* 
    TODO: Implement the Cart UI 
    - Handle empty cart state
    - Render list of items if cart is not empty
    - Render footer with total price and checkout button
*/}
