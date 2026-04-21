// CODEMAP: FRONTEND_UTILS_POSRECEIPTPRINT_JS
// WHAT_THIS_IS: This file supports frontend behavior for posReceiptPrint.js.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: utils/posReceiptPrint.js
// - Search text: posReceiptPrint.js
const DEFAULT_STORE = {
  name: import.meta.env.VITE_POS_STORE_NAME || 'Voleena Foods',
  address: import.meta.env.VITE_POS_STORE_ADDRESS || 'Store Address Not Configured',
  contact: import.meta.env.VITE_POS_STORE_CONTACT || 'N/A'
};

const DEFAULT_TERMINAL_ID = import.meta.env.VITE_POS_TERMINAL_ID || 'WEB-POS-1';

// Simple: This handles to finite number logic.
const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Simple: This handles escape html logic.
const escapeHtml = (unsafeValue) => String(unsafeValue ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Simple: This cleans or formats the currency.
const formatCurrency = (value) => `LKR ${toFiniteNumber(value, 0).toFixed(2)}`;

// Simple: This cleans or formats the date time.
const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString();
  }

  return new Intl.DateTimeFormat('en-LK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
};

// Simple: This creates the receipt from order.
export const buildReceiptFromOrder = (order, options = {}) => {
  if (!order || typeof order !== 'object') {
    return null;
  }

  const subtotal = toFiniteNumber(order.TotalAmount, 0);
  const discount = toFiniteNumber(order.DiscountAmount, 0);
  const deliveryFee = toFiniteNumber(order.DeliveryFee, 0);
  const tax = 0;
  const total = toFiniteNumber(order.FinalAmount, Math.max(subtotal - discount + deliveryFee + tax, 0));
  const amountReceived = toFiniteNumber(options.amountReceived, toFiniteNumber(order?.payment?.Amount, total));

  const items = Array.isArray(order.items)
    ? order.items.map((item) => {
      const quantity = Number.parseInt(item?.Quantity ?? item?.quantity, 10) || 0;
      const unitPrice = toFiniteNumber(item?.UnitPrice, toFiniteNumber(item?.menuItem?.Price, toFiniteNumber(item?.combo?.Price, 0)));

      return {
        name: item?.menuItem?.Name || item?.combo?.Name || 'Item',
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice
      };
    })
    : [];

  return {
    receiptNumber: order.OrderNumber || `OID-${order.OrderID || 'N/A'}`,
    orderId: order.OrderID || null,
    orderNumber: order.OrderNumber || null,
    orderType: order.OrderType || null,
    orderCreatedAt: order.created_at || order.CreatedAt || order.createdAt || new Date().toISOString(),
    printedAt: new Date().toISOString(),
    terminalId: options.terminalId || DEFAULT_TERMINAL_ID,
    cashierName: options.cashierName || 'Cashier',
    store: {
      name: options.store?.name || DEFAULT_STORE.name,
      address: options.store?.address || DEFAULT_STORE.address,
      contact: options.store?.contact || DEFAULT_STORE.contact
    },
    customer: {
      name: order?.customer?.Name || 'Walk-in Customer',
      phone: order?.customer?.Phone || '',
      email: order?.customer?.Email || ''
    },
    payment: {
      method: order?.payment?.Method || options.paymentMethod || 'N/A',
      status: order?.payment?.Status || options.paymentStatus || 'PENDING',
      amount: toFiniteNumber(order?.payment?.Amount, total),
      paidAt: order?.payment?.PaidAt || null
    },
    items,
    pricing: {
      subtotal,
      discount,
      tax,
      deliveryFee,
      total,
      amountReceived,
      change: toFiniteNumber(options.change, Math.max(amountReceived - total, 0))
    }
  };
};

