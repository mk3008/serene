import { sql as sereneSql } from '@mk3008/serene';

export const sql = sereneSql`
  INSERT INTO releases (tenant_id, sample_id, operator)
  VALUES (:tenantId, :sampleId, :operator)
`;
