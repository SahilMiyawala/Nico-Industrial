"use client"

import { useState } from "react"
import { toast } from "react-toastify"

interface AddCommentData {
  description: string
  inquiryId: string | number
  createdBy: { id: string | number }
}

const useGetCommentAdd = () => {
  const [loading, setLoading] = useState(false)

  const addComment = async (data: AddCommentData) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        toast.error("Authentication token not found. Please login again.")
        return null
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "https://nicoindustrial.com/api"}/inquiry/adddescription?isForFollowUpDescription=true`,
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

      // Handle unauthorized responses
      if (response.status === 401 || response.status === 403) {
        localStorage.clear()
        window.location.href = "/signin"
        return null
      }

      if (response.ok) {
        toast.success("Description added successfully", {
          position: "top-right",
          autoClose: 2000,
        })
        return result?.data ?? null
      } else {
        toast.error(result?.message || "Failed to add description", {
          position: "top-right",
          autoClose: 3000,
        })
        return null
      }
    } catch (error) {
      console.error("Error adding description:", error)
      toast.error("Network Error: Something went wrong. Please try again later.", {
        position: "top-right",
        autoClose: 3000,
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    addComment,
  }
}

export default useGetCommentAdd
