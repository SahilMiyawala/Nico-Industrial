import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface User {
  id: number;
  name: string;
  email: string | null;
  designation: string | null;
  mobileNo: string | null;
  active: boolean;
  deleted: boolean;
}

interface Description {
  descriptionId: number;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy?: User;
  assignTo?: User;
}

interface Product {
  productId: number;
  productName: string;
  brand?: {
    brandId: number;
    brandName: string;
  };
}

interface Inquiry {
  inquiryId: number;
  projectName: string;
  inquiryStatus: string;
  consumer?: {
    consumerId: number;
    consumerName: string;
  };
  products?: Product[];
  consultant?: {
    consultantId: number;
    consultantName: string;
  };
  followUpUser?: User;
  followUpQuotation?: User;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
  remark?: string;
  description?: Description[];
  estimatePrice?: number | null;
}

const InquiryView = () => {
  const { inquiryId } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
    }
  })

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        const response = await fetch(`https://nicoindustrial.com/api/inquiry/get/${inquiryId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch inquiry");
        }
        const data = await response.json();
        setInquiry(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInquiry();
  }, [inquiryId, token]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  if (!inquiry) return <div className="flex justify-center items-center h-screen">No inquiry found</div>;

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div data-aos="zoom-in" className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Inquiry Details</h2>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Back to Inquiry List
        </button>
      </div>

      {/* Main Details Section */}
      <div data-aos="zoom-in" className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Project Name:</label>
            <p className="px-3 py-2 flex-1 break-words">{inquiry.projectName || "N/A"}</p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Inquiry Status:</label>
            <p className="px-3 py-2 flex-1">{inquiry.inquiryStatus || "N/A"}</p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Consumer Name:</label>
            <p className="px-3 py-2 flex-1">{inquiry.consumer?.consumerName || "N/A"}</p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Product Name:</label>
            <p className="px-3 py-2 flex-1">{inquiry.products && inquiry.products.length > 0 ? inquiry.products.map((p) => p.productName).join(", ") : "N/A"}</p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Brand Name:</label>
            <p className="px-3 py-2 flex-1">
              {inquiry.products && inquiry.products.length > 0
                ? inquiry.products
                    .map((p) => p.brand?.brandName)
                    .filter((brandName): brandName is string => brandName !== undefined)
                    .join(", ")
                : "N/A"}
            </p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Consultant Name:</label>
            <p className="px-3 py-2 flex-1">{inquiry.consultant?.consultantName || "N/A"}</p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Created By:</label>
            <p className="px-3 py-2 flex-1">{inquiry.createdBy?.name || "N/A"}</p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Estimated Price:</label>
            <p className="px-3 py-2 flex-1">{inquiry.estimatePrice !== null && inquiry.estimatePrice !== undefined ? `₹${inquiry.estimatePrice.toLocaleString()}` : "N/A"}</p>
          </div>
        </div>

        <div className="flex items-start">
          <label className="font-medium text-gray-600 min-w-[120px] mt-2">Remark:</label>
          <p className="p-3 flex-1 min-h-20">{inquiry.remark || "N/A"}</p>
        </div>
      </div>

      {/* Follow-Up Section */}
      <div data-aos="zoom-in" className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Follow-Up Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Follow-Up Person:</label>
            <p className="px-3 py-2 flex-1">{inquiry.followUpUser?.name || "N/A"}</p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Quotation Person:</label>
            <p className="px-3 py-2 flex-1">{inquiry.followUpQuotation?.name || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div data-aos="zoom-in" className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Created At:</label>
            <p className="px-3 py-2 flex-1">{inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString() : "N/A"}</p>
          </div>

          <div className="flex items-center">
            <label className="font-medium text-gray-600 min-w-[120px]">Last Updated:</label>
            <p className="px-3 py-2 flex-1">{inquiry.updatedAt ? new Date(inquiry.updatedAt).toLocaleString() : "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Description History Section */}
      {/* <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Description History</h3>
        {inquiry.description && inquiry.description.length > 0 ? (
          <div className="space-y-4">
            {inquiry.description.map((desc, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="mb-2 text-gray-800">{desc.description}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center">
                    <span className="font-medium min-w-[90px]">Created by:</span>
                    <span>{desc.createdBy?.name || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium min-w-[90px]">Created at:</span>
                    <span>{desc.createdAt ? new Date(desc.createdAt).toLocaleString() : "N/A"}</span>
                  </div>
                  {desc.assignTo && (
                    <div className="flex items-center">
                      <span className="font-medium min-w-[90px]">Assigned to:</span>
                      <span>{desc.assignTo.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="bg-gray-100 rounded p-4 text-gray-500">No description history available</p>
        )}
      </div> */}
      <div data-aos="zoom-in" className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Description History</h3>
        {inquiry.description && inquiry.description.length > 0 ? (
          <div className="space-y-4">
            {/* Reverse the array before mapping */}
            {[...inquiry.description].map((desc, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="mb-2 text-gray-800">{desc.description}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center">
                    <span className="font-medium min-w-[90px]">Created by:</span>
                    <span>{desc.createdBy?.name || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium min-w-[90px]">Created at:</span>
                    <span>{desc.createdAt ? new Date(desc.createdAt).toLocaleString() : "N/A"}</span>
                  </div>
                  {desc.assignTo && (
                    <div className="flex items-center">
                      <span className="font-medium min-w-[90px]">Assigned to:</span>
                      <span>{desc.assignTo.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="bg-gray-100 rounded p-4 text-gray-500">No description history available</p>
        )}
      </div>
    </div>
  );
};

export default InquiryView;
