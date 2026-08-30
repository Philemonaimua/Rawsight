import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Strategy & Vault Configuration
export const vaultConfigs = pgTable('vault_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  autoTradeEnabled: boolean('auto_trade_enabled').default(true).notNull(),
  tradingMode: text('trading_mode').default('LIVE_MAINNET').notNull(),
  riskProfile: text('risk_profile').default('balanced').notNull(),
  sizingMode: text('sizing_mode').default('PERCENT_NAV').notNull(),
  allocationPerTradeUsd: doublePrecision('allocation_per_trade_usd').default(100).notNull(),
  allocationPercentNav: doublePrecision('allocation_percent_nav').default(5).notNull(),
  minTradeSizeUsd: doublePrecision('min_trade_size_usd').default(25).notNull(),
  maxTradeSizeUsd: doublePrecision('max_trade_size_usd').default(500).notNull(),
  maxActivePositions: integer('max_active_positions').default(6).notNull(),
  takeProfitPercent: doublePrecision('take_profit_percent').default(80).notNull(),
  stopLossPercent: doublePrecision('stop_loss_percent').default(20).notNull(),
  trailingStopEnabled: boolean('trailing_stop_enabled').default(true).notNull(),
  trailingStopDistance: doublePrecision('trailing_stop_distance').default(15).notNull(),
  rugShieldSensitivity: text('rug_shield_sensitivity').default('HIGH').notNull(),
  slippageTolerancePercent: doublePrecision('slippage_tolerance_percent').default(1.0).notNull(),
  gasPriority: text('gas_priority').default('FAST').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Vault Positions (Active & Historic)
export const vaultPositions = pgTable('vault_positions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  positionId: text('position_id').notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  tokenName: text('token_name').notNull(),
  contractAddress: text('contract_address').notNull(),
  chain: text('chain').notNull(),
  entryPriceUsd: doublePrecision('entry_price_usd').notNull(),
  currentPriceUsd: doublePrecision('current_price_usd').notNull(),
  amountTokens: doublePrecision('amount_tokens').notNull(),
  investedAmountUsd: doublePrecision('invested_amount_usd').notNull(),
  currentPnlUsd: doublePrecision('current_pnl_usd').default(0).notNull(),
  currentPnlPercent: doublePrecision('current_pnl_percent').default(0).notNull(),
  status: text('status').default('OPEN').notNull(),
  targetTpUsd: doublePrecision('target_tp_usd'),
  targetSlUsd: doublePrecision('target_sl_usd'),
  openedAt: timestamp('opened_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});

// Trade Audit Trail Logs
export const tradeLogs = pgTable('trade_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  logId: text('log_id').notNull(),
  type: text('type').notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  tokenName: text('token_name').notNull(),
  chain: text('chain').notNull(),
  amountUsd: doublePrecision('amount_usd').default(0).notNull(),
  note: text('note').notNull(),
  txHash: text('tx_hash'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  config: one(vaultConfigs, {
    fields: [users.id],
    references: [vaultConfigs.userId],
  }),
  positions: many(vaultPositions),
  logs: many(tradeLogs),
}));

export const vaultConfigsRelations = relations(vaultConfigs, ({ one }) => ({
  user: one(users, {
    fields: [vaultConfigs.userId],
    references: [users.id],
  }),
}));

export const vaultPositionsRelations = relations(vaultPositions, ({ one }) => ({
  user: one(users, {
    fields: [vaultPositions.userId],
    references: [users.id],
  }),
}));

export const tradeLogsRelations = relations(tradeLogs, ({ one }) => ({
  user: one(users, {
    fields: [tradeLogs.userId],
    references: [users.id],
  }),
}));
