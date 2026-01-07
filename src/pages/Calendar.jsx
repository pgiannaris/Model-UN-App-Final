import React, { useState } from "react";
import {
  Card,
  Button,
  Badge,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "flowbite-react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useList } from "../hooks/database";
import Banner from "../components/Banner";

export function Calendar() {
  const { user, isAdmin } = useAuth();
  // console.log(user)
  const appointmentsList = useList("appointments");
  const taskList = useList("tasks");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  if (appointmentsList.isLoading) return <Spinner className="m-8" />;

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const getItemsForDate = (date) => {
    // Convert the input date to a string in the format "YYYY-MM-DD"
    const targetDateStr = date.toISOString().split("T")[0];

    // Get the appointments list, defaulting to an empty array if none exist
    let allAppointments = appointmentsList.data ?? [];

    // Example tasks array (replace this with your actual tasks variable if needed)
    const tasks = taskList.data ?? [];
    let userTasks = [];
    // Only include tasks where the first email matches the user email
    if (user) {
      userTasks = tasks.filter((task) => task.emails?.[0] === user.email);
    }

    const formattedTasks = userTasks.map((task) => {
      const dateObj = new Date(task.dueDate);
      const time = dateObj.toTimeString().split(" ")[0].slice(0, 5); // HH:MM
      return {
        collectionId: task.collectionId,
        collectionName: task.collectionName,
        contactEmail: task.emails?.[0] || "",
        date: task.dueDate, // can add full ISO if you want
        duration: 120, // default duration
        header: task.title,
        color: "orange",
        id: task.id,
        notes: task.description || "",
        time: time,
      };
    });

    // Combine appointments and filtered tasks into a single list
    allAppointments = [...allAppointments, ...formattedTasks];

    // Filter the combined list to only include items matching the target date
    const eventsForDate = allAppointments.filter((item) => {
      const itemDateStr = new Date(item.date || item.dueDate)
        .toISOString()
        .split("T")[0];
      return itemDateStr === targetDateStr;
    });

    return eventsForDate;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedItems(getItemsForDate(date));
    setShowModal(true);
  };

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  const goToToday = () => setCurrentDate(new Date());

  const renderCalendar = () => {
    const days = [];

    // Empty days before first day
    for (let i = 0; i < firstDayOfMonth; i++)
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200 p-1" />,
      );

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      const items = getItemsForDate(date);

      const isToday =
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`h-24 cursor-pointer border border-gray-200 p-1 ${isToday && !items[0]?.color === "orange" ? "bg-blue-50" : ""} ${isToday && items[0]?.color === "orange" ? "bg-orange-50" : ""}`}
          onClick={() => handleDateClick(date)}
        >
          <div className="mb-1 flex justify-between">
            <span
              className={`text-sm font-medium ${isToday ? "text-blue-600" : ""}`}
            >
              {day}
            </span>
            {items.length > 0 && (
              <Badge
                color={items[0]?.color === "orange" ? "red" : "blue"}
                className="text-xs"
              >
                {items.length}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            {items.slice(0, 2).map((apt, idx) => (
              <div
                key={idx}
                className={`truncate rounded px-1 py-0.5 text-xs ${
                  apt.color === "orange"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {apt.header}
              </div>
            ))}
            {items.length > 2 && (
              <div className="text-xs text-gray-500">
                +{items.length - 2} more
              </div>
            )}
          </div>
        </div>,
      );
    }

    return days;
  };

  return (
    <div className="mx-auto">
      <Banner title="Calendar" description="View appointments" />

      <Card className="">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button onClick={prevMonth} size="sm" color="light">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <Button onClick={nextMonth} size="sm" color="light">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button onClick={goToToday} size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" /> Today
          </Button>
        </div>

        <div>
          <div className="mb-1 grid grid-cols-7">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-gray-50 py-2 text-center font-medium"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">{renderCalendar()}</div>
        </div>
      </Card>

      <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader>
          {selectedDate?.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </ModalHeader>
        <ModalBody>
          {selectedItems.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No appointments scheduled for this day.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedItems.map((apt, idx) => (
                <Card key={idx} className="p-3">
                  <div className="font-medium">{apt.header}</div>
                  <div className="text-sm text-gray-500">
                    {apt.time} - {apt.duration} mins
                  </div>
                  {apt.contactEmail && (
                    <div className="text-sm text-gray-500">
                      Email: {apt.contactEmail}
                    </div>
                  )}
                  {apt.notes && (
                    <div className="text-sm text-gray-500">
                      Notes: {apt.notes}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setShowModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
