import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyResponse {
  status: string; // 'success' | 'failed' | 'abandoned'
  reference: string;
  amount: number;
  paid_at: string;
}

@Injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor(config: ConfigService) {
    this.secretKey = config.getOrThrow<string>('PAYSTACK_SECRET_KEY');
  }

  async initializeTransaction(params: {
    email: string;
    amount: number; // in pesewas (GHS smallest unit)
    reference: string;
    callbackUrl: string;
    metadata: Record<string, string>;
  }): Promise<PaystackInitResponse> {
    const { callbackUrl, ...rest } = params;
    const res = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...rest, currency: 'GHS', callback_url: callbackUrl }),
    });

    const body = (await res.json()) as {
      status: boolean;
      message: string;
      data: PaystackInitResponse;
    };

    if (!body.status) {
      throw new BadGatewayException(`Paystack: ${body.message}`);
    }

    return body.data;
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const res = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });

    const body = (await res.json()) as {
      status: boolean;
      message: string;
      data: PaystackVerifyResponse;
    };

    if (!body.status) {
      throw new BadGatewayException(`Paystack: ${body.message}`);
    }

    return body.data;
  }
}
