require('dotenv').config();

const express = require("express");
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const reportRoutes = require("./routes/report.route");
const requestRoutes = require('./routes/request.routes');
const authRoutes = require('./routes/auth.routes'); 

app.use("/reports", reportRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});