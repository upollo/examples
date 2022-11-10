package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	upollo "github.com/upollo/userwatch-go"

	"github.com/gorilla/handlers"
)

var apiKey = flag.String("api-key", "", "Upollo API key.")
var apiUrl = flag.String("api-url", "", "Upollo API URL.")

func main() {
	flag.Parse()
	clientBuilder := upollo.NewClientBuilder(*apiKey)
	if *apiUrl != "" {
		clientBuilder = clientBuilder.WithUrl(*apiUrl)
	}
	// clientBuilder = clientBuilder.WithRequireTls(false)
	client, err := clientBuilder.Build()
	if err != nil {
		log.Panicf("unable to create upollo client %v", err)
	}

	web := Web{
		uwclient: client,
	}

	http.HandleFunc("/register", web.HandleRegister)
	http.HandleFunc("/login", web.HandleLogin)
	http.HandleFunc("/listDevices", web.HandleDeviceList)
	http.HandleFunc("/createChallenge", web.HandleCreateChallenge)

	port := "8001"
	fmt.Println("listening on port " + port)
	err = http.ListenAndServe(":"+port, handlers.LoggingHandler(os.Stdout, http.DefaultServeMux))
	log.Fatal(err)
}
