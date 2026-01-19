
import os
from supabase import create_client, Client
from typing import Optional

# Singleton instance placeholder
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Returns a singleton instance of the Supabase Client.
    
    CRITICAL SECURITY NOTE:
    This client uses the SERVICE_ROLE_KEY. It bypasses Row Level Security (RLS).
    It should ONLY be used in the trusted backend environment (FastAPI), never on the client-side.
    """
    global _supabase_client
    
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

        if not url or not key:
            raise ValueError(
                "Missing Supabase configuration. "
                "Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env"
            )

        try:
            _supabase_client = create_client(url, key)
        except Exception as e:
            raise ConnectionError(f"Failed to initialize Supabase client: {str(e)}")

    return _supabase_client
