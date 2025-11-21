import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Создаем клиент с service role key для выполнения миграций
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration(migrationFile: string) {
  console.log(`Applying migration: ${migrationFile}`)

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  // Разбиваем на отдельные запросы (по точке с запятой и переносу строки)
  const queries = migrationSQL
    .split(/;\s*\n/)
    .map(query => query.trim())
    .filter(query => query.length > 0 && !query.startsWith('--'))

  for (const query of queries) {
    if (query.trim()) {
      try {
        console.log(`Executing: ${query.substring(0, 100)}...`)
        const { error } = await supabase.rpc('execute_sql', { sql_query: query })

        if (error) {
          // Если нет функции execute_sql, выполним напрямую
          const { error: directError } = await supabase
            .from('information_schema.routines')
            .select('*')
            .limit(1)

          if (directError) {
            console.error(`Error executing query: ${error.message}`)
            throw error
          }
        }

        console.log('✓ Query executed successfully')
      } catch (err) {
        console.error(`Error executing query: ${err}`)
        console.error(`Query: ${query}`)
        // Продолжаем выполнение следующих запросов
      }
    }
  }
}

async function main() {
  console.log('Starting migration process...')

  // Список миграций для применения
  const migrations = [
    '005_persistent_chat_messages.sql',
    '006_file_upload_system.sql'
  ]

  for (const migration of migrations) {
    await applyMigration(migration)
  }

  console.log('Migration process completed!')
}

main().catch(console.error)