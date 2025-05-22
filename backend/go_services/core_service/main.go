package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	// Import the generated gRPC code.
	// The import path is based on the go_package option in your greeter.proto
	// and your project's module structure.
	pb "github.com/Septa-Serpenta-Seraph/Data-Forest/backend/proto/greeter"
)

const (
	pythonGrpcAddress = "localhost:50051" // Address of the Python gRPC server
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/hello" {
		http.NotFound(w, r)
		return
	}
	fmt.Fprintf(w, "Hello from Go Core Service!")
}

// callPythonGRPCHandler makes a gRPC call to the Python Greeter service
func callPythonGRPCHandler(w http.ResponseWriter, r *http.Request) {
	// Set up a connection to the server.
	conn, err := grpc.NewClient(pythonGrpcAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Printf("Failed to connect to Python gRPC server: %v", err)
		http.Error(w, "Failed to connect to Python gRPC server", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	c := pb.NewGreeterClient(conn)

	// Contact the server and print out its response.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	name := "Go Client" // You can make this dynamic, e.g., from query params
	grpcResponse, err := c.SayHello(ctx, &pb.HelloRequest{Name: name})
	if err != nil {
		log.Printf("Could not greet: %v", err)
		http.Error(w, "Failed to call Python gRPC SayHello", http.StatusInternalServerError)
		return
	}
	log.Printf("Greeting from Python: %s", grpcResponse.GetMessage())
	fmt.Fprintf(w, "Response from Python gRPC: %s", grpcResponse.GetMessage())
}

func main() {
	http.HandleFunc("/hello", helloHandler)
	http.HandleFunc("/call-python", callPythonGRPCHandler) // New endpoint

	port := ":8080" // Port for the Go service
	fmt.Printf("Go Core Service listening on port %s\n", port)
	fmt.Printf("Visit http://localhost%s/hello for basic Go response\n", port)
	fmt.Printf("Visit http://localhost%s/call-python to test gRPC call to Python service\n", port)

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}
