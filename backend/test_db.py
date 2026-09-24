from app.database import SessionLocal 
from app.models.user import User 
from app.auth.security import verify_password 
db = SessionLocal() 
user = db.query(User).filter(User.email == "customer2@example.com").first() 
print("found:", user is not None) 
print("stored hash:", user.password_hash if user else None) 
print("verify result:", verify_password("customer123", user.password_hash) if user else "N/A") 
