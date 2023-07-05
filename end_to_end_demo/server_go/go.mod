module github.com/upollo/examples/end_to_end_demo/server_go

go 1.19

require (
	github.com/gorilla/handlers v1.5.1
	github.com/thoas/go-funk v0.9.1
	github.com/upollo/userwatch-go v0.2.2
)

require (
	github.com/felixge/httpsnoop v1.0.1 // indirect
	github.com/golang/protobuf v1.5.2 // indirect
	golang.org/x/net v0.7.0 // indirect
	golang.org/x/sys v0.5.0 // indirect
	golang.org/x/text v0.7.0 // indirect
	google.golang.org/genproto v0.0.0-20230110181048-76db0878b65f // indirect
	google.golang.org/grpc v1.53.0 // indirect
	google.golang.org/protobuf v1.28.1 // indirect
)

// replace github.com/upollo/userwatch-go => ../../../client_libraries/server/go
