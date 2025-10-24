# Task: Implement Completion Logic Where Both User and Worker Must Mark as Complete

## Objective
Modify the booking system so that a service is marked as "completed" only when both the user and worker have clicked "marked as complete". Currently, the worker can mark it as completed immediately, but it should wait for the user.

## Steps
1. **Update Backend Controller Logic**
   - Modify `updateBookingStatus` in `backend/controllers/bookingController.js` to set `workerCompleted = true` when worker marks as complete, but only set `status = "completed"` if `userCompleted` is also true.
   - Ensure notifications and payment processing only happen when both have completed.

2. **Add User Completion Button in Frontend**
   - In `frontend/src/pages/UserDashboard.jsx`, add a "Mark as Completed" button for accepted bookings in the bookings tab.
   - Implement `handleUserCompletion` function to call the backend endpoint for user completion.
   - Refresh bookings after successful update.

3. **Test the Changes**
   - Verify that when worker marks as complete, status remains "accepted" until user also marks.
   - Ensure both dashboards show correct statuses and buttons.
   - Check notifications and payment processing.

## Files to Edit
- backend/controllers/bookingController.js: Update logic in updateBookingStatus.
- frontend/src/pages/UserDashboard.jsx: Add button and handler for user completion.

## Followup Steps
- After editing, test the application to ensure the completion logic works as expected.
- If needed, update any related UI or add error handling.
