const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const slotNumbers = {};

// 🔁 Convert UTC to IST slot info
function getCurrentSlotInfoIST() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  const totalMinutes = utcHour * 60 + utcMinute + 330; // IST offset
  const istHour = Math.floor(totalMinutes / 60) % 24;
  const istMinute = totalMinutes % 60;

  const slot = istMinute < 20 ? "00" : istMinute < 40 ? "20" : "40";
  const date = now.toISOString().split("T")[0];
  const time = `${String(istHour).padStart(2, "0")}:${slot}`;
  return { key: `${date}-${time}`, istHour, date, time };
}

// 📦 GET current number
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

// 📜 GET today's number history
app.get("/history", (req, res) => {
  const { date } = getCurrentSlotInfoIST();
  const todayHistory = {};

  Object.keys(slotNumbers).forEach((fullKey) => {
    if (fullKey.startsWith(date)) {
      const parts = fullKey.split("-");
      const time = parts.slice(3).join("-"); // fix here
      todayHistory[time] = slotNumbers[fullKey];
    }
  });

  res.json(todayHistory);
});

// 🏠 Home
app.get("/", (req, res) => {
  res.send("✅ Shared Number Server is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
