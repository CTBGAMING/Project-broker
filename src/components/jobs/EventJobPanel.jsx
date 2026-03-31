export default function EventJobPanel() {
    return (
      <div style={panel}>
        <h3>Event Service</h3>
  
        <label>Service Type</label>
        <select style={input}>
          <option>I don’t know yet</option>
          <option>Catering</option>
          <option>Decor</option>
          <option>DJ / Music</option>
          <option>Flowers</option>
          <option>Lighting</option>
          <option>Transport</option>
        </select>
  
        <label>Guest Count</label>
        <input style={input} placeholder="Optional / I don’t know" />
  
        <label>Dietary Requirements</label>
        <textarea
          style={input}
          placeholder="Vegan, halal, allergies, or I don’t know"
        />
  
        <label>Notes</label>
        <textarea
          style={input}
          placeholder="Describe the vibe, inspiration, timing, etc."
        />
  
        <label>Inspiration Images</label>
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
  