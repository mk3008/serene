export const sql = "UPDATE samples SET state='released' WHERE tenant_id=$tenantId AND sample_id=$sampleId AND state='ready' RETURNING sample_id AS sampleId;";
