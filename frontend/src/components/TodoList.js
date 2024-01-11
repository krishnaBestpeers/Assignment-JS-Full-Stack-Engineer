import React from "react";
import { Paper, Button, Typography } from "@mui/material";
import TodoItem from "./TodoItem";

const TodoList = ({
  todos,
  toggleTodoCompleted,
  deleteTodo,
  dragStart,
  dragOver,
  drop,
  loading,
  hasMore,
  loadMore,
}) => (
  <Paper className="todosContainer">
    <div className="todosList">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          {...todo}
          {...{ toggleTodoCompleted, deleteTodo, dragStart, dragOver, drop }}
        />
      ))}
      {loading && <Typography>Loading...</Typography>}
      {!loading && hasMore && (
        <Button onClick={loadMore} fullWidth>
          Load More
        </Button>
      )}
    </div>
  </Paper>
);

export default TodoList;
