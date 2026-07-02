import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

type PaystackInit = {
  status: boolean;
  message: string;
  data?: { authorization_url: string; access_code: string; reference: string };
};

// Safe subset of a Paystack authorization (a reusable payment token). The
// authorization_code is a server-only token; the rest is display metadata.
export type PaystackAuthorization = {
  authorization_code: string;
  channel: string;
  card_type?: string | null;
  brand?: string | null;
  last4?: string | null;
  bank?: string | null;
  exp_month?: string | null;
  exp_year?: string | null;
  reusable?: boolean;
};

type PaystackVerify = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    amount: number;
    paid_at: string | null;
    authorization?: PaystackAuthorization | null;
  };
};

@Injectable()
export class PaystackService {
  private readonly secretKey: string;
  private readonly callbackUrl: string;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    this.secretKey = config.getOrThrow<string>('PAYSTACK_SECRET_KEY');
    this.callbackUrl = config.get<string>('PAYSTACK_CALLBACK_URL') ?? '';
    // Paystack signs webhooks with the secret key; allow an explicit override.
    this.webhookSecret =
      config.get<string>('PAYSTACK_WEBHOOK_SECRET') ?? this.secretKey;
  }

  async initializeTransaction(params: {
    email: string;
    amountGhs: number;
    reference: string;
    /** Per-transaction return URL (e.g. the app's deep link). Takes
     * precedence over the configured default, so the mobile client can be
     * redirected straight back into the app after checkout. */
    callbackUrl?: string;
  }) {
    const callbackUrl = params.callbackUrl || this.callbackUrl;
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: Math.round(params.amountGhs * 100), // amount is in pesewas
        currency: 'GHS',
        reference: params.reference,
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      }),
    });
    const json = (await res.json()) as PaystackInit;
    if (!json.status || !json.data) {
      throw new BadGatewayException(json.message ?? 'Paystack init failed');
    }
    return {
      authorizationUrl: json.data.authorization_url,
      accessCode: json.data.access_code,
      reference: json.data.reference,
    };
  }

  async verifyTransaction(reference: string) {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${this.secretKey}` } },
    );
    const json = (await res.json()) as PaystackVerify;
    if (!json.status || !json.data) {
      throw new BadGatewayException(json.message ?? 'Paystack verify failed');
    }
    return {
      status: json.data.status,
      amount: json.data.amount,
      paidAt: json.data.paid_at,
      authorization: json.data.authorization ?? null,
    };
  }

  /** Revoke a saved authorization on Paystack (used when a family removes a
   * saved payment method). Best-effort — never throws. */
  async deactivateAuthorization(authorizationCode: string): Promise<void> {
    try {
      await fetch('https://api.paystack.co/customer/deactivate_authorization', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authorization_code: authorizationCode }),
      });
    } catch {
      // Deactivation is best-effort; removing our record is what matters.
    }
  }

  /** HMAC-SHA512 of the raw body, compared to the x-paystack-signature header
   * with a constant-time comparison (avoids signature timing attacks). */
  verifyWebhookSignature(
    signature: string | undefined,
    rawBody: Buffer,
  ): boolean {
    if (!signature) return false;
    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    const expected = Buffer.from(hash);
    const received = Buffer.from(signature);
    return (
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received)
    );
  }
}
