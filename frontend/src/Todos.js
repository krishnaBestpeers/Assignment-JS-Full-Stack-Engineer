import { useState, useEffect } from "react";
import { Container, Typography, Button } from "@mui/material";
import AddTodoForm from "./components/AddTodoForm";
import TodoList from "./components/TodoList";
import useApi from "./useApi";

function Todos() {
  const [todos, setTodos] = useState([]);
  const [showDueToday, setShowDueToday] = useState(false);
  // const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const apiURL = "http://localhost:3001";

  const { loading, error, fetchData } = useApi(apiURL);

  useEffect(() => {
    const loadInitialTodos = async () => {
      setSkip(0);
      setTodos([]); // Clear existing todos
      await loadTodos(0);
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
  const loadTodos = async (tempSkip) => {
    if (loading) return;

    let apiUrl = `/?skip=${tempSkip}`;

    if (showDueToday) {
      const today = new Date().toISOString().split("T")[0];
      apiUrl += `&dueDate=${today}`;
    }
    const newTodos = await fetchData(apiUrl);
    setTodos((prevTodos) => [...prevTodos, ...newTodos]);
    if (newTodos.length < 20) {
      setHasMore(false);
    }
  };

  function addTodo(text, dueDate) {
    const body = { text, dueDate };
    fetchData("/", "POST", body).then((todo) => {
      setTodos((prevTodos) => [...prevTodos, todo]);
      setShowDueToday(false);
    });
  }

  function toggleTodoCompleted(id) {
    const body = { completed: !todos.find((todo) => todo.id === id).completed };
    fetchData(`/${id}`, "PUT", body).then(() => {
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
    fetchData(`/${id}`, "DELETE").then(() =>
      setTodos(todos.filter((todo) => todo.id !== id))
    );
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

    const body = {
      draggedId: draggedItemId, // Provide the ID of the dragged item
      draggedIndex: draggedIndex,
      droppedIndex: index, // Provide the dropped index
      droppedId: id,
    };
    fetchData("/drag", "PUT", body)
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
