import express from "express";
import fetch from "node-fetch";
import { GoogleAuth } from "google-auth-library";
const app = express();
app.use(express.json());

// Load service account key
import serviceAccount from "./service-account.json" assert { type: "json" };

const auth = new GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
});

// Create access token
async function getAccessToken() {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

// Send notification
async function sendFCMMessage(message) {
  const token = await getAccessToken();

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ message }),
    },
  );

  return response.json();
}

// 1-to-1
app.post("/send-single", async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    token,
    notification: { title, body },
  };

  const result = await sendFCMMessage(message);
  res.send(result);
});

// 1-to-many
app.post("/send-multiple", async (req, res) => {
  const { tokens, title, body } = req.body;

  const results = [];
  for (let token of tokens) {
    results.push(await sendFCMMessage({
      token,
      notification: { title, body },
    }));
  }

  res.send(results);
});

// group (array of tokens)
app.post("/send-group", async (req, res) => {
  const { groupTokens, title, body } = req.body;

  const results = [];
  for (let token of groupTokens) {
    results.push(await sendFCMMessage({
      token,
      notification: { title, body },
    }));
  }

  res.send(results);
});

app.listen(3000, () =>
  console.log("🚀 FCM HTTP v1 Notification Server Running"),
);