// Simple: This creates the receipt html.
const buildReceiptHtml = (receipt) => {
  // Simple: This handles item rows logic.
  const itemRows = (receipt.items || []).map((item) => {
    return `
      <tr>
        <td class="item-name">${escapeHtml(item.name)}</td>
        <td class="item-qty">${escapeHtml(item.quantity)}</td>
        <td class="item-value">${escapeHtml(formatCurrency(item.unitPrice))}</td>
        <td class="item-value">${escapeHtml(formatCurrency(item.lineTotal))}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>POS Receipt ${escapeHtml(receipt.receiptNumber || '')}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      width: 76mm;
      font-family: "Courier New", Courier, monospace;
      color: #111827;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.35;
    }

    .receipt {
      width: 100%;
      padding: 2mm 1mm 3mm;
    }

    .center {
      text-align: center;
    }

    .store-name {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 3px;
    }

    .meta,
    .footer-text {
      font-size: 10px;
      color: #374151;
    }

    .line {
      border-top: 1px dashed #9ca3af;
      margin: 6px 0;
    }

    .kv {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 2px 0;
      word-break: break-word;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2px;
    }

    th,
    td {
      padding: 2px 0;
      border: none;
      vertical-align: top;
    }

    th {
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      border-bottom: 1px solid #9ca3af;
      padding-bottom: 3px;
    }

    .item-name {
      width: 42%;
      padding-right: 6px;
      word-break: break-word;
    }

    .item-qty {
      width: 10%;
      text-align: center;
    }

    .item-value {
      width: 24%;
      text-align: right;
      white-space: nowrap;
    }

    .totals {
      margin-top: 4px;
    }

    .totals .kv {
      font-size: 11px;
    }

    .totals .grand {
      font-size: 12px;
      font-weight: 700;
      border-top: 1px solid #111827;
      padding-top: 4px;
      margin-top: 4px;
    }

    @media print {
      body {
        width: 76mm;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="store-name">${escapeHtml(receipt.store?.name || '')}</div>
      <div class="meta">${escapeHtml(receipt.store?.address || '')}</div>
      <div class="meta">${escapeHtml(receipt.store?.contact || '')}</div>
    </div>

    <div class="line"></div>

    <div class="kv"><span>Receipt No</span><span>${escapeHtml(receipt.receiptNumber || '')}</span></div>
    <div class="kv"><span>Order ID</span><span>${escapeHtml(receipt.orderId || '')}</span></div>
    <div class="kv"><span>Date/Time</span><span>${escapeHtml(formatDateTime(receipt.orderCreatedAt))}</span></div>
    <div class="kv"><span>Cashier</span><span>${escapeHtml(receipt.cashierName || '')}</span></div>
    <div class="kv"><span>Terminal</span><span>${escapeHtml(receipt.terminalId || '')}</span></div>
    <div class="kv"><span>Customer</span><span>${escapeHtml(receipt.customer?.name || 'Walk-in Customer')}</span></div>

    <div class="line"></div>

    <table>
      <thead>
        <tr>
          <th class="item-name">Item</th>
          <th class="item-qty">Qty</th>
          <th class="item-value">Price</th>
          <th class="item-value">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="line"></div>

    <div class="totals">
      <div class="kv"><span>Subtotal</span><span>${escapeHtml(formatCurrency(receipt.pricing?.subtotal))}</span></div>
      <div class="kv"><span>Discount</span><span>${escapeHtml(formatCurrency(receipt.pricing?.discount))}</span></div>
      <div class="kv"><span>Tax</span><span>${escapeHtml(formatCurrency(receipt.pricing?.tax))}</span></div>
      <div class="kv"><span>Delivery Fee</span><span>${escapeHtml(formatCurrency(receipt.pricing?.deliveryFee))}</span></div>
      <div class="kv grand"><span>Total</span><span>${escapeHtml(formatCurrency(receipt.pricing?.total))}</span></div>
    </div>

    <div class="line"></div>

    <div class="kv"><span>Payment Method</span><span>${escapeHtml(receipt.payment?.method || 'N/A')}</span></div>
    <div class="kv"><span>Payment Status</span><span>${escapeHtml(receipt.payment?.status || 'PENDING')}</span></div>
    <div class="kv"><span>Amount Received</span><span>${escapeHtml(formatCurrency(receipt.pricing?.amountReceived))}</span></div>
    <div class="kv"><span>Change</span><span>${escapeHtml(formatCurrency(receipt.pricing?.change))}</span></div>

    <div class="line"></div>

    <div class="center footer-text">
      <div>Printed: ${escapeHtml(formatDateTime(receipt.printedAt))}</div>
      <div>Thank you for your order</div>
    </div>
  </div>

  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>
  `;
};

// Simple: This creates the receipt print window.
export const openReceiptPrintWindow = (receiptInput) => {
  if (!receiptInput) {
    throw new Error('No receipt data available to print');
  }

  const printWindow = window.open('', '_blank', 'width=430,height=780');

  if (!printWindow) {
    throw new Error('Print popup was blocked. Allow popups and try again.');
  }

  const html = buildReceiptHtml(receiptInput);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

