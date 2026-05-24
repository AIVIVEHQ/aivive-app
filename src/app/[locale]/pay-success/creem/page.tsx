import { redirect } from 'next/navigation';

interface CreemSuccessPageProps {
  searchParams: Promise<{
    checkout_id?: string;
    order_id?: string;
    customer_id?: string;
    subscription_id?: string;
    product_id?: string;
    signature?: string;
  }>;
}

export default async function CreemSuccessPage({ searchParams }: CreemSuccessPageProps) {
  const { checkout_id, order_id, subscription_id } = await searchParams;

  // Verify required parameters
  if (!checkout_id) {
    redirect('/pricing?error=invalid_checkout');
  }

  // Redirect to the main success page with Creem-specific parameters
  const params = new URLSearchParams();
  if (checkout_id) params.set('checkout_id', checkout_id);
  if (order_id) params.set('order_id', order_id);
  if (subscription_id) params.set('subscription_id', subscription_id);
  params.set('provider', 'creem');

  redirect(`/pay-success?${params.toString()}`);
}