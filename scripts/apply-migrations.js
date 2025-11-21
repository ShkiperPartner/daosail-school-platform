const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Database connection string - будем использовать из URL Supabase
const supabaseUrl = 'https://rmlgsnlgwmstajwdhygg.supabase.co'
const connectionString = `postgresql://postgres:UuVn7HkCLisncqzN@db.rmlgsnlgwmstajwdhygg.supabase.co:5432/postgres`

async function applyMigrations() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    await client.connect()
    console.log('Connected to Supabase database')

    // Читаем миграции
    const migrations = [
      '005_persistent_chat_messages.sql',
      '006_file_upload_system.sql'
    ]

    for (const migrationFile of migrations) {
      console.log(`\nApplying migration: ${migrationFile}`)

      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

      try {
        await client.query(migrationSQL)
        console.log(`✓ Migration ${migrationFile} applied successfully`)
      } catch (error) {
        console.error(`✗ Error applying migration ${migrationFile}:`, error.message)
        // Продолжаем с следующей миграцией
      }
    }

  } catch (error) {
    console.error('Database connection error:', error.message)
  } finally {
    await client.end()
    console.log('Database connection closed')
  }
}

applyMigrations()