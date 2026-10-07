# Good Budget Backend API

This project exposes a set of REST endpoints for user accounts, authentication, categories, transactions, and summary reporting.

## 1) Health check

### GET /test
- Full path: `http://localhost:3000/test`
- Auth required: No
- Request body: None
- Query params: None
- Summary: Simple server health check endpoint used to confirm the app is running.
- Failure cases covered:
  - None beyond generic server-side failure; the route itself does not validate anything.

## 2) Authentication

### POST /auth/signup
- Full path: `http://localhost:3000/auth/signup`
- Auth required: No
- Body (JSON):
  - `name` (string, required): user display name, trimmed before validation
  - `email` (string, required): valid email address
  - `username` (string, required): lowercase username matching allowed pattern
  - `password` (string, required): must be at least 8 chars, include uppercase, number, and special character
- Summary: Creates a new user, hashes the password, and returns a JWT access token and refresh token.
- Failure cases covered:
  - `name` not a string
  - `email` not a string
  - `username` not a string
  - `password` not a string
  - empty/invalid `name` (max 60 chars)
  - invalid email format
  - invalid username format
  - invalid password format
  - duplicate email (`409`)
  - duplicate username (`409`)
  - missing JWT config environment variables (`500`)
  - database insert failure or server error (`500`)

### POST /auth/login
- Full path: `http://localhost:3000/auth/login`
- Auth required: No
- Body (JSON):
  - `identifier` (string, required): either email or username
  - `password` (string, required): plain text password to verify
- Summary: Authenticates a user by email or username and issues an access token.
- Failure cases covered:
  - `identifier` is not a string
  - `password` is not a string
  - empty identifier after trim
  - user not found (`404`)
  - incorrect password (`401`)
  - missing JWT secret config (`500`)
  - invalid/expired token-related error while signing (`500`)
  - database lookup failure or server error (`500`)

## 3) Users

### GET /users/
- Full path: `http://localhost:3000/users/`
- Auth required: No
- Query params: None
- Summary: Retrieves a limited list of users from the database.
- Failure cases covered:
  - Database/connection issues (`500`)
  - No explicit validation error is raised here; list results are gated by environment `RATE_LIMIT`

### GET /users/:id
- Full path: `http://localhost:3000/users/:id`
- Auth required: No
- Path params:
  - `id` (UUID, required): user ID
- Summary: Fetches a specific user by UUID.
- Failure cases covered:
  - invalid UUID (`400`)
  - no matching user (`404`)
  - database/server error (`500`)

### POST /users/
- Full path: `http://localhost:3000/users/`
- Auth required: No
- Body (JSON):
  - `user_name` (string, required)
  - `user_email` (string, required)
  - `user_username` (string, required)
  - `user_password` (string, required)
- Summary: Creates a user record directly without JWT-based authentication.
- Failure cases covered:
  - invalid `user_name` length/content
  - invalid `user_username` format
  - invalid `user_password` policy
  - duplicate username (`409`)
  - missing `HASH_SALT` config (`500`)
  - database error or insert failure (`500`)

### PATCH /users/
- Full path: `http://localhost:3000/users/`
- Auth required: No
- Body (JSON):
  - `user_id` (UUID, required)
  - optional: `user_name`, `user_email`, `user_username`, `user_password`
- Summary: Updates one or more user fields for the specified user.
- Failure cases covered:
  - invalid `user_id` (`400`)
  - invalid `user_name` format (`400`)
  - invalid `user_username` format (`400`)
  - invalid `user_password` policy (`400`)
  - user does not exist (`404`)
  - no update fields provided (`400`)
  - missing `HASH_SALT` config (`500`)
  - database or server error (`500`)

### DELETE /users/
- Full path: `http://localhost:3000/users/`
- Auth required: No
- Body (JSON):
  - `user_id` (UUID, required)
- Summary: Permanently deletes a user record.
- Failure cases covered:
  - invalid UUID (`400`)
  - user not found (`404`)
  - database/server error (`500`)

## 4) Accounts

### GET /accounts/
- Full path: `http://localhost:3000/accounts/`
- Auth required: No
- Query params: None
- Summary: Returns a paginated list of account rows using the configured `RATE_LIMIT`.
- Failure cases covered:
  - database/server error (`500`)

### GET /accounts/:id
- Full path: `http://localhost:3000/accounts/:id`
- Auth required: No
- Path params:
  - `id` (UUID, required)
- Summary: Finds one account by ID.
- Failure cases covered:
  - invalid UUID (`400`)
  - account not found (`404`)
  - database/server error (`500`)

