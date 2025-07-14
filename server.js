const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const slotNumbers = {};

// 🔁 Function to calculate IST slot key
function getCurrentSlotKeyIST() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // Convert UTC to IST (+5:30)
  const totalMinutes = utcHour * 60 + utcMinute + 330; // 330 = 5*60 + 30
  const istHour = Math.floor(totalMinutes / 60) % 24;
  const istMinute = totalMinutes % 60;

  const slot = istMinute < 20 ? "00" : istMinute < 40 ? "20" : "40";
  const date = now.toISOString().split("T")[0];
  const time = `${String(istHour).padStart(2, "0")}:${slot}`;
  return { key: `${date}-${time}`, istHour };
}

// 📦 Endpoint to get the shared number
app.get("/number", (req, res) => {
  const { key, istHour } = getCurrentSlotKeyIST();

  // ✅ Only allow access from 9am to 9pm IST
  if (istHour < 9 || istHour >= 21) {
    return res.json({
      error: "Number only available between 9am to 9pm (IST)",
    });
  }

  // 🎲 Generate a random 2-digit number if not already set
  if (!slotNumbers[key]) {
    const random = Math.floor(Math.random() * 100);
    slotNumbers[key] = String(random).padStart(2, "0");
  }

  res.json({ number: slotNumbers[key] });
});

// 🔄 Home route (optional)
app.get("/", (req, res) => {
  res.send("✅ Shared Number Server is running!");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
