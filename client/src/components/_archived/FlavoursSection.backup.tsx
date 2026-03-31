import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import FlavourCard from './FlavourCard';
import FlavourModal from './FlavourModal';
import barbequeImage from '@assets/generated_images/barbeque_flavour_makhana.png';
import himalayanImage from '@assets/generated_images/himalayan_salt_pepper_makhana.png';
import periPeriImage from '@assets/generated_images/peri_peri_flavour_makhana.png';
import creamOnionImage from '@assets/generated_images/cream_onion_flavour_makhana.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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

  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    totals: { subtotal: number; tax: number; delivery: number; shipping: number; grandTotal: number };
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
    country: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  useEffect(() => {
  localStorage.setItem("poptum-cart", JSON.stringify(cartItems));
}, [cartItems]);

  const flavourKeys: FlavourKey[] = ['barbeque', 'himalayan', 'periPeri', 'creamOnion'];

  const flavourPrices: Record<FlavourKey, number> = {
    barbeque: 4.99,
    himalayan: 4.99,
    periPeri: 4.99,
    creamOnion: 4.99,
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  const getFlavourData = (key: FlavourKey) => {
    const data = t.flavours[key];
    return {
      name: data.name,
      description: data.description,
      fullDescription: data.fullDescription,
      ingredients: data.ingredients,
      tasteProfile: data.tasteProfile,
      servingIdeas: data.servingIdeas,
      image: flavourImages[key],
      price: flavourPrices[key],
    };
  };

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

    const data = getFlavourData(cartFlavour);
    const unitPrice = data.price;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === cartFlavour);

      if (existing) {
  if (quantity === 0) {
    return prev.filter(item => item.key !== cartFlavour);
  }

  return prev.map((item) =>
    item.key === cartFlavour
      ? { ...item, quantity }
      : item
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

  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const freeShippingThreshold = 30;
const remainingForFreeShipping = Math.max(
  freeShippingThreshold - cartSubtotal,
  0
);

const progress =
  Math.min(cartSubtotal / freeShippingThreshold, 1) * 100;

  const openCheckout = () => {
    setOrderSuccess(null);
    setCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (!submitting) {
      setCheckoutOpen(false);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
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
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm() || cartItems.length === 0) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          customer: formValues,
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

      setOrderSuccess({
        orderId: data.orderId,
        totals: data.totals,
      });
      setCartItems([]);
      setFormValues({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
});
      setCheckoutOpen(true);
    } finally {
      setSubmitting(false);
    }
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
                priceLabel={formatPrice(data.price)}
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
                        {formatPrice(unitPrice)} <span className="text-xs text-muted-foreground">/ pack</span>
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
                      {formatPrice(totalPrice)}
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

        {/* Checkout modal */}
        <Dialog open={checkoutOpen} onOpenChange={(open) => !open && closeCheckout()}>
          <DialogContent className="max-w-xl" data-testid="checkout-modal">
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
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">
                    {language === 'de'
                      ? 'Deine Bestellung wurde erfolgreich aufgegeben.'
                      : 'Your order has been successfully placed.'}
                  </DialogTitle>
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
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(orderSuccess.totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(orderSuccess.totals.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span>{formatPrice(orderSuccess.totals.delivery)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatPrice(orderSuccess.totals.shipping)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2 mt-1">
                      <span>Total</span>
                      <span>{formatPrice(orderSuccess.totals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
<Button
  type="button"
  className="mt-2"
  onClick={() => {
    setOrderSuccess(null);
    closeCheckout();
  }}
>                  {language === 'de' ? 'Schließen' : 'Close'}
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
                    {language === 'de' ? 'Checkout' : 'Checkout'}
                  </DialogTitle>
                </DialogHeader>

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
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t text-sm font-semibold">
                    <span>{language === 'de' ? 'Zwischensumme' : 'Subtotal'}</span>
                    <span>{formatPrice(cartSubtotal)}</span>
                  </div>
                </div>

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
                    <input
                      name="country"
                      value={formValues.country}
                      onChange={handleFormChange}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    {formErrors.country && (
                      <p className="text-xs text-red-500">{formErrors.country}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handlePlaceOrder}
                    disabled={submitting || cartItems.length === 0}
                  >
                    {submitting
                      ? language === 'de'
                        ? 'Bestellung wird gesendet...'
                        : 'Placing order...'
                      : language === 'de'
                        ? 'Bestellung Aufgeben'
                        : 'Place Order'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={closeCheckout}
                    disabled={submitting}
                  >
                    {language === 'de' ? 'Abbrechen' : 'Cancel'}
                  </Button>
                </div>
              </motion.div>
            )}
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
  {cartSubtotal < freeShippingThreshold ? (
    <p className="text-xs text-muted-foreground mb-1">
      {language === "de"
        ? `Noch ${formatPrice(remainingForFreeShipping)} bis zum kostenlosen Versand`
        : `You're ${formatPrice(remainingForFreeShipping)} away from FREE shipping`}
    </p>
  ) : (
    <p className="text-xs text-green-600 font-medium">
      {language === "de"
        ? "Kostenloser Versand freigeschaltet!"
        : "Free shipping unlocked!"}
    </p>
  )}

  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
    <div
      className="h-full bg-primary transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>
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
    {formatPrice(cartSubtotal)}
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
