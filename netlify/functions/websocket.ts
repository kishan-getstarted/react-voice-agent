import { HandlerEvent, HandlerContext } from "@netlify/functions";

exports.handler = async (event: HandlerEvent, context: HandlerContext) => {
    // Only allow websocket connections
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: 'Method Not Allowed'
      };
    }
  
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 401,
        body: 'Missing API Key'
      };
    }
  
    // Return websocket connection details
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Connected to websocket'
      })
    };
  };