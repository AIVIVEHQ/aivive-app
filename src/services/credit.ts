import {
  findCreditByOrderNo,
  getUserValidCredits,
  insertCredit,
} from "@/models/credit";
import { credits as creditsTable } from "@/db/schema";
import { getIsoTimestr } from "@/lib/time";
import { getSnowId } from "@/lib/hash";
import { Order } from "@/types/order";
import { UserCredits } from "@/types/user";
import { getFirstPaidOrderByUserUuid } from "@/models/order";

export enum CreditsTransType {
  NewUser = "new_user", // initial credits for new user
  OrderPay = "order_pay", // user pay for credits
  SystemAdd = "system_add", // system add credits
  Ping = "ping", // cost for ping api
  Generation = "generation", // image generation
  GenerationRefund = "generation_refund", // refund for failed generation
}

export enum CreditsAmount {
  NewUserGet = 100,
  PingCost = 1,
}

export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  let user_credits: UserCredits = {
    left_credits: 0,
  };

  try {
    const first_paid_order = await getFirstPaidOrderByUserUuid(user_uuid);
    if (first_paid_order) {
      user_credits.is_recharged = true;
    }

    const credits = await getUserValidCredits(user_uuid);
    if (credits) {
      credits.forEach((v) => {
        user_credits.left_credits += v.credits || 0;
      });
    }

    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    if (user_credits.left_credits > 0) {
      user_credits.is_pro = true;
    }

    return user_credits;
  } catch (e) {
    console.log("get user credits failed: ", e);
    return user_credits;
  }
}

export async function decreaseCredits({
  user_uuid,
  trans_type,
  credits,
}: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
}) {
  try {
    let order_no = "";
    let expired_at = "";
    let left_credits = 0;

    const userCredits = await getUserValidCredits(user_uuid);
    if (userCredits) {
      for (let i = 0, l = userCredits.length; i < l; i++) {
        const credit = userCredits[i];
        left_credits += credit.credits;

        // credit enough for cost
        if (left_credits >= credits) {
          order_no = credit.order_no || "";
          expired_at = credit.expired_at?.toISOString() || "";
          break;
        }

        // look for next credit
      }
    }

    const new_credit: typeof creditsTable.$inferInsert = {
      trans_no: getSnowId(),
      created_at: new Date(getIsoTimestr()),
      expired_at: new Date(expired_at),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: 0 - credits,
      order_no: order_no,
    };
    await insertCredit(new_credit);
  } catch (e) {
    console.log("decrease credits failed: ", e);
    throw e;
  }
}

export async function increaseCredits({
  user_uuid,
  trans_type,
  credits,
  expired_at,
  order_no,
}: {
  user_uuid: string;
  trans_type: string;
  credits: number;
  expired_at?: string;
  order_no?: string;
}) {
  try {
    const new_credit: typeof creditsTable.$inferInsert = {
      trans_no: getSnowId(),
      created_at: new Date(getIsoTimestr()),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: credits,
      order_no: order_no || "",
      expired_at: expired_at ? new Date(expired_at) : null,
    };
    await insertCredit(new_credit);
  } catch (e) {
    console.log("increase credits failed: ", e);
    throw e;
  }
}

export async function updateCreditForOrder(order: Order) {
  try {
    const credit = await findCreditByOrderNo(order.order_no);
    if (credit) {
      // order already increased credit
      return;
    }

    await increaseCredits({
      user_uuid: order.user_uuid,
      trans_type: CreditsTransType.OrderPay,
      credits: order.credits,
      expired_at: order.expired_at,
      order_no: order.order_no,
    });
  } catch (e) {
    console.log("update credit for order failed: ", e);
    throw e;
  }
}

/**
 * Deduct credits for image generation
 */
export async function deductGenerationCredits(
  user_uuid: string,
  credits_amount: number,
  generation_uuid: string
): Promise<void> {
  try {
    const trans_no = `GEN-${generation_uuid}`;

    // Check if already deducted (idempotency)
    const existing = await findCreditByOrderNo(trans_no);
    if (existing) {
      throw new Error("Credits already deducted for this generation");
    }

    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Generation,
      credits: credits_amount,
    });
  } catch (e) {
    console.log("deduct generation credits failed: ", e);
    throw e;
  }
}

/**
 * Refund credits for failed generation
 */
export async function refundGenerationCredits(
  user_uuid: string,
  credits_amount: number,
  generation_uuid: string,
  reason: string
): Promise<void> {
  try {
    const trans_no = `REFUND-GEN-${generation_uuid}`;

    // Check if already refunded
    const existing = await findCreditByOrderNo(trans_no);
    if (existing) {
      return; // Already refunded
    }

    await increaseCredits({
      user_uuid,
      trans_type: CreditsTransType.GenerationRefund,
      credits: credits_amount,
      order_no: trans_no,
    });
  } catch (e) {
    console.log("refund generation credits failed: ", e);
    throw e;
  }
}

/**
 * Get user's credit balance (sum of valid credits)
 */
export async function getUserCreditBalance(user_uuid: string): Promise<number> {
  try {
    const userCredits = await getUserValidCredits(user_uuid);
    let balance = 0;

    if (userCredits) {
      userCredits.forEach((v) => {
        balance += v.credits || 0;
      });
    }

    return balance < 0 ? 0 : balance;
  } catch (e) {
    console.log("get user credit balance failed: ", e);
    return 0;
  }
}

/**
 * Check if user has sufficient credits
 */
export async function hasSufficientCredits(
  user_uuid: string,
  required: number
): Promise<boolean> {
  const balance = await getUserCreditBalance(user_uuid);
  return balance >= required;
}
