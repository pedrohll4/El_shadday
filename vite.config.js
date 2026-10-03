import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ordersFilePath = path.resolve(__dirname, 'orders_db.json')

function getOrders() {
  try {
    if (!fs.existsSync(ordersFilePath)) {
      return []
    }
    const data = fs.readFileSync(ordersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    console.error('Error reading orders_db.json:', e)
    return []
  }
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving orders_db.json:', e)
  }
}

function apiOrdersPlugin() {
  const handler = (server) => {
    server.middlewares.use((req, res, next) => {
      // GET all orders
      if (req.url === '/api/orders' && req.method === 'GET') {
        const orders = getOrders()
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(orders))
        return
      }

      // POST new order
      if (req.url === '/api/orders' && req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const newOrder = JSON.parse(body)
            const currentOrders = getOrders()
            // Avoid duplicates
            const filtered = currentOrders.filter(o => o.orderId !== newOrder.orderId)
            const updated = [newOrder, ...filtered]
            saveOrders(updated)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, order: newOrder }))
          } catch (err) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
          }
        })
        return
      }

      // PATCH update order status
      if (req.url?.startsWith('/api/orders/') && req.method === 'PATCH') {
        const id = req.url.replace('/api/orders/', '').split('?')[0]
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const updates = JSON.parse(body)
            const currentOrders = getOrders()
            const updated = currentOrders.map(o => o.orderId === id ? { ...o, ...updates } : o)
            saveOrders(updated)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (err) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
          }
        })
        return
      }

      next()
    })
  }

  return {
    name: 'api-orders-plugin',
    configureServer(server) {
      handler(server)
    },
    configurePreviewServer(server) {
      handler(server)
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiOrdersPlugin()],
  server: {
    port: 3000,
    open: true
  }
})
