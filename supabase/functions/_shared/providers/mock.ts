// ─────────────────────────────────────────────────────────────
// Proveedor Mock — para desarrollo y testing sin pago real
// Activo cuando PAYMENT_MODE=mock (default en dev)
// ─────────────────────────────────────────────────────────────
import type {
  PaymentProvider,
  CrearPagoInput,
  ResultadoPago,
  PagoWebhook,
} from '../payment-provider.ts';

export class MockProvider implements PaymentProvider {
  private appUrl: string;

  constructor(appUrl: string) {
    this.appUrl = appUrl;
  }

  async crearPago(input: CrearPagoInput): Promise<ResultadoPago> {
    const mockPrefId = `MOCK-PREF-${Date.now()}`;

    // El link de pago va a nuestra propia página de checkout mock
    const linkPago = `${this.appUrl}/pagar/${input.ordenId}?mock=1&prefId=${mockPrefId}`;

    return {
      linkPago,
      preferenciaId: mockPrefId,
      metadata: {
        modo: 'mock',
        sin_pago_real: true,
        ordenId: input.ordenId,
      },
    };
  }

  async procesarWebhook(payload: unknown): Promise<PagoWebhook> {
    // En modo mock, el webhook lo enviamos nosotros desde simular-pago
    const body = payload as {
      ordenId?: string;
      pagoId?: string;
      estado?: string;
    };

    return {
      tipo: 'payment',
      pagoId: body.pagoId || `MOCK-PAY-${Date.now()}`,
      estado: (body.estado as PagoWebhook['estado']) ?? 'approved',
      monto: 0,
      referenciaExterna: body.ordenId,
      metadata: { modo: 'mock' },
    };
  }

  async obtenerPago(pagoId: string): Promise<PagoWebhook> {
    return {
      tipo: 'payment',
      pagoId,
      estado: 'approved',
      monto: 0,
      referenciaExterna: pagoId.replace('MOCK-PAY-', ''),
      metadata: { modo: 'mock' },
    };
  }
}
