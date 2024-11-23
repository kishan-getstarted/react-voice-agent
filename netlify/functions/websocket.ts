// netlify/functions/websocket.ts
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { OpenAIVoiceReactAgent } from '../../src/lib/langchain_openai_voice'
import { INSTRUCTIONS } from '../../src/prompt'
import { TOOLS } from '../../src/tools'

// Type definition for WebSocket
interface WebSocket {
  send: (data: string) => void;
  close: () => void;
  on: (event: string, callback: (data?: any) => void) => void;
}

const wsConnections = new Map()

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle non-HTTPS requests
  if (event.headers['x-forwarded-proto'] !== 'https') {
    return {
      statusCode: 426,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Please use a secure connection.'
    }
  }

  // Handle non-WebSocket requests
  if (!event.headers['upgrade'] || event.headers['upgrade'].toLowerCase() !== 'websocket') {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'This function only handles WebSocket connections'
    }
  }

  const secWebSocketKey = event.headers['sec-websocket-key']
  if (!secWebSocketKey) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Missing Sec-WebSocket-Key header'
    }
  }

  // Handle WebSocket upgrade
  const upgradeResponse = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': secWebSocketKey
    } as const,
    body: '',
    isBase64Encoded: false
  }

  return upgradeResponse
}

// WebSocket connection handler
export const wsHandler = (ws: WebSocket) => {
  if (!process.env.OPENAI_API_KEY) {
    return ws.close()
  }

  const agent = new OpenAIVoiceReactAgent({
    instructions: INSTRUCTIONS,
    tools: TOOLS,
    model: "gpt-4-turbo-preview",
  })

  agent.connect(ws as any, ws.send.bind(ws))
    .catch(error => {
      console.error('Error connecting agent:', error)
      ws.close()
    })
  
  wsConnections.set(ws, agent)

  ws.on('close', () => {
    wsConnections.delete(ws)
    console.log("Connection closed")
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    wsConnections.delete(ws)
  })
}