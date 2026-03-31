import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  CheckCircle,
  XCircle,
  FileText,
  UserCog,
  AlertTriangle,
  ClipboardList,
  Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [pendingContractors, setPendingContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [roleUpdating, setRoleUpdating] = useState(false);

  const ROLES = [
    "Customer",
    "Contractor",
    "Scoper",
    "Inspector",
    "Admin",
    "CorporateUser",
    "CorporateAdmin"
  ];

  // Load pending contractors
  useEffect(() => {
    loadPendingContractors();
  }, []);

  async function loadPendingContractors() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "Pending");

    if (!error) setPendingContractors(data);
    setLoading(false);
  }

  // Approve contractor
  async function approveContractor(id) {
    await supabase
      .from("profiles")
      .update({ status: "Approved" })
      .eq("id", id);

    loadPendingContractors();
    setSelectedContractor(null);
  }

  // Reject contractor
  async function rejectContractor(id) {
    await supabase
      .from("profiles")
      .update({ status: "Rejected" })
      .eq("id", id);

    loadPendingContractors();
    setSelectedContractor(null);
  }

  // Update role
  async function updateRole(id, newRole) {
    setRoleUpdating(true);

    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id);

    setRoleUpdating(false);
    loadPendingContractors();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-md p-6 border-r border-gray-300">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">
          Admin Panel
        </h1>

        <nav className="space-y-4 text-gray-700">
          <button className="w-full text-left hover:text-purple-600">
            Pending Approvals
          </button>
          <button className="w-full text-left hover:text-purple-600">
            Contractors
          </button>
          <button className="w-full text-left hover:text-purple-600">
            Inspectors
          </button>
          <button className="w-full text-left hover:text-purple-600">
            Projects
          </button>
          <button className="w-full text-left hover:text-purple-600">
            Financials
          </button>
          <button className="w-full text-left hover:text-purple-600">
            Emergency Jobs
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">

        {/* HEADER */}
        <h2 className="text-4xl font-bold text-gray-800 mb-10 flex items-center gap-3">
          <ClipboardList />
          Pending Contractor Approvals
        </h2>

        {/* LOADING */}
        {loading && (
          <div className="flex items-center gap-3 text-purple-600">
            <Loader2 className="animate-spin" />
            Loading contractors...
          </div>
        )}

        {/* TABLE */}
        {!loading && pendingContractors.length === 0 && (
          <p className="text-gray-600 italic">
            No pending contractor applications.
          </p>
        )}

        {!loading && pendingContractors.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-200">

            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-purple-700">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pendingContractors.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-purple-50">
                    <td className="p-3">{u.full_name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3 flex gap-3">
                      <button
                        className="text-green-600 hover:text-green-800"
                        onClick={() => setSelectedContractor(u)}
                      >
                        <UserCog size={20} />
                      </button>
                      <button
                        className="text-purple-600 hover:text-purple-800"
                        onClick={() => approveContractor(u.id)}
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => rejectContractor(u.id)}
                      >
                        <XCircle size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CONTRACTOR DETAILS MODAL */}
        {selectedContractor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-xl border border-purple-300">

              <h3 className="text-3xl font-bold text-purple-700 mb-6">
                Manage Contractor
              </h3>

              <p><strong>Name:</strong> {selectedContractor.full_name}</p>
              <p><strong>Email:</strong> {selectedContractor.email}</p>
              <p><strong>Current Role:</strong> {selectedContractor.role}</p>

              <hr className="my-6" />

              {/* ROLE UPDATE */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2 font-medium">
                  Change Role
                </label>
                <select
                  className="p-3 border rounded w-full"
                  onChange={(e) =>
                    updateRole(selectedContractor.id, e.target.value)
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* DOCUMENTS */}
              <div className="mt-6">
                <h4 className="font-bold text-lg mb-3 text-gray-700">
                  Uploaded Documents
                </h4>

                <div className="flex flex-col gap-3">
                  <button className="flex items-center gap-2 text-purple-600 hover:text-purple-800">
                    <FileText size={18} />
                    View ID Document
                  </button>

                  <button className="flex items-center gap-2 text-purple-600 hover:text-purple-800">
                    <FileText size={18} />
                    View Proof of Address
                  </button>

                  <button className="flex items-center gap-2 text-purple-600 hover:text-purple-800">
                    <FileText size={18} />
                    View Work Portfolio
                  </button>
                </div>
              </div>

              {/* CLOSE BUTTON */}
              <div className="mt-10 text-right">
                <button
                  onClick={() => setSelectedContractor(null)}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
