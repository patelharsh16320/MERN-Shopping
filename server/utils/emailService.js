const nodemailer = require('nodemailer');

const createTransport = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
};

const send = async ({ to, subject, html }) => {
  const transporter = createTransport();
  if (!transporter) {
    console.log(`[Email] Not configured — would send to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Shop Admin'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
  }
};

const orderConfirmationHtml = (order, user) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fafafa;border-radius:12px">
  <h2 style="color:#6c63ff">🌸 Order Confirmed!</h2>
  <p>Hi <strong>${user.name}</strong>, your order has been placed successfully.</p>
  <div style="background:white;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #e0e0e0">
    <p><strong>Order ID:</strong> #${String(order._id).slice(-8).toUpperCase()}</p>
    <p><strong>Total:</strong> ₹${order.totalPrice?.toLocaleString()}</p>
    <p><strong>Payment:</strong> ${order.paymentMethod}</p>
    <p><strong>Status:</strong> ${order.orderStatus}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin:12px 0">
    <tr style="background:#f0f0ff;text-align:left"><th style="padding:8px">Item</th><th style="padding:8px">Qty</th><th style="padding:8px">Price</th></tr>
    ${(order.orderItems || []).map(i => `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:8px">${i.name}</td><td style="padding:8px">${i.quantity}</td><td style="padding:8px">₹${i.price}</td></tr>`).join('')}
  </table>
  <p style="color:#636e72;font-size:13px">Thank you for shopping with us!</p>
</div>`;

const adminNewOrderHtml = (order, user) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fafafa;border-radius:12px">
  <h2 style="color:#d63031">🛒 New Order Received</h2>
  <div style="background:white;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #e0e0e0">
    <p><strong>Order ID:</strong> #${String(order._id).slice(-8).toUpperCase()}</p>
    <p><strong>Customer:</strong> ${user.name} (${user.email})</p>
    <p><strong>Total:</strong> ₹${order.totalPrice?.toLocaleString()}</p>
    <p><strong>Payment:</strong> ${order.paymentMethod}</p>
    <p><strong>Items:</strong> ${order.orderItems?.length || 0}</p>
    <p><strong>Placed:</strong> ${new Date().toLocaleString('en-IN')}</p>
  </div>
  <table style="width:100%;border-collapse:collapse">
    <tr style="background:#f0f0ff;text-align:left"><th style="padding:8px">Item</th><th style="padding:8px">Qty</th><th style="padding:8px">Price</th></tr>
    ${(order.orderItems || []).map(i => `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:8px">${i.name}</td><td style="padding:8px">${i.quantity}</td><td style="padding:8px">₹${i.price}</td></tr>`).join('')}
  </table>
</div>`;

module.exports = { send, orderConfirmationHtml, adminNewOrderHtml };
