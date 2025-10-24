import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, MapPin, Filter, X, Loader, Navigation, Globe } from "lucide-react";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map update component
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const FindWorker = () => {
  // State management
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isWorldView, setIsWorldView] = useState(false);
  const mapRef = useRef(null);

  // Booking state
  const [bookingServiceId, setBookingServiceId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    bookingDate: "",
    bookingTime: "",
    userName: "",
    userAddress: "",
    notes: "",
  });
  const [bookingMessage, setBookingMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories
  const categories = [
    "All",
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Gardening",
    "Painting",
    "Carpentry",
  ];

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation({ lat: 13.0827, lng: 80.2707 });
        }
      );
    } else {
      setUserLocation({ lat: 13.0827, lng: 80.2707 });
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // Load auth data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedWorker = localStorage.getItem("worker");
    const storedToken = localStorage.getItem("token");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setUserRole("user");
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error parsing user data", e);
        setIsLoggedIn(false);
      }
    } else if (storedWorker) {
      try {
        JSON.parse(storedWorker);
        setUserRole("worker");
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error parsing worker data", e);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
    setToken(storedToken || null);
  }, []);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/services");
        const data = await res.json();
        if (data.success) {
          const servicesList = data.services || [];
          setServices(servicesList);

          // Extract unique locations
          const locations = [
            ...new Set(
              servicesList
                .filter((s) => s.workerLocation)
                .map((s) => {
                  const parts = s.workerLocation.split(',');
                  return parts[parts.length - 4]?.trim() || '';
                })
                .filter(Boolean)
            ),
          ].sort();

          setAvailableLocations(locations);
        } else {
          setError("Failed to load services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter and sort services
  useEffect(() => {
    let filtered = services.map(service => ({
      ...service,
      distance: userLocation && service.location?.coordinates
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            service.location.coordinates[1],
            service.location.coordinates[0]
          )
        : null
    }));

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter(
        (service) =>
          service.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Location search filter
    if (selectedLocation) {
      filtered = filtered.filter((service) => {
        if (!service.workerLocation) return false;
        return service.workerLocation.toLowerCase().includes(selectedLocation.toLowerCase());
      });
    }

    // Location/Radius filter
    if (useLocationFilter && userLocation) {
      filtered = filtered.filter((service) => {
        return service.distance !== null && service.distance <= searchRadius;
      });
    }

    // Sort
    if (sortBy === "distance" && userLocation) {
      filtered.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredServices(filtered);
  }, [
    searchQuery,
    selectedCategory,
    selectedLocation,
    services,
    userLocation,
    searchRadius,
    useLocationFilter,
    sortBy,
  ]);

  const handleBookClick = (serviceId) => {
    if (!isLoggedIn || !user || userRole !== "user") {
      alert("You must be logged in as a user to book.");
      return;
    }
    setBookingServiceId(serviceId);
    setShowModal(true);
    setBookingMessage("");
    setBookingData({
      bookingDate: "",
      bookingTime: "",
      userName: user.name || "",
      userAddress: "",
      notes: "",
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn || !user || userRole !== "user") {
      setBookingMessage("You must be logged in as a user to book.");
      return;
    }
    if (!token) {
      setBookingMessage("You must be logged in to book.");
      return;
    }
    if (!bookingData.bookingDate || !bookingData.bookingTime || !bookingData.userAddress) {
      setBookingMessage("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: bookingServiceId,
          bookingDate: bookingData.bookingDate,
          bookingTime: bookingData.bookingTime,
          userAddress: bookingData.userAddress,
          userLocation: userLocation,
          notes: bookingData.notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookingMessage("Booking successful! ✓");
        setTimeout(() => {
          setShowModal(false);
          setBookingServiceId(null);
          setBookingMessage("");
        }, 2000);
      } else {
        setBookingMessage(data.message || "Booking failed.");
      }
    } catch (error) {
      console.error(error);
      setBookingMessage("Network error during booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedLocation("");
    setUseLocationFilter(false);
    setSortBy("relevance");
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Loader style={{ animation: 'spin 1s linear infinite' }} size={40} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Sidebar */}
      <aside style={{
        width: '320px',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '24px',
        overflowY: 'auto',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Find Workers
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Search and filter services near you
          </p>
        </div>

        {/* Search Box */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
            <input
              type="text"
              placeholder="Search services or workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
        </div>

        {/* Location Filter */}
        {userLocation && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', color: '#0c4a6e', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useLocationFilter}
                  onChange={(e) => setUseLocationFilter(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <MapPin size={16} style={{ marginRight: '4px' }} />
                Near Me
              </label>
              <button
                onClick={getUserLocation}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  padding: '4px'
                }}
                title="Refresh location"
              >
                <Navigation size={16} />
              </button>
            </div>
            {useLocationFilter && (
              <div>
                <label style={{ fontSize: '12px', color: '#075985', display: 'block', marginBottom: '6px' }}>
                  Search Radius: {searchRadius} km
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  <span>0.5 km</span>
                  <span>20 km</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
            <Filter size={16} style={{ marginRight: '6px' }} />
            Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((cat) => (
              <label
                key={cat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: selectedCategory === cat ? '#eff6ff' : 'transparent',
                  border: selectedCategory === cat ? '1px solid #3b82f6' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={selectedCategory === cat}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ marginRight: '10px', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '14px', color: selectedCategory === cat ? '#1e40af' : '#4b5563' }}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        {availableLocations.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Location
            </h3>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'white'
              }}
            >
              <option value="">All Locations</option>
              {availableLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort By */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
            Sort By
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'white'
            }}
          >
            <option value="relevance">Relevance</option>
            {userLocation && <option value="distance">Distance</option>}
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: 'white',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '16px'
          }}
        >
          <X size={16} />
          Clear Filters
        </button>

        {/* Results Count */}
        <div style={{
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            <strong style={{ color: '#111827' }}>{filteredServices.length}</strong> worker{filteredServices.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              Available Services
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              {isLoggedIn ? "Browse and book services near you" : "Sign in to see location-based results"}
            </p>
          </div>
          {userLocation && (
            <button
              onClick={() => setShowMapView(!showMapView)}
              style={{
                padding: '10px 20px',
                background: showMapView ? '#3b82f6' : 'white',
                color: showMapView ? 'white' : '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
              </svg>
              {showMapView ? 'List View' : 'Map View'}
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: '16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* Map View */}
        {showMapView && userLocation ? (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'calc(100vh - 180px)' }}>
            {/* Map Controls */}
            <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsWorldView(!isWorldView)}
                style={{
                  padding: '8px 16px',
                  background: isWorldView ? '#3b82f6' : 'white',
                  color: isWorldView ? 'white' : '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Globe size={16} />
                {isWorldView ? 'Local View' : 'World View'}
              </button>
            </div>
            <MapContainer
              center={isWorldView ? [0, 0] : [userLocation.lat, userLocation.lng]}
              zoom={isWorldView ? 2 : 12}
              style={{ height: 'calc(100% - 60px)', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapUpdater center={isWorldView ? [0, 0] : [userLocation.lat, userLocation.lng]} zoom={isWorldView ? 2 : 12} />

              {/* User location marker */}
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.icon({
                  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <strong>📍 Your Location</strong>
                  </div>
                </Popup>
              </Marker>

              {/* Search radius circle */}
              {useLocationFilter && (
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={searchRadius * 1000}
                  color="#3b82f6"
                  fillColor="#93c5fd"
                  fillOpacity={0.2}
                />
              )}

              {/* Worker markers */}
              {filteredServices.map((service) => {
                if (!service.location?.coordinates) return null;
                return (
                  <Marker
                    key={service._id}
                    position={[service.location.coordinates[1], service.location.coordinates[0]]}
                    icon={L.icon({
                      iconUrl: selectedMarker === service._id 
                        ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
                        : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
                      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })}
                    eventHandlers={{
                      click: () => setSelectedMarker(service._id)
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '220px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                          {service.title}
                        </h4>
                        <div style={{ marginBottom: '8px' }}>
                          <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                            <strong style={{ color: '#374151' }}>Worker:</strong> {service.workerName}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                            <strong style={{ color: '#374151' }}>Category:</strong> {service.category}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                            <strong style={{ color: '#374151' }}>Location:</strong> {service.workerLocation}
                          </p>
                        </div>
                        <div style={{ paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                          <p style={{ margin: '4px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                            ₹{service.price}
                          </p>
                          {service.distance && (
                            <p style={{ margin: '4px 0', fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>
                              📍 {service.distance.toFixed(2)} km away
                            </p>
                          )}
                        </div>
                        {isLoggedIn && userRole === "user" && (
                          <button
                            onClick={() => handleBookClick(service._id)}
                            style={{
                              width: '100%',
                              marginTop: '12px',
                              padding: '8px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Book Now
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        ) : (
          /* Grid View */
          filteredServices.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                No workers found
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {filteredServices.map((service) => (
                <div
                  key={service._id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0, flex: 1 }}>
                      {service.title}
                    </h3>
                    <span style={{
                      padding: '4px 12px',
                      background: '#eff6ff',
                      color: '#1e40af',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
                      {service.category}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                    {service.description}
                  </p>

                  <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div>
                        <p style={{ color: '#9ca3af', marginBottom: '4px' }}>Price</p>
                        <p style={{ color: '#111827', fontWeight: '600', fontSize: '16px' }}>₹{service.price}</p>
                      </div>
                      {service.distance && (
                        <div>
                          <p style={{ color: '#9ca3af', marginBottom: '4px' }}>Distance</p>
                          <p style={{ color: '#3b82f6', fontWeight: '600' }}>📍 {service.distance.toFixed(2)} km</p>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        <strong style={{ color: '#374151' }}>Worker:</strong> {service.workerName}
                      </p>
                      {service.workerLocation && (
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>
                          <strong style={{ color: '#374151' }}>Location:</strong> {service.workerLocation}
                        </p>
                      )}
                    </div>
                  </div>

                  {isLoggedIn && userRole === "user" && (
                    <button
                      onClick={() => handleBookClick(service._id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >
                      Book Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Booking Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#6b7280',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              ×
            </button>

            <form onSubmit={handleBookingSubmit} style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                Book Service
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={bookingData.userName}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={bookingData.bookingDate}
                    onChange={(e) => setBookingData({ ...bookingData, bookingDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    value={bookingData.bookingTime}
                    onChange={(e) => setBookingData({ ...bookingData, bookingTime: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Address *
                </label>
                <textarea
                  value={bookingData.userAddress}
                  onChange={(e) => setBookingData({ ...bookingData, userAddress: e.target.value })}
                  required
                  rows="3"
                  placeholder="Enter your full address"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Special Instructions
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  rows="2"
                  placeholder="Any additional details or requirements"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {bookingMessage && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: bookingMessage.includes('successful') ? '#d1fae5' : '#fee2e2',
                  color: bookingMessage.includes('successful') ? '#065f46' : '#991b1b',
                  fontSize: '14px'
                }}>
                  {bookingMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isSubmitting ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#2563eb')}
                onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = '#3b82f6')}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindWorker;