import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { CREEM_API_KEY, CREEM_BASE_URL } from '@/lib/creem';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, cancelUrl = '/pricing' } = body;

    if (!CREEM_API_KEY) {
      return NextResponse.json(
        { error: 'CREEM_API_KEY is not configured' },
        { status: 500 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const baseUrl = new URL(request.url).origin;
    const successUrl = `${baseUrl}/pay-success/creem`;
    const fullCancelUrl = `${baseUrl}${cancelUrl}`;

    const response = await fetch(`${CREEM_BASE_URL}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CREEM_API_KEY,
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: successUrl,
        metadata: {
          user_email: session.user.email,
          user_uuid: session.user.id || '',
          payment_type: 'one_time',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const checkout = await response.json();

    return NextResponse.json({
      result: checkout,
      ok: true,
      checkoutUrl: checkout.url,
    });
  } catch (error) {
    console.error('Creem one-time payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
