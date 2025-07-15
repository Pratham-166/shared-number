const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const slotNumbers = {};

// 🔁 Function to calculate IST slot key and IST hour
function getCurrentSlotInfoIST() {
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
  return { key: `${date}-${time}`, istHour, date, time };
}

// 📦 /number endpoint: generates and returns number
app.get("/number", (req, res) => {
  const { key, istHour } = getCurrentSlotInfoIST();

  if (istHour < 9 || istHour >= 21) {
    return res.json({
      error: "Number only available between 9am to 9pm (IST)",
    });
  }

  if (!slotNumbers[key]) {
    const random = Math.floor(Math.random() * 100);
    slotNumbers[key] = String(random).padStart(2, "0");
  }

  res.json({ number: slotNumbers[key] });
});

// 📜 /history endpoint: returns all numbers for today
app.get("/history", (req, res) => {
  const { date } = getCurrentSlotInfoIST();
  const todayHistory = {};

  Object.keys(slotNumbers).forEach((fullKey) => {
    if (fullKey.startsWith(date)) {
      const time = fullKey.split("-")[1]; // get HH:MM part
      todayHistory[time] = slotNumbers[fullKey];
    }
  });

  res.json(todayHistory);
});

// 🏠 home route
app.get("/", (req, res) => {
  res.send("✅ Shared Number Server is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
