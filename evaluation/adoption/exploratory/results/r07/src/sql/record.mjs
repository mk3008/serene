import { sql as fixedSql } from '@mk3008/serene';

export const sql = fixedSql`
  INSERT INTO releases (tenant_id, sample_id, operator)
  VALUES (:tenantId, :sampleId, :operator)
`;
