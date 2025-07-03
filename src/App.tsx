import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Inquiry from "./pages/Dashboard/Inquiry";
import Product from "./pages/Dashboard/Product";
import Consumer from "./pages/Dashboard/Consumer";
import Consultant from "./pages/Dashboard/Consultant";
import GeneralFollowUp from "./pages/Dashboard/GeneralFollowUp";
import Brand from "./pages/Dashboard/Brand";
import Users from "./pages/Dashboard/Users";
import Role from "./pages/Dashboard/Role";
import Analytics from "./pages/Dashboard/Analytics";
import { ToastContainer } from "react-toastify";
import InquiryView from "./pages/Dashboard/InquiryView";
import Notification from "./pages/Dashboard/Notification";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";
import ForgotPassword from "./components/auth/ForgotPassword";

export default function App() {
  const token = localStorage.getItem("token");
  useEffect(() => {
    AOS.init({
      offset: 0,
      delay: 100,
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <>
      <ToastContainer autoClose={3000} position="top-right" limit={1} hideProgressBar theme="colored" closeOnClick pauseOnHover draggable pauseOnFocusLoss draggablePercent={60} />
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route index path="/inquiry" element={<Inquiry />} />
            <Route index path="/product" element={<Product />} />
            <Route index path="/consumer" element={<Consumer />} />
            <Route index path="/consultant" element={<Consultant />} />
            <Route index path="/general-follow-up" element={<GeneralFollowUp />} />
            <Route index path="/brand" element={<Brand />} />
            <Route index path="/role" element={<Role />} />
            <Route index path="/users" element={<Users />} />
            <Route index path="/analytics" element={<Analytics />} />
            <Route path="/inquiry/:inquiryId" element={<InquiryView />} />
            <Route path="/allnotification" element={<Notification />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ForgotPassword />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
