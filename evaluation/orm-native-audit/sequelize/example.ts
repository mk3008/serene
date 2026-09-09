import {Sequelize,QueryTypes, type Transaction} from 'sequelize';
import {sql,bind} from '../../../dist/index.js';
export async function find(db:Sequelize, transaction:Transaction, id:number) {
 const q=bind(sql`SELECT id FROM items WHERE id=:id`,{id},'indexed');
 return db.query<{id:number}>(q.text,{bind:q.values,type:QueryTypes.SELECT,transaction});
}
