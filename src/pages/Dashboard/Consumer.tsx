import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPenAlt, FaPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdDelete, MdOutlineNavigateNext } from "react-icons/md";
import { useNavigate } from "react-router";

interface CreatedByType {
  id: number;
  name: string;
  email: string;
  designation: string;
  mobileNo: string;
  active: boolean;
  deleted: boolean;
}

interface ConsumerType {
  consumerId: number;
  consumerName: string;
  emailId: string;
  address: string;
  contact: string;
  createdAt: string;
  createdBy: CreatedByType;
}

const Consumer = () => {
  const [search, setSearch] = useState("");
  const [filter1, setFilter1] = useState("");
  const [filter2, setFilter2] = useState("");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editConsumerId, setEditConsumerId] = useState<number | null>(null);
  const [consumers, setConsumers] = useState<ConsumerType[]>([]);
  const [newConsumer, setNewConsumer] = useState({
    consumerName: "",
    emailId: "",
    address: "",
    contact: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    }
  });

  // const consumersPerPage = 10;
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchConsumers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/consumer/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          size: itemsPerPage,
          search: search,
          filter1: filter1,
          filter2: filter2,
        },
      });
      console.log(response);

      if (response.data?.statusCode === 200) {
        setConsumers(response.data.data.consumers);
        setTotalRecords(response.data.data.totalRecords);
      }
    } catch (error) {
      console.error("Error fetching consumers:", error);
      toast.error("Failed to fetch consumers", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumers();
  }, [currentPage, search, filter1, filter2]);

  const validateForm = () => {
    if (!newConsumer.consumerName.trim()) {
      toast.error("Consumer name is required", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
      return false;
    }
    if (!newConsumer.emailId.trim()) {
      toast.error("Email is required", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
      return false;
    }
    if (!newConsumer.contact.trim()) {
      toast.error("Contact number is required", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
      return false;
    }
    return true;
  };

  // const filteredConsumers = consumers.filter((consumer) => consumer.consumerName && consumer.consumerName.toLowerCase().includes(search.toLowerCase()));
  const currentConsumers = consumers;

  const totalPages = Math.ceil(totalRecords / itemsPerPage); // Use totalRecords instead of filteredConsumers.length
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);
  // const currentConsumers = filteredConsumers.slice(startIndex, endIndex);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePageClick = (pageNum: number) => setCurrentPage(pageNum);

  const handleCreateConsumer = () => {
    setEditConsumerId(null);
    setNewConsumer({
      consumerName: "",
      emailId: "",
      address: "",
      contact: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewConsumer({
      consumerName: "",
      emailId: "",
      address: "",
      contact: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewConsumer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!userId) {
      toast.error("User ID not found in localStorage", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
      return;
    }

    try {
      let response;
      if (editConsumerId !== null) {
        // Update consumer
        response = await axios.put(
          `https://nicoindustrial.com/api/consumer/update/${editConsumerId}`,
          { ...newConsumer, updatedBy: { id: userId } },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const successMessage = response.data.message || "Consumer updated successfully";
        toast.success(successMessage, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
        });
      } else {
        // Create new consumer
        response = await axios.post(
          `https://nicoindustrial.com/api/consumer/save`,
          { ...newConsumer, createdBy: { id: userId } },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const successMessage = response.data.message || "Consumer created successfully";
        toast.success(successMessage, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
        });
      }

      handleCloseModal();
      fetchConsumers();
    } catch (error) {
      const backendError = (error as any).response?.data?.message || "Error submitting consumer. Please try again later.";
      toast.error(backendError, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
    }
  };

  const handleEdit = async (consumer: ConsumerType) => {
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/consumer/get/${consumer.consumerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const consumerData = response.data.data;

      setNewConsumer({
        consumerName: consumerData.consumerName || "",
        emailId: consumerData.emailId || "",
        address: consumerData.address || "",
        contact: consumerData.contact || "",
      });

      setEditConsumerId(consumer.consumerId);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching consumer details:", error);
      toast.error("Failed to fetch consumer details", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this consumer?")) return;
    try {
      const response = await axios.delete(`https://nicoindustrial.com/api/consumer/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const successMessage = response.data.message || "Consumer deleted successfully";
      toast.success(successMessage, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
      });
      fetchConsumers();
    } catch (error) {
      const backendError = (error as any).response?.data?.message || "Error deleting consumer. Please try again later.";
      toast.error(backendError, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      });
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
      {/* Search + Add */}
      <div data-aos="fade-up" className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search Consumer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-black p-2 rounded-md w-full max-w-xs"
        />
        <button onClick={handleCreateConsumer} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <FaPlus />
          Create Consumer
        </button>
      </div>

      {/* Table */}
      <div data-aos="fade-up" className="overflow-x-auto custom-scroll">
        <table className="min-w-full text-left">
          <thead className="bg-[#38487c] text-white dark:text-white dark:bg-black">
            <tr className="text-center border border-gray-400">
              <th className="p-2 min-w-[80px]">Sr No</th>
              <th className="p-2 min-w-[200px]">Name</th>
              <th className="p-2 min-w-[300px]">Email</th>
              <th className="p-2 min-w-[350px]">Address</th>
              <th className="p-2 min-w-[150px]">Contact</th>
              <th className="p-2 min-w-[150px]">Created By</th>
              <th className="p-2 min-w-[150px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentConsumers.length ? (
              currentConsumers.map((consumer, index) => (
                <tr className="text-center bg-white transform duration-200 hover:bg-gray-200 dark:text-white dark:bg-black" key={consumer.consumerId}>
                  <td className="p-2">{startIndex + index + 1}</td>
                  <td className="p-2">{consumer.consumerName}</td>
                  <td className="p-2">{consumer.emailId}</td>
                  <td className="p-2">{consumer.address}</td>
                  <td className="p-2">{consumer.contact}</td>
                  <td className="p-2">{consumer.createdBy?.name || "N/A"}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => handleEdit(consumer)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xl">
                      <FaPenAlt />
                    </button>
                    <button onClick={() => handleDelete(consumer.consumerId)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xl">
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  {loading ? "Loading..." : "No consumers found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div data-aos="fade-up" className="flex justify-between items-center mt-6 flex-wrap gap-2">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to {endIndex} of {totalRecords} results
        </p>
        <div className="flex gap-2">
          <button onClick={handlePrev} className={`flex px-3 border-black py-1 border hover:bg-gray-100 dark:hover:text-black dark:border-white rounded ${currentPage === 1 ? "" : "hover:bg-gray-100"}`}>
            <MdOutlineNavigateNext className="text-2xl rotate-180" />
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button key={pageNum} onClick={() => handlePageClick(pageNum)} className={`px-3 py-1 border rounded ${currentPage === pageNum ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}>
              {pageNum}
            </button>
          ))}
          <button onClick={handleNext} className={`flex px-3 py-1 border hover:bg-gray-100 dark:hover:text-black dark:border-white border-black rounded ${currentPage === totalPages ? "" : "hover:bg-gray-100"}`}>
            Next
            <MdOutlineNavigateNext className="text-2xl" />
          </button>
        </div>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            handlePageClick(1);
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
        <div className="fixed inset-0 bg-[#00000071] bg-opacity-50 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4 font-semibold">{editConsumerId ? "Edit Consumer" : "Create Consumer"}</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Consumer Name *</label>
              <input type="text" name="consumerName" placeholder="Consumer Name" value={newConsumer.consumerName} onChange={handleInputChange} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Email *</label>
              <input type="email" name="emailId" placeholder="Email" value={newConsumer.emailId} onChange={handleInputChange} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Address</label>
              <input type="text" name="address" placeholder="Address" value={newConsumer.address} onChange={handleInputChange} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Contact *</label>
              <input type="text" name="contact" placeholder="Contact" value={newConsumer.contact} onChange={handleInputChange} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-between">
              <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400">
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                {editConsumerId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consumer;
