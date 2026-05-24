import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { CREEM_API_KEY, CREEM_BASE_URL } from '@/lib/creem';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    // Ensure we have the correct user UUID from the database
    const userRecord = await db()
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!userRecord || userRecord.length === 0) {
       return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userUuid = userRecord[0].uuid;
 
    const successUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/pay-success/creem`;
    
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
          user_uuid: userUuid,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const checkout = await response.json();
    console.log('Creem API response:', checkout);

    return NextResponse.json({
      result: checkout,
      ok: true,
      checkoutUrl: checkout.url || checkout.checkout_url || checkout.checkoutUrl,
    });
  } catch (error) {
    console.error('Creem checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
