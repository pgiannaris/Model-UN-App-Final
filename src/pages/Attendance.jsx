import { useState, useEffect } from "react";
import { useInsert, useRemove, useList } from "../hooks/database";
import { useAuth } from "../hooks/useAuth";
import Banner from "../components/Banner";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function Attendance() {
  const { user, isAdmin } = useAuth();

  // ✅ Always call hooks first
  const [students, setStudents] = useState([]);
  const [studentName, setStudentName] = useState({});
  const [inputDate, setInputDate] = useState({});
  const [found, setFound] = useState([]);
  const [allDates, setAllDates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentMeeting, setCurrentMeeting] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
  });

  const { data } = useList("attendance");
  const insertStudent = useInsert("students");
  const listStudent = useList("students");
  const removeStudent = useRemove("students");
  const remove = useRemove("attendance");
  const insertAttendance = useInsert("attendance");

  // Calculate total students
  const totalStudents = students.length;

  // Prepare percentage data
  const attendanceData = [
    {
      name: "Present",
      value:
        totalStudents > 0
          ? Math.round(
              (students.filter((s) => s.status === "present").length /
                totalStudents) *
                100,
            )
          : 0,
      color: "#16a34a", // green
    },
    {
      name: "Excused",
      value:
        totalStudents > 0
          ? Math.round(
              (students.filter((s) => s.status === "excused").length /
                totalStudents) *
                100,
            )
          : 0,
      color: "#ca8a04", // yellow
    },
    {
      name: "Absent",
      value:
        totalStudents > 0
          ? Math.round(
              (students.filter((s) => s.status === "absent").length /
                totalStudents) *
                100,
            )
          : 0,
      color: "#dc2626", // red
    },
  ];

  // ✅ Now safe to use hooks and effects
  useEffect(() => {
    if (Array.isArray(listStudent.data)) {
      setStudents(
        listStudent.data.map((student) => ({
          id: student.id,
          name: student.name,
          status: "absent",
        })),
      );
    }
  }, [listStudent.data]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      const dates = Array.from(new Set(data.map((r) => r.date))).sort(
        (b, a) => new Date(a) - new Date(b),
      );
      setAllDates(dates);
    }
  }, [data]);

  // ✅ Conditional rendering happens here, AFTER hooks
  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="mb-4 text-xl font-semibold">Please Log In</h2>
        <p className="text-gray-600">
          You need to be logged in as an Administrator to view the attendance
          tracker page.
        </p>
      </div>
    );
  }

  // Format dates for display
  function formatReadableDate(dateStr) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Format ISO date string to YYYY-MM-DD
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  }

  // Cycle through attendance status (absent -> present -> excused -> absent)
  const cycleAttendanceStatus = (id) => {
    setStudents(
      students.map((student) => {
        if (student.id === id) {
          // Cycle through the three possible statuses
          const nextStatus =
            student.status === "absent"
              ? "present"
              : student.status === "present"
                ? "excused"
                : "absent";

          return { ...student, status: nextStatus };
        }
        return student;
      }),
    );
  };

  // Set specific attendance status
  const setAttendanceStatus = (id, status) => {
    setStudents(
      students.map((student) =>
        student.id === id ? { ...student, status } : student,
      ),
    );
  };

  // Handle search input changes
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter students based on search query and attendance status
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "present")
      return matchesSearch && student.status === "present";
    if (filter === "absent")
      return matchesSearch && student.status === "absent";
    if (filter === "excused")
      return matchesSearch && student.status === "excused";
    return matchesSearch;
  });

  // Search attendance records by student name
  function searchByName(e) {
    e.preventDefault();
    if (!studentName.name) {
      alert("Please enter a student name");
      return;
    }

    let results = [];
    for (let record of data) {
      for (let student of record.data) {
        if (studentName.name === student.name) {
          results.push({
            date: record.date,
            status: student.status || (student.present ? "present" : "absent"),
          });
        }
      }
    }
    setFound(results);
  }

  // Search attendance records by date
  function searchByDate(e) {
    e.preventDefault();
    if (!inputDate.date) {
      alert("Please enter a date");
      return;
    }

    const results = [];
    for (let record of data) {
      const formattedDate = formatDate(record.date);
      if (formattedDate === inputDate.date) {
        for (let student of record.data) {
          results.push({
            name: student.name,
            status: student.status || (student.present ? "present" : "absent"),
          });
        }
      }
    }
    setFound(results);
  }

  // Add a single new student
  function addStudent() {
    let data = prompt("Input student name:");
    if (data) {
      insertStudent.call({ name: data });
    }
  }

  function handleRemoveStudent() {
    let studentName = prompt("Input student name:");
    if (studentName) {
      // Find the student by name
      if (studentName) {
        for (let i in listStudent.data) {
          console.log(listStudent.data[i]);
          if (studentName == listStudent.data[i].name) {
            console.log("found student, id:", listStudent.data[i].id);
            removeStudent.call(listStudent.data[i].id);
          } else {
            console.log("Student not found");
          }
        }
        // Use the student's ID to remove them
      }
    } else {
      alert("Please enter a students name");
    }
  }

  // Add multiple students via JSON
  function bulkAddStudent() {
    let data = prompt(
      'Bulk JSON FORMAT: [{"name": "StudentNameOne"}, {"name": "StudentNameTwo"}] YOU CAN ONLY ADD 20 NAMES PER BULK ADD',
    );
    try {
      const students = JSON.parse(data);
      if (Array.isArray(students)) {
        const delay = 100; // Delay between requests to avoid overloading
        students.forEach((student, index) => {
          setTimeout(() => {
            insertStudent.call(student, { requestKey: null });
          }, index * delay);
        });
      } else {
        alert(
          "Invalid input format. Please provide an array of student objects.",
        );
      }
    } catch (error) {
      alert("Invalid JSON format. Please try again.");
      console.error("JSON parsing error:", error);
    }
  }

  // Load a previous meeting date into the date input
  function loadPrevMeeting(meeting) {
    document.getElementById("date").value = meeting;
    setInputDate({ ...inputDate, date: meeting });
  }

  // Save current attendance record to database
  const saveAttendance = () => {
    // Calculate attendance statistics
    const presentCount = students.filter(
      (student) => student.status === "present",
    ).length;

    // Check if attendance record for this date already exists
    for (let record of data) {
      if (record.date === currentMeeting.date) {
        remove.call(record.id); // Remove existing record
        break;
      }
    }

    // Create attendance record
    const attendanceRecord = {
      date: currentMeeting.date,
      data: students.map((student) => ({
        name: student.name,
        status: student.status || "absent",
        // Keep present property for backward compatibility
        present: student.status === "present",
      })),
    };
    for (let i in Array.from(allDates)) {
      console.log(allDates[i]);
      if (currentMeeting.date == allDates[i]) {
        alert(
          "You are appending to a previously appended date. Press ⌘ + W, CTRL + W, or close this tab now to cancel this operation. Press 'Ok' to continue with the operation",
        );
      }
    }
    // Save to database
    insertAttendance.call(attendanceRecord);

    // Reset student status after saving
    setStudents(students.map((student) => ({ ...student, status: "absent" })));

    alert("Attendance saved successfully!");
  };

  // Get status color based on attendance status
  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "excused":
        return "bg-yellow-100 text-yellow-800";
      case "absent":
      default:
        return "bg-red-100 text-red-800";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "present":
        return "Present";
      case "excused":
        return "Excused";
      case "absent":
      default:
        return "Absent";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <Banner
        title="Student Attendance Tracker"
        description="Mark, track, and analyze attendance for Model UN meetings and
            conferences"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Take Attendance */}
          <div className="col-span-2 space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-semibold text-blue-800">
                Take Attendance
              </h3>

              {/* Meeting Info */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-1">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-2"
                    value={currentMeeting.date}
                    onChange={(e) =>
                      setCurrentMeeting({
                        ...currentMeeting,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Search and Filter */}
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 p-2"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`rounded-lg px-3 py-2 ${
                      filter === "all"
                        ? "cursor-pointer bg-blue-600 text-white"
                        : "cursor-pointer bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`rounded-lg px-3 py-2 ${
                      filter === "present"
                        ? "cursor-pointer bg-green-600 text-white"
                        : "cursor-pointer bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setFilter("present")}
                  >
                    Present
                  </button>
                  <button
                    className={`rounded-lg px-3 py-2 ${
                      filter === "excused"
                        ? "cursor-pointer bg-yellow-600 text-white"
                        : "cursor-pointer bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setFilter("excused")}
                  >
                    Excused
                  </button>
                  <button
                    className={`rounded-lg px-3 py-2 ${
                      filter === "absent"
                        ? "cursor-pointer bg-red-600 text-white"
                        : "cursor-pointer bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setFilter("absent")}
                  >
                    Absent
                  </button>
                </div>
              </div>

              {/* Student List */}
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        <span className="ml-2">Status</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="p-4 whitespace-nowrap">
                          <div className="ml-1 font-medium text-gray-900">
                            {student.name}
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => cycleAttendanceStatus(student.id)}
                              className={`cursor-pointer rounded-lg px-3 py-1 ${getStatusColor(student.status)}`}
                            >
                              {getStatusText(student.status)}
                            </button>
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  setAttendanceStatus(student.id, "present")
                                }
                                className={`rounded-lg px-2 py-1 text-xs ${
                                  student.status === "present"
                                    ? "cursor-pointer bg-green-500 text-white"
                                    : "cursor-pointer bg-gray-200 text-gray-800"
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() =>
                                  setAttendanceStatus(student.id, "excused")
                                }
                                className={`rounded-lg px-2 py-1 text-xs ${
                                  student.status === "excused"
                                    ? "cursor-pointer bg-yellow-200 text-black"
                                    : "cursor-pointer bg-gray-200 text-gray-800"
                                }`}
                              >
                                E
                              </button>
                              <button
                                onClick={() =>
                                  setAttendanceStatus(student.id, "absent")
                                }
                                className={`rounded-lg px-2 py-1 text-xs ${
                                  student.status === "absent"
                                    ? "cursor-pointer bg-red-500 text-white"
                                    : "cursor-pointer bg-gray-200 text-gray-800"
                                }`}
                              >
                                A
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-4 text-center text-gray-500"
                        >
                          No students found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={saveAttendance}
                  className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                >
                  Save Attendance
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-semibold text-blue-800">
                Find Student
              </h3>

              {/* Search Inputs */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Student Name:
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 p-2"
                    placeholder="Student Name"
                    value={studentName.name}
                    onChange={(e) =>
                      setStudentName({ ...studentName, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    className="w-full rounded-lg border border-gray-300 p-2"
                    onChange={(e) =>
                      setInputDate({ ...inputDate, date: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Search Buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-white"
                  onClick={searchByName}
                >
                  Search By Student
                </button>
                <button
                  className="cursor-pointer rounded-lg bg-blue-200 px-3 py-2 text-black"
                  onClick={searchByDate}
                >
                  Search By Date
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        {found && found[0] && found[0].date ? "Date" : "Name"}
                      </th>
                      <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {found.map((item, index) => (
                      <tr key={index}>
                        <td className="font-regular">
                          <span className="ml-4">
                            {item.date
                              ? formatReadableDate(item.date)
                              : item.name}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`m-4 rounded-lg p-2 ${getStatusColor(item.status)}`}
                          >
                            {getStatusText(item.status)}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Stats and History */}
          <div className="space-y-6">
            {/* Attendance Stats */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-semibold text-blue-800">
                Attendance Statistics
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">
                    {students.filter((s) => s.status === "present").length}/
                    {students.length}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-sm text-gray-600">Excused</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {students.filter((s) => s.status === "excused").length}/
                    {students.length}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {students.filter((s) => s.status === "absent").length}/
                    {students.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {students.length > 0
                    ? Math.round(
                        ((students.filter((s) => s.status === "present")
                          .length +
                          students.filter((s) => s.status === "excused")
                            .length *
                            0.5) /
                          students.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  (Excused absences count as 50% attendance)
                </p>
              </div>
            </div>

            {/* Attendance History */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-semibold text-blue-800">
                Previous Meetings
              </h3>

              <div className="space-y-3">
                {Array.isArray(allDates) &&
                  allDates.map((meeting, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition hover:bg-blue-50"
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => loadPrevMeeting(meeting)}
                      >
                        <h4 className="font-medium text-blue-800">{meeting}</h4>
                        <p className="text-sm text-gray-500">
                          {formatReadableDate(meeting)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const recordToDelete = data.find(
                            (record) => record.date === meeting,
                          );
                          if (recordToDelete) {
                            if (
                              confirm(
                                `Are you sure you want to delete attendance for ${meeting}? This cannot be undone.`,
                              )
                            ) {
                              remove.call(recordToDelete.id);
                            }
                          } else {
                            alert("Meeting record not found.");
                          }
                        }}
                        className="ml-4 cursor-pointer rounded-lg bg-red-600 px-3 py-1 text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 w-full rounded-lg bg-white p-0 shadow-md">
          <div className="rounded-lg bg-white">
            {/* Meeting Info */}

            {/* Student List */}
            <div className="mt-8 w-full rounded-lg bg-white p-6">
              <h3 className="mb-4 text-xl font-semibold text-blue-800">
                Overall Attendance
              </h3>

              {/* Student List with Overall Attendance Percentage */}
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {students.map((student) => {
                      // Count total events
                      const totalEvents = allDates.length;
                      // Count times attended (present + 50% excused)
                      const attended = (data ?? []).reduce((count, record) => {
                        const match = record.data.find(
                          (s) => s.name === student.name,
                        );
                        if (match) {
                          if (match.status === "present" || match.present)
                            return count + 1;
                          if (match.status === "excused") return count + 0.5;
                        }
                        return count;
                      }, 0);

                      const percentage =
                        totalEvents > 0
                          ? Math.round((attended / totalEvents) * 100)
                          : 0;

                      return (
                        <tr key={student.id}>
                          <td className="p-4 whitespace-nowrap">
                            <div className="ml-1 font-medium text-gray-900">
                              {student.name}
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center justify-between">
                              <span>
                                {attended}/{totalEvents} events
                              </span>
                              <span className="ml-4 font-semibold text-blue-600">
                                {percentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
