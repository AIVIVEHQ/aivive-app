import { redirect } from '@/i18n/navigation';

interface PaySuccessPageProps {
  searchParams: Promise<{
    checkout_id?: string;
    order_id?: string;
    subscription_id?: string;
    provider?: string;
    session_id?: string;
  }>;
  params: Promise<{ locale: string }>;
}

export default async function PaySuccessPage({ searchParams, params }: PaySuccessPageProps) {
  const { locale } = await params;
  const { provider, session_id, checkout_id, order_id, subscription_id } = await searchParams;

  // Handle different payment providers
  if (provider === 'creem') {
    // Creem payment success - verify the payment and redirect
    if (checkout_id && order_id) {
      // TODO: Add Creem payment verification logic here if needed
      console.log('Creem payment success:', { checkout_id, order_id, subscription_id });
      
      // Redirect to success page
      redirect({
        href: process.env.NEXT_PUBLIC_PAY_SUCCESS_URL || "/",
        locale: locale || "en",
      });
    } else {
      // Missing required parameters
      redirect({
        href: process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/",
        locale: locale || "en",
      });
    }
  } else if (session_id) {
    // Stripe payment - redirect to existing Stripe handler
    redirect({
      href: `/pay-success/${session_id}`,
      locale: locale || "en",
    });
  } else {
    // Unknown provider or missing parameters
    redirect({
      href: process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/",
      locale: locale || "en",
    });
  }
}