import { describe, it, expect } from 'vitest'
import { scenario } from '../../packages/scenario/innovative.js'

describe('Innovative Scenario DSL', () => {
  it.skip('should spawn a mock API with dynamic port and ping it with ofetch', async () => {
    const result = await scenario('Mock API Test')
      .mockAPI({
        '/hello': () => ({ message: 'world' })
      })
      .action('Ping Mock API', async ({ ofetch }) => {
        const res = await ofetch('/hello')
        expect(res.message).toBe('world')
        return res
      })
      .execute()

    expect(result.success).toBe(true)
    expect(result.results).toHaveLength(2)
  })

  it.skip('should support WebSockets via crossws', async () => {
    let wsMessage = ''
    const result = await scenario('WebSocket Test')
      .mockAPI({}, {
        hooks: {
          message: (peer, message) => {
            wsMessage = message.text()
          }
        }
      })
      .action('Use WebSocket', async ({ mockServer }) => {
        const WebSocket = (await import('ws')).default
        const wsUrl = mockServer.url.replace('http', 'ws')
        const ws = new WebSocket(wsUrl)
        
        await new Promise((resolve) => ws.on('open', resolve))
        ws.send('hello ws')
        
        // Wait a bit for message to be processed
        await new Promise((resolve) => setTimeout(resolve, 100))
        ws.close()
        
        expect(wsMessage).toBe('hello ws')
        return { wsMessage }
      })
      .execute()

    expect(result.success).toBe(true)
  })
})
