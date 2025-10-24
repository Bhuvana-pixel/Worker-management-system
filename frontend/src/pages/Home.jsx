import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import RegisterModal from "../pages/RegisterModal";
import "../styles/Home.css";
import homeBg from "../assets/bg2.jpg";

const Home = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showWorkerProfile, setShowWorkerProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedWorker = localStorage.getItem("worker");

    try {
      if (storedUser && storedUser !== "undefined") {
        setProfile({ ...JSON.parse(storedUser), role: "user" });
      } else if (storedWorker && storedWorker !== "undefined") {
        const workerData = JSON.parse(storedWorker);
        setProfile({ ...workerData, role: "worker" });
        setShowWorkerProfile(true);
      }
    } catch (err) {
      console.error("Failed to parse profile:", err);
      localStorage.removeItem("user");
      localStorage.removeItem("worker");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("worker");
    setProfile(null);
    setShowWorkerProfile(false);
    navigate("/");
  };

  // Worker Profile Component
  const WorkerProfileSection = ({ workerData }) => (
    <section className="worker-profile-section" style={{ 
      padding: '40px 20px',
      minHeight: '100vh'
    }}>
      <div className="worker-profile-content" style={{ 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        {/* Welcome Header with Background Card */}
        <div className="section-header" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '30px',
          borderRadius: '20px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ 
            color: '#1e293b',
            fontSize: '2.2rem',
            fontWeight: '600',
            margin: '0 0 10px 0'
          }}>Welcome back, {workerData.name}!</h2>
          <p style={{ 
            color: '#64748b',
            fontSize: '1.1rem',
            margin: '0'
          }}>Your worker profile and dashboard</p>
        </div>
        
        <div className="worker-profile-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px',
          marginBottom: '30px'
        }}>
          {/* Profile Summary Card */}
          <div className="profile-summary-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            gridColumn: 'span 2'
          }}>
            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="profile-avatar" style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {workerData.profileImage ? (
                  <img src={workerData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{workerData.name?.charAt(0) || "W"}</span>
                )}
              </div>
              <div className="profile-info">
                <h3 style={{ 
                  color: '#1e293b', 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  margin: '0 0 5px 0' 
                }}>{workerData.name}</h3>
                <p className="profile-role" style={{ 
                  color: '#3b82f6', 
                  fontSize: '1rem', 
                  fontWeight: '500', 
                  margin: '0 0 10px 0' 
                }}>Professional Worker</p>
                <div className="profile-rating" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="rating-stars" style={{ fontSize: '1.2rem' }}>⭐⭐⭐⭐⭐</span>
                  <span className="rating-text" style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    {workerData.rating || "5.0"} ({workerData.reviewsCount || "0"} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Skills & Services */}
          <div className="worker-skills-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ 
              color: '#1e293b', 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              margin: '0 0 15px 0' 
            }}>Your Skills & Services</h4>
            <div className="skills-list" style={{ marginBottom: '20px' }}>
              {workerData.skills ? (
                Array.isArray(workerData.skills) ? (
                  workerData.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag" style={{
                      display: 'inline-block',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      margin: '4px',
                      border: 'none'
                    }}>{skill}</span>
                  ))
                ) : (
                  <span className="skill-tag" style={{
                    display: 'inline-block',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}>{workerData.skills}</span>
                )
              ) : (
                <p className="no-skills" style={{ 
                  color: '#64748b', 
                  fontStyle: 'italic' 
                }}>No skills added yet</p>
              )}
            </div>
            <button
              className="manage-skills-btn"
              onClick={() => navigate("/worker-dashboard")}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Manage Skills
            </button>
          </div>
          {/* Quick Stats */}
          <div className="worker-stats-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ 
              color: '#1e293b', 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              margin: '0 0 20px 0' 
            }}>Your Statistics</h4>
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '15px'
            }}>
              <div className="stat-item" style={{ textAlign: 'center' }}>
                <div className="stat-number" style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  color: '#3b82f6',
                  margin: '0'
                }}>{workerData.completedJobs || "0"}</div>
                <div className="stat-label" style={{ 
                  color: '#64748b', 
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>Jobs Completed</div>
              </div>
              <div className="stat-item" style={{ textAlign: 'center' }}>
                <div className="stat-number" style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  color: '#10b981',
                  margin: '0'
                }}>{workerData.totalEarnings || "$0"}</div>
                <div className="stat-label" style={{ 
                  color: '#64748b', 
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>Total Earned</div>
              </div>
              <div className="stat-item" style={{ textAlign: 'center' }}>
                <div className="stat-number" style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  color: '#f59e0b',
                  margin: '0'
                }}>{workerData.responseTime || "2h"}</div>
                <div className="stat-label" style={{ 
                  color: '#64748b', 
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>Avg Response Time</div>
              </div>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="worker-actions-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ 
              color: '#1e293b', 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              margin: '0 0 20px 0' 
            }}>Quick Actions</h4>
            <div className="action-buttons" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <button 
                className="action-btn primary" 
                onClick={() => navigate("/worker-dashboard")}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                <span className="btn-icon">📊</span> View Dashboard
              </button>
              <button 
                className="action-btn secondary" 
                onClick={() => navigate("/worker-profile-edit")}
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                <span className="btn-icon">✏</span> Edit Profile
              </button>
              <button 
                className="action-btn secondary" 
                onClick={() => navigate("/worker-jobs")}
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                <span className="btn-icon">💼</span> View Jobs
              </button>
            </div>
          </div>
          {/* Recent Activity */}
          <div className="worker-activity-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            gridColumn: 'span 2'
          }}>
            <h4 style={{ 
              color: '#1e293b', 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              margin: '0 0 20px 0' 
            }}>Recent Activity</h4>
            <div className="activity-list">
              {workerData.recentActivity && workerData.recentActivity.length > 0 ? (
                workerData.recentActivity.map((activity, idx) => (
                  <div key={idx} className="activity-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '15px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    marginBottom: '10px'
                  }}>
                    <div className="activity-icon" style={{
                      fontSize: '1.5rem',
                      backgroundColor: '#e0e7ff',
                      padding: '10px',
                      borderRadius: '50%',
                      width: '45px',
                      height: '45px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>{activity.icon || "📝"}</div>
                    <div className="activity-content">
                      <p style={{ 
                        color: '#1e293b', 
                        fontSize: '0.95rem', 
                        margin: '0 0 5px 0',
                        fontWeight: '500'
                      }}>{activity.description}</p>
                      <span className="activity-time" style={{ 
                        color: '#64748b', 
                        fontSize: '0.85rem' 
                      }}>{activity.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activity" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ 
                    color: '#64748b', 
                    fontSize: '1.1rem', 
                    margin: '0 0 20px 0',
                    fontWeight: '500'
                  }}>No recent activity</p>
                  <button 
                    className="start-working-btn" 
                    onClick={() => navigate("/find-jobs")}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                  >
                    Start Finding Jobs
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Profile Completion */}
          <div className="profile-completion-card" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ 
              color: '#1e293b', 
              fontSize: '1.3rem', 
              fontWeight: '600', 
              margin: '0 0 20px 0' 
            }}>Profile Completion</h4>
            <div className="completion-bar" style={{
              backgroundColor: '#e5e7eb',
              borderRadius: '10px',
              height: '12px',
              overflow: 'hidden',
              marginBottom: '10px'
            }}>
              <div
                className="completion-fill"
                style={{
                  width: `${workerData.profileCompletion || 60}%`,
                  backgroundColor: '#3b82f6',
                  height: '100%',
                  borderRadius: '10px',
                  transition: 'width 0.3s ease'
                }}
              ></div>
            </div>
            <p style={{ 
              color: '#475569', 
              fontWeight: '600', 
              margin: '0 0 15px 0',
              textAlign: 'center'
            }}>{workerData.profileCompletion || 60}% Complete</p>
            <div className="completion-tips">
              <p style={{ 
                color: '#64748b', 
                fontSize: '0.9rem', 
                margin: '0 0 10px 0' 
              }}>Complete your profile to get more job opportunities:</p>
              <ul style={{ 
                color: '#64748b', 
                fontSize: '0.85rem',
                paddingLeft: '20px'
              }}>
                {!workerData.profileImage && <li>Add a profile photo</li>}
                {!workerData.bio && <li>Write a professional bio</li>}
                {(!workerData.skills || workerData.skills.length < 3) && <li>Add more skills</li>}
                {!workerData.portfolio && <li>Upload portfolio items</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Worker-specific CTA */}
        <div className="worker-cta" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ 
            color: '#1e293b', 
            fontSize: '1.8rem', 
            fontWeight: '600', 
            margin: '0 0 15px 0' 
          }}>Ready to Take on New Projects?</h3>
          <p style={{ 
            color: '#64748b', 
            fontSize: '1.1rem', 
            margin: '0 0 25px 0',
            lineHeight: '1.6'
          }}>Browse available jobs that match your skills and start earning today!</p>
          <button 
            className="cta-main" 
            onClick={() => navigate("/find-jobs")}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)';
            }}
          >
            <span className="btn-icon">🔍</span> Find Jobs Now
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <div className="home" style={{ backgroundImage: `url(${homeBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Navigation */}
      <header className="navbar">
        <div className="nav-content">
          <div className="logo">
            <span className="logo-icon">⚡</span> WorkBee
          </div>
          <nav className="nav-links">
            <Link to="/find-worker" className="nav-link">Find Workers</Link>
            <a href="#features" className="nav-link">About Us</a>
            <a href="#footer" className="nav-link">Contact</a>
          </nav>
          <div className="auth-buttons">
            {profile ? (
              <>
                <button
                  className="profile-btn"
                  onClick={() =>
                    navigate(profile.role === "user" ? "/user-dashboard" : "/worker-dashboard")
                  }
                >
                  <span className="user-avatar">👤</span> {profile.name?.split(" ")[0] || "Profile"}
                </button>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className="login-btn" onClick={() => setShowRegister(true)}>Login</button>
                <button className="signup-btn" onClick={() => setShowRegister(true)}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Worker Profile Section */}
      {showWorkerProfile && profile && profile.role === "worker" && (
        <WorkerProfileSection workerData={profile} />
      )}

      {/* Hero Section */}
      {!showWorkerProfile && (
        <section className="hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Connect with Skilled Workers</h1>
              <p>
                Find the right talent for your project or become a worker and offer your services to a growing community of clients.
              </p>
              <div className="hero-buttons">
                <button className="cta-primary" onClick={() => navigate("/find-worker")}>
                <span className="btn-icon">🔍</span> Find a Worker
                </button>

              </div>
            </div>

          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="services">
        <div className="services-content">
          <div className="section-header">
            <h2>Popular Services</h2>
            <p>Discover the most requested services in our platform</p>
          </div>
          <div className="service-grid">
            {[
              { name: "Home Repairs", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop&crop=center", icon: "🔧" },
              { name: "Painting & Decor", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop&crop=center", icon: "🎨" },
              { name: "Tech Support", image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center", icon: "💻" },
              { name: "Cleaning Services", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop&crop=center", icon: "🧹" },
              { name: "Auto Mechanic", image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop&crop=center", icon: "🚗" },
              { name: "Hair & Beauty", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center", icon: "💄" },
            ].map((service) => (
              <div
                key={service.name}
                className="service-card"
                onClick={() => navigate(`/find-worker?skill=${encodeURIComponent(service.name)}`)}
                style={{
                  backgroundImage: `url(${service.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  minHeight: '250px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-8px)';
                  e.target.style.boxShadow = '0 15px 35px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
              >
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.8) 0%, rgba(147, 51, 234, 0.8) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }} className="service-overlay"></div>
                
                {/* Content */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '25px 20px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '10px'
                  }}>
                    {service.icon}
                  </div>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    margin: '0',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                    letterSpacing: '0.5px'
                  }}>
                    {service.name}
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    margin: '5px 0 0 0',
                    opacity: '0.9',
                    fontWeight: '300'
                  }}>
                    Professional services
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
<section className="features" id="features">
  <div className="features-content">
    <h2>Why Choose WorkBee?</h2>
    <div className="features-grid">
      <div className="feature-card">
        <div className="feature-icon">🛡</div>
        <h3>Verified Workers</h3>
        <p>
          All workers are background checked and skill verified for your peace of mind.
        </p>
      </div>
      <div className="feature-card">
        <div className="feature-icon">⚡</div>
        <h3>Instant Matching</h3>
        <p>
          Get matched with the perfect worker for your project in minutes, not hours.
        </p>
      </div>
      <div className="feature-card">
        <div className="feature-icon">💳</div>
        <h3>Secure Payments</h3>
        <p>
          Safe and secure payment processing with money-back guarantee.
        </p>
      </div>
      <div className="feature-card">
        <div className="feature-icon">📱</div>
        <h3>24/7 Support</h3>
        <p>
          Round-the-clock customer support to help you with any questions.
        </p>
      </div>
    </div>
  </div>
