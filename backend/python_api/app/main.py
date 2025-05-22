from fastapi import FastAPI
import grpc
from concurrent import futures
import threading # For running gRPC server in a background thread

# Assuming your generated files are in a 'pb' subdirectory within 'app'
from .pb import greeter_pb2
from .pb import greeter_pb2_grpc

app = FastAPI()

# --- gRPC Server Implementation ---
class GreeterServicer(greeter_pb2_grpc.GreeterServicer):
    async def SayHello(self, request: greeter_pb2.HelloRequest, context: grpc.aio.ServicerContext):
        print(f"Received SayHello request from: {request.name}")
        return greeter_pb2.HelloReply(message=f"Hello, {request.name}! This is Python gRPC.")

async def serve_grpc():
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    greeter_pb2_grpc.add_GreeterServicer_to_server(GreeterServicer(), server)
    grpc_port = "50051"
    server.add_insecure_port(f'[::]:{grpc_port}')
    print(f"Python gRPC server listening on port {grpc_port}")
    await server.start()
    await server.wait_for_termination()

# --- FastAPI Endpoints ---
@app.get("/")
async def root():
    return {"message": "Hello from Python FastAPI Agent API!"}

@app.get("/hello")
async def hello():
    return {"message": "Hello again from Python FastAPI Agent API!"}

# --- FastAPI Startup Event to run gRPC server ---
_grpc_thread = None
_grpc_server_task = None

@app.on_event("startup")
async def startup_event():
    global _grpc_server_task
    # Running gRPC server in an asyncio task
    # For a more robust solution with Uvicorn, one might explore Uvicorn's ability
    # to manage multiple ASGI apps or use a dedicated gRPC server process.
    # This approach is simpler for a combined "hello world".
    print("FastAPI startup: Starting gRPC server...")
    _grpc_server_task = asyncio.create_task(serve_grpc())
    print("FastAPI startup: gRPC server task created.")


@app.on_event("shutdown")
async def shutdown_event():
    global _grpc_server_task
    if _grpc_server_task:
        print("FastAPI shutdown: Attempting to stop gRPC server...")
        # This is a simplified shutdown. Proper gRPC server shutdown can be more involved.
        # For grpc.aio.server, it should stop when wait_for_termination unblocks.
        # server.stop(grace=None) might be needed if it were a synchronous server.
        # For asyncio tasks, cancelling it might be an option if serve_grpc was designed for it.
        # For now, we rely on the process ending.
        print("FastAPI shutdown: gRPC server should be stopping.")

# Need to import asyncio for create_task
import asyncio
