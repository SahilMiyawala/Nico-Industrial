"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { FaPenAlt, FaPlus } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { MdDelete, MdOutlineNavigateNext } from "react-icons/md"
import { useNavigate } from "react-router"

type BrandType = {
  brandId: number
  brandName: string
  products: any
  createdAt: string
  updatedAt: string | null
  totalPages?: number
}

const Brand = () => {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  // const itemsPerPage = 10;
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  const [brands, setBrands] = useState<BrandType[]>([])
  const token = localStorage.getItem("token")
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin")
    }
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [brandName, setBrandName] = useState("")
  const [editingBrand, setEditingBrand] = useState<BrandType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchBrands = async () => {
    setIsLoading(true)
    try {
      const res = await axios.get("https://nicoindustrial.com/api/brand/list", {
        params: {
          page: currentPage,
          size: itemsPerPage,
          search: search,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.data && res.data.data) {
        // Access brands from the new structure: data.brands
        const brandList = res.data.data.brands.map((brand: any) => ({
          ...brand,
          _id: brand._id || brand.id,
        }))

        // Get totalPages from the root level of data
        setTotalPages(res.data.data.totalPages)
        setBrands(brandList)
      }
    } catch (error: any) {
      console.error("Failed to fetch brands:", error)
      toast.error(error.response?.data?.message || "Failed to fetch brands")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [currentPage, itemsPerPage, search])

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isModalOpen])

  const paginated = brands // Use brands directly from API

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const handleModalOpen = async (brand: BrandType | null = null) => {
    if (brand) {
      try {
        // First check if we have all needed data already
        if (brand.brandId && brand.brandName) {
          setBrandName(brand.brandName)
          setEditingBrand(brand)
          setIsModalOpen(true)
          return
        }

        // Only fetch if we don't have complete data
        const response = await axios.get(`https://nicoindustrial.com/api/brand/${brand.brandId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const brandData = response.data.data
        console.log("Fetched brand data:", brandData)

        setBrandName(brandData.brandName)
        setEditingBrand({
          brandId: brandData.brandId,
          brandName: brandData.brandName,
          products: brandData.products,
          createdAt: brandData.createdAt,
          updatedAt: brandData.updatedAt,
        })

        setIsModalOpen(true)
      } catch (error) {
        console.error("Failed to fetch brand data:", error)
        toast.error("Error fetching brand data", {
          position: "top-right",
          autoClose: 3000,
        })
      }
    } else {
      // For creating new brand
      setBrandName("")
      setEditingBrand(null)
      setIsModalOpen(true)
    }
  }
  const userId = localStorage.getItem("userId")

  const handleCreateOrUpdate = async () => {
    if (!brandName.trim()) {
      toast.error("Brand name is required", { position: "top-right", autoClose: 3000 })
      return
    }

    setIsLoading(true)

    try {
      const url = editingBrand
        ? `https://nicoindustrial.com/api/brand/edit/${editingBrand.brandId}?userId=${userId}`
        : `https://nicoindustrial.com/api/brand/save?userId=${userId}`

      const method = editingBrand ? "PUT" : "POST"
      console.log("URL:", url)

      console.log("Save response:", method)
      const response = await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: {
          brandName,
          userId, // Include userId if your backend requires it
        },
      })

      toast.success(response.data?.message || `Brand ${editingBrand ? "updated" : "created"} successfully`, {
        position: "top-right",
        autoClose: 3000,
      })

      setIsModalOpen(false)
      setBrandName("")
      setEditingBrand(null)
      fetchBrands()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error saving brand"
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
      console.error("Save error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (brandId: number) => {
    if (!brandId) {
      toast.error("Invalid brand ID")
      console.warn("Attempted to delete with invalid ID:", brandId)
      return
    }
    if (window.confirm("Are you sure you want to delete this brand?")) {
      try {
        const response = await axios.delete(`https://nicoindustrial.com/api/brand/delete/${brandId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (response.data) {
          toast.success(response.data.message || "Brand deleted successfully!")
          setBrands((prevBrands) => prevBrands.filter((brand) => brand.brandId !== brandId))
        }
      } catch (error) {
        toast.error("Error deleting brand. Please try again.")
        console.error("Error deleting brand:", error)
      }
    }
  }

  return (
    <div className="p-4 dark:text-white">
      <ToastContainer />
      <div data-aos="fade-up" className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search brand..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
          className="border border-black p-2 rounded-md w-full max-w-xs"
        />
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={() => handleModalOpen()}
        >
          <FaPlus />
          Create Brand
        </button>
      </div>

      <div data-aos="fade-up" className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-left">
          <thead className="bg-[#38487c] text-white dark:text-white dark:bg-black">
            <tr className="text-center">
              <th className="border p-2">Sr No</th>
              <th className="border p-2">Brand Name</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length ? (
              paginated.map((brand, index) => (
                <tr
                  className="text-center hover:bg-gray-200 bg-white transform duration-200 dark:text-white dark:bg-black"
                  key={brand.brandId}
                >
                  <td className="p-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-2">{brand.brandName}</td>
                  <td className="p-2 space-x-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xl"
                      onClick={() => handleModalOpen(brand)}
                    >
                      <FaPenAlt />
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xl"
                      onClick={() => handleDelete(brand.brandId)}
                    >
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center p-4">
                  No brands found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div data-aos="fade-up" className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, (currentPage - 1) * itemsPerPage + brands.length)} of{" "}
          {totalPages * itemsPerPage} results
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white"
            disabled={currentPage === 1}
          >
            <MdOutlineNavigateNext className="text-2xl rotate-180" />
            Previous
          </button>

          {[...Array(totalPages).keys()].slice(0, 3).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => goToPage(i + 1)}
              className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
            >
              {i + 1}
            </button>
          ))}

          {totalPages > 4 && <span className="px-2 py-1">...</span>}

          {totalPages > 3 && (
            <button onClick={() => goToPage(totalPages)} className="px-3 py-1 border rounded hover:bg-gray-100">
              {totalPages}
            </button>
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            className="flex px-3 py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black dark:border-white"
            disabled={currentPage === totalPages}
          >
            Next
            <MdOutlineNavigateNext className="text-2xl" />
          </button>
        </div>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value))
            setCurrentPage(1)
          }}
          className="border border-black p-1 rounded dark:border-white dark:bg-black dark:text-white"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-50 bg-[#00000071] backdrop-blur-xs flex justify-center items-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-md w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">{editingBrand ? "Edit Brand" : "Create New Brand"}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="border border-gray-300 p-2 rounded-md w-full"
                placeholder="Enter brand name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button
                className={`px-4 py-2 ${isLoading ? "bg-gray-400" : "bg-blue-600"} text-white rounded-md`}
                onClick={handleCreateOrUpdate}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Brand
