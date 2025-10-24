import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePanel.css";

const ProfilePanel = () => {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem("profile") || "{}");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile.name || "",
    email: profile.email || "",
    location: profile.location || "",
    profilePicture: profile.profilePicture || "",
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/${profile.role}/update/${profile._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("profile", JSON.stringify({ ...data[profile.role], role: profile.role }));
        alert("Profile updated!");
        setEditing(false);
      } else {
        alert("Update failed.");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Network error.");
    }
  };

  return (
    <div className="profile-panel">
      <img
        src={form.profilePicture || "/default-avatar.png"}
        alt="Profile"
        className="profile-pic"
      />
      {editing ? (
        <div className="edit-form">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
          />
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Location"
          />
          <input
            value={form.profilePicture}
            onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
            placeholder="Profile Picture URL"
          />
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="view-details">
          <h3>{form.name}</h3>
          <p>{form.email}</p>
          <p>{form.location}</p>
          <button onClick={() => setEditing(true)}>Edit Profile</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePanel;