### POST /accounts/
- Full path: `http://localhost:3000/accounts/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `acc_name` (string, required)
  - `acc_type` (string, required): one of `cash`, `saving`, `credit_card`, `current`
  - `acc_balance` (number, required): must be >= 0
- Summary: Creates a new account associated with the authenticated user.
- Failure cases covered:
  - invalid or empty account name (`400`)
  - negative balance (`400`)
  - invalid account type (`400`)
  - invalid authenticated user ID (`400`)
  - user not found (`404`)
  - database/server error (`500`)

### PATCH /accounts/
- Full path: `http://localhost:3000/accounts/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `acc_id` (UUID, required)
  - optional: `acc_name`, `acc_type`, `acc_is_disabled`
- Summary: Updates account fields only for the authenticated user’s account.
- Failure cases covered:
  - invalid `acc_id` (`400`)
  - invalid `acc_name` (`400`)
  - invalid `acc_type` (`400`)
  - no fields supplied (`400`)
  - account not found for that user (`404`)
  - database/server error (`500`)

### DELETE /accounts/
- Full path: `http://localhost:3000/accounts/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `acc_id` (UUID, required)
- Summary: Deletes the specified account only if it belongs to the authenticated user.
- Failure cases covered:
  - invalid account ID (`400`)
  - account not found or not owned by user (`404`)
  - malformed SQL in delete query may trigger a server error (`500`)
  - database/server error (`500`)

## 5) Transactions

### GET /transactions/
- Full path: `http://localhost:3000/transactions/`
- Auth required: No
- Query params: None
- Summary: Returns recent transactions sorted by `created_at` descending, limited by environment `RATE_LIMIT`.
- Failure cases covered:
  - database/server error (`500`)

### GET /transactions/:id
- Full path: `http://localhost:3000/transactions/:id`
- Auth required: No
- Path params:
  - `id` (UUID, required): transaction id
- Summary: Fetches a single transaction by UUID.
- Failure cases covered:
  - invalid transaction ID (`400`)
  - transaction not found (`404`)
  - database/server error (`500`)

### GET /transactions/user/:id
- Full path: `http://localhost:3000/transactions/user/:id`
- Auth required: No
- Path params:
  - `id` (UUID, required): user ID
- Summary: Lists all transactions for a specific user sorted by date and creation time.
- Failure cases covered:
  - invalid user ID (`400`)
  - user not found (`404`)
  - database/server error (`500`)

### GET /transactions/account/:id
- Full path: `http://localhost:3000/transactions/account/:id`
- Auth required: No
- Path params:
  - `id` (UUID, required): account ID
- Summary: Lists all transactions for a specific account.
- Failure cases covered:
  - invalid account ID (`400`)
  - account not found (`404`)
  - database/server error (`500`)

### POST /transactions/
- Full path: `http://localhost:3000/transactions/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `account_id` (UUID, required)
  - `tran_merchant` (string, required)
  - `tran_type` (string, required): `income` or `expense`
  - `tran_amount` (number, required): must be > 0
  - optional: `tran_desc`, `tran_status`, `tran_mode`, `tran_date`
- Summary: Creates a transaction for the authenticated user and updates the account balance immediately.
- Failure cases covered:
  - invalid authenticated user ID (`400`)
  - invalid `account_id` (`400`)
  - missing merchant (`400`)
  - invalid transaction amount (`400`)
  - invalid `tran_type` (`400`)
  - invalid `tran_status` (`400`)
  - invalid `tran_mode` (`400`)
  - invalid `tran_date` (`400`)
  - account does not exist or not belong to user (`404`)
  - invalid PostgreSQL enum or foreign key errors (`400`)
  - missing required DB field (`400`)
  - database/server error (`500`)

### PATCH /transactions/
- Full path: `http://localhost:3000/transactions/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `tran_id` (UUID, required)
  - optional: `tran_desc`, `tran_status`, `tran_merchant`, `tran_mode`, `tran_date`
- Summary: Updates transaction fields for the authenticated user's transaction while keeping the row active (`deleted_at IS NULL`).
- Failure cases covered:
  - invalid `tran_id` (`400`)
  - invalid `tran_status` (`400`)
  - invalid `tran_mode` (`400`)
  - invalid `tran_date` (`400`)
  - no fields provided (`400`)
  - transaction not found for that user (`404`)
  - invalid PostgreSQL enum error (`400`)
  - database/server error (`500`)

### DELETE /transactions/
- Full path: `http://localhost:3000/transactions/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `tran_id` (UUID, required)
- Summary: Soft deletes a transaction and reverses the account balance impact for the authenticated user.
- Failure cases covered:
  - invalid `tran_id` (`400`)
  - transaction not found or already deleted (`404`)
  - account balance update failure (`500`)
  - database or transaction rollback failure (`500`)

## 6) Summary endpoints

### GET /summary/all
- Full path: `http://localhost:3000/summary/all`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Query params:
  - `start_date` (string, required): date in a valid parseable format
  - `end_date` (string, required): date in a valid parseable format
