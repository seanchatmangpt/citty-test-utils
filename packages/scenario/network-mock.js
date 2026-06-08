import { listen } from 'listhen'
import { createApp, eventHandler, toNodeListener } from 'h3'
import { getPort } from 'get-port-please'

/**
 * Creates a mock network server using h3 and listhen.
 * @param {Record<string, any>} routes - A map of paths to event handlers
 * @returns {Promise<string>} The mock server URL
 */
export async function createMockNetwork(routes) {
  const app = createApp()
  
  for (const [path, handler] of Object.entries(routes)) {
    app.use(path, eventHandler(handler))
  }
  
  const port = await getPort()
  const listener = await listen(toNodeListener(app), {
    port,
    showURL: false,
    clipboard: false
  })
  
  return listener.url
}
