# NeoRastro Data Contract

This document defines the strict data schemas shared between the **FastAPI Ingestion Engine**, **Supabase Database**, and **React Frontend**.

---

## 1. Python Models (Pydantic / FastAPI)

Use these models in the Python backend to validate TCP stream data before inserting into Supabase.

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime
from uuid import UUID

# Enums
StatusType = Literal['online', 'offline', 'moving', 'idle', 'maintenance']

class PositionBase(BaseModel):
    """Telemetry data point from GPS tracker"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    speed: float = Field(..., ge=0, description="Speed in km/h")
    course: Optional[float] = Field(None, ge=0, le=360)
    altitude: Optional[float] = None
    satellites: Optional[int] = Field(None, ge=0)
    ignition: bool = Field(False, description="Ignition status (ACC)")
    voltage: float = Field(0.0, description="Vehicle battery voltage")
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "lat": -23.5505,
                "lng": -46.6333,
                "speed": 80.5,
                "course": 120,
                "ignition": True,
                "voltage": 12.8,
                "timestamp": "2024-05-20T10:00:00Z"
            }
        }

class VehicleRead(BaseModel):
    """Vehicle entity sent to Frontend"""
    id: UUID
    organization_id: UUID
    plate: str
    name: str
    model: str
    driver: str
    status: StatusType
    last_position: Optional[PositionBase]
    
    # Computed fields or joined data can be added here
```

---

## 2. JSON Payload Example (Realtime Event)

This is the payload structure expected by the Frontend via **Supabase Realtime** (WebSocket) or REST API response.

### Single Vehicle Update
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Caminhão 01 - Entrega",
  "plate": "ABC-1234",
  "status": "moving",
  "model": "Volvo FH16",
  "driver": "Carlos Silva",
  "lastPosition": {
    "lat": -23.55052,
    "lng": -46.63331,
    "speed": 65.5,
    "course": 180,
    "ignition": true,
    "voltage": 24.2,
    "timestamp": "2024-05-21T14:30:05.123Z"
  }
}
```

---

## 3. Database Schema (Supabase)

For reference, this corresponds to the database definitions.

**Table: `positions`**
- `id`: uuid (PK)
- `vehicle_id`: uuid (FK -> vehicles.id)
- `lat`: float8
- `lng`: float8
- `speed`: float4
- `course`: float4
- `ignition`: boolean
- `voltage`: float4
- `timestamp`: timestamptz
- `raw_data`: jsonb (Optional: stores original hex string from tracker)

**Table: `vehicles`**
- `id`: uuid (PK)
- `organization_id`: uuid (RLS Partition Key)
- `plate`: text
- ...
```