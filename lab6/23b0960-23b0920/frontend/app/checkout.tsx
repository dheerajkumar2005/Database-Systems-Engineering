import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { apiCall } from '../utils/api';

export default function Checkout() {
    // TODO: Define state variables (address, loading)
    const router = useRouter();
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [loading, setLoading] = useState(false);

    const placeOrder = async () => {
        // TODO: Implement placeOrder
        // 1. Validate that all address fields are filled
        // 2. Call API '/place-order' with address data
        // 3. On success, show alert and navigate to home ('/(tabs)')
        
        if(!address.street || !address.city || !address.state || !address.pincode){
            Alert.alert('Error', 'Please fill all boxes');
            return;
        }   

        try{
            setLoading(true);

            // sleep 
            // await new Promise(resolve => setTimeout(resolve, 3000));

            await apiCall('/place-order',{
                method: 'POST',
                body: {address}
            });

            Alert.alert('Success', 'Order placed successfully!'); // check this 
            router.replace('/(tabs)');

        }catch (error) {
            Alert.alert('Error', 'Failed to place order');
        }finally {
            setLoading(false);
        }
    };

    const updateAddress = (field : string, val: string) => {
        setAddress((prev) => ({
            ...prev,
            [field] : val
        }))
    };

    return (
        <SafeAreaView style = {styles.container} edges={['bottom', 'left', 'right']}>
            <Stack.Screen options={{ title: 'Checkout', headerShown: true, headerBackTitle: 'Back' }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{flex: 1}}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>Shipping Address</Text>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder='Street'
                            value={address.street}
                            onChangeText={(val)=>updateAddress('street',val)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder='City'
                            value={address.city}
                            onChangeText={(val)=>updateAddress('city',val)}
                        />
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, styles.halfInput]}
                                placeholder='State'
                                value={address.state}
                                onChangeText={(val)=>updateAddress('state',val)}
                            />
                            <TextInput
                                style={[styles.input, styles.halfInput]}
                                placeholder='Pincode'
                                value={address.pincode}
                                onChangeText={(val)=>updateAddress('pincode',val)}
                            />
                        </View>
                    </View>
                    <View>
                        <TouchableOpacity 
                            onPress={placeOrder}
                            style={[styles.button,loading && styles.buttonDisabled]}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.buttonText}>Placing Order...</Text>
                            ):(
                                <Text style={styles.buttonText}>Place Order</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 20,
        textAlign: 'center',
    },
    form: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 14,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    halfInput: {
        flex: 1,
    },
    button: {
        backgroundColor: '#28a745',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

{/* 
    1.Fix the alert msg in 3 places  
    2.what to do if quantity > stock quantity
*/}
