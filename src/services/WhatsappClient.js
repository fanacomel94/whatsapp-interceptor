const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const clients = {};
const clientsReady = {};          // track ready state
const lastMessageByClient = {};   // store last received message (proof)
const inboxByClient = {};         // clientId -> array of {from, body, timestamp}

function startClient(id) {
  // prevent re-init same id
  if (clients[id]) {
    console.log(`Client ${id} already started.`);
    return;
  }

  clients[id] = new Client({
    authStrategy: new LocalAuth({ clientId: String(id) }),
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2407.3.html",
    },
  });

  clientsReady[id] = false;

  clients[id].on("qr", (qr) => {
    console.log(qr);
    qrcode.generate(qr, { small: true });
  });

  clients[id].on("ready", () => {
    clientsReady[id] = true;
    console.log(`Client ${id} is ready! ✅`);
  });

  clients[id].on("message", async (msg) => {
    try {
      // IMPORTANT: avoid msg.getContact() because it can break after WA updates
      if (
        process.env.PROCESS_MESSAGE_FROM_CLIENT === "true" &&
        msg.from !== "status@broadcast"
      ) {
        const data = {
          from: msg.from,
          body: msg.body,
          timestamp: Date.now(), 
        };

        lastMessageByClient[id] = data;

        // Add to inbox
        if (!inboxByClient[id]) {
          inboxByClient[id] = [];
        }
        inboxByClient[id].push(data);
        
        // Keep only last 30 messages
        if (inboxByClient[id].length > 30) {
          inboxByClient[id].shift();
        }

        console.log(`[Client ${id}] 📩 Received`);
        console.log("From:", data.from);
        console.log("Body:", data.body);

        // Optional: auto ACK to prove receive end-to-end
        // await clients[id].sendMessage(msg.from, "✅ WA-Bridge received your message");
      }
    } catch (error) {
      console.error("Message handler error:", error);
    }
  });

  clients[id].initialize().catch((err) => console.log(err));
}

function sendMessage(phoneNumber, message, clientId, file) {
  const id = String(clientId);

  const client = clients[id];
  if (!client) {
    throw new Error(`Client ${id} not started. Call GET /${id}/start first.`);
  }
  if (!clientsReady[id]) {
    throw new Error(`Client ${id} not ready yet. Scan QR and wait for READY.`);
  }

  if (file) {
    const media = new MessageMedia(
      file.mimetype,
      file.buffer.toString("base64")
    );
    return client.sendMessage(phoneNumber, media);
  }

  return client.sendMessage(phoneNumber, message);
}

// expose proof getter for router
function getLastMessage(clientId) {
  const id = String(clientId); 
  return lastMessageByClient[id] || null;
}

function isClientReady(clientId) {
  const id = String(clientId);
  return !!clientsReady[id];
}

function getInbox(clientId) {
  const id = String(clientId);
  return inboxByClient[id] || [];
}

module.exports = { startClient, sendMessage, getLastMessage, isClientReady, getInbox };