</section>


      {/* Call to Action */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>
            Join thousands of satisfied clients and skilled workers on WorkConnect
          </p>
          <button className="cta-main" onClick={() => setShowRegister(true)}>
            <span className="btn-icon">🚀</span> Get Started Now
          </button>
          <div className="cta-features">
            <span className="cta-feature">✓ Free to join</span>
            <span className="cta-feature">✓ No hidden fees</span>
            <span className="cta-feature">✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">⚡</span> WorkBee
              </div>
              <p>Connecting skilled workers with clients worldwide.</p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Company</h4>
                <a href="#about">About Us</a>
                <a href="#careers">Careers</a>
                <a href="#press">Press</a>
              </div>
              <div className="link-group">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#contact">Contact Us</a>
                <a href="#status">Status</a>
              </div>
              <div className="link-group">
                <h4>Legal</h4>
                <a href="#terms">Terms of Service</a>
                <a href="#privacy">Privacy Policy</a>
                <a href="#cookies">Cookies</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 WorkBee. All rights reserved.</p>
            <div className="social-links"></div>
          </div>
        </div>
      </footer>

      {/* Register Modal */}
      {showRegister && (
        <RegisterModal
          close={() => setShowRegister(false)}
          onLogin={(profile) => {
            setProfile(profile);
            if (profile.role === "worker") {
              setShowWorkerProfile(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default Home;