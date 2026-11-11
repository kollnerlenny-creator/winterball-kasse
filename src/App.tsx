/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Snowflake,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  CupSoda,
  Utensils,
  RefreshCw,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

import { auth, db, PATH, activeConfig, DEFAULT_FIREBASE_CONFIG } from './firebase';
import {
  InventoryItem,
  CartItem,
  Order,
  FinanceStats,
  PosType,
  ViewType,
} from './types';
import { SAMPLE_PRODUCTS } from './sampleData';

import { OrderView } from './components/Views/OrderView';
import { CustomerSelectView } from './components/Views/CustomerSelectView';
import { CustomerView } from './components/Views/CustomerView';
import { DashboardView } from './components/Views/DashboardView';
import { HistoryView } from './components/Views/HistoryView';
import { InventoryView } from './components/Views/InventoryView';

import { FirebaseStatusModal } from './components/FirebaseStatusModal';
import { Screensaver } from './components/Screensaver';
import { PinModal } from './components/PinModal';
import { SizeModal } from './components/SizeModal';
import { DonationModal } from './components/DonationModal';
import { PaymentModal } from './components/PaymentModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SaleSuccessOverlay } from './components/SaleSuccessOverlay';

const STORAGE_INV_KEY = 'winterball_inventory_cache';
const STORAGE_ORDERS_KEY = 'winterball_orders_cache';
const STORAGE_STATS_KEY = 'winterball_stats_cache';

