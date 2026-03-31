import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const DOCUMENT_TYPES = [
  "ID Document",
  "Proof of Address",
  "Qualification / Certificate",
  "Company Registration",
  "Bank Confirmation Letter",
];

export default function ContractorDocuments() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [file, setFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ----------------------------
  // LOAD USER
  // ----------------------------
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      setUser(data.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setProfile(profile);
    }

    load();
  }, []);

  // ----------------------------
  // LOAD UPLOADS
  // ----------------------------
  useEffect(() => {
    if (!user) return;

    async function loadUploads() {
      const { data } = await supabase
        .from("contractor_documents")
        .select("*")
        .eq("contractor_id", user.id)
        .order("uploaded_at", { ascending: false });

      setUploads(data || []);
    }

    loadUploads();
  }, [user]);

  // ----------------------------
  // UPLOAD DOCUMENT
  // ----------------------------
  async function uploadDocument() {
    setError(null);

    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("contractor_documents")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setLoading(false);
      return;
    }

    // Save metadata
    await supabase.from("contractor_documents").insert({
      contractor_id: user.id,
      document_type: docType,
      file_path: filePath,
    });

    setFile(null);

    const { data } = await supabase
      .from("contractor_documents")
      .select("*")
      .eq("contractor_id", user.id)
      .order("uploaded_at", { ascending: false });

    setUploads(data || []);
    setLoading(false);
  }

  if (!profile) return <p>Loading…</p>;
  if (profile.role !== "Contractor")
    return <p>Access denied</p>;

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2>Upload Verification Documents</h2>

      <p>
        Please upload the required documents to complete your
        verification. Our team will review them shortly.
      </p>

      <hr />

      <label>
        Document Type
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          {DOCUMENT_TYPES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>

      <br />
      <br />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br />
      <br />

      <button onClick={uploadDocument} disabled={loading}>
        {loading ? "Uploading…" : "Upload Document"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <hr />

      <h3>Uploaded Documents</h3>

      {uploads.length === 0 && (
        <p>No documents uploaded yet.</p>
      )}

      {uploads.map((doc) => (
        <div
          key={doc.id}
          style={{
            border: "1px solid #ccc",
            padding: 8,
            marginBottom: 6,
          }}
        >
          <strong>{doc.document_type}</strong>
          <div>
            Uploaded:{" "}
            {new Date(doc.uploaded_at).toLocaleString()}
          </div>
          <div>
            Status:{" "}
            {doc.reviewed ? "Reviewed" : "Pending review"}
          </div>
        </div>
      ))}
    </div>
  );
}
