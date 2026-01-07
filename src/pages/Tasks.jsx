import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useList, useInsert, useRemove } from "../hooks/database";
import {
  TextInput,
  Button,
  Label,
  Spinner,
  Card,
  Datepicker,
  Textarea,
  Toast,
  ToastToggle,
} from "flowbite-react";
import Banner from "../components/Banner";

export function Tasks() {
  const { user, isAdmin } = useAuth();
  const listTasks = useList("tasks");
  const studentsList = useList("students"); // PocketBase students collection

  const insert = useInsert("tasks");
  const remove = useRemove("tasks");

  // --- Admin form state ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [priority, setPriority] = useState("medium");

  // Email assignment
  const [assignedEmails, setAssignedEmails] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);

  // UI state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  console.log(listTasks.data);
  useEffect(() => {
    if (studentSearch.trim() === "") {
      setFilteredStudents([]);
      return;
    }
    const searchLower = studentSearch.toLowerCase();
    setFilteredStudents(
      (studentsList.data ?? []).filter(
        (s) =>
          s.name?.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower),
      ),
    );
  }, [studentSearch, studentsList.data]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="mb-4 text-xl font-semibold">Please Log In</h2>
        <p className="text-gray-600">You need to be logged in to view tasks.</p>
      </div>
    );
  }

  if (listTasks.isLoading || studentsList.isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="xl" />
      </div>
    );
  }

  const tasksToShow = isAdmin
    ? (listTasks.data ?? [])
    : (listTasks.data ?? []).filter((task) =>
        task.emails?.includes(user.email),
      );

  // --- Admin actions ---
  async function handleCreateTask(e) {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      setToastMessage("Title and due date are required");
      setShowToast(true);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description || "",
      dueDate: dueDate.toISOString().slice(0, 10),
      priority,
      emails: assignedEmails,
    };

    try {
      await insert.call(payload);
      setToastMessage("Task created successfully");
      setShowToast(true);
      // reset form
      setTitle("");
      setDescription("");
      setDueDate(null);
      setPriority("medium");
      setAssignedEmails([]);
      setStudentSearch("");
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to create task");
      setShowToast(true);
    }
  }

  async function handleDeleteTask(id) {
    if (!id) return;
    const ok = window.confirm("Delete this task? This cannot be undone.");
    if (!ok) return;
    try {
      setDeletingId(id);
      await remove.call(id);
      setToastMessage("Task deleted");
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to delete task");
      setShowToast(true);
    } finally {
      setDeletingId(null);
    }
  }

  const addAssignedEmail = (email) => {
    if (!assignedEmails.includes(email)) {
      setAssignedEmails([...assignedEmails, email]);
    }
    setStudentSearch("");
  };

  const removeAssignedEmail = (email) => {
    setAssignedEmails(assignedEmails.filter((e) => e !== email));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Banner title="Tasks" description="View and manage tasks" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Admin Panel */}
          {isAdmin && (
            <Card className="space-y-4 p-6">
              <h3 className="text-xl font-semibold text-blue-800">
                Admin Panel
              </h3>
              <p className="text-gray-600">
                Create a new task and assign students.
              </p>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <Label htmlFor="title" value="Task Title" />
                  <TextInput
                    id="title"
                    placeholder="Enter title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description" value="Description" />
                  <Textarea
                    id="description"
                    placeholder="Enter description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate" value="Due Date" />
                  <Datepicker
                    id="dueDate"
                    value={dueDate}
                    placeholder={new Date()}
                    onChange={setDueDate}
                    showFooter={false}
                  />
                </div>

                <div>
                  <Label htmlFor="priority" value="Priority" />
                  <select
                    id="priority"
                    className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 hover:bg-inherit focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low" className="">
                      Low
                    </option>
                    <option value="medium" className="">
                      Medium
                    </option>
                    <option value="high" className="">
                      High
                    </option>
                  </select>
                </div>

                {/* Student assignment */}
                {/* Student assignment */}
                <div className="relative">
                  <Label htmlFor="studentSearch" value="Assign Students" />
                  <TextInput
                    id="studentSearch"
                    placeholder="Search students by name or email"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />

                  {(filteredStudents.length > 0 || studentSearch === "all") && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg">
                      {/* "All" option */}
                      <button
                        type="button"
                        className="block w-full px-3 py-1 text-left font-medium text-blue-700 hover:bg-gray-100"
                        onClick={() => {
                          setAssignedEmails(
                            (studentsList.data ?? []).map((s) => s.email),
                          );
                          setStudentSearch("");
                        }}
                      >
                        All Students
                      </button>

                      {/* Search results */}
                      {(studentSearch === "all"
                        ? studentsList.data
                        : filteredStudents
                      ).map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          className="block w-full px-3 py-1 text-left hover:bg-gray-100"
                          onClick={() => addAssignedEmail(s.email)}
                        >
                          {s.name} ({s.email})
                        </button>
                      ))}

                      {/* Show a message if no results */}
                      {((studentSearch !== "all" &&
                        filteredStudents.length === 0) ||
                        (studentSearch === "all" &&
                          (studentsList.data ?? []).length === 0)) && (
                        <div className="px-3 py-2 text-gray-500">
                          No students found
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display assigned emails */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {assignedEmails.map((email) => (
                      <span
                        key={email}
                        className="flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-sm text-blue-800"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeAssignedEmail(email)}
                          className="font-bold text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={insert.isLoading}>
                    {insert.isLoading ? <Spinner size="sm" /> : "Create Task"}
                  </Button>
                  <Button
                    color="gray"
                    type="button"
                    onClick={() => {
                      setTitle("");
                      setDescription("");
                      setDueDate(null);
                      setPriority("medium");
                      setAssignedEmails([]);
                      setStudentSearch("");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tasks List */}
          <div
            className={`rounded-lg bg-white p-6 shadow-md ${
              isAdmin ? "lg:col-span-2" : "lg:col-span-3"
            }`}
          >
            <h3 className="mb-4 text-xl font-semibold text-blue-800">
              Tasks Area
            </h3>

            <div className="grid gap-4">
              {tasksToShow.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No tasks to show.
                </div>
              ) : (
                tasksToShow.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {task.title}
                          </h3>
                          <span
                            className={`text-sm font-medium ${
                              task.priority === "high"
                                ? "text-red-600"
                                : task.priority === "medium"
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <p className="mt-1 text-gray-700">{task.description}</p>

                        <div className="mt-3 space-y-1 text-sm text-gray-500">
                          <p>
                            Due:{" "}
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString(
                                  "en-US",
                                )
                              : "—"}
                          </p>
                          <p>Assigned to: {task.emails?.join(", ") || "—"}</p>
                        </div>
                      </div>

                      {isAdmin && (
                        <Button
                          size="xs"
                          color="failure"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deletingId === task.id || remove.isLoading}
                        >
                          {deletingId === task.id || remove.isLoading
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed right-4 bottom-4">
          <Toast>
            <div className="ml-3 text-sm font-normal">{toastMessage}</div>
            <ToastToggle onClick={() => setShowToast(false)} />
          </Toast>
        </div>
      )}
    </div>
  );
}
