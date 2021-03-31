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
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productOnCartIndex = cart.findIndex(product => product.id === productId); // Check if product is inside cart

        if (productOnCartIndex !== -1) {
          updateProductAmount({productId: productId, amount: cart[productOnCartIndex].amount + 1})
          
        } else {
          
          const productResponse = await api.get(`products/${productId}`);
          const productToAdd = productResponse.data
          productToAdd.amount = 1
          setCart([...cart, productToAdd])
          const updatedCart = [...cart, productToAdd];
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        }

    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)
      if (!productExists) {
        toast.error('Erro na remoção do produto')
        return
      }
      const updatedCart = [...cart];
      const index = cart.findIndex(product => product.id === productId);
      updatedCart.splice(index, 1);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount < 1) {
        return 
      }

      const productOnCartIndex = cart.findIndex(product => product.id === productId);
      const stockResponse = await api.get(`stock/${productId}`);
      const currentProductStockInfo = stockResponse.data as Stock;

      

      if (currentProductStockInfo.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
     
      
      const updatedCart = [...cart];
      updatedCart[productOnCartIndex].amount = amount;
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      

    } catch {
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
