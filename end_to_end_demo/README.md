This demo contains and end-to-end web application that demonstrates how you can use Upollo's client and server APIs to validate registrations and logins, distinguish genuine users from users attempting repeated free trials or sharing accounts, and then gracefully upsell where appropriate.

The example consists of a web client and backend server. See [upollo.ai/docs/examples/end-to-end](https://upollo.ai/docs/examples/end-to-end) for a detailed explanation of how it works.

## Server

There are 3 different servers to choose from depending on the language you would like to use:
1. `server`: NodeJS
1. `server_go`: Go
1. `server_python`: Python

The servers all listen on port 8001 for incomming requests and provide the same API for the client to call.

See the README in each server's root directory for instructions on how to run.

## Client

The web client is written in React. See the README in the `web` directory for instructions on how to run.
