'use strict';
import { MsgObjectToWrap } from './MsgObjectToWrap';

/**
 * A function that takes a `MsgObjectToWrap` and returns a Promise of any type.
 */
export type WraperFunction = (msgObject: MsgObjectToWrap) => Promise<any>;
