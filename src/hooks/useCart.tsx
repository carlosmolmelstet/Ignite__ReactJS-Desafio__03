import { AxiosResponse } from 'axios';
import { createContext, ReactNode, useContext, useState } from 'react';
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const item = cart.filter(item => item.id == productId);
      var index = cart.findIndex((obj => obj.id == productId));

      let stock = await api.get<Stock>(`stock/${productId}`).then((response: AxiosResponse<Stock>) => response.data.amount);

      if(stock < cart[index]?.amount + 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      api.get<Product>(`products/${productId}`).then((response: AxiosResponse) => {
        if(item.length == 0) {
          const item =  {...response.data, amount:  1};
          setCart([
            ...cart,
            item
          ]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, item]));

        } else {
          const newCart = [...cart];
          newCart[index].amount = newCart[index].amount + 1;
          setCart(newCart);
         localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        }

      });
    } catch {
      toast.error('Erro na adição do produto');
   }
  };

  const removeProduct = (productId: number) => {
    try {
      var itemExist = cart.filter(product => product.id === productId);
      if(itemExist.length < 1) {
        toast.error('Erro na remoção do produto');
        return;
      }
      const removeIndex = cart.findIndex(product => product.id === productId);
      const newCart = [...cart];
      newCart.splice(removeIndex, 1);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);

    } catch {
      toast.error('Erro na remoção do produto');
     }
     
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) {
        return;
      }

      var index = cart.findIndex((obj => obj.id == productId));

      let stock = await api.get<Stock>(`stock/${productId}`).then((response: AxiosResponse<Stock>) => response.data.amount);
      if(stock < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = [...cart];
      newCart[index].amount = amount;
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

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
