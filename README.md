# Demonstrate using self-hosted Ory service(s) for OAuth2 client credential flow

This repository is companion to a tutorial article at:
https://techsparx.com/software-development/oauth2/oauth2-client-credentials-ory.html

The goal is demonstrating using either the hosted Ory service, or the self-hosted Hydra service, to implement OAuth2 based machine-machine authentication using Client Credential Flow.

Client Credential Flow is a usage mode for OAuth2 when there is no human being to make approvals.  In other words, it is meant to be used by back-end software components to authenticate with each other.

In this mode:

* A the client service is able to register with a service, and generate a "client" object which is identified by a `client_id` and `client_secret` token pair.
* The client service invokes an OAuth2 endpoint, supplying the `client_id` and `client_secret`, to which the service responds with an authorization token.
* The client service then uses that token in the Authorization header as a Bearer token.
* The token can be associated with a `scope` string indicating the capabilities this token can access

The _server_ directory contains a simple REST service.  It implements an `/auth/token` endpoint for generating authorization tokens.  The service in turn uses either the hosted Ory or self-hosted Hydra services for their OAuth2 implementation.

The _spec_ directory contains an OpenAPI file describing the REST service.

The _cli_ directory contains scripts for interacting with the service, allowing us to easily generate and use authorization tokens.

The _hydra_ directory contains instructions for self-hosting Hydra, as well as Hydra-specific scripts similar to whats in the _cli_ directory.

