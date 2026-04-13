const express = require("express");
const uploadRoutes = require("./server/routes/uploadRoutes");

const app = express();

app.use(uploadRoutes);

app.listen(3000, () => {
  console.log("Upload server running on http://localhost:3000");
});