export default function App() {
  // Current view state
  const [currentView, setCurrentView] = useState<ViewType>('order');
  const [currentPos, setCurrentPos] = useState<PosType>(1); // 1 = Getränke, 2 = Speisen
  const [customerPos, setCustomerPos] = useState<PosType>(1);

  // Firestore live data state with initial local cache fallback
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INV_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [financeStats, setFinanceStats] = useState<FinanceStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STATS_KEY);
      return saved ? JSON.parse(saved) : { expenses: 0, cashStart: 0 };
    } catch {
      return { expenses: 0, cashStart: 0 };
    }
  });

  // Local POS cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Firebase auth & connection status
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  // Modals state
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProductForVar, setSelectedProductForVar] = useState<string | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [saleSuccessAmount, setSaleSuccessAmount] = useState<number>(0);
  const [showSaleSuccess, setShowSaleSuccess] = useState(false);

  // Confirm dialog state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Screensaver & Toast state
  const [screensaverActive, setScreensaverActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const idleSecondsRef = useRef(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Helper to ensure authenticated user before calling write operations
  const ensureAuth = async (): Promise<User | null> => {
    if (auth.currentUser) return auth.currentUser;
    try {
      const cred = await signInAnonymously(auth);
      setUser(cred.user);
      return cred.user;
    } catch (err: any) {
      console.warn("Could not sign in anonymously:", err);
      return null;
    }
  };

  // --- 1. FIREBASE AUTHENTICATION (Anonymous Kiosk Auth) ---
  const initAuth = async () => {
    setFirebaseStatus('connecting');
    setFirebaseError(null);
    try {
      const cred = await signInAnonymously(auth);
      setUser(cred.user);
      setFirebaseStatus('connected');
    } catch (err: any) {
      console.warn("Auth initialization note:", err);
      if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        setFirebaseError("Anonyme Anmeldung ist in deiner Firebase Console noch nicht aktiviert. Klicke hier für die Anleitung.");
      } else {
        setFirebaseError(err.message || "Verbindungsfehler");
      }
      setFirebaseStatus('error');
    }
  };

  useEffect(() => {
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setFirebaseStatus('connected');
        setFirebaseError(null);
      }
    });
    return () => unsub();
  }, []);

  // --- 2. FIRESTORE REAL-TIME LISTENERS (Connected with auth lifecycle) ---
  useEffect(() => {
    // Inventory listener
    const unsubInv = onSnapshot(
      collection(db, PATH, 'inventory'),
      (snapshot) => {
        const invMap: Record<string, InventoryItem> = {};
        snapshot.forEach((docSnap) => {
          invMap[docSnap.id] = docSnap.data() as InventoryItem;
        });
        setInventory(invMap);
        try {
          localStorage.setItem(STORAGE_INV_KEY, JSON.stringify(invMap));
        } catch (e) {}
        setFirebaseStatus('connected');
      },
      (error) => {
        console.warn("Firestore Inventory Listener error:", error);
        if (error.code === 'permission-denied') {
          setFirebaseError("Firestore-Zugriff verweigert (permission-denied). Bitte trage die Sicherheitsregeln in der Firebase Console ein.");
          setFirebaseStatus('error');
        }
      }
    );

    // Orders listener
    const unsubOrders = onSnapshot(
      collection(db, PATH, 'orders'),
      (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((docSnap) => {
          orderList.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        setOrders(orderList);
        try {
          localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orderList));
        } catch (e) {}
      },
      (error) => {
        console.warn("Firestore Orders Listener error:", error);
      }
    );

    // Finance stats listener
    const unsubStats = onSnapshot(
      doc(db, PATH, 'stats', 'finance'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const statsObj = {
            expenses: data.expenses ?? 0,
            cashStart: data.cashStart ?? 0,
          };
          setFinanceStats(statsObj);
          try {
            localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(statsObj));
          } catch (e) {}
        }
      },
      (error) => {
        console.warn("Firestore Stats Listener error:", error);
      }
    );

    return () => {
      unsubInv();
      unsubOrders();
      unsubStats();
    };
  }, [user]);

  // --- 3. SCREENSAVER IDLE TIMER (60s) ---
  useEffect(() => {
    const handleActivity = () => {
      idleSecondsRef.current = 0;
      if (screensaverActive) {
        setScreensaverActive(false);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, handleActivity));

    const interval = setInterval(() => {
      idleSecondsRef.current += 1;
      if (
        idleSecondsRef.current >= 60 &&
        currentView === 'order' &&
        !showPaymentModal &&
        !showPinModal &&
        !showDonationModal &&
        !showSizeModal &&
        !showFirebaseModal &&
        !screensaverActive
      ) {
        setScreensaverActive(true);
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(interval);
    };
  }, [
    currentView,
    showPaymentModal,
    showPinModal,
    showDonationModal,
    showSizeModal,
    showFirebaseModal,
    screensaverActive,
  ]);

  // --- 4. CART & LIVE CUSTOMER DISPLAY SYNC ---
  const syncCartToCustomerScreen = useCallback(async (
    items: CartItem[],
    total: number,
    isPaying: boolean,
    given: number = 0,
    tip: number = 0
  ) => {
    try {
      await ensureAuth();
      const change = Math.max(0, given - total - tip);
      await setDoc(doc(db, PATH, 'sync', `cart_pos_${currentPos}`), {
        items: items.map((i) => ({ name: i.name, price: i.price })),
        total,
        isPaying,
        given,
        change,
        tip,
        lastUpdate: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Error syncing cart to customer screen:", e);
    }
  }, [currentPos]);

  const handleAddToCart = (item: CartItem) => {
    const newCart = [...cart, item];
    setCart(newCart);
    const newTotal = newCart.reduce((sum, i) => sum + i.price, 0);
    syncCartToCustomerScreen(newCart, newTotal, false);
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = cart.filter((_, idx) => idx !== index);
    setCart(newCart);
    const newTotal = newCart.reduce((sum, i) => sum + i.price, 0);
    syncCartToCustomerScreen(newCart, newTotal, false);
  };

  const handleClearCart = () => {
    setCart([]);
    syncCartToCustomerScreen([], 0, false);
  };

  const handleSelectSize = (size: 'small' | 'large') => {
    if (!selectedProductForVar) return;
    const item = inventory[selectedProductForVar];
    if (!item) return;

    if (size === 'small' && (item.stockS ?? 0) <= 0) {
      showToast("Größe Klein ist leider ausverkauft!");
      return;
    }
    if (size === 'large' && (item.stockL ?? 0) <= 0) {
      showToast("Größe Groß ist leider ausverkauft!");
      return;
    }

    const name = size === 'small' ? `${selectedProductForVar} (S)` : `${selectedProductForVar} (L)`;
    const price = size === 'small' ? item.priceS ?? 0 : item.priceL ?? 0;

    handleAddToCart({
      name,
      price,
      isVariant: true,
      isLarge: size === 'large',
      parent: selectedProductForVar,
    });

    setShowSizeModal(false);
  };

  const handleConfirmDonation = (amount: number) => {
    handleAddToCart({
      name: 'Spende / Freibetrag',
      price: amount,
      isVariant: false,
      isLarge: false,
      parent: null,
      isDonation: true,
    });
    showToast(`Spende von ${amount.toFixed(2)} € hinzugefügt`);
  };

  // --- 5. PROCESS SALE ---
  const handleProcessSale = async (given: number, tip: number) => {
    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
    await ensureAuth();

    try {
      const orderRef = doc(collection(db, PATH, 'orders'));
      const orderData = {
        items: cart,
        total: cartTotal,
        tip,
        timestamp: serverTimestamp(),
        storniert: false,
        pos: currentPos,
      };

      // 1. Write order and update stocks using writeBatch
      const batch = writeBatch(db);
      batch.set(orderRef, orderData);

      for (const item of cart) {
        if (!item.parent || item.isDonation) continue;
        const invRef = doc(db, PATH, 'inventory', item.parent);
        if (item.isVariant) {
          const stockField = item.isLarge ? 'stockL' : 'stockS';
          batch.set(invRef, { [stockField]: increment(-1) }, { merge: true });
        } else {
          batch.set(invRef, { stock: increment(-1) }, { merge: true });
        }
      }

      await batch.commit();

      // 2. Optimistically add to orders list
      const newOrder: Order = {
        id: orderRef.id,
        items: [...cart],
        total: cartTotal,
        tip,
        timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        storniert: false,
        pos: currentPos,
      };

      setOrders((prev) => {
        const updated = [newOrder, ...prev];
        try {
          localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // 3. Optimistically update inventory stocks locally
      setInventory((prev) => {
        const next = { ...prev };
        for (const item of cart) {
          if (!item.parent || item.isDonation || !next[item.parent]) continue;
          const curr = { ...next[item.parent] };
          if (item.isVariant) {
            if (item.isLarge) curr.stockL = (curr.stockL ?? 0) - 1;
            else curr.stockS = (curr.stockS ?? 0) - 1;
          } else {
            curr.stock = (curr.stock ?? 0) - 1;
          }
          next[item.parent] = curr;
        }
        try {
          localStorage.setItem(STORAGE_INV_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 4. Notify customer screen
      try {
        await setDoc(doc(db, PATH, 'sync', `cart_pos_${currentPos}`), {
          items: [],
          total: 0,
          isPaying: false,
          given: 0,
          change: 0,
          justCompleted: true,
          completedTotal: cartTotal + tip,
          completedAt: Date.now(),
          lastUpdate: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Sync sale error:", e);
      }

      setSaleSuccessAmount(cartTotal);
      setShowSaleSuccess(true);
      setTimeout(() => setShowSaleSuccess(false), 2000);

      setCart([]);
      setShowPaymentModal(false);
      showToast("Verkauf erfolgreich verbucht!");
    } catch (err: any) {
      console.warn("Batch sale failed, attempting direct order write:", err);
      try {
        const orderRef = doc(collection(db, PATH, 'orders'));
        await setDoc(orderRef, {
          items: cart,
          total: cartTotal,
          tip,
          timestamp: serverTimestamp(),
          storniert: false,
          pos: currentPos,
        });

        const fallbackOrder: Order = {
          id: orderRef.id,
          items: [...cart],
          total: cartTotal,
          tip,
          timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
          storniert: false,
          pos: currentPos,
        };

        setOrders((prev) => [fallbackOrder, ...prev]);
        setCart([]);
        setShowPaymentModal(false);
        showToast("Verkauf verbucht!");
      } catch (fallbackErr: any) {
        console.error("Sale error:", fallbackErr);
        showToast(fallbackErr.message || "Fehler beim Buchen");
        throw fallbackErr;
      }
    }
  };

  // --- 6. ACTIONS (STORNO, DELETE ORDER, STATS, INVENTORY) ---
  const handleStornoOrder = (order: Order) => {
    setConfirmConfig({
      isOpen: true,
      title: "Buchung stornieren?",
      message: `Möchtest du den Beleg über ${(order.total || 0).toFixed(2)} € wirklich stornieren? Der Lagerbestand wird automatisch wieder zurückgebucht.`,
      confirmLabel: "Ja, stornieren",
      variant: 'danger',
      action: async () => {
        try {
          await ensureAuth();
          const batch = writeBatch(db);
          batch.set(doc(db, PATH, 'orders', order.id), { storniert: true }, { merge: true });

          (order.items || []).forEach((item) => {
            if (!item.parent || item.isDonation) return;
            const invRef = doc(db, PATH, 'inventory', item.parent);
            if (item.isVariant) {
              const field = item.isLarge ? 'stockL' : 'stockS';
              batch.set(invRef, { [field]: increment(1) }, { merge: true });
            } else {
              batch.set(invRef, { stock: increment(1) }, { merge: true });
            }
          });

          await batch.commit();

          // Optimistically update orders list
          setOrders((prev) =>
            prev.map((o) => (o.id === order.id ? { ...o, storniert: true } : o))
          );

          // Optimistically restore stock in local state
          setInventory((prev) => {
            const next = { ...prev };
            (order.items || []).forEach((item) => {
              if (!item.parent || item.isDonation || !next[item.parent]) return;
              const curr = { ...next[item.parent] };
              if (item.isVariant) {
                if (item.isLarge) curr.stockL = (curr.stockL ?? 0) + 1;
                else curr.stockS = (curr.stockS ?? 0) + 1;
              } else {
                curr.stock = (curr.stock ?? 0) + 1;
              }
              next[item.parent] = curr;
            });
            try {
              localStorage.setItem(STORAGE_INV_KEY, JSON.stringify(next));
            } catch (e) {}
            return next;
          });

          showToast("Buchung erfolgreich storniert");
        } catch (err: any) {
          showToast("Fehler beim Stornieren: " + err.message);
        }
      },
    });
  };

  const handleDeleteOrder = (order: Order) => {
    setConfirmConfig({
      isOpen: true,
      title: "Beleg unwiderruflich löschen?",
      message: `Soll dieser Beleg (${(order.total || 0).toFixed(2)} €) komplett aus der Datenbank und dem Buchungsverlauf gelöscht werden? Falls er noch nicht storniert war, wird der Warenbestand wieder zurückgebucht.`,
      confirmLabel: "Endgültig löschen",
      variant: 'danger',
      action: async () => {
        try {
          await ensureAuth();

          // If order was not yet storniert, safely restore stocks without failing if item doc doesn't exist
          if (!order.storniert && (order.items || []).length > 0) {
            try {
              const batch = writeBatch(db);
              (order.items || []).forEach((item) => {
                if (!item.parent || item.isDonation) return;
                const invRef = doc(db, PATH, 'inventory', item.parent);
                if (item.isVariant) {
                  const field = item.isLarge ? 'stockL' : 'stockS';
                  batch.set(invRef, { [field]: increment(1) }, { merge: true });
                } else {
                  batch.set(invRef, { stock: increment(1) }, { merge: true });
                }
              });
              await batch.commit();
            } catch (e) {
              console.warn("Stock restore on delete note (non-fatal):", e);
            }

            // Restore in local state
            setInventory((prev) => {
              const next = { ...prev };
              (order.items || []).forEach((item) => {
                if (!item.parent || item.isDonation || !next[item.parent]) return;
                const curr = { ...next[item.parent] };
                if (item.isVariant) {
                  if (item.isLarge) curr.stockL = (curr.stockL ?? 0) + 1;
                  else curr.stockS = (curr.stockS ?? 0) + 1;
                } else {
                  curr.stock = (curr.stock ?? 0) + 1;
                }
                next[item.parent] = curr;
              });
              try {
                localStorage.setItem(STORAGE_INV_KEY, JSON.stringify(next));
              } catch (e) {}
              return next;
            });
          }

          // Always delete order document from Firestore
          await deleteDoc(doc(db, PATH, 'orders', order.id));

          // Remove from local orders state
          setOrders((prev) => {
            const next = prev.filter((o) => o.id !== order.id);
            try {
              localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(next));
            } catch (e) {}
            return next;
          });

          showToast("Beleg erfolgreich gelöscht");
        } catch (err: any) {
          console.error("Delete order error:", err);
          showToast("Fehler beim Löschen: " + err.message);
        }
      },
    });
  };

  const handleSaveExpenses = async (amount: number) => {
    await ensureAuth();
    setFinanceStats((prev) => ({ ...prev, expenses: amount }));
    await setDoc(doc(db, PATH, 'stats', 'finance'), { expenses: amount }, { merge: true });
    showToast("Sonstige Kosten gespeichert");
  };

  const handleSaveCashStart = async (amount: number) => {
    await ensureAuth();
    setFinanceStats((prev) => ({ ...prev, cashStart: amount }));
    await setDoc(doc(db, PATH, 'stats', 'finance'), { cashStart: amount }, { merge: true });
    showToast("Kassenstart gespeichert");
  };

  const handleSaveProduct = async (prodName: string, data: InventoryItem) => {
    // 1. Optimistic UI update so the product appears IMMEDIATELY
    setInventory((prev) => {
      const updated = { ...prev, [prodName]: data };
      try {
        localStorage.setItem(STORAGE_INV_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Ensure Firebase auth is active
    await ensureAuth();

    // 3. Persist to Firestore
    await setDoc(doc(db, PATH, 'inventory', prodName), data);
  };

  const handleDeleteProduct = (prodName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `Artikel löschen?`,
      message: `Soll der Artikel "${prodName}" wirklich unwiderruflich aus dem Sortiment gelöscht werden?`,
      confirmLabel: "Löschen",
      variant: 'danger',
      action: async () => {
        // Optimistic delete
        setInventory((prev) => {
          const updated = { ...prev };
          delete updated[prodName];
          try {
            localStorage.setItem(STORAGE_INV_KEY, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        await ensureAuth();
        await deleteDoc(doc(db, PATH, 'inventory', prodName));
        showToast(`Artikel "${prodName}" gelöscht`);
      },
    });
  };

  const handleLoadSampleData = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Winterball Beispieldaten laden?",
      message: "Möchtest du ein typisches Sortiment für Getränke (Glühwein, Kinderpunsch, Bier, Cola, Wasser) und Speisen (Bratwurst, Krakauer, Pommes, Waffel) anlegen?",
      confirmLabel: "Beispieldaten einspielen",
      variant: 'primary',
      action: async () => {
        try {
          // Optimistic update
          setInventory((prev) => {
            const updated = { ...prev, ...SAMPLE_PRODUCTS };
            try {
              localStorage.setItem(STORAGE_INV_KEY, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });

          await ensureAuth();
          const batch = writeBatch(db);
          Object.entries(SAMPLE_PRODUCTS).forEach(([prodName, data]) => {
            batch.set(doc(db, PATH, 'inventory', prodName), data);
          });
          await batch.commit();
          showToast("Winterball-Sortiment erfolgreich angelegt!");
        } catch (e: any) {
          showToast("Fehler beim Laden der Beispieldaten: " + e.message);
        }
      },
    });
  };

  const handleResetApp = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Gesamtes System zurücksetzen?",
      message: "ACHTUNG: Alle Artikel, Bestände, Buchungen, Umsätze und Kosten werden gelöscht. Dies kann nicht rückgängig gemacht werden!",
      confirmLabel: "Ja, alles zurücksetzen",
      variant: 'danger',
      action: async () => {
        try {
          setInventory({});
          setOrders([]);
          setFinanceStats({ expenses: 0, cashStart: 0 });
          setCart([]);

          try {
            localStorage.removeItem(STORAGE_INV_KEY);
            localStorage.removeItem(STORAGE_ORDERS_KEY);
            localStorage.removeItem(STORAGE_STATS_KEY);
          } catch (e) {}

          await ensureAuth();
          const batch = writeBatch(db);
          orders.forEach((o) => batch.delete(doc(db, PATH, 'orders', o.id)));
          Object.keys(inventory).forEach((k) => batch.delete(doc(db, PATH, 'inventory', k)));
          batch.delete(doc(db, PATH, 'stats', 'finance'));
          batch.delete(doc(db, PATH, 'sync', 'cart_pos_1'));
          batch.delete(doc(db, PATH, 'sync', 'cart_pos_2'));
          await batch.commit();
          showToast("System komplett zurückgesetzt");
        } catch (err: any) {
          showToast("Reset fehlgeschlagen: " + err.message);
        }
      },
    });
  };

  const posName = currentPos === 1 ? 'GETRÄNKE' : 'SPEISEN';
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCustomerSync = useCallback(
    (given: number, tip: number, isPaying: boolean) => {
      syncCartToCustomerScreen(cart, cartTotal, isPaying, given, tip);
    },
    [cart, cartTotal, syncCartToCustomerScreen]
  );

  // If customer view is active, render fullscreen customer screen
  if (currentView === 'customer') {
    return (
      <CustomerView
        customerPos={customerPos}
        onClose={() => setCurrentView('order')}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[140] bg-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-500/80 animate-viewIn">
          <Info className="w-5 h-5 text-indigo-400 flex-none" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Screensaver */}
      <Screensaver
        visible={screensaverActive}
        onWake={() => setScreensaverActive(false)}
        subtitle={posName}
      />

      {/* Sale Success Overlay */}
      <SaleSuccessOverlay visible={showSaleSuccess} amount={saleSuccessAmount} />

      {/* Top Application Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex-none z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-none">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-600/30">
              <Snowflake className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Winterball</span>
                <span className="text-indigo-400">Kasse</span>
              </h1>
            </div>
            <div className="hidden sm:inline-block px-2.5 py-0.5 bg-slate-800 rounded-md text-[10px] font-bold text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
              {posName}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setCurrentView('order')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'order'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verkauf
            </button>
            <button
              onClick={() => setCurrentView('customer-select')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'customer-select'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kundenansicht
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Historie
            </button>
            <button
              onClick={() => {
                if (currentView === 'inventory') {
                  setCurrentView('order');
                } else {
                  setShowPinModal(true);
                }
              }}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inventar
            </button>
          </nav>

          {/* Firebase Status Badge */}
          <div className="flex items-center gap-2 flex-none">
            <button
              onClick={() => setShowFirebaseModal(true)}
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                firebaseStatus === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30'
                  : firebaseStatus === 'connecting'
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/30'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/30 animate-pulse'
              }`}
              title="Firebase Status & Sicherheitsregeln"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  firebaseStatus === 'connected'
                    ? 'bg-emerald-400'
                    : firebaseStatus === 'connecting'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-rose-500'
                }`}
              />
              <span className="hidden md:inline font-mono">
                {activeConfig.projectId}
              </span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Views Container */}
      <main className="flex-grow relative max-w-7xl w-full mx-auto overflow-hidden">
        {currentView === 'order' && (
          <div key="view-order" className="h-full animate-viewIn">
            <OrderView
              currentPos={currentPos}
              onSetPos={setCurrentPos}
              inventory={inventory}
              cart={cart}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onOpenVariantModal={(name) => {
                setSelectedProductForVar(name);
                setShowSizeModal(true);
              }}
              onOpenDonationModal={() => setShowDonationModal(true)}
              onOpenPaymentModal={() => setShowPaymentModal(true)}
              onLoadSampleData={handleLoadSampleData}
            />
          </div>
        )}

        {currentView === 'customer-select' && (
          <div key="view-customer-select" className="h-full animate-viewIn">
            <CustomerSelectView
              onSelectPos={(pos) => {
                setCustomerPos(pos);
                setCurrentView('customer');
              }}
            />
          </div>
        )}

        {currentView === 'dashboard' && (
          <div key="view-dashboard" className="h-full animate-viewIn">
            <DashboardView
              orders={orders}
              inventory={inventory}
              stats={financeStats}
              onSaveExpenses={handleSaveExpenses}
              onSaveCashStart={handleSaveCashStart}
            />
          </div>
        )}

        {currentView === 'history' && (
          <div key="view-history" className="h-full animate-viewIn">
            <HistoryView
              orders={orders}
              onStornoOrder={handleStornoOrder}
              onDeleteOrder={handleDeleteOrder}
              onToast={showToast}
            />
          </div>
        )}

        {currentView === 'inventory' && (
          <div key="view-inventory" className="h-full animate-viewIn">
            <InventoryView
              inventory={inventory}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onResetApp={handleResetApp}
              onLoadSampleData={handleLoadSampleData}
              onToast={showToast}
            />
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* Firebase Status & Rules Helper */}
      <FirebaseStatusModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        status={firebaseStatus}
        errorMessage={firebaseError || undefined}
        userId={user?.uid}
        onRetry={initAuth}
        activeProjectId={activeConfig.projectId}
      />

      {/* Inventory PIN Protection Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setCurrentView('inventory');
          showToast("Inventar entsperrt");
        }}
        targetPin="5657"
      />

      {/* Variant Size Modal (Klein / Groß) */}
      <SizeModal
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        productName={selectedProductForVar}
        product={selectedProductForVar ? inventory[selectedProductForVar] : null}
        onSelectSize={handleSelectSize}
      />

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        onConfirm={handleConfirmDonation}
      />

      {/* Payment & Checkout Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        total={cartTotal}
        onClose={() => setShowPaymentModal(false)}
        onProcessSale={handleProcessSale}
        onSyncCustomerState={handleCustomerSync}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        confirmVariant={confirmConfig.variant}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.action}
      />
    </div>
  );
}
