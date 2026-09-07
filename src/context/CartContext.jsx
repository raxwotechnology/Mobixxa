'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Initialize with initial sample cart items if needed, or empty
  const [cartItems, setCartItems] = useState([
    {
      id: 'prod-004',
      name: 'Anker Prime 67W GaN 3-Port Wall Charger',
      brand: 'Anker',
      price: 18500,
      originalPrice: 22000,
      thumbnail: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80',
      quantity: 1,
      warranty: '1-Year Official Warranty',
    },
    {
      id: 'prod-007',
      name: 'Apple AirPods Pro (2nd Generation) with USB-C Case',
      brand: 'Apple',
      price: 78000,
      originalPrice: 86000,
      thumbnail: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=80',
      quantity: 1,
      warranty: '1-Year Apple Care',
    },
  ]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mobixa_cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load cart from localStorage', e);
    }
    setMounted(true);
  }, []);

  // Save to localStorage whenever cartItems changes
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('mobixa_cart', JSON.stringify(cartItems));
      } catch (e) {
        console.warn('Could not save cart to localStorage', e);
      }
    }
  }, [cartItems, mounted]);

  // Derived counts and totals
  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  }, [cartItems]);

  // Actions
  const addToCart = (product, quantity = 1, options = {}) => {
    setCartItems((prevItems) => {
      const existingIdx = prevItems.findIndex((item) => item.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prevItems];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
          warranty: options.warranty || updated[existingIdx].warranty,
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            originalPrice: product.originalPrice,
            thumbnail: product.thumbnail || (product.gallery && product.gallery[0]),
            quantity: Math.max(1, quantity),
            warranty: options.warranty || '1-Year Official Warranty',
          },
        ];
      }
    });

    if (options.openDrawer !== false) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
