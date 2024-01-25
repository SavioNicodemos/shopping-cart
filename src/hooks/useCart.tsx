import { ReactNode, createContext, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { ProductRequest } from '../pages/Home';
import { api } from '../services/api';
import { Product, Stock } from '../types';

type CartProviderProps = {
  children: ReactNode;
};

type UpdateProductAmount = {
  productId: number;
  amount: number;
};

type CartContextData = {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
};

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storedCart = localStorage.getItem('@RocketShoes:cart');

    if (storedCart) {
      return JSON.parse(storedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId);
      if (product) {
        updateProductAmount({ productId, amount: product.amount + 1 });
        return;
      }

      const response = await api.get<ProductRequest>(`/products/${productId}`).catch(() => {
        throw new Error('Erro na adição do produto');
      });
      const newProduct = {
        ...response.data,
        id: parseInt(response.data.id),
        amount: 1,
      };

      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]));

      setCart([...cart, newProduct]);
    } catch (error) {
      let message = 'Erro na adição do produto';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const filteredProducts = cart.filter(product => product.id !== productId);
      if (filteredProducts.length === cart.length) {
        throw new Error('Produto não encontrado');
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProducts));

      setCart(filteredProducts);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      if (amount <= 1) {
        throw new Error('A quantidade mínima é 1');
      }

      const product = cart.find(product => product.id === productId);
      if (!product) {
        throw new Error('Erro na alteração de quantidade do produto');
      }

      const response = await api.get<Stock>(`/stock/${productId}`);
      if (amount > response.data.amount) {
        throw new Error('Quantidade solicitada fora de estoque');
      }

      const filteredProducts = cart.filter(product => product.id !== productId);

      const newProducts = [...filteredProducts, { ...product, amount }];

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts));

      setCart(newProducts);
    } catch (error) {
      let message = 'Erro na alteração de quantidade do produto';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
