package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	userwatchgo "github.com/Userwatch/userwatch-go"

	"github.com/gorilla/handlers"
)

var API_ADDR = "api.userwat.ch:443"

// var API_ADDR = "localhost:8081"
var API_KEY = "???"

func main() {

	client, err := userwatchgo.NewClientBuilder(API_KEY).WithUrl(API_ADDR).Build()
	if err != nil {
		log.Panicf("unable to create userwatchgo client %v", err)
	}

	web := Web{
		uwclient: client,
	}

	http.HandleFunc("/register", web.HandleRegister)
	http.HandleFunc("/listDevices", web.HandleDeviceList)
	http.HandleFunc("/createChallenge", web.HandleCreateChallenge)

	port := "8080"
	fmt.Println("listening on port " + port)
	http.ListenAndServe(":"+port, handlers.LoggingHandler(os.Stdout, http.DefaultServeMux))
}
