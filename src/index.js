require('dotenv').config()
const express = require("express")
const messageRouter = require('./routers/messageRouter')
const whatsappclient = require('./services/WhatsappClient')

const app = express()
app.use(express.json())
app.use(messageRouter)

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
 