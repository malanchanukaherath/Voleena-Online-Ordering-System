const mockStripeFactory = jest.fn(() => ({

// CODEMAP: BACKEND_SERVER_TESTS_PAYMENTSERVICE_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const mockStripeFactory = jest.fn(() => ({

// CODEMAP: BACKEND_SERVER_TESTS_PAYMENTSERVICE_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const mockStripeFactory = jest.fn(() => ({

// CODEMAP: BACKEND_SERVER_TESTS_PAYMENTSERVICE_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const mockStripeFactory = jest.fn(() => ({
});
// CODEMAP: BACKEND_SERVER_TESTS_PAYMENTSERVICE_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const mockStripeFactory = jest.fn(() => ({
  refunds: {
    create: jest.fn()
  }
}));

jest.mock('stripe', () => mockStripeFactory);

jest.mock('../models', () => ({
  Payment: {},
  Order: {},
  Customer: {}
}));

const { PayHereService } = require('../services/paymentService');

describe('payment service refunds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('records PayHere refunds as manual follow-up without marking payment refunded', async () => {
    const payment = {
      PaymentID: 10,
      Amount: 1500,
      Status: 'PAID',
      GatewayStatus: 'SUCCESS',
      RefundedAt: new Date('2026-01-01T00:00:00Z'),
      RefundReason: null,
      save: jest.fn().mockResolvedValue(true)
    };

    await new PayHereService().processRefund(payment, 'Customer cancelled');

    expect(payment.Status).toBe('PAID');
    expect(payment.GatewayStatus).toBe('MANUAL_REFUND_REQUIRED');
    expect(payment.RefundedAt).toBeNull();
    expect(payment.RefundReason).toBe('Customer cancelled');
    expect(payment.save).toHaveBeenCalledTimes(1);
  });
});



