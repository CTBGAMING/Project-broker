
import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function UploadButton({ onUpload, folder = 'general', label = 'Upload Photo' }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const filePath = `${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('uploads').upload(filePath, file);
    setUploading(false);
    if (error) { alert('Upload failed: '+error.message); return; }
    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
    onUpload(publicUrlData.publicUrl);
  }

  return (
    <div>
      <button type="button" className="px-4 py-2 rounded bg-white/10 hover:bg-white/20" onClick={()=>fileInput.current.click()}>
        {uploading ? 'Uploading...' : label}
      </button>
      <input type="file" accept="image/*" ref={fileInput} className="hidden" onChange={handleUpload} />
    </div>
  );
}
