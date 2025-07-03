import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export type RoleType = {
  Id: number;
  name: string;
};

export const useRole = () => {
  const token = localStorage.getItem("token");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = async (query = "") => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://nicoindustrial.com/api/roles/list?search=${query}&page=${currentPage}&perPage=${itemsPerPage}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedRoles = data.data.roles || [];

        setRoles(fetchedRoles);
        setTotalPages(data.data.totalPages || 1);

        // Fix for incorrect totalRecords
        const total = data.data.totalRecords;
        setTotalRecords(total !== undefined && total !== 0 ? total : fetchedRoles.length);
      } else {
        toast.error("Failed to fetch data.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(search);
  }, [currentPage, search, itemsPerPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleModalOpen = (role: RoleType | null = null) => {
    setIsModalOpen(true);
    if (role) {
      setRoleName(role.name);
      setEditingRole(role);
    } else {
      setRoleName("");
      setEditingRole(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setRoleName("");
    setEditingRole(null);
  };

  const handleCreateOrUpdateRole = async () => {
    if (!roleName.trim()) {
      toast.error("Role name cannot be empty");
      return;
    }

    try {
      setIsSaving(true);

      const url = editingRole ? `https://nicoindustrial.com/api/roles/edit/${editingRole.Id}` : `https://nicoindustrial.com/api/roles/save`;

      const method = editingRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleName }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || (editingRole ? "Role updated" : "Role created"));
        fetchData(search);
        handleModalClose();
      } else {
        toast.error(data.message || "Failed to save role.");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Error saving role.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this role?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://nicoindustrial.com/api/roles/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Role deleted successfully");
        fetchData(search);
      } else {
        toast.error(data.message || "Failed to delete role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Error deleting role.");
    }
  };

  return {
    roles,
    search,
    setSearch,
    currentPage,
    goToPage,
    totalPages,
    totalRecords,
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
  };
};
