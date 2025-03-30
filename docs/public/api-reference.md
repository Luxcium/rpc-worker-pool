# API Reference

The RPC Worker Pool exposes a JSON-RPC 2.0 compatible API over HTTP and TCP interfaces.

## HTTP API

### Endpoint

`http://<host>:<port>/<command>/<param1>/<param2>/...`

### Commands

#### `helloWorld`

Returns a greeting message.

**Parameters:**

- Any number of string parameters that will be joined together in the greeting

**Example Request:**
