/*--------------------------------------------------------------------
 * Copyright © 2023 Luxcium✨ (Benjamin Vincent).
 * All rights reserved.
 * Licensed under the MIT License. See below at the botom of this
 * page for license information.
 *
 * // † **Scientia est lux principium✨** ™ //
 *------------------------------------------------------------------*/

/**
 * JSON-RPC 2.0 Notification object
 * ```typescript
 *    interface RpcNotification<N extends Array<any> | Record<string, any>> {
 *      jsonrpc: '2.0';
 *      method: string;
 *      params?: N;
 *    }
 * ```
 * A Notification is a Request object without an "id" member. A Request
 * object that is a Notification signifies the Client's lack of interest
 * in the corresponding Response object, and as such no Response object
 * needs to be returned to the client. The Server MUST NOT reply to a
 * Notification, including those that are within a batch request.
 *
 * Notifications are not confirmable by definition since they do not have
 * a Response object to be returned. As such, the Client would not be aware
 * of any errors (e.g., "Invalid params", "Internal error").
 * \
 *  \
 * Based on the JSON-RPC 2.0 Specification documentation \
 * Copyright (C) 2007-2010 by the JSON-RPC Working Group
 * @see {@link https://www.jsonrpc.org/specification}
 *
 */
export interface RpcNotification<N extends Array<any> | Record<string, any>> {
  /**
   * A String specifying the version of the JSON-RPC protocol.
   * MUST be exactly "2.0".
   */
  jsonrpc: '2.0';

  /**
   * A String containing the name of the method to be invoked. Method names
   * that begin with the word "rpc" followed by a period character (U+002E or
   * ASCII 46) are reserved for rpc-internal methods and extensions and MUST
   * NOT be used for anything else.
   */
  method: string;

  /**
   * A Structured value that holds the parameter values to be used during
   * the invocation of the method. This member MAY be omitted.
   */
  params?: N;
}

/** json-rpc
 * JSON-RPC 2.0 Request object
 * ```typescript
 *    interface RpcRequest<P extends Array<any> | Record<string, any>> {
 *      jsonrpc: '2.0';
 *      method: string;
 *      params?: P;
 *      id?: string | number;
 *    }
 * ```
 * A RPC call is represented by sending a Request object to a Server.
 * \
 * \
 * Based on the JSON-RPC 2.0 Specification documentation \
 * Copyright (C) 2007-2010 by the JSON-RPC Working Group
 * @see {@link https://www.jsonrpc.org/specification}
 *
 */
export interface RpcRequest<P extends Array<any> | Record<string, any>> {
  /**
   * A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
   */
  jsonrpc: '2.0';

  /**
   * An identifier established by the Client that MUST contain a
   * String or Number value if included. If it is not included,
   * it is assumed to be a notification.
   *
   * The Server MUST reply with the same value in the Response object
   * if included. This member is used to correlate the context between
   * the two objects.
   */
  id: string | number;

  /**
   * A String containing the name of the method to be invoked. Method
   * names that begin with the word "rpc" followed by a period character
   * (U+002E or ASCII 46) are reserved for rpc-internal methods and
   * extensions and MUST NOT be used for anything else.
   */
  method: string;

  /**
   * A Structured value that holds the parameter values to be used
   * during the invocation of the method. This member MAY be omitted.
   *
   * If present, parameters for the RPC call MUST be provided as a
   * Structured value.
   * - By-position: params MUST be an Array containing the values in
   *   the Server's expected order.
   * - By-name: params MUST be an Object, with member names that match
   *   the Server's expected parameter names. The absence of expected
   *   names MAY result in an error being generated. The names MUST
   *   match exactly, including case, the method's expected parameters.
   */
  params?: P;
}

/*
  The MIT License

  Copyright © 2023 Luxcium✨ (Benjamin Vincent)

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use, copy,
  modify, merge, publish, distribute, sublicense, and/or sell copies
  of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/
