'use client';

import { ReactNode, useState } from 'react';
import { toast } from 'sonner';

type PaymentMode = 'subscription' | 'one-time';

interface CreemPaymentButtonProps {
  productId: string;
  mode?: PaymentMode;
  children: ReactNode;
  cancelUrl?: string;
}

export function CreemPaymentButton({
  productId,
  mode = 'subscription',
  children,
  cancelUrl = '/pricing',
}: CreemPaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const endpoint = mode === 'subscription' 
        ? '/api/creem/checkout'
        : '/api/creem/one-time-payment';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          cancelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={handlePayment} style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
      {children}
    </div>
  );
}