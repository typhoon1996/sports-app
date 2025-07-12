# Sports App Backend API Documentation

This document outlines the API endpoints provided by the Sports App backend, intended for integration with the frontend application.

## API Endpoints

### Admin Routes (`/api/admin`)

These routes are typically protected and require administrative privileges.

*   **GET `/api/admin/users`**
    *   **Use Case:** Fetch a list of all users in the system. Useful for an admin dashboard to view and manage users.
*   **GET `/api/admin/users/:userId`**
    *   **Use Case:** Retrieve detailed information about a specific user by their ID. Used for viewing individual user profiles in the admin panel.
*   **DELETE `/api/admin/users/:userId`**
    *   **Use Case:** Permanently delete a user account. An administrative function for removing users from the system.
*   **PUT `/api/admin/users/:userId/block`**
    *   **Use Case:** Block a user, preventing them from accessing certain features or the application entirely.
*   **PUT `/api/admin/users/:userId/unblock`**
    *   **Use Case:** Unblock a previously blocked user, restoring their access.
*   **GET `/api/admin/reports`**
    *   **Use Case:** Fetch a list of all reported items (users, matches, messages). Used in an admin report management interface.
*   **GET `/api/admin/reports/:reportId`**
    *   **Use Case:** Retrieve detailed information about a specific report. Useful for administrators investigating a report.
*   **PUT `/api/admin/reports/:reportId/status`**
    *   **Use Case:** Update the status of a report (e.g., "pending," "resolved," "dismissed"). Used by administrators to manage the report workflow.
*   **DELETE `/api/admin/messages/:messageId`**
    *   **Use Case:** Delete a specific chat message. An administrative tool for moderation.
*   **PUT `/api/admin/users/:userId/disable`**
    *   **Use Case:** Disable a user account. Similar to blocking but might have different implications within the application logic.
*   **DELETE `/api/admin/matches/:matchId`**
    *   **Use Case:** Delete a specific match. An administrative function to remove unwanted or problematic matches.
*   **GET `/api/admin/sports`**
    *   **Use Case:** Fetch a list of all defined sports. Used by administrators to view available sports.
*   **POST `/api/admin/sports`**
    *   **Use Case:** Create a new sport entry. An administrative function to add new sports to the application.
*   **PUT `/api/admin/sports/:sportId`**
    *   **Use Case:** Update the details of an existing sport. Allows administrators to modify sport information.
*   **DELETE `/api/admin/sports/:sportId`**
    *   **Use Case:** Delete a sport entry. An administrative function to remove sports.

### Authentication Routes (`/api/auth`)

These routes handle user account creation and management.

*   **POST `/api/auth/signup`**
    *   **Use Case:** Register a new user account. Frontend sends user details (e.g., username, email, password).
*   **POST `/api/auth/login`**
    *   **Use Case:** Authenticate an existing user. Frontend sends user credentials, backend returns authentication tokens if successful.
*   **GET `/api/auth/profile`**
    *   **Use Case:** Retrieve the profile information of the currently authenticated user. Used for displaying the user's profile page.
*   **PUT `/api/auth/profile`**
    *   **Use Case:** Update the profile information of the currently authenticated user. Supports updating various profile fields, including potentially a profile picture (multipart/form-data).
*   **PUT `/api/auth/change-password`**
    *   **Use Case:** Allow the authenticated user to change their password. Frontend sends the old and new passwords.
*   **GET `/api/auth/preferences/notifications`**
    *   **Use Case:** Fetch the notification preferences for the authenticated user. Used to display and manage notification settings.
*   **PUT `/api/auth/preferences/notifications`**
    *   **Use Case:** Update the notification preferences for the authenticated user.

### Friendships Routes (`/api/friendships`)

These routes manage connections and relationships between users.

*   **POST `/api/friendships/requests/:receiverId`**
    *   **Use Case:** Send a friend request from the authenticated user to another user specified by `receiverId`.
*   **PUT `/api/friendships/requests/:requestId/accept`**
    *   **Use Case:** Accept a pending friend request. The authenticated user accepts a request they received.
*   **PUT `/api/friendships/requests/:requestId/reject`**
    *   **Use Case:** Reject a pending friend request. The authenticated user rejects a request they received.
*   **GET `/api/friendships/pending`**
    *   **Use Case:** Fetch all pending friend requests that the authenticated user has received. Used to display friend request notifications or a pending requests list.
*   **GET `/api/friendships/friendships`**
    *   **Use Case:** Fetch the list of users that the authenticated user is friends with.
*   **DELETE `/api/friendships/friendships/:friendshipId`**
    *   **Use Case:** Remove an existing friendship.
