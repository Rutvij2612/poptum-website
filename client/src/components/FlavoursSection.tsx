import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/language-context';
import FlavourCard from './FlavourCard';
import FlavourModal from './FlavourModal';
import barbequeImage from '@assets/generated_images/barbeque_flavour_makhana.png';
import himalayanImage from '@assets/generated_images/himalayan_salt_pepper_makhana.png';
import periPeriImage from '@assets/generated_images/peri_peri_flavour_makhana.png';
import creamOnionImage from '@assets/generated_images/cream_onion_flavour_makhana.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AUTH_CHANGE_EVENT, getAuth, isLoggedIn, saveAuth } from '@/lib/auth';
import { getIndiaCheckoutGstDisplay } from '@/lib/india-gst-display';
import { formatDualFlavourPrice, formatDualFooterPayable, formatDualLineTotal, formatPriceByCountry, getCountryOrDefault, EUR_TO_INR } from '@/lib/pricing';
import { INDIAN_STATES_AND_UTS } from '../../../shared/indian-states';
import {
  calculateGermanyVatFromInclusiveTotal,
  calculateOrderPricing,
  getGermanyCartProgress,
  getIndiaCartProgress,
  getPacketUnitPrice,
} from '../../../shared/order-pricing';

const API = import.meta.env.VITE_API_URL || '';

const flavourImages = {
  barbeque: barbequeImage,
  himalayan: himalayanImage,
  periPeri: periPeriImage,
  creamOnion: creamOnionImage,
};

type FlavourKey = 'barbeque' | 'himalayan' | 'periPeri' | 'creamOnion';
type CartItem = {
  key: FlavourKey;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
};
type CheckoutStep = 'auth' | 'details' | 'payment' | 'verification';

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className={`flex items-center space-x-2 text-xs ${isValid ? "text-green-600" : "text-gray-500"}`}>
      {isValid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
      <span>{text}</span>
    </div>
  );
}

function getActiveCheckoutCountry(
  formCountry: string,
  loggedIn: 'India' | 'Germany',
): 'India' | 'Germany' {
  return formCountry === 'India' || formCountry === 'Germany' ? formCountry : loggedIn;
}

function isIndiaCheckout(formCountry: string, loggedIn: 'India' | 'Germany') {
  return getActiveCheckoutCountry(formCountry, loggedIn) === 'India';
}

function isGermanyCheckout(formCountry: string, loggedIn: 'India' | 'Germany') {
  return getActiveCheckoutCountry(formCountry, loggedIn) === 'Germany';
}

/** Guest footer marketing progress (dual-country, not checkout shipping). */
const GUEST_INDIA_PACKET_INR = 150;
const GUEST_GERMANY_PACKET_EUR = 3.49;
const GUEST_DISCOUNT_MIN_PACKETS = 5;
const GUEST_INDIA_FREE_MIN_PACKETS = 10;
const GUEST_GERMANY_FREE_MIN_PACKETS = 12;
const GUEST_DISCOUNT_INDIA_VALUE = 750;
const GUEST_DISCOUNT_GERMANY_VALUE = 17.45;
const GUEST_FREE_INDIA_VALUE = 1500;
const GUEST_FREE_GERMANY_VALUE = 41.88;
const GUEST_MARKER_A_PERCENT = (GUEST_INDIA_FREE_MIN_PACKETS / GUEST_GERMANY_FREE_MIN_PACKETS) * 100;

type GuestCartProgressPhase =
  | 'discount'
  | 'free_shipping'
  | 'india_free_shipping_unlocked'
  | 'fully_unlocked';

type GuestCartProgress = {
  phase: GuestCartProgressPhase;
  message: string;
  note?: string;
  showPhase2Bar: boolean;
  phase1ProgressPercent: number;
  overallFillPercent: number;
  markerAPercent: number;
  indiaMilestoneComplete: boolean;
  germanyMilestoneComplete: boolean;
};

function guestRound2(value: number): number {
  return Math.round(value * 100) / 100;
}

function guestFmtInr(amount: number): string {
  return `₹${amount}`;
}

function guestFmtEur(amount: number): string {
  return `€${guestRound2(amount).toFixed(2)}`;
}

function getGuestCartProgress(totalPackets: number): GuestCartProgress {
  const indiaValue = totalPackets * GUEST_INDIA_PACKET_INR;
  const euroValue = guestRound2(totalPackets * GUEST_GERMANY_PACKET_EUR);
  const overallFillPercent = Math.min((totalPackets / GUEST_GERMANY_FREE_MIN_PACKETS) * 100, 100);
  const base = {
    markerAPercent: GUEST_MARKER_A_PERCENT,
    phase1ProgressPercent: 100,
    showPhase2Bar: true,
  };

  if (totalPackets >= GUEST_GERMANY_FREE_MIN_PACKETS) {
    return {
      ...base,
      phase: 'fully_unlocked',
      message: 'FREE SHIPPING unlocked!',
      overallFillPercent: 100,
      indiaMilestoneComplete: true,
      germanyMilestoneComplete: true,
    };
  }

  if (totalPackets >= GUEST_INDIA_FREE_MIN_PACKETS) {
    const remainingGermany = guestRound2(
      (GUEST_GERMANY_FREE_MIN_PACKETS - totalPackets) * GUEST_GERMANY_PACKET_EUR,
    );
    return {
      ...base,
      phase: 'india_free_shipping_unlocked',
      message: `You're ${guestFmtEur(remainingGermany)} away from FREE SHIPPING`,
      overallFillPercent,
      indiaMilestoneComplete: true,
      germanyMilestoneComplete: false,
    };
  }

  if (totalPackets >= GUEST_DISCOUNT_MIN_PACKETS) {
    const remainingIndia = (GUEST_INDIA_FREE_MIN_PACKETS - totalPackets) * GUEST_INDIA_PACKET_INR;
    const remainingGermany = guestRound2(
      (GUEST_GERMANY_FREE_MIN_PACKETS - totalPackets) * GUEST_GERMANY_PACKET_EUR,
    );
    return {
      ...base,
      phase: 'free_shipping',
      message: `You're ${guestFmtInr(remainingIndia)} / ${guestFmtEur(remainingGermany)} away from FREE SHIPPING`,
      overallFillPercent,
      indiaMilestoneComplete: false,
      germanyMilestoneComplete: false,
    };
  }

  const remainingIndia = GUEST_DISCOUNT_INDIA_VALUE - indiaValue;
  const remainingGermany = guestRound2(GUEST_DISCOUNT_GERMANY_VALUE - euroValue);
  return {
    phase: 'discount',
    message: `You're ${guestFmtInr(remainingIndia)} / ${guestFmtEur(remainingGermany)} away from ₹51 / €2.46 OFF`,
    note: 'Shipping charges depend on country selection during checkout.',
    showPhase2Bar: false,
    phase1ProgressPercent: (totalPackets / GUEST_DISCOUNT_MIN_PACKETS) * 100,
    overallFillPercent,
    markerAPercent: GUEST_MARKER_A_PERCENT,
    indiaMilestoneComplete: false,
    germanyMilestoneComplete: false,
  };
}

type LoggedInFooterProgress = {
  phase: string;
  message: string;
  note?: string;
  progressPercent: number;
};

/** Logged-in India footer: simple 5 → 10 free-shipping bar (display only). */
function getLoggedInIndiaFooterProgress(totalPackets: number): LoggedInFooterProgress {
  if (totalPackets >= GUEST_INDIA_FREE_MIN_PACKETS) {
    return {
      phase: 'free_shipping_unlocked',
      message: 'Free Shipping Unlocked',
      progressPercent: 100,
    };
  }
  if (totalPackets >= GUEST_DISCOUNT_MIN_PACKETS) {
    const remaining = (GUEST_INDIA_FREE_MIN_PACKETS - totalPackets) * GUEST_INDIA_PACKET_INR;
    return {
      phase: 'free_shipping',
      message: `You're ${guestFmtInr(remaining)} away from Free Shipping`,
      progressPercent:
        ((totalPackets - GUEST_DISCOUNT_MIN_PACKETS) /
          (GUEST_INDIA_FREE_MIN_PACKETS - GUEST_DISCOUNT_MIN_PACKETS)) *
        100,
    };
  }
  const base = getIndiaCartProgress(totalPackets);
  return {
    phase: base.phase,
    message: base.message,
    note: base.note,
    progressPercent: base.progressPercent,
  };
}

