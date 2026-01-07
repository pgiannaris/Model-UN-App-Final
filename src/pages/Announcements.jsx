import React, { useState } from "react";
import {
  Button,
  Card,
  Label,
  Spinner,
  TextInput,
  Textarea,
  Toast,
  ToastToggle,
} from "flowbite-react";
import {
  Calendar as CalendarIcon,
  X as CloseIcon,
  Trash2 as DeleteIcon,
  CheckCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useList, useInsert, useRemove } from "../hooks/database";
import pb from "../pocketbase"; // Import PocketBase instance directly
import Banner from "../components/Banner";

// utility to generate month days grid
function generateMonth(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let currentWeek = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length) {
    weeks.push([...currentWeek, ...Array(7 - currentWeek.length).fill(null)]);
  }
  return weeks;
}

// parse "YYYY-MM-DD" as local date
function parseDateString(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

// Simple modal component
function Modal({ open, onClose, children }) {
  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-3xl"
      onClick={handleBackdropClick}
    >
      <div className="relative w-[70rem] max-w-full rounded-lg bg-white p-10 shadow-lg">
        {children}
      </div>
    </div>
  );
}

export function Announcements() {
  const { isAdmin } = useAuth();

  const announcementsQuery = useList("announcements");
  const insertAnnouncement = useInsert("announcements");
  const removeAnnouncement = useRemove("announcements");

  const [imageFile, setImageFile] = useState();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [date, setDate] = useState(new Date());
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthGrid = generateMonth(viewYear, viewMonth);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!title) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("date", date.toLocaleDateString("en-CA"));

    if (imageFile) formData.append("image", imageFile);

    try {
      await insertAnnouncement.callAsync(formData);
      setImageFile(null);
      setTitle("");
      setSubtitle("");
      setDate(new Date());
      e.target.reset();

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error("Failed to add announcement:", error);
    }
  };

  const confirmDelete = async () => {
    try {
      await removeAnnouncement.callAsync(toDelete);
      setToDelete(null);
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else setViewMonth(viewMonth + 1);
  };

  const eventsByDay = (announcementsQuery.data || []).reduce((acc, a) => {
    const dObj = parseDateString(a.date);
    if (
      dObj &&
      dObj.getFullYear() === viewYear &&
      dObj.getMonth() === viewMonth
    ) {
      const day = dObj.getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(a.title);
    }
    return acc;
  }, {});

  function formatDateToReadableName(dateStr) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let m = month < 3 ? month + 12 : month;
    let y = month < 3 ? year - 1 : year;
    const q = day;
    const K = y % 100;
    const J = Math.floor(y / 100);
    const h =
      (q +
        Math.floor((13 * (m + 1)) / 5) +
        K +
        Math.floor(K / 4) +
        Math.floor(J / 4) +
        5 * J) %
      7;
    const weekdayNames = [
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ];
    const weekday = weekdayNames[h];

    const suffix = ((d) => {
      if (d >= 11 && d <= 13) return "th";
      switch (d % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    })(day);

    return `${weekday}, ${months[month - 1]} ${day}${suffix}, ${year}`;
  }

  const announcementsByDate = (announcementsQuery.data || [])
    .sort((b, a) => new Date(a.date) - new Date(b.date))
    .reduce((groups, announcement) => {
      const date = formatDateToReadableName(announcement.date);
      if (!groups[date]) groups[date] = [];
      groups[date].push(announcement);
      return groups;
    }, {});

  if (announcementsQuery.isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-0">
      <Banner
        title="Announcements"
        description="Mark, track, and analyze attendance for Model UN meetings and conferences"
      />

      {/* Add Announcement Modal */}
      {isAdmin && (
        <>
          {isAdmin && (
            <div
              onClick={() => setAddModalOpen(true)}
              className="fixed right-6 bottom-6 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white align-middle shadow-lg transition-all duration-300 hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="mb-2 flex align-middle text-4xl font-bold text-blue-600">
                +
              </span>
            </div>
          )}
          <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
            <h2 className="mb-4 text-xl font-bold">Add New Announcement</h2>
            <form
              onSubmit={(e) => {
                handleAddAnnouncement(e);
                setAddModalOpen(false);
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              <div>
                <Label htmlFor="title" value="Title" />
                <TextInput
                  id="title"
                  placeholder="Announcement Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="image" value="Image" />
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <ImageIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <TextInput
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="subtitle" value="Subtitle / Caption" />
                <Textarea
                  id="subtitle"
                  placeholder="Add a short description or additional details..."
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 md:col-span-2">
                <Button
                  className="cursor-pointer"
                  type="button"
                  color="gray"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="cursor-pointer"
                  type="submit"
                  disabled={insertAnnouncement.isPending}
                >
                  {insertAnnouncement.isPending
                    ? "Adding..."
                    : "Add Announcement"}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {/* Announcements List */}
      <Card className="h-full border-none shadow-none">
        {Object.keys(announcementsByDate).length > 0 ? (
          Object.entries(announcementsByDate).map(([date, announcements]) => (
            <div key={date} className="mb-6 last:mb-0">
              <h3 className="mb-3 flex items-center rounded bg-gray-100 p-2 font-medium text-gray-700">
                <CalendarIcon className="mr-2 h-5 w-5 text-blue-500" />
                {date}
              </h3>
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <AnnouncementItem
                    key={announcement.id}
                    announcement={announcement}
                    isAdmin={isAdmin}
                    onDelete={() => setToDelete(announcement.id)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            No announcements posted yet.{" "}
            {isAdmin
              ? "Add one above to get started."
              : "Check back soon for updates!"}
          </div>
        )}
      </Card>

      {/* Delete confirmation modal */}
      <Modal open={toDelete !== null} onClose={() => setToDelete(null)}>
        <h2 className="mb-4 text-lg font-bold">
          Confirm <span className="text-red-600">Deletion</span>
        </h2>
        <p className="mb-4">
          Are you sure you want to delete this announcement? This action cannot
          be undone.
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            className="cursor-pointer"
            color="gray"
            onClick={() => setToDelete(null)}
            disabled={removeAnnouncement.isPending}
          >
            Cancel
          </Button>
          <Button
            color="failure"
            className="cursor-pointer"
            onClick={confirmDelete}
            disabled={removeAnnouncement.isPending}
          >
            {removeAnnouncement.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed right-4 bottom-4">
          <Toast>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm font-normal">
              Announcement added successfully!
            </div>
            <ToastToggle onClick={() => setShowSuccessToast(false)} />
          </Toast>
        </div>
      )}
    </div>
  );
}

// Single announcement item
function AnnouncementItem({ announcement, isAdmin, onDelete }) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { title, subtitle, date } = announcement;

  const hasImage = !!announcement?.image;
  const imageUrl = hasImage
    ? pb.getFileUrl(announcement, announcement.image)
    : null;

  return (
    <>
      <div
        className="group flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50"
        onClick={() => setIsDetailModalOpen(true)}
      >
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-gray-800 group-hover:text-blue-600">
            {title}
          </h3>
          {subtitle && (
            <p className="line-clamp-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        <div className="ml-4 flex items-center gap-2">
          {hasImage && (
            <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
          )}
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="cursor-pointer rounded-full p-2 text-gray-400 hover:bg-red-100 hover:text-red-500"
            >
              <DeleteIcon size={18} />
            </button>
          )}
        </div>
      </div>

      <Modal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      >
        <div className="relative max-h-[80vh] overflow-y-auto">
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="absolute top-0 right-2 z-10 cursor-pointer rounded-full bg-white p-2 text-gray-500 shadow-md hover:bg-gray-100 hover:text-red-500"
          >
            <X size={20} />
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                onDelete();
              }}
              className="absolute top-12 right-2 z-10 cursor-pointer rounded-full bg-white p-2 text-gray-500 shadow-md hover:bg-gray-100 hover:text-red-500"
            >
              <DeleteIcon size={20} />
            </button>
          )}

          {hasImage && (
            <img
              src={imageUrl}
              alt={title}
              className="mr-auto mb-4 ml-auto w-full max-w-sm rounded-lg object-cover"
              onError={(e) => {
                e.target.src = "/placeholder-image.jpg";
                e.target.alt = "Image unavailable";
              }}
            />
          )}

          <h2 className="mb-2 text-2xl font-bold text-gray-800">{title}</h2>
          <p className="mb-4 text-sm text-gray-500">{date}</p>
          {subtitle && (
            <p className="whitespace-pre-wrap text-gray-700">{subtitle}</p>
          )}
        </div>
      </Modal>
    </>
  );
}
