import { sql as statement } from '@mk3008/serene';

export const sql = statement`
  UPDATE samples
  SET state = 'released'
  WHERE tenant_id = :tenantId
    AND sample_id = :sampleId
    AND state = 'ready'
`;
