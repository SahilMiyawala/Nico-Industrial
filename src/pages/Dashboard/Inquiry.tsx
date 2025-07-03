"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { FaFileInvoice, FaPlus, FaUserCheck } from "react-icons/fa"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons"
import axios from "axios"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useNavigate, useLocation } from "react-router-dom"
import Select from "react-select"
import { MdOutlineNavigateNext } from "react-icons/md"
import { FaEye } from "react-icons/fa"
import { FaPenAlt } from "react-icons/fa"
import { MdDelete } from "react-icons/md"
import { CiClock2 } from "react-icons/ci"
import { FaRegBell } from "react-icons/fa"
import { BsChatSquareText } from "react-icons/bs" // New icon for response button

// Define TypeScript interfaces
interface Consumer {
  consumerId: string | number
  consumerName: string
  emailId?: string
  address?: string
  contact?: string
}

interface Brand {
  brandId: string | number
  brandName: string
}

interface Product {
  productId: string | number
  productName: string
  price?: number
  brand?: Brand
}

interface Consultant {
  consultantId: string | number
  consultantName: string
  contactPerson?: string
  contactNumber?: string
}

interface User {
  id: string | number
  name: string
  email?: string
  active?: boolean
  designation?: string
  mobileNo?: string
}

interface ReminderData {
  inquiryReminderId: number
  inquiryId: number
  projectName: string
  inquiryType?: string
  inquiryStatus: string
  reminderQuestion: string
  reminderAnswer: string
  createrName: string
  createdAt: string
  userIdName: string
}

interface Inquiry {
  inquiryId: string | number
  projectName: string
  inquiryStatus: string
  description?: string
  consumer?: Consumer
  products?: Product
  brand?: Brand
  consultant?: Consultant
  followUpUser?: User
  followUpQuotation?: User
  remark?: string
  createdBy?: User
  createdAt?: string
  updatedAt?: string
  updatedBy?: User
  isWin?: boolean | null
  estimatePrice?: number
  quotationGiven?: boolean
  reminder?: boolean
  reminderData?: ReminderData | null
}

interface FormData {
  projectName: string
  inquiryStatus: string
  consumerId: string | number
  brandIds?: (string | number)[]
  productIds: (string | number)[]
  consultantId: string | number
  remark: string
  createdBy?: string | number
  followUpUser: string | number
  followUpQuotation: string | number
  description: string
  estimatePrice?: number
}

interface SelectOption {
  value: string | number
  label: string
}

interface LocationState {
  status?: string
}

