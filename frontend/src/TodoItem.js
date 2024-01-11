import React from "react";
import { Box, Checkbox, Typography, Button, Icon } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles({
  todoContainer: {
    borderTop: "1px solid #bfbfbf",
    marginTop: 5,
    "&:first-child": {
      margin: 0,
      borderTop: "none",
    },
    "&:hover": {
      "& $deleteTodo": {
        visibility: "visible",
      },
    },
  },
  deleteTodo: {
    visibility: "hidden",
  },
});

const TodoItem = ({
  id,
  text,
  completed,
  dueDate,
  index,
  toggleTodoCompleted,
  deleteTodo,
  dragStart,
  dragOver,
  drop,
}) => {
  const classes = useStyles();

  return (
    <div
      draggable
      onDragStart={(e) => dragStart(e, index, id)}
      onDragOver={(e) => dragOver(e)}
      onDrop={(e) => drop(e, index, id)}
    >
      <Box
        key={id}
        display="flex"
        flexDirection="row"
        alignItems="center"
        className={classes.todoContainer}
      >
        <Checkbox
          checked={completed}
          onChange={() => toggleTodoCompleted(id)}
        />
        <Box flexGrow={1}>
          <Typography variant="body1">{text}</Typography>
          {dueDate && (
            <Typography variant="caption" color="textSecondary">
              Due Date: {dueDate}
            </Typography>
          )}
        </Box>
        <Button
          className={classes.deleteTodo}
          startIcon={<Icon>delete</Icon>}
          onClick={() => deleteTodo(id)}
        >
          Delete
        </Button>
      </Box>
    </div>
  );
};

export default TodoItem;
