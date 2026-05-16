require('dotenv').config();

const express = require("express");
const app = express();

const reportRoutes = require("./routes/report.route");

app.use(express.json());

app.use("/reports", reportRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});