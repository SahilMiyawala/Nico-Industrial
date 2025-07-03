import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPenAlt, FaPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdDelete, MdOutlineNavigateNext } from "react-icons/md";
import { useNavigate } from "react-router";

const Consultant = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  // const consultantsPerPage = 5;
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    }
  })

  const [showModal, setShowModal] = useState(false);
  const [newConsultant, setNewConsultant] = useState({
    consultantName: "",
    contactNumber: "",
    contactPerson: "",
  });
  const [errors, setErrors] = useState({
    consultantName: "",
    contactNumber: "",
    contactPerson: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchConsultants();
  }, [currentPage, search]);

  const fetchConsultants = async () => {
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/consultant/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          size: itemsPerPage,
          search: search,
          filter1: "",
          filter2: "",
        },
      });

      const data = response.data.data;
      const formattedData = data.Consultants.map((item: any) => ({
        id: item.consultantId,
        consultantName: item.consultantName,
        contactNumber: item.contactNumber,
        contactPerson: item.contactPerson,
        createdAt: item.createdAt ? item.createdAt.split("T")[0] : "N/A",
        updatedAt: item.updatedAt ? item.updatedAt.split("T")[0] : "N/A",
        createdBy: item.createdBy?.name || "N/A",
      }));

      setConsultants(formattedData);
      setTotalRecords(data.totalRecords);
    } catch (error) {
      console.error("Error fetching consultants:", error);
    }
  };

  const handleSubmit = async () => {
    const { consultantName, contactPerson, contactNumber } = newConsultant;

    // Validation logic
    const newErrors = {
      consultantName: "",
      contactNumber: "",
      contactPerson: "",
    };

    let isValid = true;

    if (!consultantName) {
      newErrors.consultantName = "Consultant Name is required";
      isValid = false;
    }
    if (!contactPerson) {
      newErrors.contactPerson = "Contact Person is required";
      isValid = false;
    }
    if (!contactNumber) {
      newErrors.contactNumber = "Contact Number is required";
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return; // Don't hit the API if there are errors
    }

    const userId = localStorage.getItem("userId");
    const payload = { ...newConsultant, createdBy: { id: userId } };

    try {
      let response;
      if (isEditing && editId !== null) {
        response = await axios.put(`https://nicoindustrial.com/api/consultant/update/${editId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await axios.post(`https://nicoindustrial.com/api/consultant/save`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const successMessage = response.data.message || "Operation successful";
      toast.success(successMessage, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
      });

      handleModalClose();
      fetchConsultants(); // Refresh the data
    } catch (error) {
      const backendError = (error as any).response?.data?.message || "An error occurred";
      toast.error(backendError, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
    }
  };

  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsEditing(false);
    setNewConsultant({ consultantName: "", contactNumber: "", contactPerson: "" });
    setEditId(null);
    setErrors({ consultantName: "", contactNumber: "", contactPerson: "" });
  };

  const handleModalOpen = () => {
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewConsultant((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEdit = (consultant: any) => {
    setNewConsultant({
      consultantName: consultant.consultantName,
      contactNumber: consultant.contactNumber,
      contactPerson: consultant.contactPerson,
    });
    setEditId(consultant.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this consultant?")) {
      try {
        await axios.delete(`https://nicoindustrial.com/api/consultant/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Consultant deleted successfully", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
        });
        fetchConsultants(); // Refresh the data
      } catch (error) {
        const backendError = (error as any).response?.data?.message || "An error occurred";
        toast.error(backendError, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          style: { backgroundColor: "red" },
        });
      }
    }
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);

  return (
    <div className="p-4 dark:text-white">
      <ToastContainer />
      {/* Top Controls */}
      <div data-aos="fade-up" className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search Consultant..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-black p-2 rounded-md w-full max-w-xs"
        />
        <button onClick={handleModalOpen} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <FaPlus />
          Create Consultant
        </button>
      </div>

      {/* Table */}
      <div data-aos="fade-up" className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-left">
          <thead className="bg-[#38487c] text-white dark:text-white dark:bg-black">
            <tr className="text-center">
              <th className="border p-2">Sr No</th>
              <th className="border p-2">Consultant Name</th>
              <th className="border p-2">Contact Number</th>
              <th className="border p-2">Contact Person</th>
              <th className="border p-2">Created At</th>
              <th className="border p-2">Updated At</th>
              <th className="border p-2">Created By</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultants.length ? (
              consultants.map((consultant, index) => (
                <tr className="text-center bg-white transform duration-200 hover:bg-gray-200 dark:text-white dark:bg-black" key={consultant.id}>
                  <td className="p-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-2">{consultant.consultantName}</td>
                  <td className="p-2">{consultant.contactNumber}</td>
                  <td className="p-2">{consultant.contactPerson}</td>
                  <td className="p-2">{consultant.createdAt}</td>
                  <td className="p-2">{consultant.updatedAt}</td>
                  <td className="p-2">{consultant.createdBy}</td>
                  <td className="p-2 flex justify-center gap-2">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xl" onClick={() => handleEdit(consultant)}>
                      <FaPenAlt />
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xl" onClick={() => handleDelete(consultant.id)}>
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center p-4">
                  No consultants found.
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
            <button onClick={handlePrev} disabled={currentPage === 1} className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white">
              <MdOutlineNavigateNext className="text-2xl rotate-180" />Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} onClick={() => goToPage(i + 1)} className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={handleNext} disabled={currentPage === totalPages}  className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white">
              Next<MdOutlineNavigateNext className="text-2xl" />
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#00000071] bg-opacity-50 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md w-96">
            <h2 className="text-lg font-semibold mb-4">{isEditing ? "Edit Consultant" : "Create Consultant"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}>
              <div className="mb-4">
                <label htmlFor="consultantName" className="block text-sm font-medium text-gray-700">
                  Consultant Name
                </label>
                <input type="text" id="consultantName" name="consultantName" value={newConsultant.consultantName} onChange={handleInputChange} className={`border ${errors.consultantName ? "border-red-500" : "border-gray-300"} p-2 rounded-md w-full`} />
                {errors.consultantName && <p className="text-red-500 text-xs mt-1">{errors.consultantName}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <input type="text" id="contactPerson" name="contactPerson" value={newConsultant.contactPerson} onChange={handleInputChange} className={`border ${errors.contactPerson ? "border-red-500" : "border-gray-300"} p-2 rounded-md w-full`} />
                {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input type="text" id="contactNumber" name="contactNumber" value={newConsultant.contactNumber} onChange={handleInputChange} className={`border ${errors.contactNumber ? "border-red-500" : "border-gray-300"} p-2 rounded-md w-full`} />
                {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={handleModalClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
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

export default Consultant;
