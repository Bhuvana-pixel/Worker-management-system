import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/UserDashboard.css";

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchUserBookings(userData._id);
      fetchUserPayments(userData._id);
      fetchUserNotifications(userData._id);

      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Initialize Socket.IO connection
      const socket = io('http://localhost:5000');
      socket.emit('join', userData._id);

      // Listen for real-time notifications
      socket.on('notification', (data) => {
        console.log('Real-time notification received:', data);
        // Refresh notifications when a new one arrives
        fetchUserNotifications(userData._id);
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('New Notification', {
            body: data.message,
            icon: '/vite.svg'
          });
        }
      });

      // Listen for booking acceptance notifications
      socket.on('bookingAccepted', (data) => {
        console.log('Booking accepted notification received:', data);
        // Refresh bookings and notifications
        fetchUserBookings(userData._id);
        fetchUserNotifications(userData._id);
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('Booking Accepted!', {
            body: data.message,
            icon: '/vite.svg'
          });
        }
      });

      // Poll notifications every 30 seconds as fallback
      const intervalId = setInterval(() => {
        fetchUserNotifications(userData._id);
      }, 30000);

      return () => {
        socket.disconnect();
        clearInterval(intervalId);
      };
    } else {
      navigate("/");
    }
  }, [navigate]);

  const fetchUserBookings = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/bookings/${userId}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const handleUserCompletion = async (bookingId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/user-completion`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        alert("Booking marked as completed!");
        fetchUserBookings(user._id); // Refresh bookings
      } else {
        alert(data.message || "Failed to update completion status.");
      }
    } catch (err) {
      console.error("Error updating user completion:", err);
      alert("Network error occurred.");
    }
  };

  const handleLeaveReview = async (bookingId) => {
    const review = prompt("Please leave a review for the service:");
    if (review) {
      try {
        const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/review`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ review }),
        });
        const data = await res.json();
        if (data.success) {
          alert("Review submitted successfully!");
          fetchUserBookings(user._id); // Refresh bookings
        } else {
          alert(data.message || "Failed to submit review.");
        }
      } catch (err) {
        console.error("Error submitting review:", err);
        alert("Network error occurred.");
      }
    }
  };

  const fetchUserPayments = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/payments/${userId}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  };

  const fetchUserNotifications = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/notifications/${userId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleEditProfile = () => {
    setEditedUser({ ...user });
    setIsEditingProfile(true);
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

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('name', editedUser.name || '');
      formData.append('email', editedUser.email || '');
      formData.append('mobile', editedUser.mobile || '');
      formData.append('location', editedUser.location || '');

      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }

      const res = await fetch(`http://localhost:5000/api/user/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsEditingProfile(false);
        setSelectedFile(null);
        setPreviewImage(null);
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Network error occurred.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedUser({});
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  const completedBookings = bookings.filter(booking => booking.status === "completed");
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>User Dashboard</h1>
          <div className="header-actions">
            <span className="welcome">Welcome, {user.name}</span>
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
            className={activeTab === "bookings" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("bookings")}
          >
            My Bookings ({bookings.length})
          </button>
          <button 
            className={activeTab === "payments" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("payments")}
          >
            Payments ({payments.length})
          </button>
          <button 
            className={activeTab === "notifications" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications ({unreadNotifications.length})
          </button>
        </nav>

        <main className="dashboard-main">
          {activeTab === "profile" && (
            <div className="profile-section">
              <div className="profile-card">
                <h2>Profile Information</h2>
                <div className="profile-details">
                  {isEditingProfile ? (
                    <>
                      <div className="profile-picture-section">
                        <label>Profile Picture:</label>
                        <div className="profile-picture-upload">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="profile-picture-input"
                          />
                          <label htmlFor="profile-picture-input" className="upload-btn">
                            Choose File
                          </label>
                          {previewImage && (
                            <img src={previewImage} alt="Preview" className="profile-preview" />
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <label>Name:</label>
                        <input
                          type="text"
                          value={editedUser.name || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                        />
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <input
                          type="email"
                          value={editedUser.email || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                        />
                      </div>
                      <div className="detail-item">
                        <label>Mobile:</label>
                        <input
                          type="text"
                          value={editedUser.mobile || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, mobile: e.target.value })}
                        />
                      </div>
                      <div className="detail-item">
                        <label>Location:</label>
                        <input
                          type="text"
                          value={editedUser.location || ""}
                          onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
                        />
                      </div>
                      <div className="edit-buttons">
                        <button onClick={handleSaveProfile} className="save-btn">Save</button>
                        <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {user.profilePicture && (
                        <div className="profile-picture-display">
                          <label>Profile Picture:</label>
                          <img src={`http://localhost:5000${user.profilePicture}`} alt="Profile" className="profile-picture" />
                        </div>
                      )}
                      <div className="detail-item">
                        <label>Name:</label>
                        <span>{user.name}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{user.email}</span>
                      </div>
                      <div className="detail-item">
                        <label>Mobile:</label>
                        <span>{user.mobile}</span>
                      </div>
                      <div className="detail-item">
                        <label>Location:</label>
                        <span>{user.location}</span>
                      </div>
                      <div className="detail-item">
                        <label>Total Bookings:</label>
                        <span>{bookings.length}</span>
                      </div>
                      <div className="detail-item">
                        <label>Completed Bookings:</label>
                        <span>{completedBookings.length}</span>
                      </div>
                      <button onClick={handleEditProfile} className="edit-profile-btn">Edit Profile</button>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => navigate('/find-worker')}
                  className="book-service-btn"
                  style={{
                    backgroundColor: '#4738dd',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '24px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '20px',
                    width: '100%',
                    fontSize: '1rem'
                  }}
                >
                  Book New Service
                </button>
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="bookings-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>My Bookings ({bookings.length})</h2>
                {bookings.length === 0 && (
                  <button 
                    onClick={() => navigate('/find-worker')}
                    style={{
                      backgroundColor: '#4738dd',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Book Your First Service
                  </button>
                )}
              </div>
              {bookings.length === 0 ? (
                <p className="no-data">No bookings yet.</p>
              ) : (
                <div className="bookings-list">
                  {bookings.map((booking) => (
                    <div key={booking._id} className={`booking-card ${booking.status}`}>
                  <div className="booking-header">
                    <h4>{booking.serviceId?.title || 'Service'}</h4>
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="booking-notification">
                    {booking.status === "accepted" && (
                      <p style={{ color: "green", fontWeight: "bold" }}>
                        Your booking has been accepted by the worker.
                      </p>
                    )}
                    {booking.status === "rejected" && (
                      <p style={{ color: "red", fontWeight: "bold" }}>
                        Your booking has been rejected by the worker.
                      </p>
                    )}
                  </div>
                      <div className="booking-details">
                        <p><strong>Worker:</strong> {booking.workerId?.name || 'Worker'}</p>
                        <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                        <p><strong>Price:</strong> ₹{booking.price || 'N/A'}</p>
                        <p><strong>Address:</strong> {booking.userAddress || 'N/A'}</p>
                        {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                      </div>
                      {booking.status === "accepted" && !booking.userCompleted && (
                        <div className="booking-actions">
                          <button
                            className="complete-btn"
                            onClick={() => handleUserCompletion(booking._id)}
                          >
                            Mark as Completed
                          </button>
                        </div>
                      )}
                      {booking.status === "completed" && (
                        <div className="booking-actions">
                          <button
                            className="review-btn"
                            onClick={() => handleLeaveReview(booking._id)}
                          >
                            Leave Review
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="payments-section">
              <h2>Payments ({payments.length})</h2>
              {payments.length === 0 ? (
                <p className="no-data">No payments found.</p>
              ) : (
                <div className="payments-list">
                  {payments.map((pay) => (
                    <div key={pay._id} className="payment-card">
                      <div>
                        <span><strong>Amount:</strong> ₹{pay.amount}</span>
                        <span><strong>Status:</strong> {pay.status}</span>
                        <span><strong>Date:</strong> {new Date(pay.date).toLocaleDateString()}</span>
                        <span><strong>Booking:</strong> {pay.bookingId}</span>
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

export default UserDashboard;
