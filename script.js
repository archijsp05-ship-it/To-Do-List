"use strict";


const STORAGE_KEY = "todos";

const state = {
  todos: loadTodos(),
  filter: "all", // "all" | "active" | "completed"
  editingId: null,
};

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const filters = document.getElementById("filters");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-completed");

function loadTodos() {
  try {
    const data = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function addTodo(text) {
  state.todos.push({ id: Date.now().toString(), text, completed: false });
  commit();
}

function toggleTodo(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (todo) todo.completed = !todo.completed;
  commit();
}

function updateTodo(id, text) {
  const todo = state.todos.find((t) => t.id === id);
  if (todo && text.trim()) todo.text = text.trim();
  state.editingId = null;
  commit();
}

function deleteTodo(id) {
  state.todos = state.todos.filter((t) => t.id !== id);
  commit();
}

function clearCompleted() {
  state.todos = state.todos.filter((t) => !t.completed);
  commit();
}

/* Save to storage, then re-render */
function commit() {
  saveTodos();
  render();
}

function getVisibleTodos() {
  switch (state.filter) {
    case "active":
      return state.todos.filter((t) => !t.completed);
    case "completed":
      return state.todos.filter((t) => t.completed);
    default:
      return state.todos;
  }
}

function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.completed ? " completed" : "");
  li.dataset.id = todo.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.className = "toggle";

  li.appendChild(checkbox);

  if (state.editingId === todo.id) {
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-input";
    editInput.value = todo.text;

    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "Save";

    li.append(editInput, saveBtn);
  } else {
    const span = document.createElement("span");
    span.className = "todo-text";
    span.textContent = todo.text; // textContent prevents HTML injection

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";

    li.append(span, editBtn);
  }

  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.textContent = "Delete";
  li.appendChild(delBtn);

  return li;
}

function render() {
  list.innerHTML = "";
  const visible = getVisibleTodos();

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No tasks to show.";
    list.appendChild(empty);
  } else {
    const fragment = document.createDocumentFragment();
    visible.forEach((todo) => fragment.appendChild(createTodoElement(todo)));
    list.appendChild(fragment);
  }

  // Filter button highlight
  filters.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === state.filter);
  });

  // Items-left counter
  const left = state.todos.filter((t) => !t.completed).length;
  countEl.textContent = `${left} item${left === 1 ? "" : "s"} left`;

  // Focus the edit box when editing
  const editBox = list.querySelector(".edit-input");
  if (editBox) {
    editBox.focus();
    editBox.setSelectionRange(editBox.value.length, editBox.value.length);
  }
}

// Add new task
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

// Event delegation: ONE listener on the <ul> handles every item's buttons
list.addEventListener("click", (e) => {
  const li = e.target.closest(".todo-item");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains("delete-btn")) {
    deleteTodo(id);
  } else if (e.target.classList.contains("edit-btn")) {
    state.editingId = id;
    render();
  } else if (e.target.classList.contains("save-btn")) {
    updateTodo(id, li.querySelector(".edit-input").value);
  }
});

list.addEventListener("change", (e) => {
  if (e.target.classList.contains("toggle")) {
    toggleTodo(e.target.closest(".todo-item").dataset.id);
  }
});

// Enter saves, Escape cancels while editing
list.addEventListener("keydown", (e) => {
  if (!e.target.classList.contains("edit-input")) return;
  const id = e.target.closest(".todo-item").dataset.id;
  if (e.key === "Enter") {
    updateTodo(id, e.target.value);
  } else if (e.key === "Escape") {
    state.editingId = null;
    render();
  }
});

// Delegated filter buttons
filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  state.filter = btn.dataset.filter;
  render();
});

clearBtn.addEventListener("click", clearCompleted);

render();