## BUG-14 Rate Limiting Implementation - Validation Test Cases

### Implementation Summary

- **File Modified**: backend/server.js (added general rate limiter import and application)
- **File Created**: backend/middleware/rateLimitMiddleware.js (rate limiter definitions)
- **File Modified**: backend/routes/authRoutes.js (applied authLimiter to sensitive endpoints)
- **Package Added**: express-rate-limit ^7.1.5 to backend/package.json

### Rate Limiting Configuration

1. **General API Rate Limiter**: 100 requests per 15 minutes per IP
   - Applied globally to all routes
   - Skips health check endpoint (/health)
2. **Authentication Rate Limiter**: 5 requests per 15 minutes per IP
   - Applied to sensitive auth endpoints
   - Stricter limits to prevent brute-force and OTP abuse

### Protected Endpoints (Stricter Rate Limiting - 5/15min)

- POST /api/auth/login
- POST /api/auth/pos-login
- POST /api/auth/register
- POST /api/auth/register/request-otp
- POST /api/auth/register/verify-otp
- POST /api/auth/forgot-password/request-otp
- POST /api/auth/forgot-password/verify-otp
- POST /api/auth/forgot-password/reset

### All Other Endpoints (General Rate Limiting - 100/15min)

- All endpoints except those listed above and /health

### Test Cases

#### Test 1: Normal API Request Should Succeed

**Test**: Make a GET request to an unprotected endpoint like /api/categories
**Expected**: 200 OK response
**Validates**: Rate limiting doesn't block normal requests

#### Test 2: Multiple Requests Below General Limit Should Succeed

**Test**: Make 50 GET requests to /api/categories from the same IP
**Expected**: All 50 requests return 200 OK
**Validates**: General rate limiter allows up to 100 requests per 15 minutes

#### Test 3: Requests Exceeding General Limit Should Be Rate Limited

**Test**: Make 101 GET requests to /api/categories from the same IP (within 15 minutes)
**Expected**: First 100 requests return 200 OK, 101st request returns 429 Too Many Requests
**Validates**: General rate limiter enforces 100 request limit

#### Test 4: Health Check Should Skip Rate Limiting

**Test**: Make 150 GET requests to /health from the same IP
**Expected**: All 150 requests return 200 OK (no rate limiting)
**Validates**: Health check endpoint bypasses rate limiting

#### Test 5: Auth Endpoint Has Stricter Rate Limit

**Test**: Make 6 POST requests to /api/auth/login from the same IP (within 15 minutes)
**Expected**: First 5 requests return 401/200 (auth success/failure based on credentials), 6th request returns 429 Too Many Requests
**Validates**: Auth limiter enforces 5 request limit

#### Test 6: Auth Endpoints Have Independent Limit Count

**Test**: Make 3 requests to /api/auth/login, 2 requests to /api/auth/pos-login from same IP
**Expected**: All 5 requests succeed, 6th request to either endpoint returns 429
**Validates**: Auth endpoints share the same 5-request limit

#### Test 7: OTP Endpoints Are Rate Limited

**Test**: Make 6 POST requests to /api/auth/register/request-otp from the same IP
**Expected**: First 5 requests return success/error based on validation, 6th returns 429
**Validates**: OTP endpoints are protected from abuse

#### Test 8: Password Reset Endpoints Are Rate Limited

**Test**: Make 6 POST requests to /api/auth/forgot-password/request-otp from the same IP
**Expected**: First 5 requests return success/error, 6th returns 429
**Validates**: Password reset endpoints are protected from abuse

#### Test 9: Rate Limit Headers Are Present

**Test**: Make a request to /api/auth/login and check response headers
**Expected**: Response includes RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset headers
**Validates**: Rate limit information is communicated to clients

#### Test 10: Different IPs Have Independent Rate Limits

**Test**:

- IP1 makes 3 requests to /api/auth/login
- IP2 makes 3 requests to /api/auth/login
- IP1 makes 3 more requests to /api/auth/login (total 6)
  **Expected**:
- IP1's 6th request returns 429
- IP2's requests all succeed (only at 3)
  **Validates**: Rate limiting is applied per IP address

### Testing Commands (curl examples)

#### Test login endpoint rate limit:

```bash
# Requests 1-5 should succeed/fail based on credentials
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
done

# Request 6 should return 429
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -w "\nStatus: %{http_code}\n"
```

#### Test general rate limit:

```bash
# Make 100+ requests to a regular endpoint
for i in {1..101}; do
  curl http://localhost:5000/api/categories \
    -w "Request $i - Status: %{http_code}\n"
done
```

#### Test health check bypass:

```bash
# Health check should not be rate limited
for i in {1..150}; do
  curl http://localhost:5000/health \
    -w "Request $i - Status: %{http_code}\n"
done
```

### Expected Response Format for 429 Too Many Requests

```json
{
  "message": "Too many authentication attempts, please try again later."
}
```

or for general limiter:

```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

### Verification Steps

1. **Check package.json**: Verify express-rate-limit is added to dependencies
2. **Check middleware file**: Verify rateLimitMiddleware.js exists and exports both limiters
3. **Check server.js**: Verify generalLimiter is imported and applied globally
4. **Check authRoutes.js**: Verify authLimiter is imported and applied to all sensitive endpoints
5. **Check rate limit headers**: Make a request and verify RateLimit-\* headers in response
6. **Functional testing**: Run the test commands above to validate rate limiting behavior

### Notes

- Rate limiting uses IP address from request. When behind a reverse proxy (like Vercel), ensure proxy is trusted via trust proxy setting if needed
- The 15-minute window resets after each 15-minute period
- Rate limit info is included in response headers as per standard RateLimit specification
- No business logic was modified; only middleware layer was enhanced
- All existing authentication, OTP, and password reset logic remains unchanged
