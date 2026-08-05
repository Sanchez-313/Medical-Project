"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ListChecks, Plus, Trash2 } from "lucide-react";

interface Todo {
  id: number;
  task: string;
  is_done: number;
}

export default function StaffTodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");

  function load() {
    return fetch("/api/staff/todos")
      .then((r) => r.json())
      .then((result) => setTodos(result.success ? result.data : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function addTodo(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const result = await fetch("/api/staff/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: text.trim() }),
    }).then((r) => r.json());
    if (result.success) {
      setText("");
      load();
    }
  }

  async function toggleDone(todo: Todo) {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, is_done: t.is_done ? 0 : 1 } : t)));
    await fetch(`/api/staff/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_done: !todo.is_done }),
    });
  }

  async function removeTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/staff/todos/${id}`, { method: "DELETE" });
  }

  const doneCount = todos.filter((t) => t.is_done).length;

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <ListChecks size={18} />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Daily To-Do</h3>
            <p className="text-xs font-semibold text-slate-400">
              {todos.length === 0 ? "No tasks yet" : `${doneCount}/${todos.length} done`}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={addTodo} className="mb-4 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
        />
        <button
          type="submit"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          aria-label="Add task"
        >
          <Plus size={18} />
        </button>
      </form>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {!loading && todos.length === 0 && <p className="text-sm text-slate-400">Nothing on the list today.</p>}
        {todos.map((todo) => (
          <div key={todo.id} className="group flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2">
            <input
              type="checkbox"
              checked={Boolean(todo.is_done)}
              onChange={() => toggleDone(todo)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`flex-1 text-sm font-semibold ${todo.is_done ? "text-slate-300 line-through" : "text-slate-700"}`}>
              {todo.task}
            </span>
            <button
              type="button"
              onClick={() => removeTodo(todo.id)}
              className="text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              aria-label="Delete task"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
