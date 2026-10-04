import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// TODO: Define interfaces for CartItemData and CartItemProps
interface CartItemData{
  item_id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number 
  stock_quantity: number;
}

interface CartItemProps{
  item: CartItemData;
  onUpdateQuantity: (product_id: number,quantity:number) => void;
}

const CartItem = ({ item, onUpdateQuantity }: any) => {

    const increase = () => {
      if(item.quantity < item.stock_quantity){
        onUpdateQuantity(item.product_id,item.quantity + 1);
      }
      // else any msg ?
    } 

    const decrease = () => {
      onUpdateQuantity(item.product_id,Math.max(item.quantity-1,0));
    }

    return (
        <View style={styles.card}>
            <View style={styles.itemInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>₹ {item.price}</Text>
            </View>
            <View style={styles.quantitySection}> 
              <TouchableOpacity style={styles.button} onPress={decrease}>
                <Text style ={styles.buttonText}>-</Text>
              </TouchableOpacity>
              <Text style ={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.button} onPress={increase}>
                <Text style ={styles.buttonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.total}>
              Total Price : ₹{(item.price * item.quantity).toFixed(2)}
            </Text>
        </View>
    );
};

// TODO: Define styles

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 10,
    elevation: 3,
  },
  itemInfo: {
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  price: {
    fontSize: 16,
    marginTop: 4,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#007bff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 18,
    fontWeight: "bold",
  },
  total: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 5,
  },
});

export default CartItem;


{/* 
    TODO: Implement the CartItem UI
    Hints:
    1. Define and use styles (card, itemInfo, productName, etc.)
    2. Display product name and price
    3. Create a quantity control section with '-' and '+' buttons
    4. Use the onUpdateQuantity prop to handle quantity changes
        - Decrease: Math.max(0, item.quantity - 1)
        - Increase: item.quantity + 1
    5. Display the total for this item (price * quantity)
        - Use toFixed(2) for formatting
*/}