import { sql as sereneSql } from '@mk3008/serene';

export const sql = sereneSql`
  UPDATE samples
  SET state = 'released'
  WHERE tenant_id = :tenantId
    AND sample_id = :sampleId
    AND state = 'ready'
`;
