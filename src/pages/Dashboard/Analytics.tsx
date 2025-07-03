import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import { FaArrowLeft } from "react-icons/fa";
import "chart.js/auto";
import { useNavigate } from "react-router";

const Analytics = () => {
  // Dummy data for bar chart
  const barChartData = {
    labels: ["Active Users", "Completed Inquiries", "Ongoing Inquiries", "Reminders"],
    datasets: [
      {
        label: "Analytics Data",
        data: [12, 19, 8, 5],
        backgroundColor: ["#2E073F", "#7A1CAC", "#AD49E1", "#F99417"],
      },
    ],
  };

  // Updated Pie Chart Data with Unassigned Inquiries color set to pink
  const pieChartData = {
    labels: ["Active Users", "Completed Inquiries", "Ongoing Inquiries", "Reminders", "Unassigned Inquiries"],
    datasets: [
      {
        data: [30, 15, 20, 10, 25], // Example data for the new categories
        backgroundColor: ["#7A1CAC", "#F99417", "#AD49E1", "#2E073F", "#FF69B4"], // Pink for Unassigned Inquiries
      },
    ],
  };

  // State for selected user (search functionality)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <div className="p-6">
      {/* Back Arrow Button */}
      <button onClick={() => navigate("/")} className=" flex items-center text-xl text-[#2E073F] mb-6 hover:text-[gray]">
        <FaArrowLeft size={20} className="dark:text-white" /> <span className="ml-2 dark:text-white">Back</span>
      </button>

      {/* User Search Bar */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <input
          type="text"
          placeholder="Search User"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-64 p-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[gray] dark:text-white dark:border-white"
        />

        {/* Dropdown for User Category */}
        <select value={selectedCategory} onChange={handleCategoryChange} className="w-64 p-2 border border-black rounded-md shadow-sm dark:text-white dark:border-white focus:outline-none focus:ring-2 focus:ring-[gray]">
          <option value="" className="dark:bg-black">Select Category</option>
          <option value="active" className="dark:bg-black">Active Users</option>
          <option value="completed" className="dark:bg-black">Completed Inquiries</option>
          <option value="ongoing" className="dark:bg-black">Ongoing Inquiries</option>
          <option value="reminders" className="dark:bg-black">Reminders</option>
          <option value="unassigned" className="dark:bg-black">Unassigned Inquiries</option>
        </select>
      </div>

      {/* Flexbox for Side-by-Side Charts */}
      <div className="flex gap-8 mb-8">
        {/* Bar Chart */}
        <div className="flex-1">
          <h3 className="text-center text-2xl font-semibold mb-4 dark:text-white">Analytics Bar Chart</h3>
          <div className="border border-black shadow-md rounded-lg p-4">
            <Bar data={barChartData} options={{ responsive: true }} />
          </div>
        </div>

        {/* Pie Chart with size adjustments */}
        <div className="flex-1">
          <h3 className="text-center text-2xl font-semibold mb-4 dark:text-white" >Analytics Pie Chart</h3>
          <div className="border border-black shadow-md rounded-lg p-4 w-full max-w-sm mx-auto">
            {" "}
            {/* Size control for Pie Chart */}
            <Pie data={pieChartData} options={{ responsive: true }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
