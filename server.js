const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const slotNumbers = {};

function getCurrentSlotKey() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const slot = minute < 20 ? "00" : minute < 40 ? "20" : "40";
  const date = now.toISOString().split("T")[0];
  const time = `${String(hour).padStart(2, "0")}:${slot}`;
  return `${date}-${time}`;
}

app.get("/number", (req, res) => {
  const key = getCurrentSlotKey();
  const currentHour = new Date().getHours();

  if (currentHour < 9 || currentHour >= 21) {
    return res.json({ error: "Number only available between 9am to 9pm" });
  }

  if (!slotNumbers[key]) {
    const random = Math.floor(Math.random() * 100);
    slotNumbers[key] = String(random).padStart(2, "0");
  }

  res.json({ number: slotNumbers[key] });
});

// ✅ Add this route so homepage doesn't say "Cannot GET /"
app.get("/", (req, res) => {
  res.send("✅ Shared Number Server is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
