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
const requestRoutes = require('./routes/request.route');
const authRoutes = require('./routes/auth.route'); 

app.use("/reports", reportRoutes);
app.use('/requests', requestRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});