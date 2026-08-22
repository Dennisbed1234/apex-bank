import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  bigint,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  phone: text('phone'),
  dateOfBirth: text('dateOfBirth'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  refreshTokenExpiresIn: integer('refreshTokenExpiresIn'),
  accessTokenExpiresIn: integer('accessTokenExpiresIn'),
  scope: text('scope'),
  password: text('password'),
  issuer: text('issuer'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------

export const bankAccount = pgTable('bank_account', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'checking' | 'savings'
  accountNumber: text('accountNumber').notNull(),
  balanceCents: bigint('balanceCents', { mode: 'number' })
    .notNull()
    .default(0),
  currency: text('currency').notNull().default('USD'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const transaction = pgTable('transaction', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  accountId: integer('accountId').notNull(),
  amountCents: bigint('amountCents', { mode: 'number' }).notNull(),
  type: text('type').notNull(), // 'debit' | 'credit' | 'transfer'
  description: text('description').notNull(),
  category: text('category'),
  counterparty: text('counterparty'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type BankAccount = typeof bankAccount.$inferSelect
export type Transaction = typeof transaction.$inferSelect
