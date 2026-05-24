import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { increaseCredits, CreditsTransType } from '@/services/credit';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Creem webhook endpoint is reachable',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    
    if (!rawBody) {
      return NextResponse.json({ received: true, error: 'Empty body' });
    }

    // Verify webhook signature if secret is configured
    const signature = request.headers.get('creem-signature');
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (webhookSecret) {
      console.warn('Webhook secret configured but no signature header found');
    }
    
    const body = JSON.parse(rawBody);
    const { eventType, object: data } = body;
    
    console.log('Creem webhook received:', { eventType, data });

    switch (eventType) {
      case 'checkout.completed':
        // 最终付款完成事件 - 无论是一次性还是订阅，都在这里统一处理
        await handleCheckoutCompleted(data);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data);
        break;
      
      case 'subscription.created':
      case 'subscription.active':  
      case 'subscription.paid':
      case 'subscription.updated':
        // 这些事件只记录日志，不创建订单
        // 真正的订单创建在 checkout.completed 时进行
        console.log(`Subscription event logged: ${eventType}`, data.id);
        break;
      
      default:
        console.warn('Unhandled webhook type:', eventType);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Creem webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(data: any) {
  const checkout = data;
  const order = checkout.order;
  const customer = checkout.customer;
  const subscription = checkout.subscription;
  
  const userEmail = checkout.metadata?.user_email || customer?.email;
  let userUuid = checkout.metadata?.user_uuid;
  const checkout_id = checkout.id;

  if (!userEmail) {
    console.error('No user email found in checkout completed webhook');
    return;
  }

  // Fallback: try to find user by email if uuid is missing
  if (!userUuid) {
    console.log(`User UUID missing in metadata for email ${userEmail}, attempting lookup...`);
    const userRecord = await db()
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);
      
    if (userRecord && userRecord.length > 0) {
      userUuid = userRecord[0].uuid;
      console.log(`Found user UUID ${userUuid} for email ${userEmail}`);
    } else {
      console.error(`Could not find user with email ${userEmail}`);
    }
  }

  // Update user with Creem customer ID if available
  if (customer?.id && userUuid) {
    await db()
      .update(users)
      .set({ creem_customer_id: customer.id })
      .where(eq(users.uuid, userUuid));
  }

  // 检查是否已经存在相同的订单（避免重复创建）
  if (subscription?.id) {
    const existingOrder = await db()
      .select()
      .from(orders)
      .where(eq(orders.creem_subscription_id, subscription.id))
      .limit(1);
    
    if (existingOrder.length > 0) {
      console.log('Subscription order already exists, updating status to paid');
      await db()
        .update(orders)
        .set({ 
          status: 'paid',
          paid_at: new Date(),
          paid_detail: JSON.stringify(data),
        })
        .where(eq(orders.creem_subscription_id, subscription.id));
      return;
    }
  }

  // Calculate credits and expiration
  const credits = getCreditsFromProduct(order?.product, order?.amount);
  // Default validity: 12 months
  const validMonths = 12;
  const expiredAt = new Date();
  expiredAt.setMonth(expiredAt.getMonth() + validMonths);

  // Create new order record
  const orderNo = `creem_${checkout_id}_${Date.now()}`;
  const productName = checkout.product?.name || checkout.product?.id || 'Unknown Product';
  
  await db().insert(orders).values({
    order_no: orderNo,
    user_uuid: userUuid || '',
    user_email: userEmail,
    amount: order?.amount || 0,
    status: 'paid',  // 统一设为 paid，因为用户已经完成付款
    currency: order?.currency || 'USD',
    product_id: order?.product,
    product_name: productName,
    creem_customer_id: customer?.id,
    creem_subscription_id: subscription?.id,
    paid_at: new Date(),
    paid_email: userEmail,
    paid_detail: JSON.stringify(data),
    credits: credits,
    expired_at: expiredAt,
    valid_months: validMonths,
  });

  // Increase user credits
  if (credits > 0 && userUuid) {
    console.log(`Increasing credits for user ${userUuid}: +${credits}`);
    await increaseCredits({
      user_uuid: userUuid,
      trans_type: CreditsTransType.OrderPay,
      credits: credits,
      expired_at: expiredAt.toISOString(),
      order_no: orderNo,
    });
  } else {
    console.warn(`No credits to increase for order ${orderNo} (credits=${credits}, userUuid=${userUuid})`);
  }
}


async function handleSubscriptionCancelled(data: any) {
  const { id: subscription_id } = data;

  await db()
    .update(orders)
    .set({ 
      status: 'cancelled',
      paid_detail: JSON.stringify(data),
    })
    .where(eq(orders.creem_subscription_id, subscription_id));
}

function getCreditsFromProduct(productId: string, amount: number): number {
  // Map product IDs to credit amounts
  const productCredits: Record<string, number> = {
    // Starter Pack ($9.90)
    'prod_578VQAnhVFXHI8sPklii3f': 500, 
    // Pro Pack ($29.90)
    'prod_5yQNIAz1UtWTyWVgzxjzJO': 2000, 
    // Org Pack ($69.90) - Assuming ID if known, otherwise fallback to amount
  };

  if (productCredits[productId]) {
    return productCredits[productId];
  }

  // Fallback based on amount (in cents)
  if (amount === 990) return 500;     // $9.90
  if (amount === 2990) return 2000;   // $29.90
  if (amount === 6990) return 5000;   // $69.90

  console.warn(`Unknown product ID ${productId} and amount ${amount}, defaulting to 0 credits`);
  return 0;
}

