const express = require('express');
const {
  requestLogger,
  getAllTodos,
  createTodo,
  updateDraggedTodoPosition,
  updateTodoById,
  deleteTodoById,
} = require('./controller');

const app = express();

app.use(requestLogger);
app.use(require('cors')());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/', getAllTodos);
app.post('/', createTodo);
app.put('/drag', updateDraggedTodoPosition);
app.put('/:id', updateTodoById);
app.delete('/:id', deleteTodoById);

module.exports = app;
