from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello from Python FastAPI Agent API!"}

@app.get("/hello")
async def hello():
    return {"message": "Hello again from Python FastAPI Agent API!"}
