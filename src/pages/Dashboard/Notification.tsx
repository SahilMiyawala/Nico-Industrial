import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router";

// Define the type for notifications
type NotificationType = {
  notificationId: string;
  message: string;
  readable: boolean;
  userInfo: {
    name: string;
    createdOn: string;
    role: {
      roleName: string;
    };
  };
};

const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationType | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const id = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    }
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        console.log("URL", `https://nicoindustrial.com/api/notification/getNotification/${id}`);

        const response = await axios.get(`https://nicoindustrial.com/api/notification/getNotification/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        console.log("Notifications:", response.data);
        setNotifications(response.data);
        setLoading(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
        setLoading(false);
      }
    };

    if (id && token) {
      fetchNotifications();
    }
  }, [id, token]);

  const openModal = async (notification: NotificationType) => {
  try {
    // First, update the notification on the server
    await axios.put(
      `https://nicoindustrial.com/api/notification/read/${notification.notificationId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Then update the local state
    const updatedNotifications = notifications.map((n) =>
      n.notificationId === notification.notificationId ? { ...n, readable: true } : n
    );
    setNotifications(updatedNotifications);
    setSelectedNotification(notification);
    setShowModal(true);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    // You might want to show an error message to the user here
  }
};

  const closeModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <div className="p-4 text-gray-600">Loading notifications...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      <h2 data-aos="fade-down" className="text-2xl font-bold mb-6 text-gray-500">All Notifications</h2>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications found</p>
      ) : (
        <ul data-aos="fade-down" className=" grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notifications.map((notification) => (
            <li key={notification.notificationId} className={`border border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.readable ? "bg-blue-100 dark:!text-red-500" : ""}`} onClick={() => openModal(notification)}>
              <div className="flex justify-between items-center gap-2 mb-2">
                <h3 className={`font-medium text-gray-900 ${!notification.readable ? "dark:text-black" : "dark:text-gray-500"} `}>{notification.message}</h3>
              </div>
              <div className="flex justify-between">
                <span className={`text-gray-600 px-2 py-1 rounded`}>{formatDate(notification.userInfo.createdOn)}</span>
                <p className={`text-gray-600 px-2 py-1 rounded`}>{notification.userInfo.role.roleName}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center text-center justify-center z-50 p-4">
          <div className="bg-white border border-black rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
            <p className="text-2xl font-semibold mb-4">Notification Details</p>
            <button className="absolute top-3 right-5 text-gray-500 hover:text-gray-700 text-4xl" onClick={closeModal}>
              &times;
            </button>
            <br />

            <h2 className="text-xl font-bold mb-4 text-gray-800">{selectedNotification.message}</h2>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="mb-2">
                <span className="font-semibold">From:</span> {selectedNotification.userInfo.name}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Role:</span> {selectedNotification.userInfo.role.roleName}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Date:</span> {formatDate(selectedNotification.userInfo.createdOn)}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {selectedNotification.readable ? "Mark As Read" : "Mark As Unread"}
              </p>
            </div>

            <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md transition-colors" onClick={closeModal}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
