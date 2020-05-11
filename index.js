const express = require("express");
const cors = require("cors");
const contactsRoutes = require("./contacts/routes");
const usersRoutes = require('./users/routes')
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:8080" }));
app.use(contactsRoutes);
app.use(usersRoutes)

async function start() {
  try {
    const url = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0-lws5u.mongodb.net/db-contacts`;

    await mongoose.connect( url, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });

    console.log("Database connection successful");

    mongoose.connection.on('error', err => {
      console.log(err);
      process.exit(1)
    });

    const PORT = 8080;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
}

start();
