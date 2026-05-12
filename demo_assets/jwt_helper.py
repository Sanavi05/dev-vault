import jwt
import os
from datetime import datetime, timedelta

JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token.
    Raises jwt.InvalidTokenError on failure.
    Common failure: JWT_SECRET mismatch between services.
    Always ensure JWT_SECRET is identical in issuer and validator envs.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired - user must re-authenticate")
    except jwt.InvalidSignatureError:
        raise ValueError("Invalid signature - JWT_SECRET mismatch between services")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Token validation failed: {str(e)}")
