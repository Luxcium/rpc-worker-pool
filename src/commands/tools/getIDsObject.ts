import type { IdsObject } from '../../types';

export function getIDsObject(rpcRequest: any) {
  const firstElement = rpcRequest?.params ? rpcRequest.params[0] : undefined;

  const idsObject: IdsObject =
    firstElement && 'object' === typeof firstElement && firstElement !== null
      ? {
          external_message_identifier:
            Number(firstElement.external_message_identifier) ?? Number.NaN,
          employee_number: Number(firstElement.employee_number) ?? Number.NaN,
          internal_job_ref: Number(firstElement.internal_job_ref) ?? Number.NaN,
        }
      : {
          external_message_identifier: Number.NaN,
          employee_number: Number.NaN,
          internal_job_ref: Number.NaN,
        };

  return idsObject;
}