*   **PUT `/api/friendships/blocking/:userId`**
    *   **Use Case:** Block a user.
*   **PUT `/api/friendships/blocking/:userId/unblock`**
    *   **Use Case:** Unblock a user.

### Matches Routes (`/api/matches`)

These routes handle the creation, discovery, and management of sports matches.

*   **GET `/api/matches`**
    *   **Use Case:** Fetch a list of available matches. Can likely support query parameters for filtering (e.g., by sport, location, date). This is a public route.
*   **GET `/api/matches/:id`**
    *   **Use Case:** Fetch basic details of a specific match by its ID. This is a public route.
*   **GET `/api/matches/:id/details`**
    *   **Use Case:** Fetch more comprehensive details of a specific match by its ID. This is a public route.
*   **POST `/api/matches`**
    *   **Use Case:** Create a new sports match. Requires authentication. Frontend sends match details (sport, location, time, capacity, etc.).
*   **PUT `/api/matches/:id`**
    *   **Use Case:** Update the details of an existing match by its ID. Requires authentication and likely ownership or administrative rights.
*   **DELETE `/api/matches/:id`**
    *   **Use Case:** Delete an existing match by its ID. Requires authentication and likely ownership or administrative rights.
*   **GET `/api/matches/user/organized`**
    *   **Use Case:** Fetch a list of matches that the authenticated user has created.
*   **GET `/api/matches/user/participating`**
    *   **Use Case:** Fetch a list of matches that the authenticated user is currently participating in.
*   **POST `/api/matches/:matchId/join`**
    *   **Use Case:** Allow the authenticated user to join a specific match.
*   **DELETE `/api/matches/:matchId/leave`**
    *   **Use Case:** Allow the authenticated user to leave a match they have joined.
*   **GET `/api/matches/:matchId/participants`**
    *   **Use Case:** Fetch the list of participants for a specific match. This is a public route.

### Notifications Routes (`/api/notifications`)

These routes manage user notifications within the application.

*   **GET `/api/notifications`**
    *   **Use Case:** Fetch all notifications for the authenticated user.
*   **PUT `/api/notifications/:id/read`**
    *   **Use Case:** Mark a specific notification as read by its ID.
*   **PUT `/api/notifications/:id/dismiss`**
    *   **Use Case:** Mark a specific notification as dismissed (often hiding it from the user's view without permanently deleting).
*   **DELETE `/api/notifications/:id`**
    *   **Use Case:** Permanently delete a specific notification.

### Ratings Routes (`/api/ratings`)

These routes handle the user rating and review system.

*   **GET `/api/ratings/users/:userId`**
    *   **Use Case:** Fetch the ratings received by a specific user. This is a public route, allowing anyone to see a user's reputation.
*   **GET `/api/ratings/matches/:matchId`**
    *   **Use Case:** Fetch the ratings given for a specific match. This is a public route.
*   **POST `/api/ratings`**
    *   **Use Case:** Create a new rating. Typically used after a match to rate other participants. Requires authentication.
*   **PUT `/api/ratings/:ratingId`**
    *   **Use Case:** Update an existing rating. Requires authentication and likely ownership of the rating.
*   **DELETE `/api/ratings/:ratingId`**
    *   **Use Case:** Delete an existing rating. Requires authentication and likely ownership of the rating.
*   **GET `/api/ratings/pending/me`**
    *   **Use Case:** Fetch a list of matches or users that the authenticated user needs to rate. Used to prompt users for feedback after matches.

### Reports Routes (`/api/reports`)

These routes allow users to report content or other users.

*   **POST `/api/reports/match/:matchId`**
    *   **Use Case:** Submit a report about a specific match. Requires authentication.
*   **POST `/api/reports/user/:userId`**
    *   **Use Case:** Submit a report about a specific user. Requires authentication.
*   **POST `/api/reports/message/:messageId`**
    *   **Use Case:** Submit a report about a specific chat message. Requires authentication.

### Sports Routes (`/api/sports`)

These routes provide access to the list of sports available in the application.

*   **GET `/api/sports`**
    *   **Use Case:** Fetch a list of all available sports. Used for dropdowns, filters, or browsing. This is a public route.
*   **GET `/api/sports/:id`**
    *   **Use Case:** Fetch details of a specific sport by its ID. This is a public route.
*   **POST `/api/sports`**
    *   **Use Case:** Create a new sport. Requires administrative privileges.
*   **PUT `/api/sports/:id`**
    *   **Use Case:** Update details of a specific sport. Requires administrative privileges.
*   **DELETE `/api/sports/:id`**
    *   **Use Case:** Delete a sport. Requires administrative privileges.
