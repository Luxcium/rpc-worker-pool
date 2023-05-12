/*--------------------------------------------------------------------
 * Copyright © 2023 Luxcium✨ (Benjamin Vincent).
 * All rights reserved.
 * Licensed under the MIT License. See below at the botom of this
 * page for license information.
 *
 * // † **Scientia est lux principium✨** ™ //
 *------------------------------------------------------------------*/

/**
 * Represents a successful response with a result field indicating the result
 * of the RPC call.
 * ```typescript
 *    export interface RpcRight<R> {
 *      jsonrpc: '2.0';
 *      result: R;
 *      id: string | number;
 *    }
 * ```
 * @remarks
 * The Response Object MUST contain the following members:
 *
 * - jsonrpc: A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
 * - result: This member is REQUIRED on success. This member MUST NOT exist if there was an error invoking the method.
 *   The value of this member is determined by the method invoked on the Server.
 * - id: An identifier established by the Client that MUST contain a String, Number, or NULL value if included.
 *   If it is not included, it is assumed to be a notification. The value SHOULD normally not be Null,
 *   and Numbers SHOULD NOT contain fractional parts. The Server MUST reply with the same value in the Response object
 *   if included. This member is used to correlate the context between the two objects.
 *
 * @see {@link RpcResponseError}
 * \
 * \
 * Based on the JSON-RPC 2.0 Specification documentation \
 * Copyright (C) 2007-2010 by the JSON-RPC Working Group
 * @see {@link https://www.jsonrpc.org/specification}
 *
 */
export interface RpcRight<R> {
  /**
   * A String specifying the version of the JSON-RPC protocol. MUST be
   * exactly "2.0".
   */
  jsonrpc: '2.0';

  /**
   * This member is REQUIRED on success. This member MUST NOT exist if
   * there was an error invoking the method. The value of this member
   * is determined by the method invoked on the Server.
   */
  result: R;

  /**
   * An identifier established by the Client that MUST contain a
   * String, Number, or NULL value if included. If it is not included,
   * it is assumed to be a notification. The value SHOULD normally not
   * be Null, and Numbers SHOULD NOT contain fractional parts.
   * The Server MUST reply with the same value in the Response object
   * if included. This member is used to correlate the context
   * between the two objects.
   */
  id: string | number;
}

/**
 * Represents an error response with an error field containing information
 * about the encountered error.
 *
 * ```typescript
 *    export interface RpcLeft {
 *      jsonrpc: '2.0';
 *      error: RpcResponseError;
 *      id: string | number | null;
 *    }
 * ```
 * @remarks
 * The Response Object MUST contain the following members:
 *
 * - jsonrpc: A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
 * - error: This member is REQUIRED on error. This member MUST NOT exist if there was no error triggered during invocation.
 *   The value for this member MUST be an Object as defined in section 5.1.
 * - id: An identifier established by the Client that MUST contain a String, Number, or NULL value if included.
 *   If it is not included, it is assumed to be a notification. The value SHOULD normally not be Null,
 *   and Numbers SHOULD NOT contain fractional parts. The Server MUST reply with the same value in the Response object
 *   if included. This member is used to correlate the context between the two objects.
 *
 * @see {@link RpcResponseError}
 * \
 * \
 * Based on the JSON-RPC 2.0 Specification documentation \
 * Copyright (C) 2007-2010 by the JSON-RPC Working Group
 * @see {@link https://www.jsonrpc.org/specification}
 *
 */
export interface RpcLeft {
  /**
   * A String specifying the version of the JSON-RPC protocol. MUST be
   * exactly "2.0".
   */
  jsonrpc: '2.0';

  /**
   * This member is REQUIRED on error. This member MUST NOT exist if
   * there was no error triggered during invocation. The value for
   * this member MUST be an Object as defined in section 5.1.
   */
  error: RpcResponseError;

  /**
   * An identifier established by the Client that MUST contain a
   * String, Number, or NULL value if included. If it is not included,
   * it is assumed to be a notification. The value SHOULD normally not
   * be Null, and Numbers SHOULD NOT contain fractional parts.
   * The Server MUST reply with the same value in the Response object
   * if included. This member is used to correlate the context
   * between the two objects.
   */
  id: string | number | null;
}

/**
 * Represents the error object that contains information about an RPC error.
 *
 * ```typescript
 *    export interface RpcResponseError {
 *      code: number;
 *      message: string;
 *      data?: any;
 *    }
 * ```
 * @remarks
 * The error member within the Response Object MUST contain the following members:
 *
 * - code: A Number that indicates the error type that occurred. This MUST be an integer.
 * - message: A String providing a short description of the error. The message SHOULD be limited to a concise single sentence.
 * - data: A Primitive or Structured value that contains additional information about the error.
 *   This may be omitted. The value of this member is defined by the Server
 *   (e.g. detailed error information, nested errors, etc.).
 *
 * Based on the JSON-RPC 2.0 Specification documentation \
 * Copyright (C) 2007-2010 by the JSON-RPC Working Group
 * @see {@link https://www.jsonrpc.org/specification}
 *
 */
export interface RpcResponseError {
  /**
   * A Number that indicates the error type that occurred. This MUST
   * be an integer.
   */
  code: number;

  /**
   * A String providing a short description of the error. The message
   * SHOULD be limited to a concise single sentence.
   */
  message: string;

  /**
   * A Primitive or Structured value that contains additional information
   * about the error. This may be omitted. The value of this member is
   * defined by the Server (e.g. detailed error information, nested errors, etc.).
   */
  data?: any;
}

/**
 * Represents a response in JSON-RPC format. Either the result member or
 * error member MUST be included, but both members MUST NOT be included.
 * ```typescript
 *    export type RpcResponse<T> = RpcRight<T> | RpcLeft;
 * ```
 * @remarks
 * The Response is expressed as a single JSON Object, with the following members:
 *
 * - jsonrpc: A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".
 * - result: This member is REQUIRED on success. This member MUST NOT exist if there was an error invoking the method.
 *   The value of this member is determined by the method invoked on the Server.
 * - error: This member is REQUIRED on error. This member MUST NOT exist if there was no error triggered during invocation.
 *   The value for this member MUST be an Object as defined in section 5.1.
 * - id: This member is REQUIRED. It MUST be the same as the value of the id member in the Request Object.
 *   If there was an error in detecting the id in the Request object (e.g. Parse error/Invalid Request), it MUST be Null.
 *
 * @see {@link RpcRight}
 * @see {@link RpcLeft}
 * @see {@link RpcResponseError}
 * \
 * \
 * Based on the JSON-RPC 2.0 Specification documentation \
 * Copyright (C) 2007-2010 by the JSON-RPC Working Group
 * @see {@link https://www.jsonrpc.org/specification}
 *
 */
export type RpcResponse<T> = RpcRight<T> | RpcLeft;

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
