import type { IdsObject } from '../../types';

export function getIDsObject(rpcRequest: any) {
  let idsObject: IdsObject;

  const firstElement = rpcRequest?.params ? rpcRequest.params[0] : undefined;

  if (
    firstElement &&
    typeof firstElement === 'object' &&
    firstElement !== null
  ) {
    idsObject = {
      external_message_identifier:
        Number(firstElement.external_message_identifier) ?? NaN,
      employee_number: Number(firstElement.employee_number) ?? NaN,
      internal_job_ref: Number(firstElement.internal_job_ref) ?? NaN,
    };
  } else {
    idsObject = {
      external_message_identifier: NaN,
      employee_number: NaN,
      internal_job_ref: NaN,
    };
  }

  return idsObject;
}
