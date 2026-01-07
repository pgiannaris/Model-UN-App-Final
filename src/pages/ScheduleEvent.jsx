import React, { useState } from "react";
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
import {
  Calendar,
  Clock,
  CheckCircle,
  X,
  Mail,
  FileText,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  useList,
  useInsert,
  useRemove,
  useRemoveAll,
  usePreload,
} from "../hooks/database";

const DEFAULT_APPOINTMENTS = [];

export function ScheduleEvent() {
  const { user, isAdmin } = useAuth();
  const list = useList("appointments");
  const insert = useInsert("appointments");
  const [dueDate, setDueDate] = useState(new Date());
  const removeAll = useRemoveAll("appointments");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [header, setHeader] = useState("");

  usePreload("appointments", DEFAULT_APPOINTMENTS);

  function handleSubmit(e) {
    e.preventDefault();

    const appointmentData = {
      // store as ISO UTC string for consistency
      date: appointmentDate.toISOString(),
      time,
      duration: parseInt(duration, 10),
      contactEmail: String(contactEmail),
      notes: notes || "",
      header: header || "Generic Appointment",
    };

    console.log("Saving appointment with data:", appointmentData);

    insert.call(appointmentData);

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);

    setTime("");
    setDuration("");
    setContactEmail("");
    setNotes("");
    setHeader("");
  }

  function clearAllAppointments() {
    removeAll.call(list);
  }

  const sortedAppointments = list.data?.sort((b, a) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.toDateString() === dateB.toDateString()) {
      return a.time.localeCompare(b.time);
    }
    return dateA - dateB;
  });

  const appointmentsByDate = sortedAppointments?.reduce(
    (groups, appointment) => {
      const date = new Date(appointment.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "America/Los_Angeles",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(appointment);
      return groups;
    },
    {},
  );

  if (list.isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Banner title="Event Calendar" description="calendar" />
      <div className="mx-20 my-8">
        {/* Top section: Add appointment form */}
        {isAdmin && (
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-semibold">Schedule New Event</h2>

            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              <div>
                <Label htmlFor="date" value="Date" />
                <Datepicker
                  id="date"
                  value={dueDate}
                  required
                  onChange={setAppointmentDate}
                  showFooter={false}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <Label htmlFor="header" value="Header" />
                <Textarea
                  id="header"
                  placeholder="Header"
                  rows={2}
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="time" value="Time (PST)" />
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                  </div>
                  <TextInput
                    id="time"
                    type="time"
                    required
                    className="pl-10"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration" value="Duration (minutes)" />
                <TextInput
                  id="duration"
                  required
                  placeholder="Duration (minutes)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contactEmail" value="Contact Email" />
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <TextInput
                    id="contactEmail"
                    type="email"
                    placeholder="contact@example.com"
                    className="pl-10"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <Label htmlFor="notes" value="Notes" />
                <Textarea
                  id="notes"
                  placeholder="Any additional details..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <Button
                  type="submit"
                  disabled={insert.isLoading}
                  className="w-full cursor-pointer md:w-auto"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule Event
                  {insert.isLoading && <Spinner className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Bottom section: Appointments list */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Events</h2>
            {isAdmin && (
              <Button
                color="failure"
                size="xs"
                className="cursor-pointer"
                onClick={clearAllAppointments}
                disabled={removeAll.isLoading}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {appointmentsByDate ? (
              Object.keys(appointmentsByDate).length > 0 ? (
                Object.entries(appointmentsByDate).map(
                  ([date, appointments]) => (
                    <div key={date} className="mb-4">
                      <h3 className="flex items-center rounded bg-gray-100 p-2 font-medium text-gray-700">
                        <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                        {date} (PST)
                      </h3>
                      <div className="mt-2 grid gap-2">
                        {appointments.map((appointment) => (
                          <AppointmentItem
                            key={appointment.id}
                            appointment={appointment}
                            isAdmin={isAdmin}
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No events scheduled. Add one to get started!
                </div>
              )
            ) : (
              <Spinner />
            )}
          </div>
        </Card>
      </div>

      {showSuccessToast && (
        <div className="fixed right-4 bottom-4">
          <Toast>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm font-normal">
              Event scheduled successfully!
            </div>
            <ToastToggle onClick={() => setShowSuccessToast(false)} />
          </Toast>
        </div>
      )}
    </div>
  );
}

function AppointmentItem({ appointment, isAdmin }) {
  const { id, date, time, duration, contactEmail, notes, header } = appointment;
  const remove = useRemove("appointments");

  function deleteAppointment() {
    remove.call(id);
  }

  // Format a time string in PST
  const formatTimePST = (timeString) => {
    const [h, m] = timeString.split(":");
    const d = new Date();
    d.setHours(parseInt(h, 10));
    d.setMinutes(parseInt(m, 10));
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Los_Angeles",
    });
  };

  // Calculate end time in PST
  const calculateEndTimePST = (startTime, durationMinutes) => {
    const [h, m] = startTime.split(":");
    const start = new Date();
    start.setHours(parseInt(h, 10));
    start.setMinutes(parseInt(m, 10));
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Los_Angeles",
    });
  };

  const isToday =
    new Date(date).toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
    }) ===
    new Date().toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
    });

  return (
    <Card className="p-3">
      <div className="flex justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="font-medium">{header}</div>
            <div className="flex items-center text-sm text-gray-500">
              {formatTimePST(time)} - {calculateEndTimePST(time, duration)} (
              {duration} mins)
              {isToday && (
                <span className="ml-2 flex items-center font-medium text-blue-600">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Today
                </span>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <Button
            color="failure"
            size="xs"
            className="cursor-pointer"
            onClick={deleteAppointment}
            disabled={remove.isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-1 border-t border-gray-100 pt-3 text-sm">
        {contactEmail && (
          <div className="flex items-center">
            <Mail className="mr-1 h-4 w-4 text-gray-500" />
            <span className="font-medium">
              Email: <span className="font-normal">{contactEmail}</span>
            </span>
          </div>
        )}
        {notes && (
          <div className="flex items-start">
            <FileText className="mt-0.5 mr-1 h-4 w-4 text-gray-500" />
            <span className="font-medium">
              Notes: <span className="font-normal">{notes}</span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
