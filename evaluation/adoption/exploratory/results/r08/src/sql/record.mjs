import { sql as statement } from '@mk3008/serene';

export const sql = statement`
  INSERT INTO releases (tenant_id, sample_id, operator)
  VALUES (:tenantId, :sampleId, :operator)
`;
