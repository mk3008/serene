import { type ParameterStyle } from './scanner.js';
export { SereneError } from './error.js';
export type { ParameterStyle } from './scanner.js';
declare const sqlBrand: unique symbol;
declare const sortBrand: unique symbol;
export type Sql = {
    readonly [sqlBrand]: true;
    readonly sourceText: string;
};
export type Sort = {
    readonly [sortBrand]: true;
};
/** Fixed native SQL; :name notation is needed only for positional lowering. */
export declare function sql(strings: TemplateStringsArray, ...values: never[]): Sql;
/** Static, deliberately limited ORDER BY terms; no arbitrary fragments. */
export declare function sort(strings: TemplateStringsArray, ...values: never[]): Sort;
/** Select finite reviewed terms in caller-specified order; no arbitrary fragments. */
export declare function orderBy(sql: Sql, choices: Readonly<Record<string, Sort>>, selection: string | readonly string[]): Sql;
export interface BoundSql {
    readonly text: string;
    /** Review/debug SQL before output-marker lowering; contains no bound values. */
    readonly sourceText: string;
    /** Supplied-name order in passthrough; marker order when lowering (anonymous repeats). */
    readonly values: unknown[];
    readonly names: readonly string[];
    readonly params: Readonly<Record<string, unknown>>;
}
export declare function bind(sql: Sql, params?: Readonly<Record<string, unknown>>, style?: ParameterStyle): BoundSql;
/** Runtime provenance only; ordinary source review also requires serene-audit. */
export declare function review(value: unknown): {
    level: 'ordinary' | 'review-required';
    code: string;
};
