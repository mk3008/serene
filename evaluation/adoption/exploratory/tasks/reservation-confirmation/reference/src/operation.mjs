import {sql} from './sql/confirm.mjs';
export function confirmReservation(db,{tenantId,reservationId,expectedVersion,note}) {const r=db.prepare(sql).get({$tenantId:tenantId,$reservationId:reservationId,$expectedVersion:expectedVersion,$note:note});return r ? {...r}:null;}
