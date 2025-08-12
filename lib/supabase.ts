import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Database utility functions
export const db = {
  // Generic query function
  async query(sql: string, params: any[] = []) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: sql,
        params: params 
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  },

  // Get all records from a table
  async getAll(table: string) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
    
    if (error) throw error
    return data
  },

  // Get record by ID
  async getById(table: string, id: number) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Insert new record
  async insert(table: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  // Update record
  async update(table: string, id: number, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  // Delete record
  async delete(table: string, id: number) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Custom queries for your specific needs
  async getProjectsWithDetails() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        builders(name),
        estimators(name),
        statuses(label),
        locations(name),
        supervisors(name)
      `)
    
    if (error) throw error
    return data
  },

  async getProjectContacts(projectId: number) {
    const { data, error } = await supabase
      .from('project_contacts')
      .select('*')
      .eq('project_id', projectId)
    
    if (error) throw error
    return data
  },

  async getProjectDrawings(projectId: number) {
    const { data, error } = await supabase
      .from('project_drawings')
      .select('*')
      .eq('project_id', projectId)
    
    if (error) throw error
    return data
  },

  async getProjectNotes(projectId: number) {
    const { data, error } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Authentication helper
  async authenticateUser(username: string, password: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', username)
      .single()
    
    if (error) throw error
    
    // In production, you should use proper password hashing
    if (data.password_hash === password) {
      // Update last login
      await this.update('users', data.id, { 
        last_login: new Date().toISOString() 
      })
      return data
    }
    
    throw new Error('Invalid credentials')
  }
}

export default db