- Summary: Aggregates all transactions for the authenticated user between a start and end date, including counts, totals, and min/max transaction entries.
- Failure cases covered:
  - missing `start_date` (`400`)
  - missing `end_date` (`400`)
  - missing `user_id` in auth payload (`400`)
  - invalid `start_date` (`400`)
  - invalid `end_date` (`400`)
  - invalid user UUID (`400`)
  - authenticated user does not exist (`404`)
  - database/server error (`500`)

### GET /summary/accounts/
- Full path: `http://localhost:3000/summary/accounts/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Query params:
  - `start_date` (string, required)
  - `end_date` (string, required)
  - `acc_id` (UUID, required)
- Summary: Aggregates transactions for one account and the authenticated user during the chosen date range.
- Failure cases covered:
  - missing `start_date` (`400`)
  - missing `end_date` (`400`)
  - missing `acc_id` (`400`)
  - missing auth user (`400`)
  - invalid `start_date` (`400`)
  - invalid `end_date` (`400`)
  - invalid `acc_id` (`400`)
  - invalid user ID (`400`)
  - account does not exist for this user (`404`)
  - database/server error (`500`)

### GET /summary/categories/
- Full path: `http://localhost:3000/summary/categories/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Query params:
  - `start_date` (string, optional; defaults to Jan 1 of current year)
  - `end_date` (string, optional; defaults to today)
  - `cat_id` (UUID, required)
- Summary: Summarizes transaction totals for a specific category within the selected date range for the authenticated user.
- Failure cases covered:
  - missing `start_date` or `end_date` is accepted by default logic, but if provided they must be valid strings
  - `start_date` after `end_date` (`400`)
  - missing `cat_id` (`400`)
  - missing auth user in request (`400`)
  - invalid `start_date` (`400`)
  - invalid `end_date` (`400`)
  - invalid category ID (`400`)
  - invalid user ID (`400`)
  - category missing or soft-deleted (`404`)
  - database/server error (`500`)

## 7) Categories

### GET /categories/all/
- Full path: `http://localhost:3000/categories/all/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Query params:
  - `limit` (positive integer, optional)
  - `offset` (non-negative integer, optional)
- Summary: Lists categories for the authenticated user with pagination support.
- Failure cases covered:
  - invalid `limit` type/value (`400`)
  - invalid `offset` type/value (`400`)
  - database/server error (`500`)

### GET /categories/search/
- Full path: `http://localhost:3000/categories/search/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Query params:
  - `name` (string, optional)
  - `desc` (string, optional)
- Summary: Searches categories for the authenticated user by name and/or description using `ILIKE` matching.
- Failure cases covered:
  - neither `name` nor `desc` provided (`400`)
  - database/server error (`500`)

### GET /categories/:cat_id
- Full path: `http://localhost:3000/categories/:cat_id`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Path params:
  - `cat_id` (UUID, required)
- Summary: Finds a category by ID for the authenticated user.
- Failure cases covered:
  - invalid category ID (`400`)
  - no category found for that user (`404`)
  - database/server error (`500`)

### POST /categories/
- Full path: `http://localhost:3000/categories/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `name` (string, required)
  - `desc` (string, optional)
- Summary: Creates a category tied to the authenticated user.
- Failure cases covered:
  - `name` not a string (`400`)
  - `desc` present but not a string (`400`)
  - empty `name` after trim (`400`)
  - database/server error (`500`)

### PATCH /categories/
- Full path: `http://localhost:3000/categories/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `cat_id` (UUID, required)
  - optional: `name`, `desc`
- Summary: Updates a category name/description for the authenticated user.
- Failure cases covered:
  - invalid `cat_id` (`400`)
  - `name` present but not a string (`400`)
  - `desc` present but not a string (`400`)
  - empty `name` after trim (`400`)
  - no update fields supplied (`400`)
  - category not found for that user (`404`)
  - database/server error (`500`)

### DELETE /categories/
- Full path: `http://localhost:3000/categories/`
- Auth required: Yes (`Authorization: Bearer + access token string`)
- Body (JSON):
  - `cat_id` (UUID, required)
- Summary: Soft deletes a category for the authenticated user.
- Failure cases covered:
  - invalid category ID (`400`)
  - category not found for that user (`404`)
  - database/server error (`500`)

## Notes and caveats
- Some routes are mounted with trailing slashes or path segments; ensure you match the exact path used in Express registration.
- Several endpoints rely on the database schema and environment variables such as `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `HASH_SALT`.
- The project includes a few inconsistencies between route declarations and controller logic (for example, some body keys differ from the database field names or a delete query string contains a typo in the account route). This README documents the implemented behavior as written in the controllers.
