import { useState, useEffect } from "react";
import makeStyles from "@mui/styles/makeStyles";
import {
  Container,
  Typography,
  Button,
  Icon,
  Paper,
  Box,
  TextField,
  Checkbox,
} from "@mui/material";

const useStyles = makeStyles({
  addTodoContainer: { padding: 10 },
  addTodoButton: { marginLeft: 5 },
  todosContainer: { marginTop: 10, padding: 10 },
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
  todoTextCompleted: {
    textDecoration: "line-through",
  },
  deleteTodo: {
    visibility: "hidden",
  },
  dueDateInput: {
    marginLeft: 10,
  },
});

function Todos() {
  const classes = useStyles();
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showDueToday, setShowDueToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    const loadInitialTodos = async () => {
      setSkip(0);
      setLoading(true);
      setTodos([]); // Clear existing todos

      try {
        await loadTodos(0);
      } finally {
        setLoading(false);
      }
    };

    loadInitialTodos();
  }, [showDueToday]);

  useEffect(() => {
    if (skip > 0 && !loading && hasMore) {
      loadTodos(skip);
    }
  }, [skip, loading, hasMore]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setSkip((prevSkip) => prevSkip + 20);
      loadTodos(skip + 20);
    }
  };
  const loadTodos = (tempSkip) => {
    if (loading) return;

    setLoading(true);

    let apiUrl = `http://localhost:3001/?skip=${tempSkip}`;

    if (showDueToday) {
      const today = new Date().toISOString().split("T")[0];
      apiUrl += `&dueDate=${today}`;
    }

    fetch(apiUrl)
      .then((response) => response.json())
      .then((newTodos) => {
        setTodos((prevTodos) => [...prevTodos, ...newTodos]);
        if (newTodos.length < 20) {
          setHasMore(false);
        }
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  };

  function addTodo(text) {
    fetch("http://localhost:3001/", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ text, dueDate }),
    })
      .then((response) => response.json())
      .then((todo) => setTodos([...todos, todo]))
      .finally(() => {
        setNewTodoText("");
        setDueDate("");
      });
  }

  function toggleTodoCompleted(id) {
    fetch(`http://localhost:3001/${id}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify({
        completed: !todos.find((todo) => todo.id === id).completed,
      }),
    }).then(() => {
      const newTodos = [...todos];
      const modifiedTodoIndex = newTodos.findIndex((todo) => todo.id === id);
      newTodos[modifiedTodoIndex] = {
        ...newTodos[modifiedTodoIndex],
        completed: !newTodos[modifiedTodoIndex].completed,
      };
      setTodos(newTodos);
    });
  }

  function deleteTodo(id) {
    fetch(`http://localhost:3001/${id}`, {
      method: "DELETE",
    }).then(() => setTodos(todos.filter((todo) => todo.id !== id)));
  }
  function handleShowDueToday() {
    setTodos([]);
    setHasMore(true);
    setShowDueToday(!showDueToday);
  }

  function dragStart(event, index, id) {
    setDraggedItemId(id);
    setDraggedIndex(index);
    event.dataTransfer.setData("text/plain", "");
  }

  function dragOver(event) {
    event.preventDefault();
  }

  function drop(event, index, id) {
    event.preventDefault();

    fetch(`http://localhost:3001/drag`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify({
        draggedId: draggedItemId, // Provide the ID of the dragged item
        draggedIndex: draggedIndex,
        droppedIndex: index, // Provide the dropped index
        droppedId: id,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Success:", data);
        loadTodos(0);
        setDraggedItemId(null);
        setTodos([]);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h3" component="h1" gutterBottom>
        Todos
      </Typography>
      <Paper className={classes.addTodoContainer}>
        <Box display="flex" flexDirection="row">
          <Box flexGrow={1}>
            <TextField
              fullWidth
              value={newTodoText}
              onKeyPress={(event) => {
                if (event.key === "Enter" && newTodoText.trim() !== "") {
                  addTodo(newTodoText);
                }
              }}
              onChange={(event) => setNewTodoText(event.target.value)}
            />
          </Box>
          <Box>
            <TextField
              type="date"
              className={classes.dueDateInput}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Box>
          <Button
            className={classes.addTodoButton}
            startIcon={<Icon>add</Icon>}
            onClick={() => {
              if (newTodoText.trim() !== "") {
                addTodo(newTodoText);
              }
            }}
          >
            Add
          </Button>
        </Box>
      </Paper>
      <Button
        variant={showDueToday ? "contained" : "outlined"}
        onClick={() => handleShowDueToday()}
      >
        Due Today
      </Button>
      {todos.length > 0 && (
        <Paper className={classes.todosContainer}>
          <Box display="flex" flexDirection="column" alignItems="stretch">
            {todos.map(({ id, text, completed, dueDate, index }) => (
              <div
                key={id}
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
                  ></Checkbox>
                  <Box flexGrow={1}>
                    <Typography
                      className={completed ? classes.todoTextCompleted : ""}
                      variant="body1"
                    >
                      {text}
                    </Typography>
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
            ))}
            {loading && <Typography>Loading...</Typography>}
            {!loading && hasMore && (
              <Button onClick={loadMore} fullWidth>
                Load More
              </Button>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
}

export default Todos;
