const express = require('express');
const { v4: generateId } = require('uuid');
const database = require('./database');

const app = express();

function requestLogger(req, res, next) {
  res.once('finish', () => {
    const log = [req.method, req.path];
    if (req.body && Object.keys(req.body).length > 0) {
      log.push(JSON.stringify(req.body));
    }
    if (req.query && Object.keys(req.query).length > 0) {
      log.push(JSON.stringify(req.query));
    }
    log.push('->', res.statusCode);
    // eslint-disable-next-line no-console
    console.log(log.join(' '));
  });
  next();
}



app.use(requestLogger);
app.use(require('cors')());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const updateIndexes = async (collection) => {
  const todos = await collection.find({}).toArray();
  for (let i = 0; i < todos.length; i++) {
    await collection.updateOne({ _id: todos[i]._id }, { $set: { index: i + 1 } });
  }
};

app.get('/', async (req, res) => {
  try {
    let query = {};
    let skip = req.query.skip ? parseInt(req.query.skip) : 0;

    if (req.query.dueDate) {
      const isoDate = new Date(req.query.dueDate).toISOString();
      query.dueDate = isoDate.split('T')[0];
    }

    const todos = await database.client.db('todos').collection('todos')
      .find(query)
      .sort({ index: 1 })
      .skip(skip)
      .limit(20)
      .toArray();
    // Send the response after querying with dueDate
    res.status(200).json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post('/', async (req, res) => {
  const { text, dueDate } = req.body;

  if (typeof text !== 'string') {
    res.status(400);
    res.json({ message: "invalid 'text' expected string" });
    return;
  }
  const collection = database.client.db('todos').collection('todos');
  const maxIndexTodo = await collection
    .find({}, { sort: { index: -1 }, limit: 1 })
    .toArray();

  const newIndex = maxIndexTodo.length > 0 ? maxIndexTodo[0].index + 1 : 1;

  const todo = { id: generateId(), text, completed: false, dueDate, index: newIndex };
  await collection.insertOne(todo);
  res.status(201);
  res.json(todo);
});

app.put('/drag', async (req, res) => {

  const { draggedId, draggedIndex, droppedId, droppedIndex } = req.body;
  const collection = database.client.db('todos').collection('todos');

  try {
    // Remove the dragged todo from its current position
    await collection.updateOne({ id: draggedId }, { $set: { index: -1 } });
    const todos = await collection.find({}).toArray();
    console.log(todos, "todos 1")

    // Shift other todos to make space for the dragged todo
    if (draggedIndex < droppedIndex) {
      await collection.updateMany(
        { index: { $gte: droppedIndex + 1 } },
        { $inc: { index: 1 } }
      );
      await collection.updateOne({ id: draggedId }, { $set: { index: droppedIndex + 1 } });
    } else {
      await collection.updateMany(
        { index: { $gte: droppedIndex } },
        { $inc: { index: 1 } }
      );
      await collection.updateOne({ id: draggedId }, { $set: { index: droppedIndex } });
    }
    const sortedTodos = await collection.find({}).sort({ index: 1 }).toArray();

    res.status(200).json({ message: "Todo order updated successfully", sortedTodos: sortedTodos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  console.log("put id");
  if (typeof completed !== 'boolean') {
    res.status(400);
    res.json({ message: "invalid 'completed' expected boolean" });
    return;
  }

  try {
    let result = await database.client.db('todos').collection('todos').updateOne(
      { id },
      { $set: { completed: completed } },
    );

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
  res.status(200);
  res.end();
});

app.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const collection = database.client.db('todos').collection('todos');

  // Find the todo to be deleted
  const todoToDelete = await collection.findOne({ id: id });
  if (!todoToDelete) {
    res.status(404);
    res.json({ message: "Todo not found" });
    return;
  }
  await collection.deleteOne({ id: id });

  res.status(203);
  res.end();
});

module.exports = app;
