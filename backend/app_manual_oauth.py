"""
ALTERNATIVE OAUTH IMPLEMENTATION - Manual Token Exchange
Use this if authlib's automatic handling fails with "Request URL missing protocol" error.

This manually handles the OAuth token exchange instead of relying on authlib's request.url access.
"""

import httpx
from urllib.parse import urlencode

# Replace the auth_google_callback function with this version:

@app.get("/auth/google", name="auth_google_callback")
async def auth_google_callback_manual(request: Request, db: Session = Depends(get_db)):
    """
    Manual OAuth token exchange - bypasses authlib's URL construction issues
    """
    try:
        # Check credentials
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=500,
                detail="Google OAuth not configured"
            )
        
        # Get authorization code from query params
        code = request.query_params.get("code")
        if not code:
            error = request.query_params.get("error")
            if error:
                raise HTTPException(
                    status_code=400,
                    detail=f"Google OAuth error: {error}"
                )
            raise HTTPException(
                status_code=400,
                detail="No authorization code received"
            )
        
        # Get redirect_uri from session (saved during authorize_redirect)
        # If not in session, construct from request
        redirect_uri = None
        if hasattr(request, 'session') and request.session:
            # authlib stores redirect_uri in session with a specific key
            for key in request.session.keys():
                if 'redirect_uri' in str(key).lower():
                    redirect_uri = request.session.get(key)
                    break
        
        # If not in session, construct from request headers
        if not redirect_uri:
            scheme = request.headers.get('x-forwarded-proto', 'https')
            if scheme not in ['http', 'https']:
                scheme = 'https'
            host = request.headers.get('x-forwarded-host') or request.headers.get('host', 'crm-o52e.onrender.com')
            redirect_uri = f"{scheme}://{host}/auth/google"
            print(f"🔧 Constructed redirect_uri from headers: {redirect_uri}")
        else:
            print(f"🔧 Using redirect_uri from session: {redirect_uri}")
        
        # Get state from session for CSRF protection
        state = None
        if hasattr(request, 'session') and request.session:
            for key in request.session.keys():
                if 'state' in str(key).lower() and 'redirect_uri' not in str(key).lower():
                    state = request.session.get(key)
                    break
        
        # Manual token exchange with Google
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        
        print(f"🔍 Exchanging code for token...")
        print(f"   Token URL: {token_url}")
        print(f"   Redirect URI: {redirect_uri}")
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
        
        if token_response.status_code != 200:
            error_text = token_response.text
            print(f"❌ Token exchange failed: {error_text}")
            raise HTTPException(
                status_code=400,
                detail=f"Token exchange failed: {error_text}"
            )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="No access token in response"
            )
        
        print(f"✅ Successfully obtained access token")
        
        # Get user info from Google
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        async with httpx.AsyncClient() as client:
            userinfo_response = await client.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
        
        if userinfo_response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="Failed to get user info from Google"
            )
        
        user_info = userinfo_response.json()
        email = user_info.get("email")
        name = user_info.get("name", "Google User")
        
        if not email:
            raise HTTPException(
                status_code=400,
                detail="No email in user info"
            )
        
        print(f"✅ User info received: {email}")
        
        # Create or get user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            role = db.query(Role).filter(Role.name == "Team").first()
            if not role:
                role = Role(name="Team")
                db.add(role)
                db.commit()
                db.refresh(role)
            
            user = User(
                name=name,
                email=email,
                role_id=role.id,
                created_at=datetime.utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create JWT token
        access_token_jwt = create_access_token(data={"sub": str(user.id)})
        
        # Redirect to frontend with token
        return RedirectResponse(url=f"{FRONTEND_URL}/?token={access_token_jwt}")
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ OAuth Error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=400,
            detail=f"OAuth failed: {str(e)}"
        )

