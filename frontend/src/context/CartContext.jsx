"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [activeTab, setActiveTab] = useState("cart"); // 'cart' | 'history'

  // Sync from localStorage on mount & on storage/custom events
  useEffect(() => {
    const loadCart = () => {
      try {
        const stored = localStorage.getItem("mobixa_cart");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load cart from localStorage", e);
      }
      setCartItems([]);
    };

    loadCart();

    const handleCartChange = () => loadCart();
    window.addEventListener("cartChange", handleCartChange);
    window.addEventListener("storage", handleCartChange);

    return () => {
      window.removeEventListener("cartChange", handleCartChange);
      window.removeEventListener("storage", handleCartChange);
    };
  }, []);

  // Helper to persist and notify
  const persistCart = (newItems) => {
    try {
      localStorage.setItem("mobixa_cart", JSON.stringify(newItems));
      setCartItems(newItems);
      window.dispatchEvent(new Event("cartChange"));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  /**
   * addToCart(product, quantity = 1, selectedColor, selectedStorage)
   */
  const addToCart = (product, quantity = 1, selectedColor, selectedStorage) => {
    const colorName =
      typeof selectedColor === "string"
        ? selectedColor
        : selectedColor?.name || product.swatches?.[0]?.name || "Standard";

    const storageSize =
      typeof selectedStorage === "string"
        ? selectedStorage
        : selectedStorage?.size || product.storages?.[0]?.size || "";

    const price =
      (selectedStorage && selectedStorage.price) ||
      product.price ||
      product.basePrice ||
      "0.00";

    const cartItemId = `${product.id}-${colorName}-${storageSize || "default"}`;

    const existingIndex = cartItems.findIndex(
      (item) => item.cartItemId === cartItemId || item.key === cartItemId
    );

    let updated;
    if (existingIndex > -1) {
      updated = [...cartItems];
      updated[existingIndex].quantity =
        (updated[existingIndex].quantity || 1) + quantity;
    } else {
      updated = [
        ...cartItems,
        {
          cartItemId,
          key: cartItemId,
          id: product.id,
          name: product.title || product.name,
          price: price,
          color: colorName,
          storage: storageSize,
          deviceType: product.deviceType || "phone",
          colorCode: selectedColor?.color || product.swatches?.[0]?.color,
          quantity: quantity,
        },
      ];
    }

    persistCart(updated);
  };

  const removeFromCart = (cartItemId) => {
    const updated = cartItems.filter(
      (item) => item.cartItemId !== cartItemId && item.key !== cartItemId && item.id !== cartItemId
    );
    persistCart(updated);
  };

  const updateQuantity = (cartItemId, delta) => {
    const updated = cartItems
      .map((item) => {
        if (item.cartItemId === cartItemId || item.key === cartItemId || item.id === cartItemId) {
          const newQty = (item.quantity || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    persistCart(updated);
  };

  const clearCart = () => {
    persistCart([]);
  };

  // Helper to parse price string like "339,900.00" into numeric value
  const parsePrice = (priceVal) => {
    if (typeof priceVal === "number") return priceVal;
    if (!priceVal) return 0;
    const cleanStr = String(priceVal).replace(/[^0-9.]/g, "");
    return parseFloat(cleanStr) || 0;
  };

  const cartCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const cartTotalNumber = cartItems.reduce((sum, item) => {
    const numericPrice = parsePrice(item.price);
    return sum + numericPrice * (item.quantity || 1);
  }, 0);

  const cartTotal = cartTotalNumber.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <CartContext.Provider
      value={{
        isCartOpen,
        cartItems,
        activeTab,
        setActiveTab,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        cartTotalNumber,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
