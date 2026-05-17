require('dotenv').config();

const express = require("express");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const reportRoutes = require("./routes/report.route");
const requestRoutes = require('./routes/request.routes');
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.route');

app.use("/reports", reportRoutes);
app.use('/requests', requestRoutes);
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);

// Handle malformed JSON bodies dari client (harus di bawah semua route)
app.use((err, req, res, next) => {
    if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});