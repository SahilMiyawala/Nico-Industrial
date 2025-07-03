import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPenAlt, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { MdDelete, MdOutlineNavigateNext } from "react-icons/md";
import { useNavigate } from "react-router";

const Users = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    mobile: "",
    role: "",
  });
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    }
  })

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    mobile: "",
    role: "",
  });

  const token = localStorage.getItem("token");

  const validateField = (name: string, value: string) => {
    let error = "";

    if (!value) {
      error = "This field is required";
    } else {
      switch (name) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = "Invalid email format";
          }
          break;
        case "mobile":
          if (!/^\d{10}$/.test(value)) {
            error = "Mobile number must be 10 digits";
          }
          break;
        case "password":
          if (!isEditing && value.length < 3) {
            error = "Password must be at least 3 characters";
          }
          break;
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    let isValid = true;
    setLoading(false)
    // Validate all required fields
    isValid = validateField("name", newUser.name) && isValid;
    isValid = validateField("email", newUser.email) && isValid;
    isValid = validateField("designation", newUser.designation) && isValid;
    isValid = validateField("role", newUser.role) && isValid;

    // Mobile is optional but if provided, must be valid
    if (newUser.mobile) {
      isValid = validateField("mobile", newUser.mobile) && isValid;
    }

    // Password required only for new users
    if (!isEditing) {
      isValid = validateField("password", newUser.password) && isValid;
    }

    return isValid;
  };

  const fetchUsers = async (page: number, size: number, searchQuery: string = "") => {
    try {
      const res = await axios.get(`https://nicoindustrial.com/api/user/list`, {
        params: {
          page: page,
          size: size,
          search: searchQuery,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userList = res.data?.data?.list || [];
      const totalRecords = res.data?.data?.totalRecords || 0;
      const totalPages = res.data?.data?.totalPages || 1;

      const formattedUsers = userList.map((user: any) => ({
        id: user.id,
        backendId: user.Id || user.userId,
        username: user.name,
        email: user.email,
        designation: user.designation,
        mobile: user.mobileNo,
        role: user.role?.name,
        status: user.status,
      }));

      setUsers(formattedUsers);
      setTotalRecords(totalRecords);
      setTotalPages(totalPages);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    }
  };
  const fetchRoles = async () => {
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/roles/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rolesData = response.data?.data?.roles || response.data?.data?.list || [];
      const rolesArray = rolesData.map((role: any) => ({
        id: role.Id || role.id,
        name: role.name.trim(),
      }));
      setRoles(rolesArray);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      toast.error("Error fetching roles", { position: "top-right", autoClose: 3000 });
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers(currentPage, itemsPerPage, search);
      fetchRoles();
    }
  }, [token, currentPage, itemsPerPage, search]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const toggleStatus = async (userId: number, currentStatus: boolean) => {
    console.log(currentStatus);
    
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        toast.error("User not found");
        return;
      }
      const response = await axios.put(`https://nicoindustrial.com/api/user/active/${user.backendId || user.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchUsers(currentPage, itemsPerPage, search);
      toast.success(response.data.message);
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Failed to toggle status");
    }
  };

  const handleModalOpen = async (user?: any) => {
    if (user) {
      try {
        const response = await axios.get(`https://nicoindustrial.com/api/user/get/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data.data;

        setNewUser({
          name: userData.name,
          email: userData.email,
          password: "",
          designation: userData.designation,
          mobile: userData.mobileNo,
          role: userData.role?.id || userData.roleId,
        });

        setIsEditing(true);
        setEditingId(userData.Id || userData.userId || userData.id || userData.userid);
        setIsModalOpen(true);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Error fetching user data", { position: "top-right", autoClose: 3000 });
      }
    } else {
      setNewUser({
        name: "",
        email: "",
        password: "",
        designation: "",
        mobile: "",
        role: "",
      });
      setIsEditing(false);
      setEditingId(null);
      setIsModalOpen(true);
    }
    setErrors({
      name: "",
      email: "",
      password: "",
      designation: "",
      mobile: "",
      role: "",
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setNewUser({
      name: "",
      email: "",
      password: "",
      designation: "",
      mobile: "",
      role: "",
    });
    setIsEditing(false);
    setEditingId(null);
    setErrors({
      name: "",
      email: "",
      password: "",
      designation: "",
      mobile: "",
      role: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // For mobile field, only allow numbers and limit to 10 digits
    if (name === "mobile") {
      if (value === "" || (/^\d*$/.test(value) && value.length <= 10)) {
        setNewUser((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setNewUser((prev) => ({ ...prev, [name]: value }));
    }

    // Validate the field as user types
    if (name !== "password" || !isEditing) {
      validateField(name, value);
    }
  };

  const handleCreateOrUpdateUser = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form", { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      const submissionData = {
        id: editingId || undefined,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password || undefined,
        designation: newUser.designation,
        role: { id: newUser.role },
        mobileNo: newUser.mobile,
      };

      let response;
      if (isEditing) {
        response = await axios.put(`https://nicoindustrial.com/api/user/editProfile`, submissionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.post(`https://nicoindustrial.com/api/user/signup`, submissionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(response.data.message || (isEditing ? "User updated successfully" : "User created successfully"), { position: "top-right", autoClose: 3000 });

      handleModalClose();
      fetchUsers(currentPage, itemsPerPage, search);
    } catch (error: any) {
      const errorMessage = (error.response && error.response.data && error.response.data.message) || "Error processing the request. Please try again.";
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`https://nicoindustrial.com/api/user/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("User deleted successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        fetchUsers(currentPage, itemsPerPage, search);
      } catch (error) {
        console.error("Failed to delete user:", error);
        toast.error("Error deleting user", {
          position: "top-right",
          autoClose: 3000,
        });
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
      <div data-aos="fade-up" className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-black p-2 rounded w-full max-w-xs"
          
        />
        <button onClick={() => handleModalOpen()} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" disabled={loading}>
          <FaPlus />
          {loading ? "Processing..." : "Create User"}
        </button>
      </div>

      <table data-aos="fade-up" className="min-w-full border border-gray-200 text-left">
        <thead className="bg-[#38487c] text-white dark:text-white dark:bg-black">
          <tr className="text-center">
            <th className="border p-2">Sr No</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map((user, index) => (
              <tr className="text-center hover:bg-gray-200 bg-white transform duration-200 dark:text-white dark:bg-black dark:hover:bg-gray-800" key={user.id}>
                <td className="p-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="p-2">{user.username}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => {
                      toggleStatus(user.id, user.status);
                    }}
                    className={`w-14 h-7 flex items-center rounded-full p-1 duration-300 ease-in-out mx-auto ${user.status ? "bg-green-500" : "bg-gray-300 border-1 border-gray-400"}`}>
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${user.status ? "translate-x-7" : "translate-x-0"}`}></div>
                  </button>
                </td>
                <td className="p-2 space-x-2">
                  <button onClick={() => handleModalOpen(user)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xl rounded">
                    <FaPenAlt />
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xl rounded">
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center p-4">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div data-aos="fade-up" className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} results
        </p>
        <div className="flex gap-2">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white">
            <MdOutlineNavigateNext className="text-2xl rotate-180" />Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button key={pageNum} onClick={() => goToPage(pageNum)} className={`px-3 py-1 border rounded ${currentPage === pageNum ? "bg-blue-500 text-white" : "hover:bg-gray-100 "}`}>
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && <span className="px-2">...</span>}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <button onClick={() => goToPage(totalPages)} className="px-3 py-1 border rounded hover:bg-gray-100">
              {totalPages}
            </button>
          )}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white">
            Next<MdOutlineNavigateNext className="text-2xl" />
          </button>
        </div>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
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
        <div className="fixed inset-0 bg-[#00000071] backdrop-blur-xs bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto py-4">
          <div className="bg-white p-6 rounded-md w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit User" : "Create User"}</h2>
            {["name", "email", "password", "designation", "mobile"].map((field) => (
              <div key={field} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {field} {field !== "password" || !isEditing ? "*" : ""}
                </label>
                <input
                  type={field === "password" ? "password" : "text"}
                  name={field}
                  value={(newUser as any)[field]}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField(field, e.target.value)}
                  className={`border p-2 rounded w-full mt-2 ${errors[field as keyof typeof errors] ? "border-red-500" : ""}`}
                  placeholder={`Enter ${field}`}
                  required={field !== "password" || !isEditing}
                />
                {errors[field as keyof typeof errors] && <p className="text-red-500 text-xs mt-1">{errors[field as keyof typeof errors]}</p>}
              </div>
            ))}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Role *</label>
              <select name="role" value={newUser.role} onChange={handleInputChange} onBlur={(e) => validateField("role", e.target.value)} className={`border p-2 rounded w-full mt-2 ${errors.role ? "border-red-500" : ""}`} required>
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={handleModalClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">
                Cancel
              </button>
              <button onClick={handleCreateOrUpdateUser} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" disabled={loading}>
                {loading ? "Processing..." : isEditing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
