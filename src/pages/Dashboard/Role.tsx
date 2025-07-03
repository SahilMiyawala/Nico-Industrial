import { FaPenAlt, FaPlus } from "react-icons/fa";
import { useRole } from "../../hooks/userole";
import { useEffect } from "react";
import { MdDelete, MdOutlineNavigateNext } from "react-icons/md";
import { useNavigate } from "react-router";

const RoleComponent = () => {
  const {
    roles,
    search,
    setSearch,
    currentPage,
    goToPage,
  totalPages,
    isLoading,
    isModalOpen,
    roleName,
    setRoleName,
    editingRole,
    handleModalOpen,
    handleModalClose,
    handleCreateOrUpdateRole,
    handleDeleteRole,
    isSaving,
    itemsPerPage,
    setItemsPerPage,
    totalRecords,
  } = useRole();

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
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    }
  })

  return (
    <div className="p-4 dark:text-white">
      {/* Header */}
      <div data-aos="fade-up" className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search role..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            goToPage(1); // this replaces setCurrentPage
          }}
          className="border border-black p-2 rounded w-full max-w-xs"
        />
        <button onClick={() => handleModalOpen()} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <FaPlus />
          Create Role
        </button>
      </div>

      {/* Table */}
      <table data-aos="fade-up" className="min-w-full border border-gray-200 text-left">
        <thead className="bg-[#38487c] text-white dark:text-white dark:bg-black">
          <tr className="text-center">
            <th className="border p-2">Sr No</th>
            <th className="border p-2">Role Name</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={3} className="text-center p-4">
                Loading...
              </td>
            </tr>
          ) : roles.length ? (
            roles.map((role, index) => (
              <tr className="text-center hover:bg-gray-200 bg-white dark:text-white dark:bg-black  dark:hover:bg-gray-800 transform duration-200" key={role.Id}>
                <td className="p-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="p-2">{role.name}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => handleModalOpen(role)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xl rounded">
                    <FaPenAlt />
                  </button>
                  <button onClick={() => handleDeleteRole(role.Id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xl rounded">
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center p-4">
                No roles found.
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
              <button key={pageNum} onClick={() => goToPage(pageNum)} className={`px-3 py-1 border rounded ${currentPage === pageNum ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}>
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
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}  className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white">
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#00000071] backdrop-blur-xs bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md w-1/3">
            <h2 className="text-lg font-bold mb-4">{editingRole ? "Edit Role" : "Create Role"}</h2>
            <div className="mb-4">
              <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">
                Role Name
              </label>
              <input type="text" id="roleName" placeholder="Enter Role Name" value={roleName} onChange={(e) => setRoleName(e.target.value)} className="border p-2 rounded w-full mt-2" />
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={handleModalClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">
                Cancel
              </button>
              <button onClick={handleCreateOrUpdateRole} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? "Saving..." : editingRole ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleComponent;