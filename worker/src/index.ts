import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

app.get('/', (c) => {
  return c.text('SunoForge API is running!')
})

// --- Auth ---

app.post('/api/auth/signup', async (c) => {
  const { email, password, displayName } = await c.req.json()
  const id = crypto.randomUUID()
  
  try {
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password, display_name) VALUES (?, ?, ?, ?)'
    ).bind(id, email, password, displayName || email.split('@')[0]).run()
    
    return c.json({ id, email, displayName: displayName || email.split('@')[0] })
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

app.post('/api/auth/signin', async (c) => {
  const { email, password } = await c.req.json()
  
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND password = ?'
  ).bind(email, password).first()
  
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  
  return c.json({ 
    id: user.id, 
    email: user.email, 
    displayName: user.display_name 
  })
})

// --- User Profile ---

app.get('/api/user/:userId', async (c) => {
  const userId = c.req.param('userId')
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  
  if (!user) return c.json({ error: 'User not found' }, 404)
  
  // Get stats
  const historyCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM history WHERE user_id = ?').bind(userId).first()
  
  return c.json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    stats: {
      totalGenerations: historyCount?.count || 0
    }
  })
})

app.put('/api/user/:userId', async (c) => {
  const userId = c.req.param('userId')
  const { displayName } = await c.req.json()
  
  await c.env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?').bind(displayName, userId).run()
  
  return c.json({ success: true })
})

// --- History ---

app.get('/api/history/:userId', async (c) => {
  const userId = c.req.param('userId')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all()
  
  const history = results.map((row: any) => {
    try {
      return JSON.parse(row.data)
    } catch (e) {
      return null
    }
  }).filter(Boolean)
  
  return c.json(history)
})

app.post('/api/history', async (c) => {
  const { userId, data } = await c.req.json()
  const id = data.id || crypto.randomUUID()
  
  await c.env.DB.prepare(
    'INSERT INTO history (id, user_id, data) VALUES (?, ?, ?)'
  ).bind(id, userId, JSON.stringify(data)).run()
  
  return c.json({ success: true, id })
})

app.delete('/api/history/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM history WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

export default app
