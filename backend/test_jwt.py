from app.auth.security import create_access_token 
token = create_access_token({"sub": "1", "role": "customer"}) 
print(token) 
