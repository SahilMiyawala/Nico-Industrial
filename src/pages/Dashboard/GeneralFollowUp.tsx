import type React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaPenAlt, FaPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { MdDelete, MdOutlineNavigateNext } from "react-icons/md";
import { useNavigate } from "react-router";

interface User {
  id: number;
  name: string;
}

interface FollowUp {
  generalFollowUpId: number;
  generalFollowUpName: string;
  description: string;
  status: string;
  statusNotes: string;
  dueDate: Date;
  followUpPerson: { id: number; name: string };
  createdBy: { name: string };
  createdAt: { name: string };
  updatedBy: { name: string } | null;
}

interface FollowUpSubmitData {
  generalFollowUpName: string;
  followUpPerson: { id: number };
  description: string;
  status: string;
  statusNotes: string;
  dueDate: Date;
  createdBy: { id: string | null };
  updatedBy?: { id: string | null };
}

const FollowUpTable = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const currentUserId = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName");
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    }
  });

  const [formData, setFormData] = useState({
    followUpName: "",
    followUpPerson: "",
    description: "",
    status: "PENDING",
    statusNotes: "",
    dueDate: "",
    dueTime: "",
  });

  useEffect(() => {
    fetchFollowUps();
  }, [search]);

  const fetchFollowUps = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const response = await axios.get(`https://nicoindustrial.com/api/generalFollowUp/getall?userId=${userId}`, {
        params: { search: search },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.data?.list) {
        setFollowUps(response.data.data.list);
      }
    } catch (error) {
      console.error("Failed to fetch follow-ups", error);
    }
  };

  const fetchUsers = async (search = "") => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`https://nicoindustrial.com/api/user/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      if (response.data?.data?.list) {
        const usersList = response.data.data.list;
        setUsers(usersList);
        setFilteredUsers(usersList);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (userSearch) {
      const filtered = users.filter((user) => user.name.toLowerCase().includes(userSearch.toLowerCase()));
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [userSearch, users]);

  const totalPages = Math.ceil(followUps.length / itemsPerPage);
  const paginated = followUps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    return formData.followUpName.trim() !== "" && formData.followUpPerson !== "" && formData.dueDate !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!validateForm()) {
      toast.error("Please fill in all required fields.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
      return;
    }

    // Create Date object from input
    const dueDate = new Date(formData.dueDate);

    // Convert to ISO string (UTC) and remove the 'Z' to indicate local time should be preserved
    // const isoString = dueDate.toISOString();

    dueDate.setMinutes(dueDate.getMinutes() - dueDate.getTimezoneOffset());

    const dataToSubmit: FollowUpSubmitData = {
      generalFollowUpName: formData.followUpName,
      followUpPerson: { id: Number.parseInt(formData.followUpPerson) },
      description: formData.description,
      status: isEditing ? formData.status : "PENDING",
      statusNotes: formData.statusNotes,
      dueDate: dueDate, // Send as Date object with correct time
      createdBy: { id: userId },
    };
    console.log(dataToSubmit.dueDate);
    console.log("Input value:", formData.dueDate);
    // const dueDate = new Date(formData.dueDate);
    console.log("Date object:", dueDate);
    console.log("ISO string:", dueDate.toISOString());

    if (isEditing && editingFollowUpId) {
      dataToSubmit.updatedBy = { id: userId };
    }

    try {
      let response;
      if (isEditing && editingFollowUpId) {
        response = await axios.put(`https://nicoindustrial.com/api/generalFollowUp/update/${editingFollowUpId}`, dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        console.log(dataToSubmit);

        response = await axios.post("https://nicoindustrial.com/api/generalFollowUp/save", dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(response.data.message || "Follow-up saved successfully!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
      });

      fetchFollowUps();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      const errorMessage = (error as any).response?.data?.message || "An error occurred while saving the follow-up.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
    }
  };

  const resetForm = () => {
    setFormData({
      followUpName: "",
      followUpPerson: "",
      description: "",
      status: "",
      statusNotes: "",
      dueDate: "",
      dueTime: "",
    });
    setIsEditing(false);
    setEditingFollowUpId(null);
    setUserSearch("");
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this follow-up?")) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(`https://nicoindustrial.com/api/generalFollowUp/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Follow-up deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
        fetchFollowUps();
      } catch (error) {
        console.error("Failed to delete follow-up", error);
      }
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  return (
    <div className="p-4 dark:text-white">
      <ToastContainer />
      <div data-aos="fade-up" className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search General FollowUps..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-black p-2 rounded-md w-full max-w-xs"
        />
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <FaPlus />
          Create Follow-Up
        </button>
      </div>

      <table data-aos="fade-up" className="w-full">
        <thead className="bg-[#38487c] border border-gray-500 text-white dark:text-white dark:bg-black">
          <tr className="text-center">
            <th className="px-3 py-2">Sr No</th>
            <th className="px-3 py-2">GeneralFollowUp Name</th>
            <th className="px-3 py-2">Created By</th>
            <th className="px-3 py-2">Due Date</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2">Updated By</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.length ? (
            paginated.map((item, index) => (
              <tr className="text-center transform duration-200 hover:bg-gray-200 dark:hover:bg-gray-800 bg-white dark:text-white dark:bg-black" key={item.generalFollowUpId}>
                <td className="px-3 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-3 py-2">{item.generalFollowUpName}</td>
                <td className="px-3 py-2">{item.createdBy?.name}</td>
                <td className="px-3 py-2">
                  {new Date(item.dueDate).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                  })}
                </td>
                <td className="px-3 py-2">{item.description}</td>
                <td className="px-3 py-2">{item.updatedBy?.name || "—"}</td>
                <td className="px-3 py-2 space-x-2">
                  <button
                    onClick={() => {
                      const fetchFollowUpForEdit = async (id: number) => {
                        try {
                          const token = localStorage.getItem("token");
                          const response = await axios.get(`https://nicoindustrial.com/api/generalFollowUp/get/${id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });

                          const data = response.data.data;
                          if (data) {
                            const dueDate = new Date(data.dueDate);

                            // Convert UTC date to local time for the input
                            const localDateTime = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

                            setFormData({
                              followUpName: data.generalFollowUpName || "",
                              followUpPerson: data.followUpPerson?.id?.toString() || "",
                              description: data.description || "",
                              status: data.status || "",
                              statusNotes: data.statusNotes || "",
                              dueDate: localDateTime,
                              dueTime: "",
                            });
                            setIsEditing(true);
                            setEditingFollowUpId(id);
                            setIsModalOpen(true);
                          }
                        } catch (error) {
                          console.error("Failed to fetch follow-up for editing", error);
                          toast.error("Failed to load follow-up data for editing", {
                            position: "top-right",
                            autoClose: 3000,
                          });
                        }
                      };

                      fetchFollowUpForEdit(item.generalFollowUpId);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xl">
                    <FaPenAlt />
                  </button>
                  <button onClick={() => handleDelete(item.generalFollowUpId)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xl">
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center p-4">
                No Follow-Ups found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div data-aos="fade-up" className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, followUps.length)} of {followUps.length} results
        </p>
        <div className="flex gap-2">
          <button onClick={() => goToPage(currentPage - 1)} className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white" disabled={currentPage === 1}>
            <MdOutlineNavigateNext className="text-2xl rotate-180" />
            Previous
          </button>
          {[...Array(totalPages).keys()].slice(0, 3).map((_, i) => (
            <button key={i + 1} onClick={() => goToPage(i + 1)} className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>
              {i + 1}
            </button>
          ))}
          {totalPages > 4 && <span className="px-2 py-1">...</span>}
          {totalPages > 3 && (
            <button onClick={() => goToPage(totalPages)} className="px-3 py-1 border rounded hover:bg-gray-100">
              {totalPages}
            </button>
          )}
          <button onClick={() => goToPage(currentPage + 1)} className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white" disabled={currentPage === totalPages}>
            Next
            <MdOutlineNavigateNext className="text-2xl" />
          </button>
        </div>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            goToPage(1);
          }}
          className="border border-black p-1 rounded dark:border-white dark:bg-black dark:text-white">
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#00000071] bg-opacity-50 backdrop-blur-xs flex justify-center items-center z-50 overflow-y-auto py-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white p-6 rounded-md w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit Follow-Up" : "Create Follow-Up"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium">Follow-Up Name *</label>
                <input type="text" name="followUpName" value={formData.followUpName} onChange={handleInputChange} className="border p-2 rounded-md w-full" required />
              </div>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium">Follow-Up Person *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.followUpPerson === currentUserId ? "Myself" : users.find((u) => u.id.toString() === formData.followUpPerson)?.name || ""}
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    readOnly
                    className="border p-2 rounded-md w-full cursor-pointer"
                    placeholder="Select person"
                  />
                  {isUserDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="p-2 border-b">
                        <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full p-2 border rounded" autoFocus />
                      </div>
                      <div className="py-1">
                        <div
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${formData.followUpPerson === currentUserId ? "bg-blue-100" : ""}`}
                          onClick={() => {
                            setFormData({ ...formData, followUpPerson: currentUserId || "" });
                            setIsUserDropdownOpen(false);
                          }}>
                          Myself
                        </div>
                        {filteredUsers
                          .filter((user) => user.id.toString() !== currentUserId) // Exclude current user from the list
                          .map((user) => (
                            <div
                              key={user.id}
                              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${formData.followUpPerson === user.id.toString() ? "bg-blue-100" : ""}`}
                              onClick={() => {
                                setFormData({ ...formData, followUpPerson: user.id.toString() });
                                setIsUserDropdownOpen(false);
                              }}>
                              {user.name}
                            </div>
                          ))}
                        {filteredUsers.length === 0 && <div className="px-4 py-2 text-gray-500">No users found</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="border p-2 rounded-md w-full" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Status</label>
                {isEditing ? (
                  // <select name="status" value={formData.status} onChange={handleSelectChange} className="border p-2 rounded-md w-full">
                  //   <option value="PENDING">Pending</option>
                  //   <option value="COMPLETED">Done</option>
                  //   <option value="MODIFY">Modify</option>
                  // </select>
                  <input type="text" value="MODIFY" readOnly className="border p-2 rounded-md w-full bg-gray-100" />
                ) : (
                  <input type="text" value="PENDING" readOnly className="border p-2 rounded-md w-full bg-gray-100" />
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Status Notes</label>
                <textarea name="statusNotes" value={formData.statusNotes} onChange={handleInputChange} className="border p-2 rounded-md w-full" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Due Date *</label>
                <input type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="border p-2 rounded-md w-full" required />{" "}
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpTable;
