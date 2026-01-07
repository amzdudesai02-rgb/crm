-- SQL script to create demo account directly in database
-- Run this in your database management tool (Neon, Supabase, etc.)

-- First, check if account exists
SELECT * FROM users WHERE email = 'no-reply@amzdudes.io';

-- If it doesn't exist, create it
-- Note: You'll need to hash the password first, or use the register endpoint
-- This is just a reference - use the Python script instead

-- Better: Use the demo_setup.py script or signup via frontend

