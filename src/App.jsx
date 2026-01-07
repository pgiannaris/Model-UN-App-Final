import { useState } from "react";
import { Home } from "./pages/Home";
import { PageOne } from "./pages/PageOne";
import { PageTwo } from "./pages/PageTwo";
import { PageThree } from "./pages/PageThree";
import { PageFour } from "./pages/PageFour";
import { ScheduleEvent } from "./pages/ScheduleEvent";
import { AuthPage } from "./pages/AuthPage";
import { useAuth } from "./hooks/useAuth";
import { Authentication } from "./components/Authentication";
import { Routes, Route, NavLink } from "react-router";
import { Calendar } from "./pages/Calendar";
import React from "react"; // Ensure React is imported
import { Announcements } from "./pages/Announcements"; // Ensure this import is correct
import { Attendance } from "./pages/Attendance";
import { Users } from "./pages/Users";
import { Tasks } from "./pages/Tasks";
import { Polls } from "./pages/Polls";

function styleLink({ isActive }) {
  // clean, focused active/inactive styles for nav links
  return [
    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
    isActive
      ? "bg-white text-blue-700 border border-blue-200 shadow-sm"
      : "text-white hover:bg-white/10 hover:text-white/90",
  ].join(" ");
}

function NavBar({ isAdmin, onMenuToggle }) {
  return (
    <div className="sticky top-0 z-10 flex items-center bg-blue-600 px-4 py-3 text-white shadow-md">
      <button
        className="mr-4 flex h-10 w-10 items-center justify-center rounded-md bg-blue-500 hover:bg-blue-700 md:hidden"
        onClick={onMenuToggle}
      >
        <span className="text-2xl">☰</span>
      </button>
      <div className="flex items-center">
        <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
          <img
            src="/logo.png"
            alt="UN Logo"
            className="h-12 w-12 object-contain"
          />
        </div>
        <NavLink to={"/"} className="text-xl font-bold tracking-wide">
          Model UN Helper
        </NavLink>
      </div>
      <div className="ml-8 hidden space-x-2 md:flex">
        <NavLink className={styleLink} to={"/"}>
          Home
        </NavLink>
        <NavLink className={styleLink} to="/calendar">
          Calendar
        </NavLink>

        <NavLink className={styleLink} to="/scheduleevent">
          {isAdmin ? "Events" : "Events"}
        </NavLink>

        <NavLink className={styleLink} to="/announcements">
          Announcements
        </NavLink>

        <NavLink className={styleLink} to="/polls">
          Polls
        </NavLink>

        <NavLink className={styleLink} to="/tasks">
          Tasks
        </NavLink>

        {isAdmin ? (
          <NavLink className={styleLink} to="/attendance">
            Attendance
          </NavLink>
        ) : null}
        {isAdmin ? (
          <NavLink className={styleLink} to="/users">
            Users
          </NavLink>
        ) : null}
      </div>
      <Authentication className="ml-auto hidden items-center gap-2 md:flex" />
    </div>
  );
}

function Sidebar({ isOpen, onClose, isAdmin }) {
  return (
    <div
      className={`bg-opacity-50 fixed inset-0 z-20 bg-black transition-opacity ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white p-4 shadow-lg transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="mb-4 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          Close
        </button>
        <nav className="space-y-4">
          <NavLink className="block text-blue-600 hover:underline" to={"/"}>
            Home
          </NavLink>
          <NavLink
            className="block text-blue-600 hover:underline"
            to={"/calendar"}
          >
            Calendar
          </NavLink>
          {isAdmin ? (
            <NavLink
              className="block text-blue-600 hover:underline"
              to={"/scheduleevent"}
            >
              Schedule Event
            </NavLink>
          ) : null}
          {isAdmin ? (
            <NavLink
              className="block text-blue-600 hover:underline"
              to={"/attendance"}
            >
              Attendance
            </NavLink>
          ) : null}
          <NavLink
            className="block text-blue-600 hover:underline"
            to={"/announcements"}
          >
            Announcements
          </NavLink>
          <NavLink
            className="block text-blue-600 hover:underline"
            to={"/polls"}
          >
            Polls
          </NavLink>
          <NavLink
            className="block text-blue-600 hover:underline"
            to={"/tasks"}
          >
            Tasks
          </NavLink>
          {isAdmin ? (
            <NavLink
              className="block text-blue-600 hover:underline"
              to={"/users"}
            >
              Users
            </NavLink>
          ) : null}
          {isAdmin && (
            <NavLink
              className="block text-blue-600 hover:underline"
              to={"/auth"}
            >
              Auth
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  );
}

function RouteDefinitions({ isAdmin }) {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/page-one" element={<PageOne />} />
      <Route path="/page-two" element={<PageTwo />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/scheduleevent" element={<ScheduleEvent />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/polls" element={<Polls />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/users" element={<Users />} />
      {isAdmin && <Route path="/auth" element={<AuthPage />} />}
    </Routes>
  );
}

export default function App() {
  const { isAdmin, user } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div>
      <NavBar isAdmin={isAdmin} onMenuToggle={toggleSidebar} />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isAdmin={isAdmin}
      />
      <RouteDefinitions isAdmin={isAdmin} />
    </div>
  );
}
