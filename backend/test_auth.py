from app.auth.security import hash_password, verify_password 
h = hash_password("test123") 
print("hash:", h) 
print("verify:", verify_password("test123", h)) 
