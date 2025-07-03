"use client";

import type React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaPenAlt, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdDelete, MdOutlineNavigateNext } from "react-icons/md";
import { useNavigate } from "react-router";

type Brand = {
  brandId: number;
  brandName: string;
};

type Product = {
  id: number;
  name: string;
  price: number;
  brandId?: number;
  brandName?: string;
  createdBy: string;
  createdAt: string;
};

const Product = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    createdBy: "",
    createdAt: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [productsPerPage, setProductsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    }
  }, [navigate]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products when debounced search, page, or page size changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearch, productsPerPage]);

  // Fetch brands on component mount
  useEffect(() => {
    fetchBrands(brandSearch);
  }, [brandSearch]);

  // Filter brands based on search
  useEffect(() => {
    if (brandSearch.trim() === "") {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter((brand) => brand.brandName.toLowerCase().includes(brandSearch.toLowerCase()));
      setFilteredBrands(filtered);
    }
  }, [brands, brandSearch]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("https://nicoindustrial.com/api/product/list", {
        params: {
          search: debouncedSearch,
          page: currentPage,
          size: productsPerPage,
          userId: userId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const apiProducts = res.data.data.productList.map((p: any) => ({
        id: p.productId,
        name: p.productName,
        price: p.price,
        brandId: p.brand?.brandId,
        brandName: p.brand?.brandName,
        createdBy: p.createdBy?.name || "Unknown",
        createdAt: new Date(p.createdAt).toLocaleDateString(),
      }));

      setTotalPages(res.data.data.totalPages);
      setProducts(apiProducts);
    } catch (error) {
      console.error("Failed to fetch products", error);
      toast.error("Failed to fetch products", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      });
      // Set empty array on error to show "no products" message
      setProducts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async (search) => {
    try {
      const res = await axios.get(`https://nicoindustrial.com/api/brand/list?search=${search}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const brandsData = res.data.data.brands || [];
      setBrands(brandsData);
    } catch (error) {
      console.error("Failed to fetch brands", error);
      toast.error("Failed to load brands", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      price: "",
      createdBy: "",
      createdAt: "",
    });
    setSelectedBrandId(null);
    setBrandSearch("");
    setShowBrandDropdown(false);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProduct.name.trim()) {
      setErrorMessage("Product Name is required");
      return;
    }

    if (!newProduct.price) {
      setErrorMessage("Price is required");
      return;
    }

    const priceValue = Number.parseFloat(newProduct.price);
    if (isNaN(priceValue)) {
      setErrorMessage("Please enter a valid number for price");
      return;
    }

    if (priceValue <= 0) {
      setErrorMessage("Price must be greater than 0");
      return;
    }

    if (!selectedBrandId) {
      setErrorMessage("Please select a brand");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        productName: newProduct.name.trim(),
        price: priceValue,
        brand: { brandId: selectedBrandId },
        createdBy: { id: userId },
      };

      let response;

      if (editingProduct) {
        response = await axios.put(
          `https://nicoindustrial.com/api/product/update/${editingProduct.id}`,
          {
            ...payload,
            updatedBy: { id: userId },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(response.data.message || "Product updated successfully!", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
        });
      } else {
        response = await axios.post(`https://nicoindustrial.com/api/product/create`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(response.data.message || "Product created successfully!", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      const errorMessage = (error as any).response?.data?.message || (editingProduct ? "Error updating product. Please try again." : "Error creating product. Please try again.");
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startIndex = (currentPage - 1) * productsPerPage;

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        setIsLoading(true);
        const response = await axios.delete(`https://nicoindustrial.com/api/product/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const successMessage = "Product deleted successfully!" || response.data.message;
        toast.success(successMessage, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          className: "toast-success",
          style: { backgroundColor: "green" },
        });

        fetchProducts();
      } catch (error) {
        const errorMessage = (error as any).response?.data?.message || "Error deleting product. Please try again.";
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          style: { backgroundColor: "red" },
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      createdBy: product.createdBy,
      createdAt: product.createdAt,
    });
    setSelectedBrandId(product.brandId || null);

    // Set brand search to the selected brand name
    if (product.brandId) {
      const selectedBrand = brands.find((b) => b.brandId === product.brandId);
      setBrandSearch(selectedBrand?.brandName || "");
    }

    setIsModalOpen(true);
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

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".relative")) {
        setShowBrandDropdown(false);
      }
    };

    if (showBrandDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showBrandDropdown]);

  return (
    <div className="p-4 dark:text-white">
      {/* Top Controls */}
      <div data-aos="fade-up" className="flex justify-between items-center mb-4">
        <div className="relative">
          <input type="text" placeholder="Search Product..." value={search} onChange={(e) => setSearch(e.target.value)} className="border border-black p-2 rounded-md w-full max-w-xs" />
          {search !== debouncedSearch && (
            <div className="absolute right-2 top-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <FaPlus />
          Create Product
        </button>
      </div>

      {/* Product Table */}
      <div data-aos="fade-up" className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-left">
          <thead className="bg-[#38487c] text-white dark:text-white dark:bg-black">
            <tr className="text-center">
              <th className="border p-2">Sr No</th>
              <th className="border p-2">Product Name</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Brand</th>
              <th className="border p-2">Created By</th>
              <th className="border p-2">Created At</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    Loading products...
                  </div>
                </td>
              </tr>
            ) : products.length ? (
              products.map((product, index) => (
                <tr className="text-center bg-white transform duration-200 hover:bg-gray-200 dark:text-white dark:bg-black" key={product.id}>
                  <td className="p-2">{startIndex + index + 1}</td>
                  <td className="p-2">{product.name}</td>
                  <td className="p-2">₹{product.price}</td>
                  <td className="p-2">{product.brandName || "N/A"}</td>
                  <td className="p-2">{product.createdBy}</td>
                  <td className="p-2">{product.createdAt}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => handleEditProduct(product)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xl rounded" disabled={isLoading}>
                      <FaPenAlt />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xl rounded" disabled={isLoading}>
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  {debouncedSearch ? `No products found matching "${debouncedSearch}"` : "No products available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {products.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + productsPerPage, startIndex + products.length)} of {totalPages * productsPerPage} results
              {debouncedSearch && ` for "${debouncedSearch}"`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1 || isLoading}
                className={`flex dark:hover:bg-white dark:hover:!text-black px-3 py-1 border border-black rounded ${currentPage === 1 ? "bg-gray-200 hover:bg-gray-100 dark:border-white dark:bg-black dark:hover:text-white" : "hover:bg-gray-100"}`}>
                <MdOutlineNavigateNext className="text-2xl rotate-180" />
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} disabled={isLoading} className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}>
                  {i + 1}
                </button>
              ))}
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages || isLoading}
                className={`flex dark:hover:bg-white dark:hover:!text-black px-3 py-1 border border-black rounded ${currentPage === totalPages ? "bg-gray-200 hover:bg-gray-100 dark:hover:text-white dark:border-white dark:bg-black dark:hover:text-black" : "hover:bg-gray-100"}`}>
                Next
                <MdOutlineNavigateNext className="text-2xl" />
              </button>
            </div>
            <select
              value={productsPerPage}
              onChange={(e) => {
                setProductsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-black p-1 rounded dark:border-white dark:bg-black dark:text-white">
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#00000071] z-50 bg-opacity-50 backdrop-blur-xs flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl mb-4">{editingProduct ? "Edit Product" : "Create Product"}</h2>
            {errorMessage && <div className="mb-4 text-red-500 text-sm">{errorMessage}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                  Product Name*
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => {
                    setNewProduct({ ...newProduct, name: e.target.value });
                    setErrorMessage("");
                  }}
                  required
                  className="mt-1 block w-full border p-2 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price*
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => {
                    setNewProduct({ ...newProduct, price: e.target.value });
                    setErrorMessage("");
                  }}
                  required
                  className="mt-1 block w-full border p-2 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                  Brand*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search and select brand..."
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setShowBrandDropdown(true);
                    }}
                    onFocus={() => setShowBrandDropdown(true)}
                    className="mt-1 block w-full border p-2 rounded pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Selected brand display */}
                  {selectedBrandId && !showBrandDropdown && (
                    <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded flex justify-between items-center">
                      <span className="text-blue-800">{brands.find((b) => b.brandId === selectedBrandId)?.brandName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBrandId(null);
                          setBrandSearch("");
                          setErrorMessage("");
                        }}
                        className="text-blue-600 hover:text-blue-800">
                        ×
                      </button>
                    </div>
                  )}

                  {/* Dropdown list */}
                  {showBrandDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredBrands.length > 0 ? (
                        filteredBrands.map((brand) => (
                          <div
                            key={brand.brandId}
                            onClick={() => {
                              setSelectedBrandId(brand.brandId);
                              setBrandSearch(brand.brandName);
                              setShowBrandDropdown(false);
                              setErrorMessage("");
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedBrandId === brand.brandId ? "bg-blue-50 text-blue-800" : "text-gray-900"}`}>
                            {brand.brandName}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500">No brands found matching "{brandSearch}"</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-4 px-4 py-2 border rounded" disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
