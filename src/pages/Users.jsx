import { useState, useEffect } from "react";
import { useInsert, useRemove, useList } from "../hooks/database";
import { useAuth } from "../hooks/useAuth";
import Banner from "../components/Banner";
import PocketBase from "pocketbase";

export function Users() {
  const { user, isAdmin } = useAuth();
  const pb = new PocketBase("https://oct2025-team5.pockethost.io/");

  // State
  const [students, setStudents] = useState([]);
  const [approvalStudents, setApprovalStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApprovalQuery, setSearchApprovalQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");

  // Hooks
  const insertStudent = useInsert("students");
  const listStudent = useList("students");
  const removeStudent = useRemove("students");
  const listUsers = useList("users");
  const insertApprovalStudent = useInsert("studentsNeedingApproval");
  const listApprovalStudent = useList("studentsNeedingApproval");
  const removeApprovalStudent = useRemove("studentsNeedingApproval");

  // 🔹 Delete a user by name
  async function deleteUserByName(userName) {
    if (!userName || !Array.isArray(listUsers.data)) return;

    const userRecord = listUsers.data.find((u) => u.name === userName);
    if (!userRecord) {
      alert(`User "${userName}" not found.`);
      return;
    }

    if (
      confirm(
        `Are you sure you want to permanently delete "${userRecord.name}"? This cannot be undone.`,
      )
    ) {
      try {
        await pb.collection("users").delete(userRecord.id);
        console.log(`✅ Deleted user: ${userRecord.name}`);
        await listUsers.refetch?.();
      } catch (error) {
        console.error("❌ Error deleting user:", error);
        alert("Failed to delete user from database.");
      }
    }
  }

  // Load approved students
  useEffect(() => {
    if (Array.isArray(listStudent.data)) {
      setStudents(
        listStudent.data.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email || "—",
        })),
      );
    }
  }, [listStudent.data]);

  // Load approval students
  useEffect(() => {
    if (Array.isArray(listApprovalStudent.data)) {
      setApprovalStudents(
        listApprovalStudent.data.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
        })),
      );
    }
  }, [listApprovalStudent.data]);

  // Filters
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredApprovalStudents = approvalStudents.filter((student) =>
    student.name.toLowerCase().includes(searchApprovalQuery.toLowerCase()),
  );

  // Add new student manually (using modal)
  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newStudentName.trim()) return alert("Please enter a student name.");

    try {
      await insertStudent.call({
        name: newStudentName.trim(),
        email: newStudentEmail.trim() || "",
      });
      setIsAddModalOpen(false);
      setNewStudentName("");
      setNewStudentEmail("");
    } catch (error) {
      console.error("Error adding student:", error);
    }
  }

  // Remove student
  async function handleRemoveStudent(studentName) {
    if (!studentName || !Array.isArray(listStudent.data)) return;
    const student = listStudent.data.find((s) => s.name === studentName);
    if (student) await removeStudent.call(student.id);
  }

  // Move student to needing approval
  async function handleUnenrollStudent(studentName) {
    if (!studentName || !Array.isArray(listStudent.data)) return;

    const student = listStudent.data.find((s) => s.name === studentName);
    if (!student) return;

    try {
      await insertApprovalStudent.call({
        name: student.name,
        email: student.email || "",
      });
      await removeStudent.call(student.id);
    } catch (error) {
      console.error("Error unenrolling student:", error);
    }
  }

  // Approve student
  async function handleApproveStudent(student) {
    try {
      await insertStudent.call({ name: student.name, email: student.email });
      await removeApprovalStudent.call(student.id);
    } catch (error) {
      console.error("Error approving student:", error);
    }
  }

  async function handleRemoveApproveStudent(student) {
    await removeApprovalStudent.call(student.id);
  }

  // Guard for admin access
  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="mb-4 text-xl font-semibold">Please Log In</h2>
        <p className="text-gray-600">
          You need to be logged in as an Administrator to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Banner
        title="Student User List"
        description="Manage all of your users and approve new ones"
      />

      <div className="container mx-auto px-4 py-8">
        {/* ✅ Approved Students Section */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-xl font-semibold text-blue-800">Students</h3>

          <div className="mb-4">
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 p-2"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="p-4 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="p-4 font-medium whitespace-nowrap text-gray-900">
                      {student.name}
                    </td>
                    <td className="p-4 whitespace-nowrap text-gray-700">
                      {student.email}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleUnenrollStudent(student.name)}
                        className="cursor-pointer rounded-lg border border-yellow-500 px-3 py-2 text-yellow-600 transition duration-200 hover:bg-yellow-500 hover:text-white"
                      >
                        Unenroll
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="cursor-pointer rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition duration-200 hover:bg-blue-600 hover:text-white"
            >
              Add New Student
            </button>
          </div>
        </div>

        {/* ✅ Students Needing Approval Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-xl font-semibold text-blue-800">
            Add Users to Student Roster
          </h3>

          <div className="mb-4">
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 p-2"
              placeholder="Search by name..."
              value={searchApprovalQuery}
              onChange={(e) => setSearchApprovalQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="p-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="p-4 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredApprovalStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="p-4 font-medium whitespace-nowrap text-gray-900">
                      {student.name}
                    </td>
                    <td className="p-4 whitespace-nowrap text-gray-700">
                      {student.email}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleApproveStudent(student)}
                        className="cursor-pointer rounded-lg border border-green-600 px-4 py-2 text-green-600 transition duration-200 hover:bg-green-600 hover:text-white"
                      >
                        Add to Student Roster
                      </button>
                      <button
                        onClick={async () => {
                          await deleteUserByName(student.name);
                          await handleRemoveApproveStudent(student);
                        }}
                        className="ml-2 cursor-pointer rounded-lg border border-red-600 px-4 py-2 text-red-600 transition duration-200 hover:bg-red-600 hover:text-white"
                      >
                        Delete Account
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApprovalStudents.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500">
                      No students needing approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ✅ Add Student Modal */}
      {isAddModalOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-xl font-semibold text-blue-800">
              Add New Student
            </h3>
            <p className="mb-4 text-sm text-yellow-600">
              ⚠️ Warning: This student will not be linked to a real user
              account, so you won’t be able to assign tasks to them.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <input
                type="text"
                placeholder="Student name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-gray-400 px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
