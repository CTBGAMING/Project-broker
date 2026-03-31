export default function ConstructionJobPanel() {
    return (
      <div style={panel}>
        <h3>Construction Job</h3>
  
        <label>Trade Required</label>
        <select style={input}>
          <option>I don’t know</option>
          <option>Plumbing</option>
          <option>Electrical</option>
          <option>Tiling</option>
          <option>Carpentry</option>
          <option>Built-in Cabinets</option>
          <option>Painting</option>
        </select>
  
        <label>Area of Work</label>
        <input style={input} placeholder="Bathroom, kitchen, exterior, etc." />
  
        <label>Description</label>
        <textarea
          style={input}
          placeholder="Explain the issue or goal. ‘I don’t know’ is okay."
        />
  
        <label>Estimated Budget</label>
        <input style={input} placeholder="Optional" />
  
        <label>Reference Photos</label>
        <input type="file" multiple />
      </div>
    );
  }
  
  const panel = {
    marginTop: 20,
    padding: 16,
    border: "1px solid #ddd",
    borderRadius: 8,
  };
  
  const input = {
    width: "100%",
    marginTop: 6,
    marginBottom: 12,
    padding: 8,
  };
  