import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      console.log(JSON.parse(storagedCart))
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      // const stockResponse = await api.get(`stock/${productId}`);
      const productResponse = await api.get(`products/${productId}`);

      const productToAdd = productResponse.data
      const productOnCartIndex = cart.findIndex(product => product.id === productId); // Check if product is inside cart

      // if (productToAdd) {
        if (productOnCartIndex !== -1) {

          const updatedCart = cart;
          updatedCart[productOnCartIndex].amount += 1
          setCart([...updatedCart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); 
          
        } else {
          productToAdd.amount = 1
          setCart([...cart, productToAdd])
          const updatedCart = [...cart, productToAdd];
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        }
      // }

    } catch (error) {
      toast.error('Erro na adição do produto');
      console.log(error);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const index = cart.findIndex(product => product.id === productId);
      if (!index) {
        toast.error('Erro na remoção do produto')
        return
      }
      const updatedCart = [...cart];
      updatedCart.splice(index, 1);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      // TODO
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const productOnCartIndex = cart.findIndex(product => product.id === productId);
      const stockResponse = await api.get(`stock/${productId}`);
      const currentProductStockInfo = stockResponse.data as Stock;

      if (amount <= 0) {
        return;
      } else if (cart[productOnCartIndex].amount >= currentProductStockInfo.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
     
      const updatedCart = [...cart];
      updatedCart[productOnCartIndex].amount = amount;
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
