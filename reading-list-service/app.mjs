import express from "express";
import { v4 as uuidv4 } from "uuid";

// In-memory storage for books
let books = [];

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// add a book - request body should contain a title, status and an author
app.post("/reading-list/books", (req, res) => {
  const { title, author, status } = req.body;
  const uuid = uuidv4();
  
  if (!(status === "read" || status === "to_read" || status === "reading")) {
    return res.status(400).json({
      error: "Status is invalid. Accepted statuses: read | to_read | reading",
    });
  }
  
  if (!title || !author || !status) {
    return res.status(400).json({ error: "Title, Status or Author is empty" });
  }
  
  const newBook = { uuid, title, author, status };
  books.push(newBook);
  
  console.log(`Book added: ${title} by ${author} (${status}) - UUID: ${uuid}`);
  console.log(`Total books: ${books.length}`);
  
  // Return the complete book object including status
  return res.status(201).json(newBook);
});

// update status of a book by uuid
app.put("/reading-list/books/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  const { status } = req.body;
  
  if (!uuid || typeof uuid !== "string") {
    return res.status(400).json({ error: "missing or invalid UUID" });
  }
  
  const bookIndex = books.findIndex(book => book.uuid === uuid);
  if (bookIndex === -1) {
    return res.status(404).json({ error: "UUID does not exist" });
  }
  
  if (!(status === "read" || status === "to_read" || status === "reading")) {
    return res.status(400).json({
      error: "Status is invalid. Accepted statuses: read | to_read | reading",
    });
  }
  
  books[bookIndex].status = status;
  console.log(`Book status updated: ${books[bookIndex].title} -> ${status}`);
  
  return res.json({ uuid, status });
});

// get the list of books
app.get("/reading-list/books", (_, res) => {
  console.log(`Fetching all books. Total count: ${books.length}`);
  
  // Convert array to object format to maintain compatibility with frontend
  const allData = {};
  books.forEach(book => {
    allData[book.uuid] = book;
  });
  
  console.log(`Returning books:`, Object.keys(allData));
  return res.json(allData);
});

// get a book by uuid
app.get("/reading-list/books/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  
  if (!uuid || typeof uuid !== "string") {
    return res.status(400).json({ error: "missing or invalid UUID" });
  }
  
  const book = books.find(book => book.uuid === uuid);
  if (!book) {
    return res.status(404).json({ error: "UUID does not exist" });
  }
  
  return res.json(book);
});

// delete a book by uuid
app.delete("/reading-list/books/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  
  if (!uuid || typeof uuid !== "string") {
    return res.status(400).json({ error: "missing or invalid UUID" });
  }
  
  const bookIndex = books.findIndex(book => book.uuid === uuid);
  if (bookIndex === -1) {
    return res.status(404).json({ error: "UUID does not exist" });
  }
  
  const deletedBook = books[bookIndex];
  books.splice(bookIndex, 1);
  
  console.log(`Book deleted: ${deletedBook.title} by ${deletedBook.author}`);
  console.log(`Remaining books: ${books.length}`);
  
  return res.json({ uuid });
});

// health check
app.get("/healthz", (_, res) => {
  return res.sendStatus(200);
});

app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(500);
  res.json({ error: err.message });
});

app.use("*", (_, res) => {
  return res
    .status(404)
    .json({ error: "the requested resource does not exist on this server" });
});

export default app;
