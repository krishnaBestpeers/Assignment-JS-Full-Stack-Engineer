import React, { useState } from "react";
import { Box, TextField, Button, Icon, Paper } from "@mui/material";

const AddTodoForm = ({ addTodo }) => {
  const [newTodoText, setNewTodoText] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleAddTodo = () => {
    if (newTodoText.trim() !== "") {
      addTodo(newTodoText, dueDate);
      setNewTodoText("");
      setDueDate("");
    }
  };

  return (
    <Paper className="addTodoContainer">
      <Box display="flex" flexDirection="row">
        <Box flexGrow={1}>
          <TextField
            fullWidth
            value={newTodoText}
            onKeyPress={(event) => {
              if (event.key === "Enter" && newTodoText.trim() !== "") {
                handleAddTodo();
              }
            }}
            onChange={(event) => setNewTodoText(event.target.value)}
          />
        </Box>
        <Box>
          <TextField
            type="date"
            className="dueDateInput"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </Box>
        <Button
          className="addTodoButton"
          startIcon={<Icon>add</Icon>}
          onClick={handleAddTodo}
        >
          Add
        </Button>
      </Box>
    </Paper>
  );
};

export default AddTodoForm;
