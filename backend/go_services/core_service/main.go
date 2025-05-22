package main

import (
	"fmt"
	"log"
	"net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/hello" {
		http.NotFound(w, r)
		return
	}
	fmt.Fprintf(w, "Hello from Go Core Service!")
}

func main() {
	http.HandleFunc("/hello", helloHandler)

	port := ":8080" // Port for the Go service
	fmt.Printf("Go Core Service listening on port %s\n", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}
