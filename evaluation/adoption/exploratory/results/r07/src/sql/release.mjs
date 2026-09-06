import { sql as fixedSql } from '@mk3008/serene';

export const sql = fixedSql`
  UPDATE samples
  SET state = 'released'
  WHERE tenant_id = :tenantId
    AND sample_id = :sampleId
    AND state = 'ready'
`;
