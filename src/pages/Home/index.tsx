import { useEffect, useState } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { CanceledError } from 'axios';
import { toast } from 'react-toastify';
import { useCart } from '../../hooks/useCart';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { ProductList } from './styles';

export type ProductRequest = {
  id: string;
  title: string;
  price: number;
  image: string;
};

type ProductFormatted = Omit<ProductRequest, 'id'> & {
  id: number;
  priceFormatted: string;
};

type CartItemsAmount = {
  [key: number]: number;
};

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
    return { ...sumAmount, [product.id]: product.amount };
  }, {} as CartItemsAmount);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await api.get<ProductRequest[]>('products', { signal: controller.signal });
        const data = response.data.map(product => ({
          ...product,
          id: parseInt(product.id),
          priceFormatted: formatPrice(product.price),
        }));
        setProducts(data);
      } catch (error) {
        if (!(error instanceof CanceledError)) toast.error('Erro ao carregar produtos.');
        setProducts([]);
      }
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>
      {products.map(product => (
        <li key={product.id}>
          <img src={product.image} alt={product.title} />
          <strong>{product.title}</strong>
          <span>{product.priceFormatted}</span>
          <button
            type='button'
            data-testid='add-product-button'
            onClick={() => handleAddProduct(product.id)}
          >
            <div data-testid='cart-product-quantity'>
              <MdAddShoppingCart size={16} color='#FFF' />
              {cartItemsAmount[product.id] || 0}
            </div>

            <span>ADICIONAR AO CARRINHO</span>
          </button>
        </li>
      ))}
    </ProductList>
  );
};

export default Home;
