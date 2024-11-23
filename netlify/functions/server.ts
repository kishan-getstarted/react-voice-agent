// netlify/functions/server.ts
import { Handler } from '@netlify/functions'
import { join } from 'path'
import * as fs from 'fs'

interface ContentTypeMap {
  [key: string]: string;
}

const contentTypes: ContentTypeMap = {
  js: 'application/javascript',
  css: 'text/css',
  html: 'text/html',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  txt: 'text/plain'
}

export const handler: Handler = async (event, context) => {
  // Serve static files
  if (event.path === '/') {
    const indexPath = join(__dirname, '../../static/index.html')
    const content = fs.readFileSync(indexPath, 'utf8')
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: content,
    }
  }

  // Handle static assets
  if (event.path.startsWith('/static/')) {
    const filePath = join(__dirname, '../..', event.path)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const ext = filePath.split('.').pop() || 'txt'
      const contentType = contentTypes[ext] || 'text/plain'
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
        },
        body: content,
      }
    }
  }

  return {
    statusCode: 404,
    body: 'Not Found',
  }
}