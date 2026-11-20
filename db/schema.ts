import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const learnerProgress=sqliteTable('learner_progress',{sessionId:text('session_id').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),updatedAt:integer('updated_at').notNull()});