/** Logged-in Germany footer: simple 5 → 12 free-shipping bar (display only). */
function getLoggedInGermanyFooterProgress(totalPackets: number): LoggedInFooterProgress {
  if (totalPackets >= GUEST_GERMANY_FREE_MIN_PACKETS) {
    return {
      phase: 'free_shipping_unlocked',
      message: 'Free Shipping Unlocked',
      progressPercent: 100,
    };
  }
  if (totalPackets >= GUEST_DISCOUNT_MIN_PACKETS) {
    const remaining = guestRound2(
      (GUEST_GERMANY_FREE_MIN_PACKETS - totalPackets) * GUEST_GERMANY_PACKET_EUR,
    );
    return {
      phase: 'free_shipping',
      message: `You're ${guestFmtEur(remaining)} away from Free Shipping`,
      progressPercent:
        ((totalPackets - GUEST_DISCOUNT_MIN_PACKETS) /
          (GUEST_GERMANY_FREE_MIN_PACKETS - GUEST_DISCOUNT_MIN_PACKETS)) *
        100,
    };
  }
  const base = getGermanyCartProgress(totalPackets);
  return {
    phase: base.phase,
    message: base.message,
    note: base.note,
    progressPercent: base.progressPercent,
  };
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      console.log("[Razorpay SDK] Razorpay script already loaded in window.");
      resolve(true);
      return;
    }
    console.log("[Razorpay SDK] Loading script from https://checkout.razorpay.com/v1/checkout.js...");
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      console.log("[Razorpay SDK] script.onload: Razorpay SDK loaded successfully.");
      resolve(true);
    };
    script.onerror = () => {
      console.error("[Razorpay SDK] script.onerror: Failed to load Razorpay SDK.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function FlavoursSection() {
  const { t, language } = useLanguage();
  const [selectedFlavour, setSelectedFlavour] = useState<FlavourKey | null>(null);
  const [cartFlavour, setCartFlavour] = useState<FlavourKey | null>(null);
  const [quantity, setQuantity] = useState(1);
const [cartItems, setCartItems] = useState<CartItem[]>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("poptum-cart");
    return saved ? JSON.parse(saved) : [];
  }
  return [];
});  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('details');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginValues, setLoginValues] = useState({ username: '', password: '' });
  const [checkoutForgotOpen, setCheckoutForgotOpen] = useState(false);
  const [checkoutForgotEmail, setCheckoutForgotEmail] = useState('');
  const [checkoutForgotLoading, setCheckoutForgotLoading] = useState(false);
  const [checkoutForgotMessage, setCheckoutForgotMessage] = useState<string | null>(null);
  const [signupValues, setSignupValues] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    country: 'Germany',
    password: '',
    confirmPassword: '',
  });
  const [cachedProfile, setCachedProfile] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'upi'>('card');
  const [paymentExpiresAt, setPaymentExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    country: 'India' | 'Germany';
    state?: string;
    postalCode?: string;
    totals: {
      subtotal: number;
      tax: number;
      delivery: number;
      shipping: number;
      grandTotal: number;
      discount?: number;
    };
  } | null>(null);
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    orderId: string;
    totals: { subtotal: number; tax: number; delivery: number; shipping: number; grandTotal: number };
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [germanyModalOpen, setGermanyModalOpen] = useState(false);

  console.log(`[Diagnostic] [FlavoursSection Render] orderSuccess: ${!!orderSuccess}, checkoutOpen: ${checkoutOpen}, submitting: ${submitting}, checkoutStep: ${checkoutStep}, pendingOrder: ${!!pendingOrder}`);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    state: '',
    country: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loggedInCountry, setLoggedInCountry] = useState<'India' | 'Germany'>(() =>
    getCountryOrDefault(getAuth().country)
  );
  const [authLoggedIn, setAuthLoggedIn] = useState(() => isLoggedIn());
  const prevGermanyPhaseRef = useRef<string | null>(null);
  const prevGuestPacketsRef = useRef<number | null>(null);
  const prevLoggedInPacketsRef = useRef<number | null>(null);

  const syncCartUnitPrices = (country: 'India' | 'Germany') => {
    const unitPrice = getPacketUnitPrice(country);
    setCartItems((prev) => {
      if (prev.length === 0 || prev.every((item) => item.unitPrice === unitPrice)) {
        return prev;
      }
      return prev.map((item) => ({ ...item, unitPrice }));
    });
  };

  const applyAuthSession = (loggedIn: boolean) => {
    setAuthLoggedIn(loggedIn);
    if (!loggedIn) {
      setLoggedInCountry('Germany');
      setCachedProfile(null);
      syncCartUnitPrices('Germany');
      return;
    }
    const country = getCountryOrDefault(getAuth().country);
    setLoggedInCountry(country);
    syncCartUnitPrices(country);
  };

  useEffect(() => {
    const onAuthChange = () => applyAuthSession(isLoggedIn());
    window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange);
    applyAuthSession(isLoggedIn());
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange);
  }, []);
  const prefillCheckoutDetails = (profile?: Partial<{
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    state: string;
    country: string;
  }>) => {
    if (!profile) return;
    setFormValues((prev) => ({
      fullName: prev.fullName?.trim() ? prev.fullName : (profile.fullName || ''),
      email: prev.email?.trim() ? prev.email : (profile.email || ''),
      phone: prev.phone?.trim() ? prev.phone : (profile.phone || ''),
      address: prev.address?.trim() ? prev.address : (profile.address || ''),
      city: prev.city?.trim() ? prev.city : (profile.city || ''),
      postalCode: prev.postalCode?.trim() ? prev.postalCode : (profile.postalCode || ''),
      state: prev.state?.trim() ? prev.state : (profile.state || ''),
      country: prev.country?.trim() ? prev.country : (profile.country || ''),
    }));
  };

  const signupValidations = {
    length: signupValues.password.length >= 8,
    uppercase: /[A-Z]/.test(signupValues.password),
    number: /[0-9]/.test(signupValues.password),
    special: /[^A-Za-z0-9]/.test(signupValues.password),
    match: signupValues.password === signupValues.confirmPassword && signupValues.password.length > 0,
  };
  const isSignupValid = Object.values(signupValidations).every(Boolean);

  useEffect(() => {
    if (!paymentExpiresAt || checkoutStep !== 'verification') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = paymentExpiresAt.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('Expired');
        handlePaymentExpired();
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentExpiresAt, checkoutStep]);

  const handlePaymentExpired = async () => {
    if (pendingOrder?.id) {
      try {
        await fetch(`${API}/api/orders/${pendingOrder.id}/cancel`, { method: 'POST' });
      } catch (e) {
        console.error("Failed to cancel order", e);
      }
    }
    setAuthError('Payment session expired. Please try again.');
    setCheckoutStep('payment');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedProfile = localStorage.getItem('poptum-checkout-profile');
    if (!savedProfile) return;
    try {
      prefillCheckoutDetails(JSON.parse(savedProfile));
    } catch {
      // Ignore malformed local storage data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('poptum-checkout-profile', JSON.stringify(formValues));
  }, [formValues]);
  useEffect(() => {
  localStorage.setItem("poptum-cart", JSON.stringify(cartItems));
}, [cartItems]);

  useEffect(() => {
    if (!isIndiaCheckout(formValues.country, loggedInCountry)) return;
    console.log("[Diagnostic] FlavoursSection mounted. Preloading Razorpay script for India checkout...");
    loadRazorpayScript().then((loaded) => {
      console.log(`[Diagnostic] Eager preload status: ${loaded ? 'SUCCESS' : 'FAILED'}`);
    });
  }, [formValues.country, loggedInCountry]);

  const flavourKeys: FlavourKey[] = ['barbeque', 'himalayan', 'periPeri', 'creamOnion'];
  const checkoutCountry = getActiveCheckoutCountry(formValues.country, loggedInCountry);

  const cartPricingCountry = authLoggedIn ? loggedInCountry : 'Germany';

  const getFlavourData = (key: FlavourKey) => {
    const data = t.flavours[key];
    const price = authLoggedIn
      ? getPacketUnitPrice(loggedInCountry)
      : getPacketUnitPrice('Germany');
    return {
      name: data.name,
      description: data.description,
      fullDescription: data.fullDescription,
      ingredients: data.ingredients,
      tasteProfile: data.tasteProfile,
      servingIdeas: data.servingIdeas,
      image: flavourImages[key],
      price,
    };
  };

  const formatDisplayPrice = (amount: number, country = cartPricingCountry) =>
    formatPriceByCountry(amount, country);

  const formatFlavourPriceLabel = () =>
    !authLoggedIn
      ? formatDualFlavourPrice()
      : formatPriceByCountry(getPacketUnitPrice(loggedInCountry), loggedInCountry);

  const cartTotalPackets = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const orderPricing = calculateOrderPricing(cartItems, cartPricingCountry);
  const dashboardIndiaProgress = authLoggedIn && loggedInCountry === 'India'
    ? getLoggedInIndiaFooterProgress(cartTotalPackets)
    : null;
  const dashboardGermanyProgress = authLoggedIn && loggedInCountry === 'Germany'
    ? getLoggedInGermanyFooterProgress(cartTotalPackets)
    : null;
  const guestCartProgress = !authLoggedIn ? getGuestCartProgress(cartTotalPackets) : null;

  useEffect(() => {
    if (!authLoggedIn) {
      prevLoggedInPacketsRef.current = null;
      return;
    }
    const prev = prevLoggedInPacketsRef.current;
    const n = cartTotalPackets;
    if (prev !== null) {
      if (prev < GUEST_DISCOUNT_MIN_PACKETS && n >= GUEST_DISCOUNT_MIN_PACKETS) {
        showToast(
          loggedInCountry === 'India'
            ? 'Yay! ₹51 OFF unlocked!'
            : 'Yay! €2.46 OFF applied!',
        );
      }
      if (loggedInCountry === 'India' && prev < GUEST_INDIA_FREE_MIN_PACKETS && n >= GUEST_INDIA_FREE_MIN_PACKETS) {
        showToast('Free Shipping Unlocked!');
      }
      if (loggedInCountry === 'Germany' && prev < GUEST_GERMANY_FREE_MIN_PACKETS && n >= GUEST_GERMANY_FREE_MIN_PACKETS) {
        showToast('Free Shipping Unlocked!');
      }
    }
    prevLoggedInPacketsRef.current = n;
  }, [cartTotalPackets, authLoggedIn, loggedInCountry]);

  useEffect(() => {
    if (authLoggedIn) {
      prevGuestPacketsRef.current = null;
      return;
    }
    const prev = prevGuestPacketsRef.current;
    const n = cartTotalPackets;
    if (prev !== null) {
      if (prev < GUEST_DISCOUNT_MIN_PACKETS && n >= GUEST_DISCOUNT_MIN_PACKETS) {
        showToast('Yay! ₹51 / €2.46 OFF unlocked!');
      }
      if (prev < GUEST_INDIA_FREE_MIN_PACKETS && n >= GUEST_INDIA_FREE_MIN_PACKETS) {
        showToast('Free shipping unlocked for India!');
      }
      if (prev < GUEST_GERMANY_FREE_MIN_PACKETS && n >= GUEST_GERMANY_FREE_MIN_PACKETS) {
        showToast('Free shipping unlocked for Germany!');
      }
    }
    prevGuestPacketsRef.current = n;
  }, [cartTotalPackets, authLoggedIn]);

  const checkoutIndiaProgress =
    formValues.country === 'India' ? getIndiaCartProgress(cartTotalPackets) : null;
  const checkoutGermanyProgress =
    formValues.country === 'Germany' ? getGermanyCartProgress(cartTotalPackets) : null;

  useEffect(() => {
    if (!checkoutOpen || formValues.country !== 'Germany' || !checkoutGermanyProgress) return;
    const phase = checkoutGermanyProgress.phase;
    if (
      phase === 'discount_unlocked' &&
      prevGermanyPhaseRef.current !== 'discount_unlocked'
    ) {
      showToast('Yay! €2.46 OFF applied!');
    }
    if (
      phase === 'free_shipping_unlocked' &&
      prevGermanyPhaseRef.current !== 'free_shipping_unlocked'
    ) {
      showToast('FREE SHIPPING applied!');
    }
    prevGermanyPhaseRef.current = phase;
  }, [checkoutOpen, formValues.country, checkoutGermanyProgress?.phase, cartTotalPackets]);

  const dashboardProductTotal = authLoggedIn
    ? orderPricing.subtotal - orderPricing.discount
    : 0;

  const openCartModal = (key: FlavourKey) => {
  setCartFlavour(key);

  const existingItem = cartItems.find(item => item.key === key);

  if (existingItem) {
    setQuantity(existingItem.quantity);
  } else {
    setQuantity(1);
  }
};

  const closeCartModal = () => {
    setCartFlavour(null);
  };

  const incrementQty = () => setQuantity((q) => Math.min(q + 1, 20));
  const decrementQty = () => setQuantity((q) => Math.max(0, q - 1));

  const handleConfirmAddToCart = () => {
    if (!cartFlavour) return;
    if (quantity <= 0) return;

    const data = getFlavourData(cartFlavour);
    const unitPrice = data.price;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === cartFlavour);

      if (existing) {
        return prev.map((item) =>
          item.key === cartFlavour ? { ...item, quantity } : item,
        );
      }

      return [
        ...prev,
        {
          key: cartFlavour,
          name: data.name,
          image: data.image,
          quantity,
          unitPrice,
        },
      ];
    });

    showToast(`${data.name} ${t.cart.added}`);
    closeCartModal();
  };

  const openCheckout = async () => {
    setOrderSuccess(null);
    setAuthError(null);
    setAuthLoggedIn(isLoggedIn());
    const auth = getAuth();
    if (auth.country) {
      setLoggedInCountry(getCountryOrDefault(auth.country));
      setFormValues((prev) => ({ ...prev, country: prev.country || auth.country || 'Germany' }));
    }
    setCheckoutStep(isLoggedIn() ? 'details' : 'auth');
    setCheckoutOpen(true);

    if (isLoggedIn()) {
      if (cachedProfile) {
        prefillCheckoutDetails(cachedProfile);
        if (cachedProfile.country) {
          setLoggedInCountry(getCountryOrDefault(cachedProfile.country));
        }
      } else {
        try {
          const res = await fetch(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${auth.token}` }
          });
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            const profile = {
              fullName: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
              email: data.user.email,
              phone: data.user.phone,
              country: data.user.country,
            };
            setCachedProfile(profile);
            prefillCheckoutDetails(profile);
            if (profile.country) {
              setLoggedInCountry(getCountryOrDefault(profile.country));
            }
          } else {
            console.warn("Failed to retrieve user profile from token", data);
          }
        } catch (e) {
          console.error("Failed to fetch profile for checkout autofill", e);
        }
      }
    }
  };

  const closeCheckout = () => {
    if (!submitting) {
      setCheckoutOpen(false);
      setAuthError(null);
      setCheckoutStep('details');
    }
  };

  // If user reset their password from the checkout flow, reopen checkout auth.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shouldOpen =
      localStorage.getItem("poptum-open-checkout-auth-after-reset") === "true";
    if (!shouldOpen) return;

    localStorage.removeItem("poptum-open-checkout-auth-after-reset");
    if (!isLoggedIn()) {
      setTimeout(() => openCheckout(), 0);
    }
  }, []);

  const handleFormChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    if (name === 'country') {
      console.log(`[Country Change] User selected country: ${value}`);
      if (value !== 'India') {
        setFormValues((prev) => ({ ...prev, state: '' }));
      }
      if (value === 'India' || value === 'Germany') {
        const selected = value as 'India' | 'Germany';
        if (checkoutOpen || isLoggedIn()) {
          syncCartUnitPrices(selected);
        }

        if (isLoggedIn()) {
          setLoggedInCountry(selected);
          setAuthLoggedIn(true);

          const auth = getAuth();
          if (auth.token) {
            localStorage.setItem("country", selected);
            setCachedProfile((prev: any) => prev ? { ...prev, country: selected } : null);
            
            try {
              console.log(`[Country Sync] Syncing country "${selected}" to database...`);
              const res = await fetch(`${API}/api/user/update-country`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({ country: selected }),
              });
              const data = await res.json();
              if (res.ok && data.success) {
                console.log(`[Country Sync] Successfully synced country "${selected}" to user database profile.`);
              } else {
                console.error(`[Country Sync] Failed to sync country to database:`, data);
              }
            } catch (err) {
              console.error(`[Country Sync] Error syncing country to database:`, err);
            }
          }
        }
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formValues.fullName.trim()) errors.fullName = 'Required';
    if (!formValues.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) errors.email = 'Invalid email';
    if (formValues.phone.trim().length < 5) errors.phone = 'Invalid phone';
    if (formValues.address.trim().length < 5) errors.address = 'Required';
    if (!formValues.city.trim()) errors.city = 'Required';
    if (!formValues.postalCode.trim()) errors.postalCode = 'Required';
    if (!formValues.country.trim()) errors.country = 'Required';
    if (formValues.country === 'India' && !formValues.state.trim()) {
      errors.state = 'Required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getFlavourKeyByName = (name: string): FlavourKey | null => {
    const keys: FlavourKey[] = ['barbeque', 'himalayan', 'periPeri', 'creamOnion'];
    for (const k of keys) {
      if (t.flavours[k].name === name) return k;
    }
    // Fallback comparison
    const nameLower = name.toLowerCase();
    if (nameLower.includes('barbeque') || nameLower.includes('bbq')) return 'barbeque';
    if (nameLower.includes('himalayan') || nameLower.includes('pepper') || nameLower.includes('salt')) return 'himalayan';
    if (nameLower.includes('peri')) return 'periPeri';
    if (nameLower.includes('cream') || nameLower.includes('onion')) return 'creamOnion';
    return null;
  };

  const openGermanyOrderModal = () => {
    setCheckoutOpen(false);
    setPendingOrder(null);
    setPaymentExpiresAt(null);
    setCheckoutStep('details');
    setGermanyModalOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!validateForm() || cartItems.length === 0) return;

    const checkoutCountry = getActiveCheckoutCountry(formValues.country, loggedInCountry);

    let activePending = pendingOrder;

    // Manual checkout (Germany): always create a fresh order, no Razorpay pending reuse
    if (checkoutCountry === 'Germany') {
      activePending = null;
    }

    // Backend lookup if frontend state doesn't have it and user is logged in
    if (!activePending && isLoggedIn() && checkoutCountry === 'India') {
      try {
        console.log("[Diagnostic] Attempting backend lookup for reusable pending order...");
        const auth = getAuth();
        const res = await fetch(`${API}/api/orders/pending`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        const data = await res.json();
        if (res.ok && data.success && data.order) {
          activePending = data.order;
          console.log(`[Diagnostic] Backend lookup found reusable order: ${data.order.orderId}`);
        } else {
          console.log("[Diagnostic] Backend lookup returned no reusable order.");
        }
      } catch (e) {
        console.error("[Diagnostic] Failed backend lookup", e);
      }
    }

    if (activePending) {
      const expiresAt = (activePending as any).paymentExpiresAt 
        ? new Date((activePending as any).paymentExpiresAt) 
        : paymentExpiresAt;

      const now = new Date();
      const isExpired = expiresAt ? (now >= expiresAt) : false;

      if (isExpired) {
        console.log('[ORDER_EXPIRED] Creating replacement order');
        // Mark old order as Expired/Cancelled on backend
        fetch(`${API}/api/orders/${activePending.id}/cancel`, { method: 'POST' }).catch(err => {
          console.error("Failed to cancel expired order", err);
        });
        setPendingOrder(null);
        setPaymentExpiresAt(null);
        activePending = null;
      } else {
        // Compare customer details
        const origCust = (activePending as any).customerDetails || {};
        const customerDetailsUnchanged = 
          formValues.fullName === origCust.fullName &&
          formValues.email === origCust.email &&
          formValues.phone === origCust.phone &&
          formValues.address === origCust.address &&
          formValues.city === origCust.city &&
          formValues.postalCode === origCust.postalCode &&
          formValues.state === (origCust.state ?? '') &&
          formValues.country === origCust.country;

        // Compare cart items
        const origItems = (activePending as any).cartSnapshot || [];
        const origItemsMapped = origItems.map((item: any) => ({
          key: getFlavourKeyByName(item.name || item.productName),
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }));

        const itemsUnchanged = 
          cartItems.length === origItemsMapped.length &&
          cartItems.every(currentItem => {
            const matched = origItemsMapped.find((orig: any) => orig.key === currentItem.key);
            return matched && matched.quantity === currentItem.quantity && matched.unitPrice === currentItem.unitPrice;
          });

        if (customerDetailsUnchanged && itemsUnchanged) {
          console.log(`[ORDER_REUSE] Reusing pending order ${activePending.id}`);
          console.log(`[ORDER_REUSE] Cart unchanged`);
          console.log(`[ORDER_REUSE] Customer details unchanged`);
          
          setPendingOrder(activePending);
          if (expiresAt) setPaymentExpiresAt(expiresAt);
          setCheckoutStep('verification');
          console.log("[Order Placement] India user, auto-triggering Razorpay payment flow (Reused Order).");
          handleVerifyPayment(activePending);
          return; // Skip POSTing a new order!
        } else {
          console.log(`[ORDER_CANCELLED] Superseded by modified checkout`);
          console.log(`[ORDER_CREATE] Creating new order because checkout data changed`);
          
          // Cancel/expire the superseded order
          fetch(`${API}/api/orders/${activePending.id}/cancel`, { method: 'POST' }).catch(err => {
            console.error("Failed to cancel superseded order", err);
          });
          setPendingOrder(null);
          setPaymentExpiresAt(null);
          activePending = null;
        }
      }
    }

    setSubmitting(true);
    try {
      console.log(`[ORDER_CREATE] Creating a fresh Poptum order record...`);
      const response = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          customer: formValues,
          paymentMethod: selectedPayment,
          items: cartItems.map((item) => ({
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            image: item.image,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error('Order failed', data);
        return;
      }

      const orderInfo = {
        id: data.id,
        orderId: data.orderId,
        totals: data.totals,
        customerDetails: { ...formValues },
        cartSnapshot: cartItems.map(item => ({
          key: item.key,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        paymentExpiresAt: new Date(data.paymentExpiresAt)
      };

      if (checkoutCountry === 'Germany') {
        openGermanyOrderModal();
      } else {
        setPendingOrder(orderInfo);
        setPaymentExpiresAt(new Date(data.paymentExpiresAt));
        setCheckoutStep('verification');
        console.log("[Order Placement] India user, auto-triggering Razorpay payment flow.");
        handleVerifyPayment(orderInfo);
      }
    } catch (error) {
      console.error('Create order error', error);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerSuccessFlow = (activeOrder: {
    orderId: string;
    totals: {
      subtotal: number;
      tax: number;
      delivery: number;
      shipping: number;
      grandTotal: number;
      discount?: number;
    };
    country?: 'India' | 'Germany';
    state?: string;
    postalCode?: string;
  }) => {
    console.log(`[Diagnostic] [${new Date().toISOString()}] triggerSuccessFlow invoked. Order details:`, activeOrder);

    const successCountry = getActiveCheckoutCountry(
      activeOrder.country ?? formValues.country,
      loggedInCountry,
    );
    setOrderSuccess({
      orderId: activeOrder.orderId,
      country: successCountry,
      state: activeOrder.state ?? formValues.state,
      postalCode: activeOrder.postalCode ?? formValues.postalCode,
      totals: activeOrder.totals,
    });

    // 1. Clear cart state and local storage
    setCartItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("poptum-cart");
    }
    console.log(`[Diagnostic] [${new Date().toISOString()}] cart cleared`);

    // 2. Clear customer details form fields
    setFormValues({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      state: '',
      country: '',
    });
    console.log(`[Diagnostic] [${new Date().toISOString()}] form values cleared`);

    // 3. Reset pending order, payment expiration timer, and checkout step cleanly
    setPendingOrder(null);
    setPaymentExpiresAt(null);
    setTimeLeft('');
    setCheckoutStep('details');
    console.log(`[Diagnostic] [${new Date().toISOString()}] checkout reset completed. Step set to details.`);

    console.log(`[Diagnostic] [${new Date().toISOString()}] setOrderSuccess executed with activeOrder. checkoutOpen is currently: ${checkoutOpen}`);
  };

  const handleVerifyPayment = async (orderOverride?: {
    id: string;
    orderId: string;
    totals: { subtotal: number; tax: number; delivery: number; shipping: number; grandTotal: number };
  }) => {
    const activeOrder = orderOverride || pendingOrder;
    if (!activeOrder) return;
    setSubmitting(true);
    setAuthError(null);
    try {
      const checkoutCountry = getActiveCheckoutCountry(formValues.country, loggedInCountry);
      console.log(`[Payment Checkout] [Diagnostic] Starting payment flow. Detected user country: ${checkoutCountry}`);

      if (checkoutCountry === 'Germany') {
        setAuthError('Manual checkout orders do not require online payment.');
        setSubmitting(false);
        return;
      }

      if (checkoutCountry === 'India') {
        console.log("[Payment Checkout] [Diagnostic] Entering Razorpay payment branch.");
        const tStartFlow = performance.now();

        // 1. Verify VITE_RAZORPAY_KEY_ID
        const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        console.log(`[Payment Checkout] [Diagnostic] VITE_RAZORPAY_KEY_ID: ${rzpKey ? "YES" : "NO"}`);
        if (!rzpKey) {
          setAuthError("Razorpay key is not configured on the client side.");
          setSubmitting(false);
          return;
        }

        // 2. Measure script load
        const tScriptStart = performance.now();
        const resLoaded = await loadRazorpayScript();
        const tScriptDuration = performance.now() - tScriptStart;
        console.log(`[Payment Checkout] [Diagnostic] checkout.js load duration: ${tScriptDuration.toFixed(2)}ms (resLoaded: ${resLoaded})`);

        if (!resLoaded) {
          setAuthError('Failed to load Razorpay SDK.');
          setSubmitting(false);
          return;
        }

        // 3. Measure order creation fetch
        const amountInPaise = Math.round(activeOrder.totals.grandTotal * EUR_TO_INR * 100);
        console.log(`[Payment Checkout] [Diagnostic] Creating Razorpay order. Amount (paise): ${amountInPaise}, Receipt: ${activeOrder.orderId}`);
        const tOrderStart = performance.now();
        const orderRes = await fetch(`${API}/api/create-razorpay-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: activeOrder.orderId
          })
        });
        const orderData = await orderRes.json();
        const tOrderDuration = performance.now() - tOrderStart;
        console.log(`[Payment Checkout] [Diagnostic] Razorpay order creation request duration: ${tOrderDuration.toFixed(2)}ms (success: ${orderData.success})`);

        if (!orderRes.ok || !orderData.success) {
          setAuthError(orderData.message || 'Failed to initialize Razorpay payment.');
          setSubmitting(false);
          return;
        }

        // 4. Measure Razorpay instance creation and opening
        const tInstanceStart = performance.now();
        
        // Define options
        const options = {
          key: rzpKey,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Poptum",
          description: "Order Checkout",
          order_id: orderData.orderId,
          handler: async function (response: any) {
            const tCallback = performance.now();
            console.log(`[Payment Checkout] [Diagnostic] First Razorpay callback (payment successful) invoked after ${(tCallback - tStartFlow).toFixed(2)}ms. Response:`, response);
            setSubmitting(true);
            try {
              console.log(`[Payment Checkout] [Diagnostic] Verifying signature...`);
              const verifyRes = await fetch(`${API}/api/orders/${activeOrder.id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const data = await verifyRes.json();
              console.log("[Payment Checkout] [Diagnostic] Verification response:", data);
              if (verifyRes.ok && data.success === true) {
                triggerSuccessFlow(activeOrder);
              } else {
                setAuthError(data.message || 'Payment verification failed.');
              }
            } catch (e) {
              console.error("[Payment Checkout] [Diagnostic] Verification error:", e);
              setAuthError('Error verifying payment on server.');
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: formValues.fullName,
            email: formValues.email,
            contact: formValues.phone
          },
          theme: {
            color: "#000000"
          },
          modal: {
            ondismiss: function() {
              const tCallback = performance.now();
              console.log(`[Payment Checkout] [Diagnostic] First Razorpay callback (modal dismissed) invoked after ${(tCallback - tStartFlow).toFixed(2)}ms.`);
              setSubmitting(false);
              setAuthError('Payment cancelled by user.');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        const tInstanceDuration = performance.now() - tInstanceStart;
        console.log(`[Payment Checkout] [Diagnostic] Razorpay instance creation duration: ${tInstanceDuration.toFixed(2)}ms`);

        const tOpenStart = performance.now();
        rzp.on('payment.failed', function (response: any) {
          const tCallback = performance.now();
          console.error(`[Payment Checkout] [Diagnostic] First Razorpay callback (payment failed) invoked after ${(tCallback - tStartFlow).toFixed(2)}ms. Error:`, response.error);
          setAuthError(response.error.description || 'Payment failed.');
          setSubmitting(false);
        });
        
        rzp.open();
        const tOpenDuration = performance.now() - tOpenStart;
        console.log(`[Payment Checkout] [Diagnostic] rzp.open() duration: ${tOpenDuration.toFixed(2)}ms`);
        console.log(`[Payment Checkout] [Diagnostic] Razorpay modal opened. Total time from starting payment flow to open: ${(performance.now() - tStartFlow).toFixed(2)}ms`);
        
      }
    } catch (e) {
      console.error("[Payment Checkout] Exception in handleVerifyPayment:", e);
      setAuthError('Error initiating payment process.');
      setSubmitting(false);
    }
  };

  const handleCheckoutLogin = async () => {
    setAuthError(null);
    if (!loginValues.username.trim() || !loginValues.password.trim()) {
      setAuthError('Please enter username and password.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginValues),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Invalid credentials.');
        return;
      }

      saveAuth(data.token, data.role, data.username, data.country);
      const userCountry = getCountryOrDefault(data.country);
      setLoggedInCountry(userCountry);
      setAuthLoggedIn(true);
      syncCartUnitPrices(userCountry);

      try {
        const profileRes = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.success && profileData.user) {
          const profile = {
            fullName: `${profileData.user.firstName || ''} ${profileData.user.lastName || ''}`.trim(),
            email: profileData.user.email,
            phone: profileData.user.phone,
            country: profileData.user.country,
          };
          setCachedProfile(profile);
          prefillCheckoutDetails(profile);
        } else {
          if (!formValues.fullName.trim()) {
            setFormValues((prev) => ({
              ...prev,
              fullName: data.username || prev.fullName,
              country: prev.country || userCountry,
            }));
          }
        }
      } catch (e) {
        if (!formValues.fullName.trim()) {
          setFormValues((prev) => ({
            ...prev,
            fullName: data.username || prev.fullName,
            country: prev.country || userCountry,
          }));
        }
      }

      setCheckoutStep('details');
    } catch {
      setAuthError('Unable to login right now. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckoutSignup = async () => {
    setAuthError(null);
    if (!isSignupValid) {
      setAuthError('Please meet all password requirements.');
      return;
    }

    setAuthLoading(true);
    try {
      const signupRes = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupValues),
      });
      const signupData = await signupRes.json();

      if (!signupRes.ok || !signupData.success) {
        setAuthError(signupData.message || 'Signup failed.');
        return;
      }

      const profile = {
        fullName: `${signupValues.firstName} ${signupValues.lastName}`.trim(),
        email: signupValues.email,
        phone: signupValues.phone,
        country: signupValues.country,
      };
      prefillCheckoutDetails(profile);

      const loginRes = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupValues.username,
          password: signupValues.password,
        }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.success) {
        setAuthError('Signup completed, please login to continue.');
        setAuthMode('login');
        setLoginValues((prev) => ({ ...prev, username: signupValues.username }));
        return;
      }

      saveAuth(loginData.token, loginData.role, loginData.username, loginData.country);
      const signupCountry = getCountryOrDefault(loginData.country || signupValues.country);
      setLoggedInCountry(signupCountry);
      setAuthLoggedIn(true);
      syncCartUnitPrices(signupCountry);
      setCheckoutStep('details');
    } catch {
      setAuthError('Unable to signup right now. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckoutForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setCheckoutForgotMessage(null);

    if (!checkoutForgotEmail.trim()) {
      setAuthError("Please enter your email.");
      return;
    }

    setCheckoutForgotLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: checkoutForgotEmail,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || "Unable to process reset request.");
        return;
      }

      setCheckoutForgotMessage(
        data.message || "If an account exists, you'll receive an email shortly.",
      );
    } catch {
      setAuthError("Unable to process reset request.");
    } finally {
      setCheckoutForgotLoading(false);
    }
  };

  const handleNextToPayment = () => {
    if (!validateForm() || cartItems.length === 0) return;
    if (checkoutCountry === 'India' || checkoutCountry === 'Germany') {
      console.log(`[Payment Checkout] ${checkoutCountry} checkout — placing order directly (no payment method step).`);
      handleCreateOrder();
    } else {
      setCheckoutStep('payment');
    }
  };

  const checkoutPricing = calculateOrderPricing(cartItems, checkoutCountry);
  const subtotal = checkoutPricing.subtotal;
  const discount = checkoutPricing.discount;
  const shipping = checkoutPricing.shipping;
  const taxes = checkoutPricing.tax;
  const grandTotal = checkoutPricing.grandTotal;
  const germanyVatBreakdown =
    checkoutCountry === 'Germany'
      ? calculateGermanyVatFromInclusiveTotal(grandTotal)
      : null;
  const indiaGstDisplay =
    checkoutCountry === 'India'
      ? getIndiaCheckoutGstDisplay(grandTotal, formValues.state, formValues.postalCode)
      : null;

  const renderCheckoutTaxLines = () => {
    if (checkoutCountry === 'Germany' && germanyVatBreakdown) {
      return (
        <>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{language === 'de' ? 'Nettobetrag' : 'Subtotal (Taxable Value)'}</span>
            <span>{formatPriceByCountry(germanyVatBreakdown.taxableValue, checkoutCountry)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>VAT Included (7%)</span>
            <span>{formatPriceByCountry(germanyVatBreakdown.vat, checkoutCountry)}</span>
          </div>
        </>
      );
    }
    if (checkoutCountry === 'India' && indiaGstDisplay) {
      if (indiaGstDisplay.mode === 'included') {
        return (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>GST Included (5%)</span>
            <span>{formatPriceByCountry(indiaGstDisplay.gstIncluded, 'India')}</span>
          </div>
        );
      }
      if (indiaGstDisplay.mode === 'cgst_sgst') {
        return (
          <>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>CGST (2.5%)</span>
              <span>{formatPriceByCountry(indiaGstDisplay.cgst, 'India')}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>SGST (2.5%)</span>
              <span>{formatPriceByCountry(indiaGstDisplay.sgst, 'India')}</span>
            </div>
          </>
        );
      }
      return (
        <div className="flex items-center justify-between text-muted-foreground">
          <span>IGST (5%)</span>
          <span>{formatPriceByCountry(indiaGstDisplay.igst, 'India')}</span>
        </div>
      );
    }
    return null;
  };

  const renderSuccessPricingLines = () => {
    if (!orderSuccess) return null;
    const { totals, country } = orderSuccess;
    const format = (amount: number) => formatPriceByCountry(amount, country);

    if (country === 'Germany') {
      const vat = calculateGermanyVatFromInclusiveTotal(totals.grandTotal);
      return (
        <>
          <div className="flex justify-between">
            <span>{language === 'de' ? 'Nettobetrag' : 'Subtotal (Taxable Value)'}</span>
            <span>{format(vat.taxableValue)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT Included (7%)</span>
            <span>{format(vat.vat)}</span>
          </div>
          <div className="flex justify-between">
            <span>{language === 'de' ? 'Versand' : 'Shipping'}</span>
            <span>
              {totals.shipping === 0
                ? language === 'de'
                  ? 'KOSTENLOS'
                  : 'FREE'
                : format(totals.shipping)}
            </span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2 mt-1">
            <span>{language === 'de' ? 'Gesamtbetrag' : 'Grand Total'}</span>
            <span>{format(totals.grandTotal)}</span>
          </div>
        </>
      );
    }

    const gst = getIndiaCheckoutGstDisplay(
      totals.grandTotal,
      orderSuccess.state,
      orderSuccess.postalCode,
    );
    return (
      <>
        <div className="flex justify-between">
          <span>Subtotal (Taxable Value)</span>
          <span>{format(gst.taxableValue)}</span>
        </div>
        {gst.mode === 'cgst_sgst' ? (
          <>
            <div className="flex justify-between">
              <span>CGST (2.5%)</span>
              <span>{format(gst.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (2.5%)</span>
              <span>{format(gst.sgst)}</span>
            </div>
          </>
        ) : gst.mode === 'igst' ? (
          <div className="flex justify-between">
            <span>IGST (5%)</span>
            <span>{format(gst.igst)}</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span>GST Included (5%)</span>
            <span>{format(gst.gstIncluded)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{totals.shipping === 0 ? 'FREE' : format(totals.shipping)}</span>
        </div>
        <div className="flex justify-between font-semibold border-t pt-2 mt-1">
          <span>Grand Total</span>
          <span>{format(totals.grandTotal)}</span>
        </div>
      </>
    );
  };

  return (
    <section
      id="flavours"
      className="py-20 lg:py-28 bg-background"
      data-testid="flavours-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.flavours.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.flavours.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flavourKeys.map((key, index) => {
            const data = getFlavourData(key);
            return (
              <FlavourCard
                key={key}
                name={data.name}
                description={data.description}
                image={data.image}
                priceLabel={formatFlavourPriceLabel()}
                buttonText={t.flavours.viewDetails}
                onViewDetails={() => setSelectedFlavour(key)}
                onAddToCart={() => openCartModal(key)}
                isInCart={cartItems.some(item => item.key === key)}
                animationDelay={index * 0.1}
              />
            );
          })}
        </div>

        <FlavourModal
          isOpen={selectedFlavour !== null}
          onClose={() => setSelectedFlavour(null)}
          flavour={selectedFlavour ? getFlavourData(selectedFlavour) : null}
        />

        {/* Add to Cart modal */}
        <Dialog open={cartFlavour !== null} onOpenChange={(open) => !open && closeCartModal()}>
          <DialogContent className="max-w-md" data-testid="add-to-cart-modal">
            {cartFlavour && (() => {
              const data = getFlavourData(cartFlavour);
              const unitPrice = data.price;
              const totalPrice = unitPrice * quantity;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-5"
                >
                  <DialogHeader>
                    <DialogTitle className="font-heading text-xl">
                      {data.name}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Adjust quantity and add {data.name} to your cart
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={data.image}
                        alt={data.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {data.description}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {authLoggedIn ? (
                          <>
                            {formatDisplayPrice(unitPrice)}{' '}
                            <span className="text-xs text-muted-foreground">/ pack</span>
                          </>
                        ) : (
                          <>
                            {formatDualFlavourPrice()}{' '}
                            <span className="text-xs text-muted-foreground">/ pack</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Quantity
                    </span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={decrementQty}
                        disabled={quantity <= 0}
                        className="h-8 w-8 rounded-full"
                      >
                        –
                      </Button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold">
                        {quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={incrementQty}
                        className="h-8 w-8 rounded-full"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground">
                      Total
                    </span>
                    <span className="text-lg font-semibold text-foreground">
                      {authLoggedIn
                        ? formatDisplayPrice(totalPrice)
                        : formatDualLineTotal(quantity)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleConfirmAddToCart}
                    > 
                    {cartItems.some(i => i.key === cartFlavour)
                      ? t.cart.updateCart
                      : "Add to Cart"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={closeCartModal}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              );
            })()}
          </DialogContent>
        </Dialog>

        <Dialog 
          open={checkoutOpen} 
          onOpenChange={(open) => {
            console.log(`[Diagnostic] [${new Date().toISOString()}] Dialog open state requested change to: ${open}. current submitting: ${submitting}, orderSuccess: ${!!orderSuccess}, pendingOrder: ${!!pendingOrder}`);
            if (!open) closeCheckout();
          }}
          modal={!(submitting || pendingOrder)}
        >
          <DialogContent
            className="max-w-xl max-h-[min(90dvh,calc(100vh-2rem))] flex flex-col gap-0 overflow-hidden p-0 sm:rounded-lg"
            data-testid="checkout-modal"
            onPointerDownOutside={(e) => {
              console.log(`[Diagnostic] [${new Date().toISOString()}] onPointerDownOutside detected. submitting: ${submitting}, pendingOrder: ${!!pendingOrder}, orderSuccess: ${!!orderSuccess}`);
              if (submitting || pendingOrder || orderSuccess) {
                console.log(`[Diagnostic] Preventing dialog close on pointer down outside.`);
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              console.log(`[Diagnostic] [${new Date().toISOString()}] onEscapeKeyDown detected. submitting: ${submitting}, pendingOrder: ${!!pendingOrder}, orderSuccess: ${!!orderSuccess}`);
              if (submitting || pendingOrder || orderSuccess) {
                console.log(`[Diagnostic] Preventing dialog close on escape key.`);
                e.preventDefault();
              }
            }}
          >
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-6 pb-4">
            {orderSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-4 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <span className="text-3xl text-emerald-600">✓</span>
                </motion.div>
                <DialogHeader className="text-center sm:text-center">
                  <DialogTitle className="font-heading text-xl text-center w-full">
                    {language === 'de'
                      ? 'Deine Bestellung wurde erfolgreich aufgegeben.'
                      : 'Your order has been successfully placed.'}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Order confirmation details including your order ID and total cost
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {language === 'de'
                    ? 'Wir melden uns in Kürze bei dir.'
                    : "We’ll contact you shortly."}
                </p>
                <div className="text-sm text-left border rounded-lg p-4 bg-muted/50">
                  <p className="font-semibold mb-1">
                    Order ID: <span className="font-mono">{orderSuccess.orderId}</span>
                  </p>
                  <p className="text-muted-foreground text-xs mb-2">
                    Please keep this ID for your reference.
                  </p>
                  <div className="space-y-1 text-sm">{renderSuccessPricingLines()}</div>
                </div>
                <Button
                  type="button"
                  className="mt-2"
                  onClick={() => {
                    setOrderSuccess(null);
                    closeCheckout();
                  }}
                >
                  {language === 'de' ? 'Schließen' : 'Close'}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-5"
              >
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">
                    {checkoutStep === 'auth'
                      ? language === 'de'
                        ? 'Anmelden oder Registrieren'
                        : 'Login or Sign up'
                      : checkoutStep === 'payment'
                        ? language === 'de'
                          ? 'Zahlungsoptionen'
                          : 'Payment Options'
                        : language === 'de'
                          ? 'Bestellübersicht'
                          : 'Order Summary'}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Enter your shipping details to complete your order
                  </DialogDescription>
                </DialogHeader>

                {checkoutStep === 'auth' ? (
                  <div className="space-y-4">
                    <div className="inline-flex rounded-md border p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={authMode === 'login' ? 'default' : 'ghost'}
                        onClick={() => setAuthMode('login')}
                        disabled={authLoading}
                      >
                        {language === 'de' ? 'Anmelden' : 'Login'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={authMode === 'signup' ? 'default' : 'ghost'}
                        onClick={() => setAuthMode('signup')}
                        disabled={authLoading}
                      >
                        {language === 'de' ? 'Registrieren' : 'Sign up'}
                      </Button>
                    </div>
                    {authMode === 'login' ? (
                      <div className="space-y-3">
                        {!checkoutForgotOpen ? (
                          <>
                            <div className="grid grid-cols-1 gap-3">
                              <input
                                value={loginValues.username}
                                onChange={(e) =>
                                  setLoginValues((prev) => ({
                                    ...prev,
                                    username: e.target.value,
                                  }))
                                }
                                placeholder={language === 'de' ? 'Benutzername' : 'Username'}
                                className="w-full rounded-md border px-3 py-2 text-sm"
                              />
                              <input
                                type="password"
                                value={loginValues.password}
                                onChange={(e) =>
                                  setLoginValues((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                  }))
                                }
                                placeholder={language === 'de' ? 'Passwort' : 'Password'}
                                className="w-full rounded-md border px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="text-right">
                              <button
                                type="button"
                                className="text-orange-500 hover:underline font-semibold text-sm"
                                onClick={() => {
                                  localStorage.setItem("poptum-reset-return-to-checkout", "true");
                                  setCheckoutForgotOpen(true);
                                  setCheckoutForgotEmail("");
                                  setCheckoutForgotMessage(null);
                                  setAuthError(null);
                                }}
                              >
                                Forgot Password?
                              </button>
                            </div>
                          </>
                        ) : (
                          <form
                            onSubmit={handleCheckoutForgotPassword}
                            className="space-y-3"
                          >
                            <input
                              type="email"
                              required
                              value={checkoutForgotEmail}
                              onChange={(e) => setCheckoutForgotEmail(e.target.value)}
                              placeholder="Enter your email"
                              className="w-full rounded-md border px-3 py-2 text-sm"
                            />
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={checkoutForgotLoading}
                            >
                              {checkoutForgotLoading ? "Sending..." : "Send reset link"}
                            </Button>
                            {checkoutForgotMessage && (
                              <p className="text-sm text-gray-700">{checkoutForgotMessage}</p>
                            )}
                            <button
                              type="button"
                              className="text-orange-500 hover:underline font-semibold text-sm"
                              onClick={() => {
                                localStorage.removeItem("poptum-reset-return-to-checkout");
                                setCheckoutForgotOpen(false);
                                setCheckoutForgotEmail("");
                                setCheckoutForgotMessage(null);
                              }}
                            >
                              Back to login
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          value={signupValues.firstName}
                          onChange={(e) => setSignupValues((prev) => ({ ...prev, firstName: e.target.value }))}
                          placeholder={language === 'de' ? 'Vorname' : 'First Name'}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                        <input
                          value={signupValues.lastName}
                          onChange={(e) => setSignupValues((prev) => ({ ...prev, lastName: e.target.value }))}
                          placeholder={language === 'de' ? 'Nachname' : 'Last Name'}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                        <input
                          value={signupValues.username}
                          onChange={(e) => setSignupValues((prev) => ({ ...prev, username: e.target.value }))}
                          placeholder={language === 'de' ? 'Benutzername' : 'Username'}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                        <input
                          type="email"
                          value={signupValues.email}
                          onChange={(e) => setSignupValues((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="Email"
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                        <input
                          value={signupValues.phone}
                          onChange={(e) => setSignupValues((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder={language === 'de' ? 'Telefon' : 'Phone'}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                        <select
                          value={signupValues.country}
                          onChange={(e) => setSignupValues((prev) => ({ ...prev, country: e.target.value as 'India' | 'Germany' }))}
                          className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                        >
                          <option value="India">India</option>
                          <option value="Germany">Germany</option>
                        </select>
                        <input
                          type="password"
                          value={signupValues.password}
                          onChange={(e) => setSignupValues((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder={language === 'de' ? 'Passwort' : 'Password'}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                        <input
                          type="password"
                          value={signupValues.confirmPassword}
                          onChange={(e) => setSignupValues((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder={language === 'de' ? 'Passwort bestätigen' : 'Confirm Password'}
                          className="w-full rounded-md border px-3 py-2 text-sm md:col-span-2"
                        />
                        <div className="space-y-1.5 py-1 md:col-span-2">
                          <ValidationItem isValid={signupValidations.length} text="At least 8 characters" />
                          <ValidationItem isValid={signupValidations.uppercase} text="At least 1 uppercase letter" />
                          <ValidationItem isValid={signupValidations.number} text="At least 1 number" />
                          <ValidationItem isValid={signupValidations.special} text="At least 1 special character" />
                          <ValidationItem isValid={signupValidations.match} text="Passwords match" />
                        </div>
                      </div>
                    )}
                    {authError && <p className="text-sm text-red-500">{authError}</p>}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={() => {
                          if (authMode === 'login' && checkoutForgotOpen) return;
                          authMode === 'login' ? handleCheckoutLogin() : handleCheckoutSignup();
                        }}
                        disabled={authLoading || (authMode === 'login' && checkoutForgotOpen) || (authMode === 'signup' && !isSignupValid)}
                      >
                        {authLoading
                          ? language === 'de'
                            ? 'Bitte warten...'
                            : 'Please wait...'
                          : authMode === 'login'
                            ? language === 'de'
                              ? 'Weiter'
                              : 'Continue'
                            : language === 'de'
                              ? 'Registrieren und weiter'
                              : 'Sign up and continue'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={closeCheckout}
                        disabled={authLoading || checkoutForgotLoading}
                      >
                        {language === 'de' ? 'Abbrechen' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                {(checkoutIndiaProgress || checkoutGermanyProgress) && (
                  <div className="border rounded-lg p-3 bg-muted/20 space-y-1">
                    {checkoutIndiaProgress && (
                      <>
                        <p className={`text-xs ${checkoutIndiaProgress.phase.includes('unlocked') ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                          {checkoutIndiaProgress.message}
                        </p>
                        {checkoutIndiaProgress.note && (
                          <p className="text-[11px] text-muted-foreground/80">{checkoutIndiaProgress.note}</p>
                        )}
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              checkoutIndiaProgress.phase === 'free_shipping_unlocked' ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${checkoutIndiaProgress.progressPercent}%` }}
                          />
                        </div>
                      </>
                    )}
                    {checkoutGermanyProgress && (
                      <>
                        <p className={`text-xs ${checkoutGermanyProgress.phase.includes('unlocked') ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                          {checkoutGermanyProgress.message}
                        </p>
                        {checkoutGermanyProgress.note && (
                          <p className="text-[11px] text-muted-foreground/80">{checkoutGermanyProgress.note}</p>
                        )}
                        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                          {checkoutGermanyProgress.firstMilestoneComplete ? (
                            <>
                              <div
                                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${checkoutGermanyProgress.markerAPercent}%` }}
                              />
                              <div
                                className={`absolute top-0 h-full transition-all duration-500 ${
                                  checkoutGermanyProgress.secondMilestoneComplete ? 'bg-green-500' : 'bg-primary'
                                }`}
                                style={{
                                  left: `${checkoutGermanyProgress.markerAPercent}%`,
                                  width: `${Math.max(checkoutGermanyProgress.overallFillPercent - checkoutGermanyProgress.markerAPercent, 0)}%`,
                                }}
                              />
                            </>
                          ) : (
                            <div
                              className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                              style={{ width: `${checkoutGermanyProgress.overallFillPercent}%` }}
                            />
                          )}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-foreground/30 z-10"
                            style={{ left: `${checkoutGermanyProgress.markerAPercent}%` }}
                          />
                          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-0.5 h-3 bg-foreground/30 z-10" />
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className="border rounded-lg p-4 bg-muted/40 space-y-2 max-h-40 overflow-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        {formatPriceByCountry(item.unitPrice * item.quantity, checkoutCountry)}
                      </span>
                    </div>
                  ))}
                  <div className="space-y-1 pt-2 mt-1 border-t text-sm">
                    <div className="flex items-center justify-between">
                      <span>{language === 'de' ? 'Produkte' : 'Products'}</span>
                      <span>{formatPriceByCountry(subtotal, checkoutCountry)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-green-700">
                        <span>{language === 'de' ? 'Rabatt' : 'Discount'}</span>
                        <span>-{formatPriceByCountry(discount, checkoutCountry)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>{language === 'de' ? 'Versand' : 'Shipping'}</span>
                      <span>
                        {shipping === 0
                          ? (language === 'de' ? 'KOSTENLOS' : 'FREE')
                          : formatPriceByCountry(shipping, checkoutCountry)}
                      </span>
                    </div>
                    {renderCheckoutTaxLines()}
                    <div className="flex items-center justify-between font-semibold border-t pt-2 mt-1">
                      <span>{language === 'de' ? 'Gesamt' : 'Total'}</span>
                      <span>{formatPriceByCountry(grandTotal, checkoutCountry)}</span>
                    </div>
                  </div>
                </div>

                {checkoutStep === 'details' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      {language === 'de' ? 'Vollständiger Name' : 'Full Name'}
                    </label>
                    <input
                      name="fullName"
                      value={formValues.fullName}
                      onChange={handleFormChange}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    {formErrors.fullName && (
                      <p className="text-xs text-red-500">{formErrors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={formValues.email}
                      onChange={handleFormChange}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500">{formErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      {language === 'de' ? 'Telefonnummer' : 'Phone Number'}
                    </label>
                    <input
                      name="phone"
                      value={formValues.phone}
                      onChange={handleFormChange}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      {language === 'de' ? 'Stadt' : 'City'}
                    </label>
                    <input
                      name="city"
                      value={formValues.city}
                      onChange={handleFormChange}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    {formErrors.city && (
                      <p className="text-xs text-red-500">{formErrors.city}</p>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium">
                      {language === 'de' ? 'Adresse' : 'Address'}
                    </label>
                    <input
                      name="address"
                      value={formValues.address}
                      onChange={handleFormChange}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    {formErrors.address && (
                      <p className="text-xs text-red-500">{formErrors.address}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      {language === 'de' ? 'Postleitzahl' : 'Postal Code'}
                    </label>
                    <input
                      name="postalCode"
                      value={formValues.postalCode}
                      onChange={handleFormChange}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    {formErrors.postalCode && (
                      <p className="text-xs text-red-500">{formErrors.postalCode}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      {language === 'de' ? 'Land' : 'Country'}
                    </label>
                    <select
                      name="country"
                      value={formValues.country}
                      onChange={handleFormChange}
                      className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                    >
                      <option value="">Select country</option>
                      <option value="India">India</option>
                      <option value="Germany">Germany</option>
                    </select>
                    {formErrors.country && (
                      <p className="text-xs text-red-500">{formErrors.country}</p>
                    )}
                  </div>
                  {formValues.country === 'India' && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium">
                        {language === 'de' ? 'Bundesstaat' : 'State'} *
                      </label>
                      <select
                        name="state"
                        value={formValues.state}
                        onChange={handleFormChange}
                        className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                        required
                      >
                        <option value="">
                          {language === 'de' ? 'Bundesstaat wählen' : 'Select state'}
                        </option>
                        {INDIAN_STATES_AND_UTS.map((stateName) => (
                          <option key={stateName} value={stateName}>
                            {stateName}
                          </option>
                        ))}
                      </select>
                      {formErrors.state && (
                        <p className="text-xs text-red-500">{formErrors.state}</p>
                      )}
                    </div>
                  )}
                </div>
                ) : checkoutStep === 'payment' ? (
                  <div className="space-y-4 border rounded-lg p-4">
                    <p className="text-sm font-medium">
                      {language === 'de' ? 'Wähle eine Zahlungsart' : 'Choose a payment method'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={selectedPayment === 'upi' ? 'default' : 'outline'}
                        onClick={() => setSelectedPayment('upi')}
                      >
                        UPI
                      </Button>
                      <Button
                        type="button"
                        variant={selectedPayment === 'card' ? 'default' : 'outline'}
                        onClick={() => setSelectedPayment('card')}
                      >
                        {language === 'de' ? 'Karte' : 'Card'}
                      </Button>
                    </div>
                    <div className="text-sm space-y-1 border rounded-md p-3 bg-muted/30">
                      <div className="flex justify-between">
                        <span>{language === 'de' ? 'Produkte' : 'Products'}</span>
                        <span>{formatPriceByCountry(subtotal, checkoutCountry)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>{language === 'de' ? 'Rabatt' : 'Discount'}</span>
                          <span>-{formatPriceByCountry(discount, checkoutCountry)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>{language === 'de' ? 'Versand' : 'Shipping'}</span>
                        <span>
                          {shipping === 0
                            ? (language === 'de' ? 'KOSTENLOS' : 'FREE')
                            : formatPriceByCountry(shipping, checkoutCountry)}
                        </span>
                      </div>
                      {renderCheckoutTaxLines()}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>{language === 'de' ? 'Gesamt' : 'Total'}</span>
                        <span>{formatPriceByCountry(grandTotal, checkoutCountry)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-center border rounded-lg p-6 bg-muted/10 relative overflow-hidden">
                    {/* Expiry Timer */}
                    <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      {timeLeft}
                    </div>

                    {(formValues.country === 'India' || loggedInCountry === 'India') ? (
                      <div className="space-y-4 py-6">
                        <div className="mx-auto h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                          <span className="text-xl">💳</span>
                        </div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          {language === 'de' ? 'Razorpay-Zahlung ausstehend' : 'Razorpay Payment Pending'}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          {language === 'de' 
                            ? 'Bitte schließe die Zahlung über das Razorpay-Sicherheits-Popup ab.' 
                            : 'Please complete your payment via the secure Razorpay checkout popup.'}
                        </p>
                        <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto">
                          {language === 'de'
                            ? 'Wenn sich das Fenster nicht automatisch geöffnet hat, klicke unten auf "Jetzt bezahlen".'
                            : 'If the checkout window did not open automatically, click "Pay with Razorpay" below.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                          <span className="text-xl text-blue-600">
                            {selectedPayment === 'upi' ? '📱' : '💳'}
                          </span>
                        </div>

                        <h3 className="font-heading text-lg">
                          {selectedPayment === 'upi' 
                            ? (language === 'de' ? 'Scannen zum Bezahlen' : 'Scan to Pay via UPI')
                            : (language === 'de' ? 'Kartenzahlung' : 'Card Payment')}
                        </h3>

                        {selectedPayment === 'upi' ? (
                          <div className="bg-white p-4 rounded-xl shadow-sm inline-block mx-auto border">
                            <QRCodeSVG 
                              value={`upi://pay?pa=poptum@upi&pn=Poptum&am=${grandTotal}&cu=INR`} 
                              size={180} 
                              level="H"
                              includeMargin={true}
                            />
                            <p className="text-xs text-muted-foreground mt-3">
                              {language === 'de' ? 'Nutze eine beliebige UPI-App' : 'Use any UPI App (GPay, PhonePe, Paytm)'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 text-left">
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Card Number</label>
                              <input type="text" placeholder="0000 0000 0000 0000" className="w-full rounded-md border px-3 py-2 text-sm bg-white" />
                            </div>
                            <div className="flex gap-3">
                              <div className="space-y-1 flex-1">
                                <label className="text-xs font-medium">Expiry</label>
                                <input type="text" placeholder="MM/YY" className="w-full rounded-md border px-3 py-2 text-sm bg-white" />
                              </div>
                              <div className="space-y-1 flex-1">
                                <label className="text-xs font-medium">CVV</label>
                                <input type="password" placeholder="***" className="w-full rounded-md border px-3 py-2 text-sm bg-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="text-lg font-bold text-primary border-t pt-3 mt-3">
                      {language === 'de' ? 'Zu zahlen: ' : 'Amount Payable: '}
                      {formatPriceByCountry(grandTotal, formValues.country || loggedInCountry)}
                    </div>
                  </div>
                )}


                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {checkoutStep === 'details' ? (
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleNextToPayment}
                      disabled={submitting || cartItems.length === 0}
                    >
                      {submitting
                        ? (language === 'de' ? 'Wird verarbeitet...' : 'Processing...')
                        : (isIndiaCheckout(formValues.country, loggedInCountry) || isGermanyCheckout(formValues.country, loggedInCountry))
                          ? (language === 'de' ? 'Bestellung aufgeben' : 'Place Order')
                          : (language === 'de' ? 'Weiter zur Zahlung' : 'Next')}
                    </Button>
                  ) : checkoutStep === 'payment' ? (
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleCreateOrder}
                      disabled={submitting || cartItems.length === 0}
                    >
                      {submitting
                        ? language === 'de'
                          ? 'Wird verarbeitet...'
                          : 'Processing...'
                        : language === 'de'
                          ? 'Bestellung aufgeben'
                          : 'Place Order'}
                    </Button>
                  ) : (
                     <Button
                       type="button"
                       className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                       onClick={() => handleVerifyPayment()}
                       disabled={submitting}
                     >
                       {submitting
                         ? (language === 'de' ? 'Überprüfung...' : 'Verifying...')
                         : (formValues.country === 'India' || loggedInCountry === 'India')
                           ? (language === 'de' ? 'Jetzt bezahlen' : 'Pay with Razorpay')
                           : (language === 'de'
                             ? 'Zahlung simulieren/bestätigen'
                             : 'Simulate/Verify Payment')}
                     </Button>
                  )}
                  
                  {checkoutStep !== 'verification' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (checkoutStep === 'payment') {
                          setCheckoutStep('details');
                          return;
                        }
                        closeCheckout();
                      }}
                      disabled={submitting}
                    >
                      {checkoutStep === 'payment'
                        ? language === 'de'
                          ? 'Zurück'
                          : 'Back'
                        : language === 'de'
                          ? 'Abbrechen'
                          : 'Cancel'}
                    </Button>
                  )}
                </div>
                </>
                )}
              </motion.div>
            )}
            </div>
          </DialogContent>
         </Dialog>

        <Dialog open={germanyModalOpen} onOpenChange={setGermanyModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Payment Information
              </DialogTitle>
              <DialogDescription className="sr-only">
                Information about payment options for orders in Germany
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Thank you for your order.</p>
              <p>Currently we are not accepting direct online payments in EUR through the website.</p>
              <p>Your order has been received successfully.</p>
              <p>Our team will contact you via your registered email address with payment instructions and order confirmation.</p>
              <p>Thank you for your cooperation.</p>
              <div className="pt-2 font-medium">
                <p>Regards,</p>
                <p>Team Poptum</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                onClick={() => {
                  setCartItems([]);
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("poptum-cart");
                  }
                  setFormValues({
                    fullName: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    postalCode: '',
                    state: '',
                    country: '',
                  });
                  setGermanyModalOpen(false);
                  setCheckoutOpen(false);
                }}
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {cartItems.length > 0 && (
  <motion.div
  initial={{ y: 100 }}
  animate={{ y: 0 }}
  transition={{ duration: 0.35 }}
    className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg"
    role="region"
    aria-label="Shopping cart summary"
  >
    <div className="px-4 pt-2">
  {!authLoggedIn && guestCartProgress ? (
    <>
      <p
        className={`text-xs mb-1 ${
          guestCartProgress.phase === 'fully_unlocked' ||
          guestCartProgress.phase === 'india_free_shipping_unlocked'
            ? 'text-green-600 font-medium'
            : 'text-muted-foreground'
        }`}
      >
        {guestCartProgress.message}
      </p>
      {guestCartProgress.note && (
        <p className="text-[11px] text-muted-foreground/80 mb-1">{guestCartProgress.note}</p>
      )}
      {!guestCartProgress.showPhase2Bar ? (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${guestCartProgress.phase1ProgressPercent}%` }}
          />
        </div>
      ) : (
        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
          {guestCartProgress.indiaMilestoneComplete ? (
            <>
              <div
                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500"
                style={{ width: `${guestCartProgress.markerAPercent}%` }}
              />
              <div
                className={`absolute top-0 h-full transition-all duration-500 ${
                  guestCartProgress.germanyMilestoneComplete ? 'bg-green-500' : 'bg-primary'
                }`}
                style={{
                  left: `${guestCartProgress.markerAPercent}%`,
                  width: `${Math.max(guestCartProgress.overallFillPercent - guestCartProgress.markerAPercent, 0)}%`,
                }}
              />
            </>
          ) : (
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
              style={{ width: `${guestCartProgress.overallFillPercent}%` }}
            />
          )}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-foreground/30 z-10"
            style={{ left: `${guestCartProgress.markerAPercent}%` }}
            title="10 packs (India)"
          />
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 w-0.5 h-3 bg-foreground/30 z-10"
            title="12 packs (Germany)"
          />
        </div>
      )}
    </>
  ) : dashboardIndiaProgress ? (
    <>
      <p className={`text-xs mb-1 ${dashboardIndiaProgress.phase.includes('unlocked') ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
        {dashboardIndiaProgress.message}
      </p>
      {dashboardIndiaProgress.note && (
        <p className="text-[11px] text-muted-foreground/80 mb-1">{dashboardIndiaProgress.note}</p>
      )}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            dashboardIndiaProgress.phase === 'free_shipping_unlocked' ? 'bg-green-500' : 'bg-primary'
          }`}
          style={{ width: `${dashboardIndiaProgress.progressPercent}%` }}
        />
      </div>
    </>
  ) : dashboardGermanyProgress ? (
    <>
      <p className={`text-xs mb-1 ${dashboardGermanyProgress.phase.includes('unlocked') ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
        {dashboardGermanyProgress.message}
      </p>
      {dashboardGermanyProgress.note && (
        <p className="text-[11px] text-muted-foreground/80 mb-1">{dashboardGermanyProgress.note}</p>
      )}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            dashboardGermanyProgress.phase === 'free_shipping_unlocked' ? 'bg-green-500' : 'bg-primary'
          }`}
          style={{ width: `${dashboardGermanyProgress.progressPercent}%` }}
        />
      </div>
    </>
  ) : null}
</div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      
      <div className="flex flex-wrap items-center gap-4">

  {cartItems.map((item) => (
    <div key={item.key} className="flex items-center gap-2 text-sm">

      <span>{item.name}</span>

      <Button
        size="icon"
        variant="outline"
        className="h-6 w-6"
        onClick={() =>
  setCartItems(prev => {
    const updated = prev
      .map(p =>
        p.key === item.key
          ? { ...p, quantity: Math.max(p.quantity - 1, 0) }
          : p
      )
      .filter(p => p.quantity > 0);

    return updated;
  })
}
      >
        -
      </Button>

      <span>{item.quantity}</span>

      <Button
        size="icon"
        variant="outline"
        className="h-6 w-6"
        onClick={() =>
          setCartItems(prev =>
            prev.map(p =>
              p.key === item.key
                ? { ...p, quantity: p.quantity + 1 }
                : p
            )
          )
        }
      >
        +
      </Button>

    </div>
  ))}

  <span className="font-semibold text-sm">
    {authLoggedIn
      ? formatDisplayPrice(dashboardProductTotal)
      : formatDualFooterPayable(cartTotalPackets)}
  </span>

</div>

      <div className="flex gap-3 w-full sm:w-auto">

<Button
  type="button"
  variant="outline"
  onClick={() => setCartItems([])}
>
  {language === "de" ? "Warenkorb leeren" : "Clear Cart"}
</Button>

<Button
  type="button"
  onClick={openCheckout}
>
  {t.cart.proceedCheckout}
</Button>

</div>

    </div>
</motion.div>)}
{cartItems.length > 0 && (
  <motion.button
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 220, damping: 18 }}
    onClick={openCheckout}
    className="fixed bottom-24 right-6 z-50 bg-primary text-primary-foreground rounded-full h-14 w-14 shadow-xl flex items-center justify-center text-lg font-semibold"
  >
    🛒
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
    </span>
  </motion.button>
)}
{toast && (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50"
  >
    {toast}
  </motion.div>
)}
    </section>
  );
}
