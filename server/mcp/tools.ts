/**
 * Future MCP tool surface.
 * HTTP routes already call the same domain services; MCP should wrap these
 * functions rather than duplicating repository logic.
 *
 * Planned tools:
 * - list_boards / get_board / upsert_board
 * - export_architecture
 * - (later) upsert_entity / upsert_connection / import_from_requirements
 */
export { authService } from '../services/auth.js';
export { boardsService } from '../services/boards.js';
export { usersService } from '../services/users.js';
