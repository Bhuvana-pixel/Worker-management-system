import Booking from "../models/booking.js";
import Service from "../models/service.js";
import Notification from "../models/notification.js";
import Review from "../models/review.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Only users can create bookings." });
    }

    const { serviceId, bookingDate, bookingTime, userAddress, notes } = req.body;
    if (!serviceId || !bookingDate || !bookingTime || !userAddress) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields." });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    const newBooking = new Booking({
      serviceId,
      workerId: service.workerId,
      userId: req.user.id,
      userName: req.user.name,
      bookingDate,
      bookingTime,
      userAddress,
      notes,
      price: service.price,
      status: "pending",
    });

    await newBooking.save();

    // Notify worker about new booking
    const workerNotification = new Notification({
      recipientId: service.workerId,
      message: `New booking request for your service "${service.title}" from ${req.user.name}.`,
    });
    await workerNotification.save();

    res.status(201).json({ success: true, message: "Booking created successfully.", booking: newBooking });
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(500).json({ success: false, message: "Booking failed." });
  }
};

// Get bookings by worker ID
export const getBookingsByWorker = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "worker") {
      return res.status(403).json({ success: false, message: "Only workers can view this data." });
    }

    // Ensure the logged-in worker can only view their own bookings
    if (req.params.workerId !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "You can only view your own bookings." });
    }

    const bookings = await Booking.find({ workerId: req.params.workerId })
      .populate("serviceId")
      .populate("userId");

    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Get worker bookings error:", err);
    res.status(500).json({ success: false, message: "Error fetching bookings." });
  }
};

// Get bookings by user ID
export const getBookingsByUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Only users can view their bookings." });
    }

    const bookings = await Booking.find({ userId: req.params.userId })
      .populate("serviceId")
      .populate("workerId");

    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Get user bookings error:", err);
    res.status(500).json({ success: false, message: "Error fetching user bookings." });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "worker") {
      return res.status(403).json({ success: false, message: "Only workers can update booking status." });
    }

    const { status } = req.body;
    if (!["accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const booking = await Booking.findById(req.params.bookingId).populate("serviceId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    console.log('Debug: booking.workerId:', booking.workerId.toString(), 'req.user.id:', req.user.id.toString(), 'req.user.role:', req.user.role);

    // Ensure the logged-in worker owns this booking
    if (booking.workerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to update this booking." });
    }

    if (status === "completed") {
      booking.workerCompleted = true;

      // Only mark as completed if both worker and user have completed
      if (booking.userCompleted) {
        booking.status = "completed";
        booking.paymentStatus = "paid"; // Process payment when both have completed

        // Notify user about payment
        const paymentNotification = new Notification({
          recipientId: booking.userId,
          message: `Payment of ₹${booking.price} has been processed for booking "${booking.serviceId.title}".`,
        });
        await paymentNotification.save();

        // Emit real-time notification to user
        const io = req.app.get('io');
        io.to(booking.userId.toString()).emit('notification', {
          message: `Payment of ₹${booking.price} has been processed for booking "${booking.serviceId.title}".`,
          type: 'payment_processed',
          bookingId: booking._id
        });
      }
    } else {
      booking.status = status;
    }

    await booking.save();

    // Notify user about booking update
    const userNotification = new Notification({
      recipientId: booking.userId,
      message: `Your booking for "${booking.serviceId.title}" has been ${status}.`,
    });
    await userNotification.save();

    // Emit real-time notification to user
    const io = req.app.get('io');
    io.to(booking.userId.toString()).emit('notification', {
      message: `Your booking for "${booking.serviceId.title}" has been ${status}.`,
      type: 'booking_update',
      bookingId: booking._id
    });

    res.json({ success: true, message: `Booking ${status}.`, booking });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ success: false, message: "Server error while updating status." });
  }
};

// Update user completion status
export const updateUserCompletion = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Only users can update completion status." });
    }

    const booking = await Booking.findById(req.params.bookingId).populate("serviceId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Ensure the logged-in user owns this booking
    if (booking.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to update this booking." });
    }

    // Only allow completion if booking is accepted
    if (booking.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Booking must be accepted before marking as completed." });
    }

    booking.userCompleted = true;

    // If both worker and user have completed, finalize the booking and process payment
    if (booking.workerCompleted && booking.userCompleted) {
      booking.status = "completed";
      booking.paymentStatus = "paid"; // Simulate payment processing

      // Notify worker about payment
      const paymentNotification = new Notification({
        recipientId: booking.workerId,
        message: `Payment of ₹${booking.price} has been processed for booking "${booking.serviceId.title}".`,
      });
      await paymentNotification.save();

      // Emit real-time notification to worker
      const io = req.app.get('io');
      io.to(booking.workerId.toString()).emit('notification', {
        message: `Payment of ₹${booking.price} has been processed for booking "${booking.serviceId.title}".`,
        type: 'payment_processed',
        bookingId: booking._id
      });
    }

    await booking.save();

    // Notify user about their completion action
    const userNotification = new Notification({
      recipientId: booking.userId,
      message: `You have marked the booking for "${booking.serviceId.title}" as completed.`,
    });
    await userNotification.save();

    res.json({ success: true, message: "Booking completion updated.", booking });
  } catch (err) {
    console.error("Update user completion error:", err);
    res.status(500).json({ success: false, message: "Server error while updating completion." });
  }
};

// Submit review for completed booking
export const submitReview = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "user") {
      return res.status(403).json({ success: false, message: "Only users can submit reviews." });
    }

    const { bookingId, rating, feedback } = req.body;
    if (!bookingId || !rating || !feedback) {
      return res.status(400).json({ success: false, message: "Please provide rating and feedback." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const booking = await Booking.findById(bookingId).populate("serviceId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Ensure the logged-in user owns this booking
    if (booking.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to review this booking." });
    }

    // Only allow review if booking is completed and paid
    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({ success: false, message: "You can only review completed and paid bookings." });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId, userId: req.user.id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this booking." });
    }

    const newReview = new Review({
      bookingId,
      userId: req.user.id,
      workerId: booking.workerId,
      rating,
      feedback
    });

    await newReview.save();

    res.json({ success: true, message: "Review submitted successfully.", review: newReview });
  } catch (err) {
    console.error("Submit review error:", err);
    res.status(500).json({ success: false, message: "Server error while submitting review." });
  }
};

// Get reviews for a booking
export const getBookingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ bookingId: req.params.bookingId })
      .populate("userId", "name")
      .populate("workerId", "name");

    res.json({ success: true, reviews });
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ success: false, message: "Error fetching reviews." });
  }
};

// Add more controller functions as needed (delete booking, etc.)