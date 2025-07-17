const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Load existing number history from file
const historyFilePath = path.join(__dirname, "number-history.json");
let slotNumbers = {};

// Load saved history on server start
if (fs.existsSync(historyFilePath)) {
  try {
    const fileData = fs.readFileSync(historyFilePath, "utf8");
    slotNumbers = JSON.parse(fileData) || {};
  } catch (err) {
    console.error("Failed to parse history file:", err);
  }
}

// Helper: get IST time slot info
function getSlotInfoIST(dateOverride = null) {
  const now = dateOverride ? new Date(dateOverride) : new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  const totalMinutes = utcHour * 60 + utcMinute + 330; // UTC + 5h30m
  const istHour = Math.floor(totalMinutes / 60) % 24;
  const istMinute = totalMinutes % 60;

  const slot = istMinute < 20 ? "00" : istMinute < 40 ? "20" : "40";
  const date = new Date(now.getTime() + 330 * 60000)
    .toISOString()
    .split("T")[0];
  const time = `${String(istHour).padStart(2, "0")}:${slot}`;

  return {
    key: `${date}-${time}`,
    istHour,
    date,
    time,
  };
}

// Save updated slotNumbers to file
function saveToFile() {
  fs.writeFileSync(historyFilePath, JSON.stringify(slotNumbers, null, 2));
}

// GET /number — current slot number
app.get("/number", (req, res) => {
  const { key, istHour } = getSlotInfoIST();

  if (istHour < 9 || istHour >= 21) {
    return res.json({
      error: "Number only available between 9am to 9pm (IST)",
    });
  }

  if (!slotNumbers[key]) {
    const random = Math.floor(Math.random() * 100);
    slotNumbers[key] = String(random).padStart(2, "0");
    saveToFile();
  }

  res.json({ number: slotNumbers[key] });
});

// GET /history?date=YYYY-MM-DD
app.get("/history", (req, res) => {
  const queryDate = req.query.date;
  const { date: today } = getSlotInfoIST();
  const targetDate = queryDate || today;

  const dayHistory = {};

  Object.keys(slotNumbers).forEach((fullKey) => {
    if (fullKey.startsWith(targetDate)) {
      const time = fullKey.split("-").slice(1).join("-");
      dayHistory[time] = slotNumbers[fullKey];
    }
  });

  res.json(dayHistory);
});

// Root route (optional)
app.get("/", (req, res) => {
  res.send("✅ Shared Number Server is running!");
});

// Auto-generate numbers every minute during 9am–9pm IST
setInterval(() => {
  const { key, istHour } = getSlotInfoIST();

  if (istHour >= 9 && istHour < 21 && !slotNumbers[key]) {
    const random = Math.floor(Math.random() * 100);
    slotNumbers[key] = String(random).padStart(2, "0");
    saveToFile();
    console.log(`✅ Auto-generated ${key} → ${slotNumbers[key]}`);
  }
}, 60 * 1000); // every 1 minute

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
