const Product = require('../models/Product');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');
const Contact = require('../models/Contact');
const Subscriber = require('../models/Subscriber');
const Changelog = require('../models/Changelog');
const SupportTicket = require('../models/SupportTicket');

const norm = (v) => (v || '').toString().trim().toLowerCase();

// statusField/activeValue describe where the draft/trash lifecycle lives on each model.
// dupeKey groups records that should be considered duplicates of one another.
// columns lists which fields to show in the generic record table on the admin Clean DB page.
const REGISTRY = {
  products: {
    model: Product, label: 'Products', icon: '🌸',
    statusField: 'status', activeValue: 'published',
    dupeKey: (doc) => `${norm(doc.name)}|${doc.category || ''}`,
    display: (doc) => doc.name,
    columns: ['name', 'category', 'price', 'stock'],
  },
  categories: {
    model: Category, label: 'Categories', icon: '🏷️',
    statusField: 'archiveStatus', activeValue: 'active',
    dupeKey: (doc) => `${norm(doc.name)}|${doc.parent || ''}`,
    display: (doc) => doc.name,
    columns: ['name', 'description'],
  },
  coupons: {
    model: Coupon, label: 'Coupons', icon: '🎟️',
    statusField: 'archiveStatus', activeValue: 'active',
    dupeKey: (doc) => norm(doc.code).toUpperCase(),
    display: (doc) => doc.code,
    columns: ['code', 'discountType', 'discountValue'],
  },
  contacts: {
    model: Contact, label: 'Messages', icon: '💬',
    statusField: 'archiveStatus', activeValue: 'active',
    dupeKey: (doc) => `${norm(doc.email)}|${norm(doc.subject)}|${norm(doc.message)}`,
    display: (doc) => `${doc.name} — ${doc.subject}`,
    columns: ['name', 'email', 'subject'],
  },
  subscribers: {
    model: Subscriber, label: 'Subscribers', icon: '📧',
    statusField: 'archiveStatus', activeValue: 'active',
    dupeKey: (doc) => norm(doc.email),
    display: (doc) => doc.email,
    columns: ['email'],
  },
  changelog: {
    model: Changelog, label: 'Changelog', icon: '📝',
    statusField: 'archiveStatus', activeValue: 'active',
    dupeKey: (doc) => `${norm(doc.title)}|${doc.date || ''}`,
    display: (doc) => doc.title,
    columns: ['title', 'tag', 'date'],
  },
  supportTickets: {
    model: SupportTicket, label: 'Support Tickets', icon: '🎧',
    statusField: 'archiveStatus', activeValue: 'active',
    dupeKey: (doc) => `${norm(doc.email)}|${norm(doc.subject)}|${doc.category || ''}`,
    display: (doc) => doc.ticketId,
    columns: ['ticketId', 'name', 'email', 'subject'],
  },
};

module.exports = REGISTRY;
