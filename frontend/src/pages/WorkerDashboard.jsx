import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../styles/WorkerDashboard.css";

const WorkerDashboard = () => {
  const [worker, setWorker] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedWorker, setEditedWorker] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Service form states
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    availability: "available",
    district: worker?.district || "",
    latitude: "",
    longitude: ""
  });

  useEffect(() => {
    const storedWorker = localStorage.getItem("worker");
    const token = localStorage.getItem("token");
    if (storedWorker && token) {
      const workerData = JSON.parse(storedWorker);
      setWorker(workerData);
      fetchWorkerServices(workerData._id);
      fetchWorkerBookings(workerData._id);
      fetchWorkerNotifications(workerData._id);

      // Initialize Socket.IO connection
      const socket = io("http://localhost:5000");
      socket.emit('join', workerData._id);

      // Listen for new booking notifications
      socket.on('newBooking', (data) => {
        setMessage(`New booking request for "${data.serviceTitle}" from ${data.userName}`);
        fetchWorkerBookings(workerData._id); // Refresh bookings
        fetchWorkerNotifications(workerData._id); // Refresh notifications
      });

      // Listen for booking status changes (when worker accepts/rejects)
      socket.on('bookingStatusChanged', (data) => {
        setMessage(`Booking for "${data.serviceName}" has been ${data.status}`);
        fetchWorkerBookings(workerData._id); // Refresh bookings
        fetchWorkerNotifications(workerData._id); // Refresh notifications
      });

      // Cleanup on unmount
      return () => {
        socket.disconnect();
      };
    } else {
      navigate("/");
    }
  }, [navigate]);

  const fetchWorkerServices = async (workerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/services/worker/${workerId}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const fetchWorkerBookings = async (workerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/worker/${workerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('worker');
          navigate('/');
          return;
        }
        if (res.status === 403) {
          setMessage("You are not authorized to update this booking.");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const fetchWorkerNotifications = async (workerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/workers/notifications/${workerId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditing ? `http://localhost:5000/api/services/${editingService._id}` : "http://localhost:5000/api/services";
    const method = isEditing ? "PUT" : "POST";

    try {
      const longitude = parseFloat(serviceForm.longitude);
      const latitude = parseFloat(serviceForm.latitude);

      if (isNaN(longitude) || isNaN(latitude)) {
        setMessage("Please enter valid numeric coordinates for latitude and longitude.");
        return;
      }

      const payload = {
        ...serviceForm,
        district: serviceForm.district || worker.district,
        workerId: worker._id,
        workerName: worker.name,
        workerLocation: worker.location,
        location: {
          coordinates: [longitude, latitude]
        }
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setMessage(data.message);

      if (data.success) {
        fetchWorkerServices(worker._id);
        setServiceForm({ title: "", description: "", price: "", category: "", availability: "available", district: worker?.district || "", latitude: "", longitude: "" });
        setIsEditing(false);
        setEditingService(null);
      }
    } catch (err) {
      console.error("Service operation error:", err);
      setMessage("Network error occurred.");
    }
  };

  const handleEditService = (service) => {
    setServiceForm({
      title: service.title,
      description: service.description,
      price: service.price,
      category: service.category,
      availability: service.availability,
      district: service.district || worker?.district || "",
      latitude: service.location?.coordinates?.[1] || "",
      longitude: service.location?.coordinates?.[0] || ""
    });
    setIsEditing(true);
    setEditingService(service);
    setActiveTab("services");
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
          method: "DELETE",
        });

        const data = await res.json();
        setMessage(data.message);

        if (data.success) {
          fetchWorkerServices(worker._id);
        }
      } catch (err) {
        console.error("Delete service error:", err);
        setMessage("Network error occurred.");
      }
    }
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('worker');
          navigate('/');
          return;
        }
        if (res.status === 403) {
          setMessage("You are not authorized to update this booking.");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setMessage(data.message);

      if (data.success) {
        fetchWorkerBookings(worker._id);
      }
    } catch (err) {
      console.error("Update booking status error:", err);
      setMessage("Network error occurred.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("worker");
    navigate("/");
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingService(null);
    setServiceForm({ title: "", description: "", price: "", category: "", availability: "available", district: worker?.district || "", latitude: "", longitude: "" });
  };

  const handleEditProfile = () => {
    setEditedWorker({ ...worker });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('workerId', worker._id);
      formData.append('name', editedWorker.name || '');
      formData.append('email', editedWorker.email || '');
      formData.append('mobile', editedWorker.mobile || '');
      formData.append('location', editedWorker.location || '');

      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }

      const res = await fetch(`http://localhost:5000/api/workers/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setWorker(data.worker);
        localStorage.setItem("worker", JSON.stringify(data.worker));
        setIsEditingProfile(false);
        setSelectedFile(null);
        setPreviewImage(null);
        setMessage("Profile updated successfully!");
      } else {
        setMessage("Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("Network error occurred.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setEditedWorker({});
    setSelectedFile(null);
    setPreviewImage(null);
  };

  const handleRequestPayment = async (bookingId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/request-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Payment request submitted successfully!");
        fetchWorkerBookings(worker._id); // Refresh bookings
      } else {
        setMessage(data.message || "Failed to request payment.");
      }
    } catch (err) {
      console.error("Error requesting payment:", err);
      setMessage("Network error occurred.");
    }
  };

  if (!worker) {
    return <div className="loading">Loading...</div>;
  }

  const pendingBookings = bookings.filter(booking => booking.status === "pending");
  const acceptedBookings = bookings.filter(booking => booking.status === "accepted");
  const completedBookings = bookings.filter(booking => booking.status === "completed");
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="worker-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Worker Dashboard</h1>
          <div className="header-actions">
            <span className="welcome">Welcome, {worker.name}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <nav className="dashboard-nav">
          <button 
            className={activeTab === "profile" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button 
            className={activeTab === "services" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("services")}
          >
            My Services
          </button>
          <button 
            className={activeTab === "bookings" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("bookings")}
          >
            Manage Bookings ({pendingBookings.length})
          </button>
          <button 
            className={activeTab === "accepted" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("accepted")}
          >
            Accepted ({acceptedBookings.length})
          </button>
          <button 
            className={activeTab === "completed" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedBookings.length})
          </button>
          <button 
            className={activeTab === "notifications" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications ({unreadNotifications.length})
          </button>
        </nav>

        <main className="dashboard-main">
          {message && <div className="message">{message}</div>}

          {activeTab === "profile" && (
            <div className="profile-section">
              <div className="profile-card">
                <h2>Profile Information</h2>
                <div className="profile-details">
                  {isEditingProfile ? (
                    <>
                      <div className="detail-item">
                        <label>Profile Picture:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        {previewImage && (
                          <img src={previewImage} alt="Preview" className="profile-preview" />
                        )}
                      </div>
                      <div className="detail-item">
                        <label>Name:</label>
                        <input
                          type="text"
                          value={editedWorker.name || ""}
                          onChange={(e) => setEditedWorker({ ...editedWorker, name: e.target.value })}
                        />
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <input
                          type="email"
                          value={editedWorker.email || ""}
                          onChange={(e) => setEditedWorker({ ...editedWorker, email: e.target.value })}
                        />
                      </div>
                      <div className="detail-item">
                        <label>Mobile:</label>
                        <input
                          type="text"
                          value={editedWorker.mobile || ""}
                          onChange={(e) => setEditedWorker({ ...editedWorker, mobile: e.target.value })}
                        />
                      </div>
                      <div className="detail-item">
                        <label>Location:</label>
                        <input
                          type="text"
                          value={editedWorker.location || ""}
                          onChange={(e) => setEditedWorker({ ...editedWorker, location: e.target.value })}
                        />
                      </div>
                      <div className="edit-buttons">
                        <button onClick={handleSaveProfile} className="save-btn">Save</button>
                        <button onClick={handleCancelEditProfile} className="cancel-btn">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {worker.profilePicture && (
                        <div className="detail-item">
                          <label>Profile Picture:</label>
                          <img src={`http://localhost:5000${worker.profilePicture}`} alt="Profile" className="profile-picture" />
                        </div>
                      )}
                      <div className="detail-item">
                        <label>Name:</label>
                        <span>{worker.name}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{worker.email}</span>
                      </div>
                      <div className="detail-item">
                        <label>Mobile:</label>
                        <span>{worker.mobile}</span>
                      </div>
                      <div className="detail-item">
                        <label>Location:</label>
                        <span>{worker.location}</span>
                      </div>
                      <div className="detail-item">
                        <label>Total Services:</label>
                        <span>{services.length}</span>
                      </div>
                      <div className="detail-item">
                        <label>Total Bookings:</label>
                        <span>{bookings.length}</span>
                      </div>
                      <button onClick={handleEditProfile} className="edit-profile-btn">Edit Profile</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="services-section">
              <div className="services-header">
                <h2>{isEditing ? "Edit Service" : "Add New Service"}</h2>
                {isEditing && (
                  <button className="cancel-btn" onClick={cancelEdit}>Cancel Edit</button>
                )}
              </div>
              
              <form className="service-form" onSubmit={handleServiceSubmit}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Service Title"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    required
                  />
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="gardening">Gardening</option>
                    <option value="painting">Painting</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <textarea
                  placeholder="Service Description"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  required
                />
                
                <div className="form-row">
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    required
                  />
                  <select
                    value={serviceForm.availability}
                    onChange={(e) => setServiceForm({ ...serviceForm, availability: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>

                <div className="form-row">
                  <input
                    type="text"
                    placeholder="District"
                    value={serviceForm.district}
                    onChange={(e) => setServiceForm({ ...serviceForm, district: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={serviceForm.latitude}
                    onChange={(e) => setServiceForm({ ...serviceForm, latitude: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={serviceForm.longitude}
                    onChange={(e) => setServiceForm({ ...serviceForm, longitude: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="submit-btn">
                  {isEditing ? "Update Service" : "Add Service"}
                </button>
              </form>

              <div className="services-list">
                <h3>My Services ({services.length})</h3>
                {services.length === 0 ? (
                  <p className="no-data">No services added yet.</p>
                ) : (
                  <div className="services-grid">
                    {services.map((service) => (
                      <div key={service._id} className="service-card">
                        <div className="service-header">
                          <h4>{service.title}</h4>
                          <span className={`status ${service.availability}`}>
                            {service.availability}
                          </span>
                        </div>
                        <p className="service-description">{service.description}</p>
                        <div className="service-details">
                          <span className="price">₹{service.price}</span>
                          <span className="category">{service.category}</span>
                        </div>
                        <div className="service-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditService(service)}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteService(service._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="bookings-section">
              <h2>Pending Bookings ({pendingBookings.length})</h2>
              {pendingBookings.length === 0 ? (
                <p className="no-data">No pending bookings.</p>
              ) : (
                <div className="bookings-list">
                  {pendingBookings.map((booking) => (
                    <div key={booking._id} className="booking-card pending">
                      <div className="booking-header">
                        <h4>{booking.serviceId.title}</h4>
                        <span className="booking-status pending">Pending</span>
                      </div>
                      <div className="service-info">
                        <p><strong>Service Category:</strong> {booking.serviceId.category}</p>
                        <p><strong>Service Description:</strong> {booking.serviceId.description}</p>
                      </div>
                      <div className="booking-details">
                        <p><strong>Customer:</strong> {booking.userName}</p>
                        <p><strong>Phone:</strong> {booking.userId.mobile}</p>
                        <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {booking.bookingTime}</p>
                        <p><strong>Price:</strong> ₹{booking.serviceId.price}</p>
                        <p><strong>Address:</strong> {booking.userAddress}</p>
                        {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                      </div>
                      <div className="booking-actions">
                        <button
                          className="accept-btn"
                          onClick={() => handleBookingStatusUpdate(booking._id, "accepted")}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleBookingStatusUpdate(booking._id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "accepted" && (
            <div className="bookings-section">
              <h2>Accepted Bookings ({acceptedBookings.length})</h2>
              {acceptedBookings.length === 0 ? (
                <p className="no-data">No accepted bookings.</p>
              ) : (
                <div className="bookings-list">
                  {acceptedBookings.map((booking) => (
                    <div key={booking._id} className="booking-card accepted">
                      <div className="booking-header">
                        <h4>{booking.serviceId.title}</h4>
                        <span className="booking-status accepted">Accepted</span>
                      </div>
                      <div className="booking-details">
                        <p><strong>Customer:</strong> {booking.userName}</p>
                        <p><strong>Phone:</strong> {booking.userId.mobile}</p>
                        <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {booking.bookingTime}</p>
                        <p><strong>Price:</strong> ₹{booking.serviceId.price}</p>
                        <p><strong>Address:</strong> {booking.userAddress}</p>
                        {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                      </div>
                      <div className="booking-actions">
                        <button
                          className="complete-btn"
                          onClick={() => handleBookingStatusUpdate(booking._id, "completed")}
                        >
                          Mark as Completed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div className="bookings-section">
              <h2>Completed Bookings ({completedBookings.length})</h2>
              {completedBookings.length === 0 ? (
                <p className="no-data">No completed bookings yet.</p>
              ) : (
                <div className="bookings-list">
                  {completedBookings.map((booking) => (
                    <div key={booking._id} className="booking-card completed">
                      <div className="booking-header">
                        <h4>{booking.serviceId.title}</h4>
                        <span className="booking-status completed">Completed</span>
                      </div>
                      <div className="booking-details">
                        <p><strong>Customer:</strong> {booking.userName}</p>
                        <p><strong>Phone:</strong> {booking.userId.mobile}</p>
                        <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                        <p><strong>Price:</strong> ₹{booking.serviceId.price}</p>
                        <p><strong>Address:</strong> {booking.userAddress}</p>
                        <p><strong>Completed:</strong> {new Date(booking.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="booking-actions">
                        <button
                          className="request-payment-btn"
                          onClick={() => handleRequestPayment(booking._id)}
                        >
                          Request Payment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="notifications-section">
              <h2>Notifications ({notifications.length})</h2>
              {notifications.length === 0 ? (
                <p className="no-data">No notifications.</p>
              ) : (
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <div key={notification._id} className={`notification-card ${notification.read ? 'read' : 'unread'}`}>
                      <p>{notification.message}</p>
                      <small>{new Date(notification.createdAt).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WorkerDashboard;
