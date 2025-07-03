import app from "./app.mjs";

const PORT = parseInt(process.env.PORT);

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
