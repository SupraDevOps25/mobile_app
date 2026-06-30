import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

type PaystackInit = {
  status: boolean;
  message: string;
  data?: { authorization_url: string; access_code: string; reference: string };
};

type PaystackVerify = {
  status: boolean;
  message: string;
  data?: { status: string; amount: number; paid_at: string | null };
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
  }) {
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
        ...(this.callbackUrl ? { callback_url: this.callbackUrl } : {}),
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
    };
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
