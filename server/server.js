const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: 'http://localhost:3000', credentials: true },
});
// Make io accessible in any controller via req.app.get('io')
app.set('io', io);

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(require('./middleware/requestLogger'));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/orders',       require('./routes/orders'));
app.use('/api/invoices',     require('./routes/invoices'));
app.use('/api/visits',       require('./routes/visits'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/upload',       require('./routes/upload'));
app.use('/api/contacts',     require('./routes/contacts'));
app.use('/api/support',      require('./routes/support'));
app.use('/api/coupons',      require('./routes/coupons'));
app.use('/api/changelog',    require('./routes/changelog'));
app.use('/api/data',         require('./routes/data'));
app.use('/api/subscribers',  require('./routes/subscribers'));
app.use('/api/chat',         require('./routes/chat'));
app.use('/api/loyalty',      require('./routes/loyalty'));
app.use('/api/addresses',    require('./routes/addresses'));
app.use('/api/page-settings', require('./routes/pageSettings'));
app.use('/api/db-admin',     require('./routes/dbAdmin'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'women hubclub API Running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

require('./socket')(io);

const { promoteDraftsToTrash } = require('./controllers/dbAdminController');
promoteDraftsToTrash().catch(err => console.error('promoteDraftsToTrash failed:', err.message));
setInterval(() => {
  promoteDraftsToTrash().catch(err => console.error('promoteDraftsToTrash failed:', err.message));
}, 6 * 60 * 60 * 1000); // re-check every 6 hours

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
