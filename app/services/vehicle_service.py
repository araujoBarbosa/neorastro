
from uuid import UUID
from typing import List, Optional
from app.core.supabase import get_supabase_client
from app.schemas.vehicle import VehicleRead, VehicleUpdate  # Assuming these exist based on Data Contract

class VehicleService:
    """
    Business logic for Vehicle management using Supabase.
    """
    
    def __init__(self):
        # Initialize client per request or use dependency injection
        self.supabase = get_supabase_client()
        self.table = "vehicles"

    def get_all_vehicles(self) -> List[dict]:
        """
        SELECT * FROM vehicles
        """
        try:
            response = self.supabase.table(self.table).select("*").execute()
            return response.data
        except Exception as e:
            print(f"Error fetching vehicles: {e}")
            raise e

    def get_vehicle_by_id(self, vehicle_id: UUID) -> Optional[dict]:
        """
        SELECT * FROM vehicles WHERE id = vehicle_id
        """
        try:
            response = self.supabase.table(self.table)\
                .select("*")\
                .eq("id", str(vehicle_id))\
                .single()\
                .execute()
            return response.data
        except Exception as e:
            # Supabase raises an error if .single() finds no rows
            return None

    def update_vehicle_status(self, vehicle_id: UUID, status: str) -> dict:
        """
        UPDATE vehicles SET status = 'val' WHERE id = vehicle_id
        """
        try:
            response = self.supabase.table(self.table)\
                .update({"status": status, "updated_at": "now() "})\
                .eq("id", str(vehicle_id))\
                .execute()
            
            if not response.data:
                raise ValueError("Vehicle not found or update failed")
                
            return response.data[0]
        except Exception as e:
            print(f"Error updating vehicle {vehicle_id}: {e}")
            raise e

    def register_vehicle(self, vehicle_data: dict) -> dict:
        """
        INSERT INTO vehicles (...) VALUES (...)
        """
        try:
            # RLS is bypassed here, so we can insert directly.
            # Ideally, ensure 'organization_id' is present in vehicle_data 
            # to maintain logical tenant isolation.
            response = self.supabase.table(self.table)\
                .insert(vehicle_data)\
                .execute()
            
            return response.data[0]
        except Exception as e:
            print(f"Error creating vehicle: {e}")
            raise e