const Inquiry: React.FC = () => {
  const token = localStorage.getItem("token")
  const userId = Number.parseInt(localStorage.getItem("userId") || "0", 10)
  const [pageSize, setPageSize] = useState<number>(10)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("")
  const [selectedQuotationFilter, setSelectedQuotationFilter] = useState<string | number>("")
  const [selectedFollowUpUserFilter, setSelectedFollowUpUserFilter] = useState<string | number>("")
  const [selectedConsumerFilter, setSelectedConsumerFilter] = useState<string | number>("")
  const [selectedConsultantFilter, setSelectedConsultantFilter] = useState<string | number>("")
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | number>("")
  const [totalData, setTotalData] = useState<number>(0)
  const [followUpUserData, setFollowUpUserData] = useState<Array<{ id: string | number; active: boolean }>>([])
  const [followUpQuotationData, setFollowUpQuotationData] = useState<Array<{ id: string | number; active: boolean }>>(
    [],
  )

  const location = useLocation()
  const { status } = (location.state as LocationState) || {}

  useEffect(() => {
    if (status) {
      setSelectedStatusFilter(status)
      fetchTableData(1, search)
    }
  }, [status])

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin")
    }
  })

  const [showWinLossModal, setShowWinLossModal] = useState<boolean>(false)
  const [modalDescription, setModalDescription] = useState<string>("")
  const [isWin, setIsWin] = useState<boolean | null>(null)
  const [currentInquiryId, setCurrentInquiryId] = useState<string | number | null>(null)

  const handleButtonClick = (winStatus: boolean, inquiryId: string | number) => {
    setIsWin(winStatus)
    setCurrentInquiryId(inquiryId)
    setShowWinLossModal(true)
  }

  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderMessage, setReminderMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)

  // New state for reminder response modal
  const [showReminderResponseModal, setShowReminderResponseModal] = useState(false)
  const [selectedReminderData, setSelectedReminderData] = useState<ReminderData | null>(null)

  const handleSendReminder = async () => {
    if (!reminderMessage.trim()) {
      setError("Reminder note cannot be empty")
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const requestBody = {
        inquiryId: selectedInquiry.inquiryId,
        userId: selectedInquiry.quotationGiven ? selectedInquiry?.followUpUser.id : selectedInquiry.followUpQuotation.id,
        reminderQuestion: reminderMessage.trim(),
        createdBy: Number(userId),
      }

      const response = await fetch("https://nicoindustrial.com/api/reminder/alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("Failed to send reminder")
      }

      const data = await response.json()
      console.log("Reminder sent successfully:", data)

      setShowReminderModal(false)
      setReminderMessage("")

      alert("Reminder sent successfully!")
      // Refresh the table data to get updated reminder status
      fetchTableData(currentPage, search)
    } catch (err) {
      console.error("Error sending reminder:", err)
      setError(err.message || "Failed to send reminder")
    } finally {
      setIsSending(false)
    }
  }

  const handleModalSubmit = () => {
    if (!currentInquiryId) return

    fetch(`https://nicoindustrial.com/api/inquiry/winorloss/${currentInquiryId}?userId=${userId}&isWin=${isWin}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ description: modalDescription }),
    })
      .then((response) => {
        if (response.ok) {
          toast.success("Status updated successfully!")
          fetchTableData(currentPage, search)
        } else {
          toast.error("Error updating status.")
        }
      })
      .catch((error) => {
        toast.error("Error: " + error.message)
      })
      .finally(() => {
        setShowWinLossModal(false)
        setModalDescription("")
      })
  }

  const [selectedBrands, setSelectedBrands] = useState<SelectOption[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectOption[]>([])

  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    inquiryStatus: "",
    consumerId: "",
    productIds: [],
    consultantId: "",
    remark: "",
    createdBy: userId,
    followUpUser: "",
    followUpQuotation: "",
    description: "",
    brandIds: [],
    estimatePrice: 0,
  })

  const [formDataProduct, setformDataProduct] = useState<any>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tableData, setTableData] = useState<Inquiry[]>([])
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [editMode, setEditMode] = useState<boolean>(false)
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [search, setSearch] = useState<string>("")

  const [showProductModal, setShowProductModal] = useState<boolean>(false)
  const [showViewModal, setShowViewModal] = useState<boolean>(false)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)

  const navigate = useNavigate()
  const userRole = localStorage.getItem("userRole")
  const [quotationDescription, setQuotationDescription] = useState<string>("")
  const [followUpDescription, setFollowUpDescription] = useState<string>("")
  const [showDescriptionModal, setShowDescriptionModal] = useState<boolean>(false)
  const [descriptionText, setDescriptionText] = useState<string>("")
  const [currentDescriptionInquiryId, setCurrentDescriptionInquiryId] = useState<string | number | null>(null)
  const [descriptionInput, setDescriptionInput] = useState<string>("")
  const [selectedReminderInquiry, setSelectedReminderInquiry] = useState(null)

  // Hook for adding comments/descriptions
  const useGetCommentAdd = () => {
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const addComment = async (data: {
      description: string
      inquiryId: string | number
      createdBy: { id: string | number }
    }) => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")

        const response = await fetch(
          `https://nicoindustrial.com/api/inquiry/adddescription?isForFollowUpDescription=true`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          },
        )

        const result = await response.json()

        if (response.status === 401 || response.status === 403) {
          localStorage.clear()
          navigate("/signin")
          return null
        }

        if (response.ok) {
          toast.success("Comment added successfully", {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
          })
          return result?.data ?? null
        } else {
          toast.error(result?.message || "Failed to add comment", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            style: { backgroundColor: "red" },
          })
          return null
        }
      } catch (error) {
        console.error("Error adding comment:", error)
        toast.error("Something went wrong. Please try again later.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          style: { backgroundColor: "red" },
        })
        return null
      } finally {
        setLoading(false)
      }
    }

    return { loading, addComment }
  }

  const { loading: addDescLoading, addComment } = useGetCommentAdd()

  const handleDescriptionClick = (inquiryId: string | number, currentDescription = "") => {
    setCurrentDescriptionInquiryId(inquiryId)
    setDescriptionText(currentDescription)
    setShowDescriptionModal(true)
  }

  const handleDescriptionSubmit = async () => {
    try {
      if (!descriptionText.trim() || !currentDescriptionInquiryId) {
        toast.error("Please enter a description", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          style: { backgroundColor: "red" },
        })
        return
      }

      const data = {
        description: descriptionText,
        inquiryId: currentDescriptionInquiryId,
        createdBy: { id: userId },
      }

      await addComment(data)

      setShowDescriptionModal(false)
      setDescriptionText("")
      fetchTableData(currentPage, search)

      toast.success("Description added successfully", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
      })
    } catch (error: any) {
      console.error("Error adding description:", error)
      toast.error("Failed to add description", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      })
    }
  }

  const handleQuotationDone = async (inquiryId: string | number, followUpUserId: string | number) => {
    try {
      const response = await axios.put(
        `https://nicoindustrial.com/api/inquiry/quotation/done/${inquiryId}`,
        {
          followUpUser: followUpUserId,
          userId: userId,
          description: quotationDescription,
          isQuotationGiven: true,
          assignTo: followUpUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 200) {
        toast.success(response.data.message || "Quotation successful", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          className: "toast-success",
          style: { backgroundColor: "green" },
        })

        setQuotationDescription("")
        setshowStatusQuartationChangeModal(false)
        fetchTableData(currentPage)
      } else {
        toast.error("Error in response, status code: " + response.status, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          style: { backgroundColor: "red" },
        })
      }
    } catch (error) {
      console.error("Error marking quotation as done:", error)
      toast.error("Error failed", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      })
    }
  }

  useEffect(() => {
    if (localStorage.getItem("token") === null) {
      navigate("/")
    }
  }, [navigate])

  const handleFollowUpReassign = async (inquiryId: string | number, followUpQuotationId: string | number) => {
    try {
      const response = await axios.put(
        `https://nicoindustrial.com/api/inquiry/quotation/reassing/${inquiryId}`,
        {
          followUpQuotation: followUpQuotationId,
          userId: userId,
          description: followUpDescription,
          isQuotationGiven: false,
          assignTo: followUpQuotationId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      toast.success(response.data.message || "Follow-up reassigned successfully", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        className: "toast-success",
        style: { backgroundColor: "green" },
      })

      setshowStatusQuartationChangeModal(false)
      fetchTableData(currentPage)
    } catch (error) {
      console.error("Error reassigning follow-up:", error)
      toast.error("Error reassigning follow-up", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      })
    }
  }

  const handleDetailsClick = (id: string | number) => {
    navigate(`/inquiry/${id}`)
  }

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceSearch = (
    fetchFunction: (inputValue: string) => void,
    inputValue: string,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      fetchFunction(inputValue)
      setIsLoading(false)
    }, 500)
  }

  const handleSubmitProduct = async () => {
    try {
      const response = await axios.post(`https://nicoindustrial.com/api/product/create`, formDataProduct, {
        headers: {
          Authorization: `Bearer ${token}`,
          userId: userId.toString(),
        },
      })

      const successMessage = response.data.message || "Product created successfully!"
      setSuccessMessage(successMessage)

      setTimeout(() => setSuccessMessage(""), 3000)
      fetchDropdownOptions()
      setShowProductModal(false)
      setformDataProduct({})
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error submitting product. Please try again."
      setErrorMessage(errorMessage)

      setTimeout(() => setErrorMessage(""), 3000)
    }
  }

  const [successMessage, setSuccessMessage] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [showModalConsumer, setShowModalConsumer] = useState<boolean>(false)

  const [formDataConsumer, setFormDataConsumer] = useState<{
    consumerName: string
    emailId: string
    address: string
    contact: string
  }>({
    consumerName: "",
    emailId: "",
    address: "",
    contact: "",
  })

  const handleConsumerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormDataConsumer({ ...formDataConsumer, [name]: value })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.projectName.trim()) newErrors.projectName = "Project Name is required."
    if (!formData.inquiryStatus) newErrors.inquiryStatus = "Inquiry Status is required."
    if (!formData.description.trim()) newErrors.description = "Description is required."
    if (!formData.consumerId) newErrors.consumerId = "Consumer is required."
    if (!formData.brandIds || formData.brandIds.length === 0) newErrors.brandIds = "At least one Brand is required."
    if (!formData.productIds || formData.productIds.length === 0)
      newErrors.productIds = "At least one Product is required."
    if (!formData.consultantId) newErrors.consultantId = "Consultant is required."
    if (!formData.followUpQuotation) newErrors.followUpQuotation = "Follow-up Quotation is required."
    if (!formData.followUpUser) newErrors.followUpUser = "Follow-up User is required."
    if (!formData.remark.trim()) newErrors.remark = "Remark is required."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitConsumer = async () => {
    try {
      const response = await axios.post(`https://nicoindustrial.com/api/consumer/save`, formDataConsumer, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const successMessage = response.data.message || "Consumer saved successfully!"

      toast.success(successMessage, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        className: "toast-success",
        style: { backgroundColor: "green" },
      })

      setFormDataConsumer({
        consumerName: "",
        emailId: "",
        address: "",
        contact: "",
      })
      setShowModalConsumer(false)
      fetchDropdownOptions()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to save consumer. Please try again."

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        className: "toast-error",
        style: { backgroundColor: "red" },
      })
    }
  }

  const handleCloseConsumer = () => {
    setShowModalConsumer(false)
    setFormDataConsumer({
      consumerName: "",
      emailId: "",
      address: "",
      contact: "",
    })
    setFormErrors({})
    setErrorMessage("")
    setSuccessMessage("")
  }

  const [consultantformData, setconsultantFormData] = useState<{
    consultantName: string
    contactPerson: string
    contactNumber: string
    createdBy: { id: number }
  }>({
    consultantName: "",
    contactPerson: "",
    contactNumber: "",
    createdBy: { id: userId },
  })

  const [message, setMessage] = useState<string>("")
  const [messageType, setMessageType] = useState<string>("")
  const [showModalConsultant, setShowModalConsultant] = useState<boolean>(false)
  const [consltanterrors, setConsultantErrors] = useState<Record<string, string>>({})

  const handleCloseConsultant = () => {
    setShowModalConsultant(false)
    setconsultantFormData({
      consultantName: "",
      contactPerson: "",
      contactNumber: "",
      createdBy: { id: userId },
    })
    setConsultantErrors({})
    setMessage("")
    setMessageType("")
  }

  const handleConsultantInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setconsultantFormData({
      ...consultantformData,
      [name]: value,
    })
  }

  const validateConsultantFields = () => {
    const consltanterrors: Record<string, string> = {}
    if (!consultantformData.consultantName) {
      consltanterrors.consultantName = "Consultant Name is required."
    }
    if (!consultantformData.contactPerson) {
      consltanterrors.contactPerson = "Contact Person is required."
    }
    if (!consultantformData.contactNumber) {
      consltanterrors.contactNumber = "Contact Number is required."
    }
    setConsultantErrors(consltanterrors)
    return Object.keys(consltanterrors).length === 0
  }

  const getValidationClass = (fieldName: string) => {
    return consltanterrors[fieldName] ? "is-invalid" : ""
  }

  const consultantHandleSubmit = async () => {
    const isValid = validateConsultantFields()
    if (!isValid) {
      return
    }

    try {
      const response = await axios.post(`https://nicoindustrial.com/api/consultant/save`, consultantformData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const successMessage = response.data.message || "Consultant saved successfully!"

      toast.success(successMessage, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        className: "toast-success",
        style: { backgroundColor: "green" },
      })

      setconsultantFormData({
        consultantName: "",
        contactPerson: "",
        contactNumber: "",
        createdBy: { id: userId },
      })

      handleCloseConsultant()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to save consultant. Please try again."

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        className: "toast-error",
        style: { backgroundColor: "red" },
      })
    }
  }

  const [newUserData, setNewUserData] = useState<{
    userId: string
    name: string
    email: string
    password: string
    designation: string
    roleId: string | number
    mobileNo: string
  }>({
    userId: "",
    name: "",
    email: "",
    password: "",
    designation: "",
    roleId: "",
    mobileNo: "",
  })

  const [showUserModal, setShowUserModal] = useState<boolean>(false)

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/roles/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const rolesData = response.data.data.roles
      const rolesArray = rolesData.map((role: any) => ({
        id: role.Id,
        name: role.name.trim(),
      }))

      setRoleOptions(rolesArray)
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const [roleOptions, setRoleOptions] = useState<Array<{ id: string | number; name: string }>>([])

  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewUserData({ ...newUserData, [name]: value })
  }

  const handleSubmitNewUser = async () => {
    const submissionData = {
      id: newUserData.userId,
      name: newUserData.name,
      email: newUserData.email,
      password: newUserData.password || undefined,
      designation: newUserData.designation,
      role: { id: newUserData.roleId },
      mobileNo: newUserData.mobileNo,
    }

    try {
      const response = await axios.post(`https://nicoindustrial.com/api/user/signup`, submissionData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const successMessage = response.data.message || "User saved successfully!"

      toast.success(successMessage, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        className: "toast-success",
        style: { backgroundColor: "green" },
      })

      setNewUserData({
        userId: "",
        name: "",
        email: "",
        password: "",
        designation: "",
        roleId: "",
        mobileNo: "",
      })

      fetchDropdownOptions()
      setShowUserModal(false)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to save new user. Please try again."

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        className: "toast-error",
        style: { backgroundColor: "red" },
      })

      console.error("Error saving new user:", error)
    }
  }

  const [isFollowUpUser, setIsFollowUpUser] = useState<boolean>(true)

  useEffect(() => {
    fetchTableData(currentPage, search)
  }, [currentPage, search, pageSize])

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStatus = e.target.value
    setSelectedStatusFilter(selectedStatus)
  }

  const handleQuotationFilterChange = (value: string | number) => {
    setSelectedQuotationFilter(value)
    setCurrentPage(1)
  }

  const handleFollowUpUserFilterChange = (value: string | number) => {
    setSelectedFollowUpUserFilter(value)
    setCurrentPage(1)
  }

  const handleConsumerFilterChange = (value: string | number) => {
    setSelectedConsumerFilter(value)
    setCurrentPage(1)
  }

  const handleConsultantFilterChange = (value: string | number) => {
    setSelectedConsultantFilter(value)
    setCurrentPage(1)
  }

  const handleBrandFilterChange = (value: string | number) => {
    setSelectedBrandFilter(value)
    setCurrentPage(1)
  }

  useEffect(() => {
    fetchTableData(1, search)
  }, [
    selectedStatusFilter,
    selectedQuotationFilter,
    selectedFollowUpUserFilter,
    selectedConsumerFilter,
    selectedConsultantFilter,
    selectedBrandFilter,
    search,
  ])

  const fetchTableData = async (page: number, searchQuery = "", winloss = "", istotal = true) => {
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/inquiry/all`, {
        params: {
          page: page,
          size: pageSize,
          search: searchQuery,
          userId: userId,
          "inquiry-status": selectedStatusFilter || status || "",
          followUpQuotationId: selectedQuotationFilter || "",
          followUpUserId: selectedFollowUpUserFilter || "",
          consumerId: selectedConsumerFilter || "",
          consultantId: selectedConsultantFilter || "",
          brandId: selectedBrandFilter || "",
          winorloss: winloss,
          isfortotal: istotal,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log(response)

      const inquiryContent = response.data.data.inquiries.content
      const userData = inquiryContent.map((inquiry: Inquiry) => ({
        id: inquiry.followUpUser?.id || "N/A",
        active: inquiry.followUpUser?.active || false,
      }))

      const quotationData = inquiryContent.map((inquiry: Inquiry) => ({
        id: inquiry.followUpQuotation?.id || "N/A",
        active: inquiry.followUpQuotation?.active || false,
      }))

      setFollowUpUserData(userData)
      setFollowUpQuotationData(quotationData)

      setTotalData(response.data.data.totalItems)
      setTableData(inquiryContent)
      setTotalPages(response.data.data.totalPages)
      console.log("tebledata", tableData)
      console.log("totalData", totalData)
    } catch (error) {
      console.error("Error fetching table data:", error)
    }
  }

  const fetchDropdownOptions = async () => {
    try {
      const [consumers, products, consultants, users] = await Promise.all([
        axios.get(`https://nicoindustrial.com/api/consumer/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`https://nicoindustrial.com/api/product/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`https://nicoindustrial.com/api/consultant/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`https://nicoindustrial.com/api/user/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      setConsumerOptions(consumers.data.data.consumers)
      setConsultantOptions(consultants.data.data.Consultants)
      setUserOptions(users.data.data.list)
    } catch (error) {
      console.error("Error fetching dropdown options:", error)
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersResponse, consumersResponse, consultantsResponse] = await Promise.all([
          axios.get(`https://nicoindustrial.com/api/user/list`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`https://nicoindustrial.com/api/consumer/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`https://nicoindustrial.com/api/consultant/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const formattedUserOptions = usersResponse.data.data.list.map((user: User) => ({
          value: user.id,
          label: user.name,
        }))
        setUserOptions(formattedUserOptions)

        setConsumerOptions(consumersResponse.data.data.consumers)
        setConsultantOptions(consultantsResponse.data.data.Consultants)
      } catch (error) {
        console.error("Error fetching initial data:", error)
      }
    }

    fetchInitialData()
  }, [token])

  const handleModalClose = () => {
    setShowCreateModal(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      let response
      if (editMode) {
        const updateData = { ...formData, updatedBy: userId }
        response = await axios.put(`https://nicoindustrial.com/api/inquiry/update/${selectedInquiryId}`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } else {
        response = await axios.post(`https://nicoindustrial.com/api/inquiry/save`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }

      const successMessage = response.data.message || "Inquiry processed successfully!"

      toast.success(successMessage, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
      })

      fetchTableData(currentPage)
      handleModalClose()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Error processing the inquiry. Please try again."

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        style: { backgroundColor: "red" },
      })
    }
  }

  const resetForm = () => {
    setFormData({
      projectName: "",
      inquiryStatus: "",
      consumerId: "",
      productIds: [],
      consultantId: "",
      remark: "",
      createdBy: userId,
      followUpUser: "",
      followUpQuotation: "",
      description: "",
      brandIds: [],
      estimatePrice: 0,
    })
    setSelectedConsumer(null)
    setSelectedBrands([])
    setSelectedProducts([])
    setSelectedConsultant(null)
    setSelectedFollowUpUser(null)
    setSelectedFollowUpQuotation(null)
    setErrors({})
    setEditMode(false)
    setSelectedInquiryId(null)
  }

  const handleEdit = (inquiry: Inquiry) => {
    setSelectedInquiryId(inquiry.inquiryId)

    const brandIds = inquiry.products
      ? [...new Set(inquiry.products.map((product) => product.brand?.brandId))].filter(Boolean)
      : []

    const productIds = inquiry.products ? inquiry.products.map((product) => product.productId) : []

    setFormData({
      projectName: inquiry.projectName,
      inquiryStatus: inquiry.inquiryStatus,
      consumerId: inquiry.consumer ? inquiry.consumer.consumerId : "",
      brandIds: brandIds,
      productIds: productIds,
      consultantId: inquiry.consultant ? inquiry.consultant.consultantId : "",
      remark: inquiry.remark || "",
      followUpUser: inquiry.followUpUser ? inquiry.followUpUser.id : "",
      followUpQuotation: inquiry.followUpQuotation ? inquiry.followUpQuotation.id : "",
      description: inquiry.description || "",
      estimatePrice: inquiry.estimatePrice || 0,
    })

    setSelectedConsumer(
      inquiry.consumer
        ? {
            value: inquiry.consumer.consumerId,
            label: inquiry.consumer.consumerName,
          }
        : null,
    )

    if (inquiry.products && inquiry.products.length > 0) {
      const uniqueBrands = [
        ...new Map(
          inquiry.products
            .filter((product) => product.brand)
            .map((product) => [
              product.brand?.brandId,
              {
                value: product.brand?.brandId,
                label: product.brand?.brandName,
              },
            ]),
        ).values(),
      ]

      setSelectedBrands(uniqueBrands)

      const brandIdsString = uniqueBrands.map((brand) => brand.value).join(",")
      if (brandIdsString) {
        fetchProductsByBrands(brandIdsString)
      }
    } else {
      setSelectedBrands([])
    }

    if (inquiry.products && inquiry.products.length > 0) {
      const productOptions = inquiry.products.map((product) => ({
        value: product.productId,
        label: product.productName,
      }))

      setSelectedProducts(productOptions)
    } else {
      setSelectedProducts([])
    }

    setSelectedConsultant(
      inquiry.consultant
        ? {
            value: inquiry.consultant.consultantId,
            label: inquiry.consultant.consultantName,
          }
        : null,
    )

    setSelectedFollowUpUser(
      inquiry.followUpUser ? { value: inquiry.followUpUser.id, label: inquiry.followUpUser.name } : null,
    )

    setSelectedFollowUpQuotation(
      inquiry.followUpQuotation
        ? {
            value: inquiry.followUpQuotation.id,
            label: inquiry.followUpQuotation.name,
          }
        : null,
    )

    setEditMode(true)
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      try {
        const response = await axios.delete(`https://nicoindustrial.com/api/inquiry/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const successMessage = response.data.message || "Inquiry deleted successfully!"

        toast.success(successMessage, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
        })

        setTimeout(() => setSuccessMessage(""), 3000)
        fetchTableData(currentPage)
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Error deleting the inquiry. Please try again."

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          style: { backgroundColor: "red" },
        })

        setTimeout(() => setErrorMessage(""), 3000)
      }
    }
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleView = (inquiry: any) => {
    console.log("Viewing inquiry:", inquiry.inquiryId)

    navigate(`/inquiry/${inquiry.inquiryId}`)
    setSelectedInquiry(inquiry)
  }

  const [consumerOptions, setConsumerOptions] = useState<Consumer[]>([])
  const [productOptions, setProductOptions] = useState<SelectOption[]>([])
  const [consultantOptions, setConsultantOptions] = useState<Consultant[]>([])
  const [userOptions, setUserOptions] = useState<SelectOption[]>([])

  const consumerDropdownRef = useRef<HTMLDivElement>(null)
  const productDropdownRef = useRef<HTMLDivElement>(null)
  const consultantDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConsumers()
    fetchConsultants(consultantSearch)
    fetchUsers()
    fetchBrands()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [])

  const [selectedConsumer, setSelectedConsumer] = useState<SelectOption | null>(null)
  const [isLoadingConsumers, setIsLoadingConsumers] = useState<boolean>(false)

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleConsumerChange = (selectedOption: SelectOption | null) => {
    setSelectedConsumer(selectedOption)
    setFormData({
      ...formData,
      consumerId: selectedOption ? selectedOption.value : "",
    })
  }

  const handleConsumerSearch = (inputValue: string) => {
    debounceSearch(fetchConsumers, inputValue, setIsLoadingConsumers)
  }

  const [consumerSearch, setConsumerSearch] = useState("")
  const [showConsumerDropdown, setShowConsumerDropdown] = useState(false)

  const fetchConsumers = async (inputValue = "") => {
    setIsLoadingConsumers(true)
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/consumer/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: inputValue,
        },
      })
      const consumers = response.data.data.consumers.map((consumer: Consumer) => ({
        value: consumer.consumerId,
        label: consumer.consumerName,
      }))
      setConsumerOptions(response.data.data.consumers)
    } catch (error) {
      console.error("Error fetching consumers:", error)
    } finally {
      setIsLoadingConsumers(false)
    }
  }

  useEffect(() => {
    fetchConsumers(consumerSearch)
  }, [consumerSearch])

  const handleSearch = (fetchFunc: (inputValue: string) => void, inputValue: string) => {
    fetchFunc(inputValue)
  }

  const [showStatusChangeModal, setShowStatusChangeModal] = useState<boolean>(false)

  const handleStatusChange = async (inquiryId: string | number, newStatus: string) => {
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/inquiry/get/${inquiryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const inquiryData = response.data.data

      let latestDescription = ""
      if (Array.isArray(inquiryData.description) && inquiryData.description.length > 0) {
        const lastDescription = inquiryData.description[inquiryData.description.length - 1]
        latestDescription = lastDescription.description || ""
      }

      setStatusChangeData({
        ...inquiryData,
        inquiryStatus: newStatus,
        description: latestDescription,
      })

      setShowStatusChangeModal(true)
    } catch (error) {
      console.error("Error fetching inquiry details:", error)
      alert("Failed to fetch inquiry details. Please check your connection or try again.")
    }
  }

  const submitStatusChange = async () => {
    if (!isFollowUpUser && !quotationDescription) {
      setStatusChangeError("Description is required.")
      return
    }
    if (!description) {
      setStatusChangeError("Description is required.")
      return
    }

    try {
      const response = await axios.put(
        `https://nicoindustrial.com/api/inquiry/update/${statusChangeData.inquiryId}`,
        {
          ...statusChangeData,
          inquiryStatus: statusChangeData.inquiryStatus,
          description,
          updatedBy: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setSuccessMessage(response.data.message)
      setShowStatusChangeModal(false)
      setDescription("")

      setTableData((prevData) =>
        prevData.map((inquiry) =>
          inquiry.inquiryId === statusChangeData.inquiryId
            ? { ...inquiry, inquiryStatus: statusChangeData.inquiryStatus }
            : inquiry,
        ),
      )

      setTimeout(() => setSuccessMessage(""), 2000)
    } catch (error) {
      setErrorMessage("Failed to update status. Please try again.")
      setTimeout(() => setErrorMessage(""), 3000)
    }
  }

  const submitStatusDropdownChange = async () => {
    const {
      inquiryId,
      inquiryStatus,
      projectName,
      description,
      consumer,
      product,
      consultant,
      followUpUser,
      followUpQuotation,
      remark,
      updatedBy,
    } = statusChangeData

    if (!description) {
      setStatusChangeError("Description is required.")
      return
    }

    try {
      const requestData = {
        projectName,
        inquiryStatus,
        description,
        consumerId: consumer?.consumerId,
        productId: product?.productId,
        consultantId: consultant?.consultantId,
        followUpUser: followUpUser?.id,
        followUpQuotation: followUpQuotation?.id,
        remark,
        updatedBy: updatedBy?.id || userId,
      }

      const response = await axios.put(`https://nicoindustrial.com/api/inquiry/update/${inquiryId}`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      toast.success(response.data.message || "Inquiry updated successfully!", {
        position: "top-right",
        autoClose: 3000,
      })

      setShowStatusChangeModal(false)

      setTableData((prevData) =>
        prevData.map((inquiry) =>
          inquiry.inquiryId === inquiryId ? { ...inquiry, inquiryStatus, description } : inquiry,
        ),
      )
    } catch (error: any) {
      console.error("Error updating inquiry:", error.response || error)

      toast.error(error.response?.data?.message || "Failed to update inquiry. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  const [showStatusQuartationChangeModal, setshowStatusQuartationChangeModal] = useState<boolean>(false)
  const [statusChangeData, setStatusChangeData] = useState<any>({})
  const [description, setDescription] = useState<string>("")
  const [statusChangeError, setStatusChangeError] = useState<string>("")

  const fetchProducts = async (inputValue = "") => {
    setIsLoadingProducts(true)
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/product/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: inputValue,
        },
      })
      const products = response.data.data.productList.map((product: Product) => ({
        value: product.productId,
        label: product.productName,
      }))
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const [consultantSearch, setConsultantSearch] = useState("")
  const [showConsultantDropdown, setShowConsultantDropdown] = useState(false)

  const fetchConsultants = async (inputValue = "") => {
    setIsLoadingConsultants(true)
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/consultant/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: inputValue,
        },
      })
      setConsultantOptions(response.data.data.Consultants)
    } catch (error) {
      console.error("Error fetching consultants:", error)
    } finally {
      setIsLoadingConsultants(false)
    }
  }
  useEffect(() => {
    fetchConsultants(consultantSearch)
  }, [consultantSearch])

  const [followUpSearch, setFollowUpSearch] = useState("")
  const [showFollowUpDropdown, setShowFollowUpDropdown] = useState(false)
  const [quotationSearch, setQuotationSearch] = useState("")
  const [showQuotationDropdown, setShowQuotationDropdown] = useState(false)

  const fetchUsers = async (inputValue = "") => {
    setIsLoadingUsers(true)
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/user/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: inputValue,
        },
      })
      const users = response.data.data.list.map((user: User) => ({
        value: user.id,
        label: user.name,
      }))
      setUserOptions(users)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleQuotationSearch = (inputValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      fetchFollowUpQuotations(inputValue)
    }, 500)
  }
  useEffect(() => {
    fetchUsers(followUpSearch)
  }, [followUpSearch])

  const fetchFollowUpQuotations = async (inputValue = "") => {
    setIsLoadingQuotations(true)
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/user/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: inputValue,
        },
      })

      const quotations = response.data.data.list.map((user: User) => ({
        value: user.id,
        label: user.name,
      }))

      setQuotationOptions(quotations)
    } catch (error) {
      console.error("Error fetching quotations:", error)
    } finally {
      setIsLoadingQuotations(false)
    }
  }

  const [quotationOptions, setQuotationOptions] = useState<SelectOption[]>([])
  const [isLoadingQuotations, setIsLoadingQuotations] = useState<boolean>(false)
  const [selectedFollowUpQuotation, setSelectedFollowUpQuotation] = useState<SelectOption | null>(null)

  const handleProductSearch = (inputValue: string) => {
    debounceSearch(fetchProducts, inputValue, setIsLoadingProducts)
  }

  const handleConsultantSearch = (inputValue: string) => {
    debounceSearch(fetchConsultants, inputValue, setIsLoadingConsultants)
  }
  useEffect(() => {
    fetchUsers(quotationSearch)
  }, [quotationSearch])

  const handleUserSearch = (inputValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      fetchUsers(inputValue)
    }, 500)
  }

  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false)
  const [isLoadingConsultants, setIsLoadingConsultants] = useState<boolean>(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false)

  const [selectedProduct, setSelectedProduct] = useState<SelectOption | null>(null)
  const [selectedConsultant, setSelectedConsultant] = useState<SelectOption | null>(null)
  const [selectedFollowUpUser, setSelectedFollowUpUser] = useState<SelectOption | null>(null)

  const isModalOpen =
    showViewModal ||
    showCreateModal ||
    showProductModal ||
    showModalConsumer ||
    showModalConsultant ||
    showUserModal ||
    showWinLossModal ||
    showStatusQuartationChangeModal ||
    showDescriptionModal ||
    showReminderResponseModal

  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([])
  const [selectedBrand, setSelectedBrand] = useState<SelectOption | null>(null)
  const [isLoadingBrands, setIsLoadingBrands] = useState<boolean>(false)
  const [brandSearch, setBrandSearch] = useState("")
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)

  const fetchBrands = async (searchQuery = "") => {
    setIsLoadingBrands(true)
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/brand/list`, {
        params: {
          search: searchQuery,
          page: 1,
          size: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const brands = response.data.data.brands.map((brand: Brand) => ({
        value: brand.brandId,
        label: brand.brandName,
      }))
      setBrandOptions(brands)
    } catch (error) {
      console.error("Error fetching brands:", error)
    } finally {
      setIsLoadingBrands(false)
    }
  }

  const fetchProductsByBrand = async (brandId: string | number) => {
    if (!brandId) return
    setIsLoadingProducts(true)
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/product/listByBrands`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          brandIds: brandId,
        },
      })
      console.log(response.data)
      const products = response.data.data.map((product: Product) => ({
        value: product.productId,
        label: `${product.productName}${product.price ? ` - $${product.price}` : ""}`,
      }))
      setProductOptions(products)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleBrandChange = (selectedOptions: readonly SelectOption[]) => {
    const options = selectedOptions as SelectOption[]
    setSelectedBrands(options)
    setFormData({
      ...formData,
      brandIds: options.map((option) => option.value),
    })

    if (options.length > 0) {
      const brandIds = options.map((option) => option.value).join(",")
      fetchProductsByBrands(brandIds)
    } else {
      setSelectedProducts([])
      setProductOptions([])
      setFormData((prev) => ({
        ...prev,
        productIds: [],
      }))
    }
  }

  const handleProductChange = (selectedOptions: readonly SelectOption[]) => {
    const options = selectedOptions as SelectOption[]
    setSelectedProducts(options)
    setFormData({
      ...formData,
      productIds: options.map((option) => option.value),
    })
  }

  const fetchProductsByBrands = async (brandIds: string | number) => {
    if (!brandIds) return
    setIsLoadingProducts(true)
    try {
      const response = await axios.get(`https://nicoindustrial.com/api/product/listByBrands`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          brandIds: brandIds,
        },
      })
      const products = response.data.data.map((product: Product) => ({
        value: product.productId,
        label: `${product.productName}${product.price ? ` - $${product.price}` : ""}`,
      }))
      setProductOptions(products)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleBrandSearch = (inputValue: string) => {
    fetchBrands(inputValue)
  }

  useEffect(() => {
    fetchBrands(brandSearch)
  }, [brandSearch])

  const [month, setMonth] = useState<string>("")
  const [year, setYear] = useState<string>("")

  const handleExport = async () => {
    if (!month || !year) {
      alert("Please select both month and year.")
      return
    }

    try {
      const response = await axios.get(`https://nicoindustrial.com/api/inquiry/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year },
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `inquiry_${month}_${year}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Error downloading the Excel file:", error)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      fetchFollowUpQuotations()
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isModalOpen])

  const role = localStorage.getItem("userRole")

  return (
    <div className="max-w-7xl mx-auto p-3 rounded-lg dark:text-white">
      {/* Filters */}
      <div className="max-w-6xl flex flex-wrap gap-4 mb-3">
        <div className="flex flex-col w-full sm:w-1/5">
          <label className="mb-1 font-medium">Filter by Status</label>
          <select
            value={selectedStatusFilter}
            onChange={handleStatusFilterChange}
            className="p-2 border border-black dark:border-white rounded"
          >
            <option value="">All</option>
            <option value="TENDER">Tender</option>
            <option value="PURCHASE">Purchase</option>
            <option value="PROCUREMENT">Procurement</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        {role === "Admin" ? (
          <>
            {/* Filter by Quotation - Searchable Dropdown */}
            <div className="mb-4 w-full sm:w-1/4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Filter by Quotation
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search quotations..."
                  value={quotationSearch}
                  onChange={(e) => {
                    setQuotationSearch(e.target.value)
                    setShowQuotationDropdown(true)
                  }}
                  onFocus={() => setShowQuotationDropdown(true)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 p-2 rounded pr-8 dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Selected quotation display */}
                {selectedQuotationFilter && !showQuotationDropdown && (
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded flex justify-between items-center dark:bg-blue-900 dark:border-blue-700">
                    <span className="text-blue-800 dark:text-blue-100">
                      {userOptions.find((u) => u.value === selectedQuotationFilter)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleQuotationFilterChange("")
                        setQuotationSearch("")
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Dropdown list */}
                {showQuotationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-700 dark:border-gray-600">
                    {userOptions.filter((option) => option.label.toLowerCase().includes(quotationSearch.toLowerCase()))
                      .length > 0 ? (
                      [
                        <div
                          key="all"
                          onClick={() => {
                            handleQuotationFilterChange("")
                            setQuotationSearch("")
                            setShowQuotationDropdown(false)
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            selectedQuotationFilter === ""
                              ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          All
                        </div>,
                        ...userOptions
                          .filter((option) => option.label.toLowerCase().includes(quotationSearch.toLowerCase()))
                          .map((option) => (
                            <div
                              key={option.value}
                              onClick={() => {
                                handleQuotationFilterChange(option.value)
                                setQuotationSearch(option.label)
                                setShowQuotationDropdown(false)
                              }}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                                selectedQuotationFilter === option.value
                                  ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {option.label}
                            </div>
                          )),
                      ]
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        No quotations found matching "{quotationSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filter by Follow Up - Searchable Dropdown */}
            <div className="mb-4 w-full sm:w-[25.1%]">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Filter by Follow Up
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search follow ups..."
                  value={followUpSearch}
                  onChange={(e) => {
                    setFollowUpSearch(e.target.value)
                    setShowFollowUpDropdown(true)
                  }}
                  onFocus={() => setShowFollowUpDropdown(true)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 p-2 rounded pr-8 dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Selected follow up display */}
                {selectedFollowUpUserFilter && !showFollowUpDropdown && (
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded flex justify-between items-center dark:bg-blue-900 dark:border-blue-700">
                    <span className="text-blue-800 dark:text-blue-100">
                      {userOptions.find((u) => u.value === selectedFollowUpUserFilter)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleFollowUpUserFilterChange("")
                        setFollowUpSearch("")
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Dropdown list */}
                {showFollowUpDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-700 dark:border-gray-600">
                    {userOptions.filter((option) => option.label.toLowerCase().includes(followUpSearch.toLowerCase()))
                      .length > 0 ? (
                      [
                        <div
                          key="all"
                          onClick={() => {
                            handleFollowUpUserFilterChange("")
                            setFollowUpSearch("")
                            setShowFollowUpDropdown(false)
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedFollowUpUserFilter === "" ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                        >
                          All
                        </div>,
                        ...userOptions
                          .filter((option) => option.label.toLowerCase().includes(followUpSearch.toLowerCase()))
                          .map((option) => (
                            <div
                              key={option.value}
                              onClick={() => {
                                handleFollowUpUserFilterChange(option.value)
                                setFollowUpSearch(option.label)
                                setShowFollowUpDropdown(false)
                              }}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedFollowUpUserFilter === option.value ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                            >
                              {option.label}
                            </div>
                          )),
                      ]
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        No options found matching "{followUpSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filter by Consumer - Searchable Dropdown */}
            <div className="mb-4 w-full sm:w-1/4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Filter by Consumer</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search consumers..."
                  value={consumerSearch}
                  onChange={(e) => {
                    setConsumerSearch(e.target.value)
                    setShowConsumerDropdown(true)
                  }}
                  onFocus={() => setShowConsumerDropdown(true)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 p-2 rounded pr-8 dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Selected consumer display */}
                {selectedConsumerFilter && !showConsumerDropdown && (
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded flex justify-between items-center dark:bg-blue-900 dark:border-blue-700">
                    <span className="text-blue-800 dark:text-blue-100">
                      {consumerOptions.find((c) => c.consumerId === selectedConsumerFilter)?.consumerName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleConsumerFilterChange("")
                        setConsumerSearch("")
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Dropdown list */}
                {showConsumerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-700 dark:border-gray-600">
                    {consumerOptions.filter((consumer) =>
                      consumer.consumerName.toLowerCase().includes(consumerSearch.toLowerCase()),
                    ).length > 0 ? (
                      [
                        <div
                          key="all"
                          onClick={() => {
                            handleConsumerFilterChange("")
                            setConsumerSearch("")
                            setShowConsumerDropdown(false)
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedConsumerFilter === "" ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                        >
                          All
                        </div>,
                        ...consumerOptions
                          .filter((consumer) =>
                            consumer.consumerName.toLowerCase().includes(consumerSearch.toLowerCase()),
                          )
                          .map((consumer) => (
                            <div
                              key={consumer.consumerId}
                              onClick={() => {
                                handleConsumerFilterChange(consumer.consumerId)
                                setConsumerSearch(consumer.consumerName)
                                setShowConsumerDropdown(false)
                              }}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedConsumerFilter === consumer.consumerId ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                            >
                              {consumer.consumerName}
                            </div>
                          )),
                      ]
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        No consumers found matching "{consumerSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filter by Consultant - Searchable Dropdown */}
            <div className="mb-4 w-full sm:w-1/4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Filter by Consultant
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search consultants..."
                  value={consultantSearch}
                  onChange={(e) => {
                    setConsultantSearch(e.target.value)
                    setShowConsultantDropdown(true)
                  }}
                  onFocus={() => setShowConsultantDropdown(true)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 p-2 rounded pr-8 dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Selected consultant display */}
                {selectedConsultantFilter && !showConsultantDropdown && (
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded flex justify-between items-center dark:bg-blue-900 dark:border-blue-700">
                    <span className="text-blue-800 dark:text-blue-100">
                      {consultantOptions.find((c) => c.consultantId === selectedConsultantFilter)?.consultantName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleConsultantFilterChange("")
                        setConsultantSearch("")
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Dropdown list */}
                {showConsultantDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-700 dark:border-gray-600">
                    {consultantOptions.filter((consultant) =>
                      consultant.consultantName.toLowerCase().includes(consultantSearch.toLowerCase()),
                    ).length > 0 ? (
                      [
                        <div
                          key="all"
                          onClick={() => {
                            handleConsultantFilterChange("")
                            setConsultantSearch("")
                            setShowConsultantDropdown(false)
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedConsultantFilter === "" ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                        >
                          All
                        </div>,
                        ...consultantOptions
                          .filter((consultant) =>
                            consultant.consultantName.toLowerCase().includes(consultantSearch.toLowerCase()),
                          )
                          .map((consultant) => (
                            <div
                              key={consultant.consultantId}
                              onClick={() => {
                                handleConsultantFilterChange(consultant.consultantId)
                                setConsultantSearch(consultant.consultantName)
                                setShowConsultantDropdown(false)
                              }}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedConsultantFilter === consultant.consultantId ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                            >
                              {consultant.consultantName}
                            </div>
                          )),
                      ]
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        No consultants found matching "{consultantSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Filter by Brand - Searchable Dropdown */}
            <div className="mb-4 w-full sm:w-1/4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Filter by Brand</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value)
                    setShowBrandDropdown(true)
                  }}
                  onFocus={() => setShowBrandDropdown(true)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 p-2 rounded pr-8 dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Selected brand display */}
                {selectedBrandFilter && !showBrandDropdown && (
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded flex justify-between items-center dark:bg-blue-900 dark:border-blue-700">
                    <span className="text-blue-800 dark:text-blue-100">
                      {brandOptions.find((b) => b.value === selectedBrandFilter)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleBrandFilterChange("")
                        setBrandSearch("")
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Dropdown list */}
                {showBrandDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-700 dark:border-gray-600">
                    {brandOptions.filter((brand) => brand.label.toLowerCase().includes(brandSearch.toLowerCase()))
                      .length > 0 ? (
                      [
                        <div
                          key="all"
                          onClick={() => {
                            handleBrandFilterChange("")
                            setBrandSearch("")
                            setShowBrandDropdown(false)
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedBrandFilter === "" ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                        >
                          All
                        </div>,
                        ...brandOptions
                          .filter((brand) => brand.label.toLowerCase().includes(brandSearch.toLowerCase()))
                          .map((brand) => (
                            <div
                              key={brand.value}
                              onClick={() => {
                                handleBrandFilterChange(brand.value)
                                setBrandSearch(brand.label)
                                setShowBrandDropdown(false)
                              }}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selectedBrandFilter === brand.value ? "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                            >
                              {brand.label}
                            </div>
                          )),
                      ]
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                        No brands found matching "{brandSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          ""
        )}
        <div className="flex flex-col w-full sm:w-1/4">
          <label className="mb-1 font-medium">Search</label>
          <input
            type="text"
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border border-black rounded-lg dark:border-white"
          />
        </div>
      </div>

      {/* Month/Year + Buttons */}
      <div className="max-w-6xl flex flex-wrap sm:flex-nowrap items-end gap-4 mb-6">
        {role === "Admin" ? (
          <>
            <div className="flex flex-col w-full sm:w-1/6">
              <label className="mb-1 font-medium">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="p-2 border border-black rounded-lg dark:border-white"
              >
                <option value="">All</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-full sm:w-1/4">
              <label className="mb-1 font-medium">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="p-2 border border-black rounded-lg dark:border-white"
              >
                <option value="">All</option>
                <option>2024</option>
                <option>2025</option>
                <option>2026</option>
              </select>
            </div>
            <div className="flex gap-2 mt-6 sm:mt-0 w-full sm:w-[100%]">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Export to Excel
              </button>
            </div>
          </>
        ) : (
          ""
        )}
        <div className="flex gap-2 mt-6 sm:mt-0 w-full justify-end">
          <button
            onClick={() => {
              setShowCreateModal(true), resetForm()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <FaPlus />
            Create Inquiry
          </button>
        </div>
      </div>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{errorMessage}</div>
      )}

      {/* Table */}
      <div data-aos="fade-up" className="overflow-auto custom-scroll">
        <table className="min-w-full bg-white rounded-lg">
          <thead className="bg-[#38487c] text-white dark:bg-black">
            <tr className="border border-gray-500">
              <th className="px-4 py-2 min-w-[80px]">Sr No</th>
              <th className="px-4 py-2 min-w-[200px]">Project Name</th>
              <th className="px-4 py-2 min-w-[300px]">Consumer</th>
              <th className="px-4 py-2 min-w-[400px]">Product</th>
              <th className="px-4 py-2 min-w-[130px]">Consultant</th>
              <th className="px-4 py-2 min-w-[170px]">Inquiry Status</th>
              <th className="px-4 py-2 min-w-[150px]">Win/Loss</th>
              <th className="px-4 py-2 min-w-[200px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length > 0 ? (
              tableData.map((inquiry, index) => (
                <tr
                  key={inquiry.inquiryId}
                  className={`hover:bg-gray-200 bg-white text-center dark:bg-black dark:hover:bg-gray-800 transform duration-200 ${inquiry.reminder === false && inquiry.reminderData === null ? "" : "border-2 border-red-500"}`}
                >
                  <td className="px-3 py-2 text-center">
                    {inquiry.reminder === false && inquiry.reminderData === null ? "" : <FaRegBell />}
                    {(currentPage - 1) * pageSize + (index + 1)}
                  </td>
                  <td className="px-3 py-2" title={inquiry.projectName}>
                    {inquiry.projectName.length > 25 ? `${inquiry.projectName.slice(0, 25)}...` : inquiry.projectName}
                  </td>
                  <td className="px-3 py-2">{inquiry.consumer?.consumerName || "N/A"}</td>
                  <td className="px-3 py-2">
                    {inquiry.products && inquiry.products.length > 0
                      ? inquiry.products.map((p) => p.productName).join(", ")
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2">{inquiry.consultant?.consultantName || "N/A"}</td>
                  <td className="px-3 py-2">
                    <select
                      className="p-2 text-sm border border-black dark:border-white rounded-lg w-full dark:bg-black"
                      value={inquiry.inquiryStatus}
                      onChange={(e) => handleStatusChange(inquiry.inquiryId, e.target.value)}
                    >
                      <option value="TENDER">TENDER</option>
                      <option value="PURCHASE">PURCHASE</option>
                      <option value="PROCUREMENT">PROCUREMENT</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {inquiry.isWin === null ? (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleButtonClick(true, inquiry.inquiryId)}
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          <FontAwesomeIcon icon={faThumbsUp} />
                        </button>
                        <button
                          onClick={() => handleButtonClick(false, inquiry.inquiryId)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <FontAwesomeIcon icon={faThumbsDown} />
                        </button>
                      </div>
                    ) : inquiry.isWin ? (
                      <>
                        <p className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">You Win</p>
                      </>
                    ) : (
                      <>
                        <p className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">You Loss</p>
                      </>
                    )}
                  </td>
                  <td className="px-1 py-2 text-center space-x-1">
                    <button
                      title="View"
                      onClick={() => handleView(inquiry)}
                      className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      <FaEye />
                    </button>
                    <button
                      title="Edit"
                      onClick={() => handleEdit(inquiry)}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <FaPenAlt />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDelete(inquiry.inquiryId)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <MdDelete />
                    </button>
                    {role === "Admin" && (
                      <button
                        title="Reminder"
                        onClick={() => {
                          setSelectedInquiry(inquiry)
                          setShowReminderModal(true)
                        }}
                        className="p-2 bg-[#7B5D52] shadow-lg text-white rounded hover:bg-[#7B5D52]"
                      >
                        <CiClock2 />
                      </button>
                    )}

                    {/* New Reminder Response Button */}
                    {inquiry.reminderData && (
                      <button
                        title="View Reminder Response"
                        onClick={() => {
                          setSelectedReminderData(inquiry.reminderData)
                          setShowReminderResponseModal(true)
                        }}
                        className="p-2 bg-green-600 shadow-lg text-white rounded hover:bg-green-700"
                      >
                        <BsChatSquareText />
                      </button>
                    )}

                    {inquiry.followUpQuotation?.id === userId &&
                      inquiry.isWin == null &&
                      inquiry.quotationGiven === false && (
                        <>
                          <button
                            title="Quotation Done"
                            onClick={() => {
                              setQuotationDescription("")
                              setStatusChangeData({
                                inquiryId: inquiry.inquiryId,
                                followUpQuotationId: inquiry.followUpQuotation.id,
                                followUpUserId: null,
                              })
                              setSelectedFollowUpUser({
                                value: inquiry.followUpQuotation.id,
                                label: inquiry.followUpQuotation.name,
                              })
                              setIsFollowUpUser(false)
                              setshowStatusQuartationChangeModal(true)
                            }}
                            className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                          >
                            <FaFileInvoice />
                          </button>
                        </>
                      )}

                    {inquiry.followUpUser?.id === userId &&
                      inquiry.isWin == null &&
                      inquiry.quotationGiven === true && (
                        <>
                          <button
                            title="Reassign Quotation"
                            onClick={() => {
                              setFollowUpDescription(inquiry.description || "")
                              setStatusChangeData({
                                inquiryId: inquiry.inquiryId,
                                followUpQuotationId: null,
                                followUpUserId: inquiry.followUpUser.id,
                              })
                              setSelectedFollowUpUser({
                                value: inquiry.followUpUser.id,
                                label: inquiry.followUpUser.name,
                              })
                              setIsFollowUpUser(true)
                              setshowStatusQuartationChangeModal(true)
                            }}
                            className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                          >
                            <FaUserCheck />
                          </button>
                          <button
                            title="Description"
                            onClick={() => handleDescriptionClick(inquiry.inquiryId, inquiry.description)}
                            className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                            disabled={addDescLoading}
                          >
                            <FaPenAlt />
                          </button>
                        </>
                      )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center p-4 bg-gray-300">
                  No inquiries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="max-w-6xl flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">
          Showing {tableData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
          {(currentPage - 1) * pageSize + tableData.length} of {totalData} results
        </p>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="px-3 flex py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black"
            disabled={currentPage === 1}
          >
            <MdOutlineNavigateNext className="text-2xl rotate-180" />
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = currentPage > 3 ? currentPage - 3 + i + 1 : i + 1
            if (pageNum <= totalPages) {
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded ${currentPage === pageNum ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
                >
                  {pageNum}
                </button>
              )
            }
            return null
          })}
          <button
            onClick={handleNext}
            className="px-3 flex py-1 border border-black rounded hover:bg-gray-100 dark:hover:text-black"
            disabled={currentPage === totalPages}
          >
            Next <MdOutlineNavigateNext className="text-2xl" />
          </button>
        </div>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs overflow-y-auto py-4">
          <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{editMode ? "Edit" : "Create"} Inquiry</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Project Name</label>
                <input
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Project Name"
                  className="p-3 border rounded"
                  required
                />
                {errors.projectName && <div className="text-red-500 text-sm mt-1">{errors.projectName}</div>}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Status</label>
                <select
                  name="inquiryStatus"
                  value={formData.inquiryStatus}
                  onChange={handleFormChange}
                  className="p-3 border rounded"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="TENDER">TENDER</option>
                  <option value="PURCHASE">PURCHASE</option>
                  <option value="PROCUREMENT">PROCUREMENT</option>
                  <option value="URGENT">URGENT</option>
                </select>
                {errors.inquiryStatus && <div className="text-red-500 text-sm mt-1">{errors.inquiryStatus}</div>}
              </div>

              <div className="flex flex-col col-span-2">
                <label className="mb-1 font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Description"
                  className="p-3 border rounded"
                  rows={1}
                  required
                />
                {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Consumer</label>
                <Select
                  name="consumerId"
                  value={selectedConsumer}
                  onChange={(selectedOption) => {
                    if (selectedOption?.value === "add_more") {
                      setShowModalConsumer(true)
                    } else {
                      handleConsumerChange(selectedOption)
                    }
                  }}
                  onInputChange={handleConsumerSearch}
                  options={[
                    ...consumerOptions.map((consumer) => ({
                      value: consumer.consumerId,
                      label: consumer.consumerName,
                    })),
                    { value: "add_more", label: "Add More" },
                  ]}
                  placeholder="Search and Select Consumer"
                  isLoading={isLoadingConsumers}
                  isClearable
                  className="basic-select"
                  classNamePrefix="select"
                />
                {errors.consumerId && <div className="text-red-500 text-sm mt-1">{errors.consumerId}</div>}
              </div>

              {/* Brand multi-select */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Brand(s)</label>
                <Select
                  name="brandIds"
                  value={selectedBrands}
                  onChange={handleBrandChange}
                  onInputChange={handleBrandSearch}
                  options={brandOptions}
                  placeholder="Search and Select Brands"
                  isLoading={isLoadingBrands}
                  isMulti
                  className="basic-select"
                  classNamePrefix="select"
                />
                {errors.brandIds && <div className="text-red-500 text-sm mt-1">{errors.brandIds}</div>}
              </div>

              {/* Product multi-select */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Product(s)</label>
                <Select
                  name="productIds"
                  value={selectedProducts}
                  onChange={handleProductChange}
                  onInputChange={handleProductSearch}
                  options={productOptions}
                  placeholder="Search and Select Products"
                  isLoading={isLoadingProducts}
                  isMulti
                  isDisabled={selectedBrands.length === 0}
                  className="basic-select"
                  classNamePrefix="select"
                />
                {errors.productIds && <div className="text-red-500 text-sm mt-1">{errors.productIds}</div>}
              </div>

              {/* Add estimatePrice field */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Estimated Price</label>
                <input
                  type="number"
                  name="estimatePrice"
                  value={formData.estimatePrice}
                  onChange={handleFormChange}
                  placeholder="Enter estimated price"
                  className="p-3 border rounded"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Consultant</label>
                <Select
                  name="consultantId"
                  value={selectedConsultant}
                  onChange={(selectedOption) => {
                    if (selectedOption?.value === "add_more") {
                      setShowModalConsultant(true)
                    } else {
                      setSelectedConsultant(selectedOption)
                      setFormData({
                        ...formData,
                        consultantId: selectedOption ? selectedOption.value : "",
                      })
                    }
                  }}
                  onInputChange={handleConsultantSearch}
                  options={[
                    ...consultantOptions.map((consultant) => ({
                      value: consultant.consultantId,
                      label: consultant.consultantName,
                    })),
                    { value: "add_more", label: "Add More" },
                  ]}
                  placeholder="Search and Select Consultant"
                  isLoading={isLoadingConsultants}
                  isClearable
                  className="basic-select"
                  classNamePrefix="select"
                />
                {errors.consultantId && <div className="text-red-500 text-sm mt-1">{errors.consultantId}</div>}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Follow-up Quotation</label>
                <Select
                  name="followUpQuotation"
                  value={selectedFollowUpQuotation}
                  onChange={(selectedOption) => {
                    if (selectedOption?.value === "add_more") {
                      setShowUserModal(true)
                    } else {
                      setSelectedFollowUpQuotation(selectedOption)
                      setFormData({
                        ...formData,
                        followUpQuotation: selectedOption ? selectedOption.value : "",
                      })
                    }
                  }}
                  onInputChange={handleQuotationSearch}
                  options={[...quotationOptions, { value: "add_more", label: "Add More" }]}
                  placeholder="Search and Select Follow-up Quotation"
                  isLoading={isLoadingQuotations}
                  isClearable
                  className="basic-select"
                  classNamePrefix="select"
                />
                {errors.followUpQuotation && (
                  <div className="text-red-500 text-sm mt-1">{errors.followUpQuotation}</div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Follow-up User</label>
                <Select
                  name="followUpUser"
                  value={selectedFollowUpUser}
                  onChange={(selectedOption) => {
                    if (selectedOption?.value === "add_more") {
                      setShowUserModal(true)
                    } else {
                      setSelectedFollowUpUser(selectedOption)
                      setFormData({
                        ...formData,
                        followUpUser: selectedOption ? selectedOption.value : "",
                      })
                    }
                  }}
                  onInputChange={handleUserSearch}
                  options={[...userOptions, { value: "add_more", label: "Add More" }]}
                  placeholder="Search and Select Follow-up User"
                  isLoading={isLoadingUsers}
                  isClearable
                  className="basic-select"
                  classNamePrefix="select"
                />
                {errors.followUpUser && <div className="text-red-500 text-sm mt-1">{errors.followUpUser}</div>}
              </div>

              <div className="flex flex-col col-span-2">
                <label className="mb-1 font-medium">Remark</label>
                <textarea
                  name="remark"
                  value={formData.remark}
                  onChange={handleFormChange}
                  placeholder="Remark"
                  className="p-3 border rounded"
                  rows={1}
                  required
                />
                {errors.remark && <div className="text-red-500 text-sm mt-1">{errors.remark}</div>}
              </div>

              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                    setEditMode(false)
                    setSelectedInquiryId(null)
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editMode ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedInquiry && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-3xl p-5 rounded-lg shadow-lg overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Inquiry Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Project Name:</label>
                <p className="bg-gray-100 rounded">{selectedInquiry.projectName}</p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Inquiry Status:</label>
                <p className="bg-gray-100 rounded">{selectedInquiry.inquiryStatus}</p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Consumer Name:</label>
                <p className="bg-gray-100 rounded">{selectedInquiry.consumer?.consumerName || "N/A"}</p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Product Name:</label>
                <p className="bg-gray-100 rounded">{selectedInquiry.products?.productName || "N/A"}</p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Consultant Name:</label>
                <p className="bg-gray-100 rounded">{selectedInquiry.consultant?.consultantName || "N/A"}</p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Assigned To:</label>
                <p className="bg-gray-100 rounded">{selectedInquiry.followUpUser?.name || "N/A"}</p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Quotation By:</label>
                <p className="bg-gray-100 rounded">{selectedInquiry.followUpQuotation?.name || "N/A"}</p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Created By:</label>
                <p className="bg-gray-100 rounded">{selectedInquiry.createdBy?.name || "N/A"}</p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Created At:</label>
                <p className="bg-gray-100 rounded">
                  {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>

              <div className="flex gap-2">
                <label className="mb-1 font-medium text-gray-600">Last Updated:</label>
                <p className="bg-gray-100 rounded">
                  {selectedInquiry.updatedAt ? new Date(selectedInquiry.updatedAt).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <label className="mb-1 font-medium text-gray-600">Remark:</label>
              <p className="bg-gray-100 rounded min-h-20">{selectedInquiry.remark || "N/A"}</p>
            </div>

            <div className="flex gap-2">
              <label className="mb-1 font-medium text-gray-600">Description:</label>
              <p className="bg-gray-100 rounded min-h-20">{selectedInquiry.description || "N/A"}</p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Product Name</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={formDataProduct.productName || ""}
                  onChange={(e) =>
                    setformDataProduct({
                      ...formDataProduct,
                      productName: e.target.value,
                    })
                  }
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Product Price</label>
                <input
                  type="number"
                  placeholder="Enter product price"
                  value={formDataProduct.price || ""}
                  onChange={(e) =>
                    setformDataProduct({
                      ...formDataProduct,
                      price: Number.parseFloat(e.target.value),
                    })
                  }
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consumer Modal */}
      {showModalConsumer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Consumer" : "Create Consumer"}</h2>

            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{errorMessage}</div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">
                  Consumer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Consumer Name"
                  name="consumerName"
                  value={formDataConsumer.consumerName}
                  onChange={handleConsumerInputChange}
                  className={`p-3 border rounded ${formErrors.consumerName ? "border-red-500" : ""}`}
                  required
                />
                {formErrors.consumerName && <div className="text-red-500 text-sm mt-1">{formErrors.consumerName}</div>}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter Email"
                  name="emailId"
                  value={formDataConsumer.emailId}
                  onChange={handleConsumerInputChange}
                  className={`p-3 border rounded ${formErrors.emailId ? "border-red-500" : ""}`}
                  required
                />
                {formErrors.emailId && <div className="text-red-500 text-sm mt-1">{formErrors.emailId}</div>}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Address"
                  name="address"
                  value={formDataConsumer.address}
                  onChange={handleConsumerInputChange}
                  className={`p-3 border rounded ${formErrors.address ? "border-red-500" : ""}`}
                  required
                />
                {formErrors.address && <div className="text-red-500 text-sm mt-1">{formErrors.address}</div>}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">
                  Contact <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Contact"
                  name="contact"
                  value={formDataConsumer.contact}
                  onChange={handleConsumerInputChange}
                  className={`p-3 border rounded ${formErrors.contact ? "border-red-500" : ""}`}
                  required
                />
                {formErrors.contact && <div className="text-red-500 text-sm mt-1">{formErrors.contact}</div>}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={handleCloseConsumer} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                  Close
                </button>
                <button
                  onClick={handleSubmitConsumer}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Consumer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consultant Modal */}
      {showModalConsultant && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create Consultant</h2>

            {message && (
              <div
                className={`${messageType === "success" ? "bg-green-100 border-green-400 text-green-700" : "bg-red-100 border-red-400 text-red-700"} px-4 py-3 rounded mb-4 border`}
              >
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Consultant Name</label>
                <input
                  type="text"
                  placeholder="Enter consultant name"
                  name="consultantName"
                  value={consultantformData.consultantName}
                  onChange={handleConsultantInputChange}
                  className={`p-3 border rounded ${getValidationClass("consultantName") ? "border-red-500" : ""}`}
                  required
                />
                {consltanterrors.consultantName && (
                  <div className="text-red-500 text-sm mt-1">{consltanterrors.consultantName}</div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Contact Person</label>
                <input
                  type="text"
                  placeholder="Enter contact person"
                  name="contactPerson"
                  value={consultantformData.contactPerson}
                  onChange={handleConsultantInputChange}
                  className={`p-3 border rounded ${getValidationClass("contactPerson") ? "border-red-500" : ""}`}
                  required
                />
                {consltanterrors.contactPerson && (
                  <div className="text-red-500 text-sm mt-1">{consltanterrors.contactPerson}</div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Contact Number</label>
                <input
                  type="text"
                  placeholder="Enter contact number"
                  name="contactNumber"
                  value={consultantformData.contactNumber}
                  onChange={handleConsultantInputChange}
                  className={`p-3 border rounded ${getValidationClass("contactNumber") ? "border-red-500" : ""}`}
                  required
                />
                {consltanterrors.contactNumber && (
                  <div className="text-red-500 text-sm mt-1">{consltanterrors.contactNumber}</div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={handleCloseConsultant} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                  Close
                </button>
                <button
                  onClick={consultantHandleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Consultant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs overflow-y-auto py-4">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {isFollowUpUser ? "Create Follow-up User" : "Create Follow-up Quotation"}
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  name="name"
                  value={newUserData.name}
                  onChange={handleNewUserInputChange}
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  name="email"
                  value={newUserData.email}
                  onChange={handleNewUserInputChange}
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Designation</label>
                <input
                  type="text"
                  placeholder="Enter designation"
                  name="designation"
                  value={newUserData.designation}
                  onChange={handleNewUserInputChange}
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Role</label>
                <select
                  name="roleId"
                  value={newUserData.roleId}
                  onChange={handleNewUserInputChange}
                  className="p-3 border rounded"
                  required
                >
                  <option value="">Select Role</option>
                  {roleOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Mobile No</label>
                <input
                  type="text"
                  placeholder="Enter mobile number"
                  name="mobileNo"
                  value={newUserData.mobileNo}
                  onChange={handleNewUserInputChange}
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  name="password"
                  value={newUserData.password}
                  onChange={handleNewUserInputChange}
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitNewUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save {isFollowUpUser ? "User" : "Quotation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusChangeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Change Status</h2>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Description (Required)</label>
                <textarea
                  rows={3}
                  placeholder="Enter a description for the status change"
                  value={statusChangeData.description}
                  onChange={(e) =>
                    setStatusChangeData({
                      ...statusChangeData,
                      description: e.target.value,
                    })
                  }
                  className="p-3 border rounded"
                  required
                />
                {statusChangeError && <div className="text-red-500 text-sm mt-1">{statusChangeError}</div>}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowStatusChangeModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={submitStatusDropdownChange}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quotation/Follow-up Modal */}
      {showStatusQuartationChangeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {isFollowUpUser ? "Reassign Quotation" : "Mark Quotation Done"}
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Description (Required)</label>
                <textarea
                  rows={3}
                  placeholder="Enter a description"
                  value={isFollowUpUser ? followUpDescription : quotationDescription}
                  onChange={(e) =>
                    isFollowUpUser ? setFollowUpDescription(e.target.value) : setQuotationDescription(e.target.value)
                  }
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium">
                  {isFollowUpUser ? "Follow-up User" : "Select Follow-up User"}
                </label>
                <Select
                  name="followUpUser"
                  value={selectedFollowUpUser}
                  onChange={(selectedOption) => {
                    setSelectedFollowUpUser(selectedOption)
                    setStatusChangeData((prevState: typeof statusChangeData) => ({
                      ...prevState,
                      followUpQuotationId: selectedOption ? selectedOption.value : null,
                    }))
                  }}
                  onInputChange={handleUserSearch}
                  options={[...userOptions, { value: "add_more", label: "Add More" }]}
                  placeholder="Search and Select User"
                  isLoading={isLoadingUsers}
                  isClearable
                  isSearchable
                  className="basic-select"
                  classNamePrefix="select"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setshowStatusQuartationChangeModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    isFollowUpUser
                      ? handleFollowUpReassign(
                          statusChangeData.inquiryId,
                          selectedFollowUpUser ? selectedFollowUpUser.value : statusChangeData.followUpQuotationId,
                        )
                      : handleQuotationDone(
                          statusChangeData.inquiryId,
                          selectedFollowUpUser ? selectedFollowUpUser.value : statusChangeData.followUpUserId,
                        )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Win/Loss Modal */}
      {showWinLossModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{isWin ? "Mark as Won" : "Mark as Lost"}</h2>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter description"
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowWinLossModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && selectedInquiry && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Set Reminder</h2>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">
                  Reminder To:{" "}
                  {selectedInquiry.quotationGiven
                    ? `${selectedInquiry.followUpUser.name} (ID: ${selectedInquiry.followUpUser.id})`
                    : `${selectedInquiry.followUpQuotation.name} (ID: ${selectedInquiry.followUpQuotation.id})`}
                </label>
                <label className="mb-1 font-medium">Reminder Note</label>
                <textarea
                  rows={3}
                  placeholder="Enter reminder note"
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="p-3 border rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowReminderModal(false)
                    setReminderMessage("")
                    setError(null)
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReminder}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Set Reminder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Reminder Response Modal */}
      {showReminderResponseModal && selectedReminderData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Reminder Response</h2>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Project Details</h3>
                <p>
                  <strong>Project:</strong> {selectedReminderData.projectName}
                </p>
                <p>
                  <strong>Status:</strong> {selectedReminderData.inquiryStatus}
                </p>
                <h3 className="font-semibold text-gray-700 mt-4 mb-2">Reminder Information</h3>
                <p>
                  <strong>Created by:</strong> {selectedReminderData.createrName}
                </p>
                <p>
                  <strong>Assigned to:</strong> {selectedReminderData.userIdName}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedReminderData.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">Reminder Question</h3>
                <p className="text-gray-800">{selectedReminderData.reminderQuestion}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">Response</h3>
                <p className="text-gray-800">{selectedReminderData.reminderAnswer}</p>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowReminderResponseModal(false)
                    setSelectedReminderData(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-[#00000071] backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Add Description</h2>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Description</label>
                <textarea
                  rows={5}
                  placeholder="Enter description"
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  className="p-3 border rounded w-full"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowDescriptionModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDescriptionSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={addDescLoading}
                >
                  {addDescLoading ? "Saving..." : "Save Description"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

export default Inquiry
