const express = require("express");
const cors = require("cors");
const transcriptionRoutes = require("./routes/transcriptionRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api", transcriptionRoutes);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () =>
  console.log(`🚀 Server running at http://localhost:${port}`)
);
