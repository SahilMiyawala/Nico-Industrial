import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";

export default function Home() {
  const navigate = useNavigate();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [allReminders, setAllReminders] = useState([]);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [responseText, setResponseText] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    } else {
      // Fetch pending reminders when component mounts
      fetchPendingReminders();
    }
  }, [navigate]);

  const fetchPendingReminders = async () => {
    try {
      const authToken = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!authToken || !userId) {
        throw new Error("Authentication required");
      }
      const response = await axios.get(`https://nicoindustrial.com/api/reminder/check/${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log("All reminders:", response.data);
      if (response.data.statusCode === 200 && response.data.data.length > 0) {
        setAllReminders(response.data.data);
        const unansweredReminders = response.data.data.filter((reminder) => reminder.reminderAnswer === null);
        console.log("Unanswered reminders:", unansweredReminders);
        if (unansweredReminders.length > 0) {
          setPendingReminders(unansweredReminders);
          setCurrentReminderIndex(0);
          setShowReminderModal(true);
        } else {
          setPendingReminders([]);
          setShowReminderModal(false);
        }
      } else {
        setPendingReminders([]);
        setShowReminderModal(false);
      }
    } catch (error) {
      console.error("Error fetching pending reminders:", error);
      if (error.response && error.response.status === 403) {
        localStorage.clear();
        navigate("/signin");
      }
    }
  };

  const handleReminderResponse = async () => {
    const currentReminder = pendingReminders[currentReminderIndex];

    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }
    setLoadingResponse(true);
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        throw new Error("Authentication required");
      }
      await axios.post(
        `https://nicoindustrial.com/api/reminder/give-response/${currentReminder.inquiryReminderId}`,
        { reminderAnswer: responseText },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      toast.success("Response submitted successfully");
      setShowResponseModal(false);
      setResponseText("");
      const updatedPendingReminders = pendingReminders.filter((_, index) => index !== currentReminderIndex);
      setPendingReminders(updatedPendingReminders);
      if (updatedPendingReminders.length > 0) {
        if (currentReminderIndex >= updatedPendingReminders.length) {
          setCurrentReminderIndex(0);
        }
      } else {
        setShowReminderModal(false);
        setCurrentReminderIndex(0);
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error(error.response?.data?.message || "Failed to submit response");
    } finally {
      setLoadingResponse(false);
    }
  };

  const handleIgnore = () => {
    console.log("Ignored reminder:", pendingReminders[currentReminderIndex]?.inquiryReminderId);

    // Move to next reminder or close modal
    const updatedPendingReminders = pendingReminders.filter((_, index) => index !== currentReminderIndex);
    setPendingReminders(updatedPendingReminders);

    if (updatedPendingReminders.length > 0) {
      if (currentReminderIndex >= updatedPendingReminders.length) {
        setCurrentReminderIndex(0);
      }
    } else {
      setShowReminderModal(false);
      setCurrentReminderIndex(0);
    }
  };

  const handleResponse = () => {
    setShowResponseModal(true);
  };

  const handleNextReminder = () => {
    if (currentReminderIndex < pendingReminders.length - 1) {
      setCurrentReminderIndex(currentReminderIndex + 1);
    }
  };

  const handlePreviousReminder = () => {
    if (currentReminderIndex > 0) {
      setCurrentReminderIndex(currentReminderIndex - 1);
    }
  };

  const currentReminder = pendingReminders[currentReminderIndex];

  return (
    <>
      <PageMeta title="Nico Industrial Solutions" description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template" />

      {/* Reminder Modal */}
      {showReminderModal && pendingReminders.length > 0 && currentReminder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reminder</h2>
              <span className="text-sm text-gray-500">
                {currentReminderIndex + 1} of {pendingReminders.length}
              </span>
            </div>

            <div className="mb-4">
              <p className="font-semibold">Inquiry Name : {currentReminder.projectName}</p>
              <p className="text-gray-600 mt-2">Question : {currentReminder.reminderQuestion}</p>
              <p className="text-sm text-gray-500 mt-2">
                From: {currentReminder.createrName} • {new Date(currentReminder.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Navigation for multiple reminders */}
            {pendingReminders.length > 1 && (
              <div className="flex justify-between mb-4">
                <button onClick={handlePreviousReminder} disabled={currentReminderIndex === 0} className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50">
                  Previous
                </button>
                <button onClick={handleNextReminder} disabled={currentReminderIndex === pendingReminders.length - 1} className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50">
                  Next
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button onClick={handleIgnore} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Ignore
              </button>
              <button onClick={handleResponse} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Respond to Reminder</h2>

            <div className="mb-4">
              <p className="font-semibold mb-2">{currentReminder?.title}</p>
              <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Enter your response..." className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4" />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseText("");
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                disabled={loadingResponse}>
                Cancel
              </button>
              <button onClick={handleReminderResponse} disabled={loadingResponse} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {loadingResponse ? "Submitting..." : "Submit Response"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-12">
          <EcommerceMetrics />
        </div>
      </div>
    </>
  );
}
