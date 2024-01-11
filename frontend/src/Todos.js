import { useState, useEffect } from "react";
import { Container, Typography, Button } from "@mui/material";
import AddTodoForm from "./AddTodoForm";
import TodoList from "./TodoList";

function Todos() {
  const [todos, setTodos] = useState([]);
  const [showDueToday, setShowDueToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const apiURL = "http://localhost:3001";

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

    let apiUrl = `${apiURL}/?skip=${tempSkip}`;

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

  function addTodo(text, dueDate) {
    fetch(`${apiURL}/`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ text, dueDate }),
    })
      .then((response) => response.json())
      .then((todo) => {
        setTodos([...todos, todo]);
        setShowDueToday(false);
      });
  }

  function toggleTodoCompleted(id) {
    fetch(`${apiURL}/${id}`, {
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
    fetch(`${apiURL}/${id}`, {
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

    fetch(`${apiURL}/drag`, {
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
      <AddTodoForm addTodo={addTodo} />
      <Button
        variant={showDueToday ? "contained" : "outlined"}
        onClick={() => handleShowDueToday()}
      >
        Due Today
      </Button>
      {todos.length > 0 && (
        <TodoList
          todos={todos}
          toggleTodoCompleted={toggleTodoCompleted}
          deleteTodo={deleteTodo}
          dragStart={dragStart}
          dragOver={dragOver}
          drop={drop}
          loading={loading}
          hasMore={hasMore}
          loadMore={loadMore}
        />
      )}
    </Container>
  );
}

export default Todos;
