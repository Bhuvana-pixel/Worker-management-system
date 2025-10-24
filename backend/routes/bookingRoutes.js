import express from "express";
import { createBooking, getBookingsByWorker, getBookingsByUser, updateBookingStatus, updateUserCompletion, submitReview, getBookingReviews } from "../controllers/bookingController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking by user
 * @access  Private (User only)
 */
router.post("/", auth, createBooking);

/**
 * @route   PUT /api/bookings/:bookingId/status
 * @desc    Update booking status (worker accepts/rejects/completes)
 * @access  Private (Worker only)
 */
router.put("/:bookingId/status", auth, updateBookingStatus);

/**
 * @route   GET /api/bookings/worker/:workerId
 * @desc    Get all bookings for a specific worker
 * @access  Private (Worker)
 */
router.get("/worker/:workerId", auth, getBookingsByWorker);

/**
 * @route   GET /api/bookings/user/:userId
 * @desc    Get all bookings made by a user
 * @access  Private (User)
 */
router.get("/user/:userId", auth, getBookingsByUser);

/**
 * @route   PUT /api/bookings/:bookingId/user-completion
 * @desc    Update user completion status for booking
 * @access  Private (User only)
 */
router.put("/:bookingId/user-completion", auth, updateUserCompletion);

/**
 * @route   POST /api/bookings/review
 * @desc    Submit a review for a completed booking
 * @access  Private (User only)
 */
router.post("/review", auth, submitReview);

/**
 * @route   GET /api/bookings/:bookingId/reviews
 * @desc    Get all reviews for a booking
 * @access  Public
 */
router.get("/:bookingId/reviews", getBookingReviews);

export default router;