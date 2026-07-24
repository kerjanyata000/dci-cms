/** PostgREST embed hints — required when multiple FKs exist between tables. */

/** contracts.party_id → parties */
export const PARTY_ON_CONTRACT = 'parties!contracts_party_id_fkey'

/** contract_terminations.party_id → parties */
export const PARTY_ON_TERMINATION = 'parties!contract_terminations_party_id_fkey'

/** contract_amendments.party_id → parties */
export const PARTY_ON_AMENDMENT = 'parties!contract_amendments_party_id_fkey'

/** sale_orders.party_id → parties */
export const PARTY_ON_SALE_ORDER = 'parties!sale_orders_party_id_fkey'
