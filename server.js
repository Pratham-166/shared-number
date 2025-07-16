const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const slotNumbers = {};

// 🔁 Convert UTC to IST slot info
function getSlotInfoIST(dateOverride = null) {
  const now = dateOverride ? new Date(dateOverride) : new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  const totalMinutes = utcHour * 60 + utcMinute + 330; // 5h30m in mins
  const istHour = Math.floor(totalMinutes / 60) % 24;
  const istMinute = totalMinutes % 60;

  const slot = istMinute < 20 ? "00" : istMinute < 40 ? "20" : "40";
  const date = new Date(now.getTime() + 330 * 60000)
    .toISOString()
    .split("T")[0]; // convert to IST date
  const time = `${String(istHour).padStart(2, "0")}:${slot}`;

  return {
    key: `${date}-${time}`,
    istHour,
    date,
    time,
  };
}

// ✅ /number — returns today’s number
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
  }

  res.json({ number: slotNumbers[key] });
});

// ✅ /history?date=YYYY-MM-DD — returns history for a date
app.get("/history", (req, res) => {
  const queryDate = req.query.date;
  const { date: today } = getSlotInfoIST();
  const targetDate = queryDate || today;

  const dayHistory = {};

  Object.keys(slotNumbers).forEach((fullKey) => {
    if (fullKey.startsWith(targetDate)) {
      const time = fullKey.split("-").slice(1).join("-"); // time part
      dayHistory[time] = slotNumbers[fullKey];
    }
  });

  res.json(dayHistory);
});

// ✅ Homepage test message
app.get("/", (req, res) => {
  res.send("✅ Shared Number Server is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
