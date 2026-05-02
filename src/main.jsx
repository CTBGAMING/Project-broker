import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";

/* =======================
   CORE
======================= */
import App from "./App";
import Home from "./views/home";

/* =======================
   AUTH
======================= */
import Auth from "./views/auth";
import Login from "./views/auth/Login";
import Register from "./views/auth/Register";

/* =======================
   DASHBOARD ROUTER
======================= */
import DashboardRouter from "./views/dashboards";

/* =======================
   CUSTOMER
======================= */
import CustomerHome from "./views/customer/Home";
import CustomerDashboard from "./views/dashboards/CustomerDashboard";
import EventCustomerDashboard from "./views/dashboards/EventCustomerDashboard";
import RFQCustomerDashboard from "./views/dashboards/RFQCustomerDashboard"; // 🔥 NEW: RFQ Dashboard Import
import CustomerDisputes from "./views/customer/Disputes";

/* =======================
   PAYMENTS
======================= */
import ProjectCheckout from "./views/payments/ProjectCheckout";
import PaymentSuccess from "./views/payments/PaymentSuccess";
import PaymentCancel from "./views/payments/PaymentCancel";
import PaymentFailure from "./views/payments/PaymentFailure";

/* ✅ TRADESAFE CHECKOUT */
import TradeSafeCheckout from "./views/payments/TradeSafeCheckout";

/* =======================
   INVOICES (TRADESAFE)
======================= */
import InvoiceView from "./views/invoices/InvoiceView";

/* =======================
   PROFESSIONAL
======================= */
import ContractorDashboard from "./views/dashboards/ContractorDashboard";
import ScoperDashboard from "./views/dashboards/scoper";
import InspectorDashboard from "./views/dashboards/InspectorDashboard";

/* =======================
   ADMIN
======================= */
import AdminLayout from "./views/dashboards/admin/AdminLayout";
import AdminUsers from "./views/dashboards/admin/AdminUsers";
import AdminProjects from "./views/dashboards/admin/AdminProjects";
import AdminScopers from "./views/dashboards/admin/AdminScopers";
import ScoperAssignments from "./views/dashboards/admin/ScoperAssignments";
import AdminSettings from "./views/dashboards/admin/AdminSettings";
import AdminCoupons from "./views/dashboards/admin/AdminCoupons";
import AdminApprovals from "./views/dashboards/admin/AdminApprovals";
import AdminInspectionFees from "./views/dashboards/admin/AdminInspectionFees";

/* =======================
   ERROR PAGE
======================= */
function ErrorPage() {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        backgroundColor: "#0f172a",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#D4AF37" }}>404 - Page Not Found</h1>
      <p>The page you’re trying to access does not exist.</p>
      <a href="/" style={{ color: "#D4AF37", textDecoration: "underline" }}>
        Return Home
      </a>
    </div>
  );
}

/* =======================
   ROUTER
======================= */
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },

      /* ---------- DASHBOARD ENTRY ---------- */
      {
        path: "dashboard",
        element: <DashboardRouter />,
      },

      /* ---------- AUTH ---------- */
      {
        path: "auth",
        element: <Auth />,
        children: [
          { index: true, element: <Login /> },
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
        ],
      },

      /* ---------- CUSTOMER ---------- */
      { path: "customer/home", element: <CustomerHome /> },
      { path: "customer/construction", element: <CustomerDashboard /> },
      { path: "customer/construction/assistant", element: <CustomerDashboard /> },
      { path: "customer/events", element: <EventCustomerDashboard /> },
      { path: "customer/events/assistant", element: <EventCustomerDashboard /> },
      
      /* 🔥 NEW: Corporate RFQ Routes */
      { path: "customer/rfq", element: <RFQCustomerDashboard /> },
      { path: "customer/rfq/assistant", element: <RFQCustomerDashboard /> },
      
      { path: "customer/disputes", element: <CustomerDisputes /> },

      /* ---------- PAYMENTS ---------- */
      { path: "checkout/project/:projectId", element: <ProjectCheckout /> },

      /* ✅ TRADESAFE CHECKOUT (ESCROW) */
      { path: "checkout/tradesafe/:projectId", element: <TradeSafeCheckout /> },

      { path: "payment-success", element: <PaymentSuccess /> },
      { path: "payment-cancel", element: <PaymentCancel /> },
      { path: "payment-failure", element: <PaymentFailure /> },

      /* ---------- INVOICES (TRADESAFE) ---------- */
      { path: "invoices/:invoiceId", element: <InvoiceView /> },

      /* ---------- PROFESSIONAL ---------- */
      { path: "dashboard/contractor", element: <ContractorDashboard /> },
      { path: "dashboard/scoper", element: <ScoperDashboard /> },
      { path: "dashboard/inspector", element: <InspectorDashboard /> },

      /* ---------- ADMIN ---------- */
      {
        path: "dashboard/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminProjects /> },
          { path: "users", element: <AdminUsers /> },
          { path: "assignments", element: <ScoperAssignments /> },
          { path: "projects", element: <AdminProjects /> },
          { path: "scopers", element: <AdminScopers /> },
          { path: "approvals", element: <AdminApprovals /> },
          { path: "inspection-fees", element: <AdminInspectionFees /> },
          { path: "coupons", element: <AdminCoupons /> },
          { path: "settings", element: <AdminSettings /> },
        ],
      },
    ],
  },
]);

// 🔥 FIXED: Removed <React.StrictMode> to prevent the double-fire Auth refresh token loop
ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);