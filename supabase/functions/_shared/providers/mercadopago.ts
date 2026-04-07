// ─────────────────────────────────────────────────────────────
// Implementación MercadoPago de PaymentProvider
// Docs: https://www.mercadopago.com.ar/developers/es/docs
// ─────────────────────────────────────────────────────────────
import type {
  PaymentProvider,
  CrearPagoInput,
  ResultadoPago,
  PagoWebhook,
  EstadoPago,
} from '../payment-provider.ts';

const MP_BASE = 'https://api.mercadopago.com';

export class MercadoPagoProvider implements PaymentProvider {
  private token: string;

  constructor(accessToken: string) {
    this.token = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async crearPago(input: CrearPagoInput): Promise<ResultadoPago> {
    const body = {
      items: [
        {
          id: input.ordenId,
          title: input.item.titulo,
          description: input.item.descripcion || input.item.titulo,
          quantity: input.item.cantidad ?? 1,
          unit_price: input.item.monto,
          currency_id: 'ARS',
        },
      ],
      payer: input.clienteEmail ? { email: input.clienteEmail } : undefined,
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      // MP llama a este URL cuando el pago se confirma
      notification_url: input.webhookUrl,
      // Guardamos el ID de nuestra orden para identificarla al recibir el webhook
      external_reference: input.ordenId,
      statement_descriptor: 'MSERVICIOS',
      auto_return: 'approved',
      expires: false,
    };

    const resp = await fetch(`${MP_BASE}/checkout/preferences`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`MercadoPago crearPago error ${resp.status}: ${err}`);
    }

    const data = await resp.json();

    return {
      // init_point = producción | sandbox_init_point = sandbox/testing
      linkPago: data.init_point,
      preferenciaId: data.id,
      metadata: {
        sandbox_init_point: data.sandbox_init_point,
        date_created: data.date_created,
      },
    };
  }

  /**
   * MP envía: { type: "payment", data: { id: "123" }, ... }
   * Nosotros consultamos el pago por su ID para obtener el estado real.
   */
  async procesarWebhook(payload: unknown): Promise<PagoWebhook> {
    const body = payload as { type?: string; data?: { id?: string | number } };

    if (body.type !== 'payment' || !body.data?.id) {
      throw new Error('Webhook MP: tipo no soportado o falta data.id');
    }

    return this.obtenerPago(String(body.data.id));
  }

  async obtenerPago(pagoId: string): Promise<PagoWebhook> {
    const resp = await fetch(`${MP_BASE}/v1/payments/${pagoId}`, {
      headers: this.headers,
    });

    if (!resp.ok) {
      throw new Error(`MercadoPago obtenerPago error ${resp.status} para ID ${pagoId}`);
    }

    const p = await resp.json();

    const estadoMap: Record<string, EstadoPago> = {
      approved:   'approved',
      pending:    'pending',
      in_process: 'pending',
      authorized: 'pending',
      rejected:   'rejected',
      cancelled:  'cancelled',
      refunded:   'refunded',
      charged_back: 'refunded',
    };

    return {
      tipo: 'payment',
      pagoId: String(p.id),
      estado: estadoMap[p.status] ?? 'pending',
      monto: p.transaction_amount ?? 0,
      referenciaExterna: p.external_reference,
      metadata: {
        status_detail:  p.status_detail,
        payment_method: p.payment_method_id,
        payer_email:    p.payer?.email,
        date_approved:  p.date_approved,
        installments:   p.installments,
      },
    };
  }
}
