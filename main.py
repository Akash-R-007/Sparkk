# ~/proj-python-api/main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:3000", # Your Next.js development server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Supabase URL and Service Role Key must be set as environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

@app.get("/")
async def read_root():
    return {"message": "Python API connected to Supabase and running in WSL!"}

@app.get("/api/items")
async def get_items():
    try:
        response = supabase.table("items").select("*").execute()
        if response.data is None:
            raise HTTPException(status_code=500, detail="Failed to fetch data from Supabase.")
        return response.data
    except Exception as e:
        print(f"Error fetching items: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching items: {str(e)}")

@app.post("/api/items")
async def create_item(item: dict):
    try:
        if not item.get("name"):
            raise HTTPException(status_code=400, detail="Item 'name' is required.")

        response = supabase.table("items").insert(item).execute()
        if response.data is None:
            raise HTTPException(status_code=500, detail="Failed to insert data into Supabase.")
        return response.data[0]
    except Exception as e:
        print(f"Error creating item: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating item: {str(e)}")