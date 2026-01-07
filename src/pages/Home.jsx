import { useState, useEffect } from "react";
import { Authentication } from "../components/Authentication";
import { LoginModal } from "../components/LoginModal";
import { useList } from "../hooks/database";
import { SignupModal } from "../components/SignupModal";
import pb from "../pocketbase";
import { Routes, Route, NavLink } from "react-router";
import { Spinner } from "flowbite-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "flowbite-react";

export function Home() {
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const { user, isAdmin } = useAuth();
  const [countdown, setCountdown] = useState({
    days: 28,
    hours: 14,
    minutes: 36,
    seconds: 52,
  });
  const announcementsQuery = useList("announcements");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0)
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0)
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0)
          return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resources = [
    {
      id: 2,
      icon: "📝",
      link: "https://docs.google.com/presentation/d/1RvaKEI6NiGSLOUdxm11hNZoo5VRW7J_Yq2Iy4UlTzHE/edit?slide=id.p#slide=id.p",
      title: "Conference Procedures",
    },
    {
      id: 3,
      icon: "📄",
      link: "https://drive.google.com/drive/folders/1fHHenLuhYIObwkzWv6hxBqn469P2FbgC?usp=drive_link",
      title: "Position Paper Templates",
    },
    {
      id: 4,
      icon: "🤝",
      link: "https://drive.google.com/file/d/1seczFqZvBqdoRZcG_nP_7eWPtnpuOUPc/view?usp=drive_link",
      title: "Resolution Guide",
    },
  ];

  let features = [];

  if (isAdmin === true) {
    features = [
      {
        id: 1,
        icon: "🏠",
        title: "Home",
        description: "Return to the main dashboard.",
        link: "/",
      },
      {
        id: 2,
        icon: "📅",
        title: "Calendar",
        description:
          "Keep track of upcoming conferences, meetings, and deadlines with our interactive calendar.",
        link: "/calendar",
      },
      {
        id: 3,
        icon: "🕓",
        title: "Events",
        description:
          "Schedule events for all students to see. Easily manage and organize your conferences.",
        link: "/scheduleevent",
      },
      {
        id: 4,
        icon: "📢",
        title: "Announcements",
        description:
          "Stay updated with the latest news, updates, and important information.",
        link: "/announcements",
      },
      {
        id: 5,
        icon: "✓",
        title: "Attendance",
        description:
          "Track participation and attendance for all committee sessions and meetings.",
        link: "/attendance",
      },
      {
        id: 6,
        icon: "👥",
        title: "Users",
        description: "Manage users and their roles.",
        link: "/users",
      },
    ];
  } else {
    features = [
      {
        id: 1,
        icon: "📅",
        title: "Calendar",
        description:
          "Keep track of upcoming conferences, meetings, and deadlines with our interactive calendar.",
        link: "/calendar",
      },
      {
        id: 2,
        icon: "🕓",
        title: "Events",
        description:
          "Schedule events for all students to see. Easily manage and organize your conferences.",
        link: "/scheduleevent",
      },
      {
        id: 3,
        icon: "📢",
        title: "Announcements",
        description:
          "Stay updated with the latest news, updates, and important information.",
        link: "/announcements",
      },
    ];
  }

  const formattedAnnouncements = (announcementsQuery.data || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)
    .map((a) => {
      const d = new Date(a.date);
      d.setDate(d.getDate() + 1); // Shift date forward by 1 day

      return {
        id: a.id,
        month: d.toLocaleString("en-US", { month: "short" }),
        day: d.getDate(),
        title: a.title,
        content: a.subtitle || "Click to view more details",
        imageUrl: pb.getFileUrl(a, a.image),
      };
    });

  return (
    <div
      className={`${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-black"} min-h-screen`}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 py-16 text-center text-white">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-4xl font-bold">
            Welcome to the Model UN Helper
          </h2>
          <p className="text-md mx-auto mb-8 max-w-2xl">
            Your comprehensive platform for organizing and participating in
            Model United Nations conferences. Access resources, track
            attendance, vote on resolutions, and stay updated with
            announcements.
          </p>
          <div className="mb-6 flex justify-center gap-2">
            {!user && <SignupModal size="xl" />}{" "}
            {!user && <LoginModal size="xl" />}
            {user && (
              <Button
                size="xl"
                color="blue"
                href="#features"
                className="me-2 mb-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-gradient-to-br focus:ring-4 focus:ring-blue-300"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className={`container mx-auto w-full px-4 py-16`} id="features">
        <div
          className={`grid gap-8 ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}
        >
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`flex flex-col items-center rounded-xl p-6 text-center shadow-xl transition hover:-translate-y-2 ${
                isDarkMode ? "bg-gray-700" : "bg-white"
              }`}
            >
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                  isDarkMode
                    ? "bg-gray-600 text-gray-100"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {feature.icon}
              </div>
              <h3
                className={`mb-2 text-xl font-semibold ${
                  isDarkMode ? "text-gray-100" : "text-blue-800"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`mb-4 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {feature.description}
              </p>
              <NavLink
                to={feature.link}
                className={`mt-auto rounded-lg px-4 py-2 text-white transition hover:opacity-90 ${
                  isDarkMode ? "bg-gray-600" : "bg-blue-600"
                }`}
              >
                View {feature.title}
              </NavLink>
            </div>
          ))}
        </div>
      </section>
      <section className={`${isDarkMode ? "bg-gray-800" : "bg-blue-50"} py-16`}>
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2
              className={`${isDarkMode ? "text-gray-100" : "text-blue-800"} mb-2 text-3xl font-bold`}
            >
              Latest Announcements
            </h2>
            <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Stay informed with the most recent updates
            </p>
          </div>
          {announcementsQuery.isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner size="xl" />
            </div>
          ) : formattedAnnouncements.length > 0 ? (
            formattedAnnouncements.map((a) => (
              <div
                key={a.id}
                className={`${isDarkMode ? "bg-gray-700" : "bg-white"} mb-6 flex overflow-hidden rounded-lg shadow-md`}
              >
                <div
                  className={`${isDarkMode ? "bg-gray-600 text-gray-100" : "bg-blue-600 text-white"} flex min-w-20 flex-col items-center justify-center p-4 text-center`}
                >
                  <span className="text-sm uppercase">{a.month}</span>
                  <span className="text-2xl font-bold">{a.day}</span>
                </div>
                <div className="flex flex-1 flex-col justify-center p-4">
                  <h3
                    className={`${isDarkMode ? "text-gray-100" : "text-blue-800"} mb-2 text-xl font-semibold`}
                  >
                    {a.title}
                  </h3>
                  <p
                    className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-4`}
                  >
                    {a.content}
                  </p>
                  <NavLink
                    to={`/announcements#ann${a.id}`}
                    className={`${isDarkMode ? "border-gray-300 text-gray-100 hover:bg-gray-600" : "border-blue-600 text-blue-600 hover:bg-blue-50"} hover:bg-opacity-20 w-fit rounded-lg border-2 px-4 py-1 transition`}
                  >
                    Read More
                  </NavLink>
                </div>
              </div>
            ))
          ) : (
            <div
              className={`${isDarkMode ? "bg-gray-700" : "bg-white"} rounded-lg p-6 text-center shadow-md`}
            >
              <p
                className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                No announcements available yet. Check back soon!
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <NavLink
              to="/announcements"
              className={`${isDarkMode ? "text-gray-100" : "text-blue-800"} font-medium hover:underline`}
            >
              View All Announcements →
            </NavLink>
          </div>
        </div>
      </section>
      {/* Resources Section */}

      {/* Dark Mode Toggle (bottom) */}

      {/* Footer */}
      <footer className="bg-blue-800 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="border-t border-blue-700 pt-6 text-center">
            <p className="text-blue-200">
              <b> &copy; {new Date().getFullYear()} All Rights Reserved</b>,
              Panos Giannaris, Yuisho Kawane, Sitar Eswar, Chris Tam
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
