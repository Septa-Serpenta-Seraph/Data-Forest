module github.com/Septa-Serpenta-Seraph/Data-Forest/backend/go_services/core_service

go 1.24.3

require (
	github.com/Septa-Serpenta-Seraph/Data-Forest/backend/proto/greeter v0.0.0-00010101000000-000000000000
	google.golang.org/grpc v1.72.1
)

require (
	golang.org/x/net v0.35.0 // indirect
	golang.org/x/sys v0.30.0 // indirect
	golang.org/x/text v0.22.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250218202821-56aae31c358a // indirect
	google.golang.org/protobuf v1.36.5 // indirect
)

replace github.com/Septa-Serpenta-Seraph/Data-Forest/backend/proto/greeter => ../../proto/greeter
