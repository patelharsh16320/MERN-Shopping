const mongoose = require('mongoose');

const dashboardWidgetSchema = new mongoose.Schema({
  key:      { type: String, required: true, unique: true },
  label:    { type: String, required: true },
  icon:     { type: String, default: '📊' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('DashboardWidget', dashboardWidgetSchema);
