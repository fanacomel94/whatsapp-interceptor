const express = require("express");
const router = new express.Router();
const multer = require("multer");
const upload = multer();

const { 
  startClient,
  sendMessage,
  getLastMessage,
  isClientReady,
  getInbox,
} = require("../services/WhatsappClient");

router.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start WA client
router.get("/:id/start", (req, res) => { 
  console.log(`Starting client with id: ${req.params.id}`);
  startClient(req.params.id);
  res.json({ ok: true, message: `Client ${req.params.id} starting...` });
});

// Check if client is ready
router.get("/:id/status", (req, res) => {
  res.json({ ok: true, clientId: req.params.id, ready: isClientReady(req.params.id) });
});
 
// Proof endpoint: last received message
router.get("/:id/last-message", (req, res) => {
  const last = getLastMessage(req.params.id);
  if (!last) return res.json({ ok: true, received: false });
  res.json({ ok: true, received: true, data: last });
}); 

// Get inbox messages
router.get("/messages", (req, res) => {
  const clientId = req.query.clientId || "1";
  const inbox = getInbox(clientId);
  res.json(inbox);
});  

// Send message
router.post("/message", upload.single("file"), (req, res) => {
  try {
    const file = req.file;
    const clientId = req.body.clientId;

    sendMessage(req.body.phoneNumber, req.body.message, clientId, file);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }  
}); 

module.exports = router;
