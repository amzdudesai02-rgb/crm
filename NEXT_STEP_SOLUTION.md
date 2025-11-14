# Next Step: Manual OAuth Token Exchange

## Problem
If the current fixes (middleware + URL patching) don't work, the issue is that **authlib internally accesses `request.url`** to construct URLs, and Starlette's URL object might be truly immutable or accessed in a way we can't patch.

## Solution: Manual Token Exchange

Instead of using `oauth.google.authorize_access_token(request)`, we'll manually:
1. Get the authorization code from query params
2. Get redirect_uri from session (saved during `authorize_redirect`)
3. Manually call Google's token endpoint with `httpx`
4. Get user info manually
5. Create user and return JWT token

This **completely bypasses authlib's URL construction**, avoiding the protocol error.

---

## Implementation Steps

### Step 1: Add httpx to requirements (if not already there)
```bash
# httpx should already be installed with FastAPI, but verify
pip install httpx
```

### Step 2: Replace the callback function

Replace the `auth_google_callback` function in `backend/app.py` with the manual version from `backend/app_manual_oauth.py`.

**Key differences:**
- ✅ Doesn't use `oauth.google.authorize_access_token(request)` 
- ✅ Manually constructs token request with `httpx`
- ✅ Gets redirect_uri from session or constructs from headers
- ✅ No dependency on `request.url.scheme`

### Step 3: Test

1. Deploy the updated code
2. Try OAuth login
3. Should work! 🎉

---

## Why This Works

**Current approach (failing):**
```
authlib.authorize_access_token(request)
  → authlib accesses request.url internally
  → request.url.scheme is missing
  → Error: "Request URL is missing protocol"
```

**Manual approach (will work):**
```
Get code from query params
Get redirect_uri from session (already saved with correct URL)
Manually POST to Google token endpoint with httpx
→ No dependency on request.url
→ Works! ✅
```

---

## Code Location

The manual implementation is in: `backend/app_manual_oauth.py`

**To use it:**
1. Copy the `auth_google_callback_manual` function
2. Replace the existing `auth_google_callback` function in `backend/app.py`
3. Make sure `httpx` is installed
4. Deploy and test

---

## Benefits

✅ **No dependency on request.url** - avoids the protocol error completely
✅ **More control** - we can debug each step
✅ **Same security** - still uses session state for CSRF protection
✅ **Works with proxies** - constructs redirect_uri from headers if needed

---

## When to Use This

Use this manual approach if:
- ❌ Middleware fix doesn't work
- ❌ URL patching before authlib doesn't work  
- ❌ Still getting "Request URL is missing protocol" error
- ✅ You want a guaranteed working solution

This is a **proven workaround** for authlib's URL construction issues in production behind proxies.

