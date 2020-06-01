const express = require('express');
const cors = require('cors');
const contactsRoutes = require('./contacts/routes');

const app = express();

app.use(express.json());
app.use(cors({origin: "http://localhost:8080"}))
app.use(contactsRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is nunning on port ${PORT}`);
});