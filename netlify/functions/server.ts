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
  txt: 'text/plain',
  wasm: 'application/wasm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg'
}

const isBinaryFileType = (ext: string): boolean => {
  const binaryTypes = ['wasm', 'mp3', 'wav', 'ogg', 'png', 'jpg', 'jpeg', 'gif', 'ico']
  return binaryTypes.includes(ext)
}

export const handler: Handler = async (event, context) => {
  try {
    // Serve index for root path
    if (event.path === '/') {
      const indexPath = join(__dirname, './../../static/index.html')
      const content = fs.readFileSync(indexPath, 'utf8')
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
        },
        body: content,
      }
    }

    // Handle static files (including those in /static/)
    let filePath = event.path
    if (event.path.startsWith('/static/')) {
      filePath = event.path.slice(7) // Remove '/static/' prefix
    }
    
    // Ensure the file path is within the static directory
    const fullPath = join(__dirname, '../../static', filePath)
    
    if (fs.existsSync(fullPath)) {
      const ext = fullPath.split('.').pop() || 'txt'
      const contentType = contentTypes[ext] || 'application/octet-stream'
      
      // Handle binary files
      if (isBinaryFileType(ext)) {
        const content = fs.readFileSync(fullPath)
        return {
          statusCode: 200,
          headers: {
            'Content-Type': contentType,
          },
          body: content.toString('base64'),
          isBase64Encoded: true
        }
      }
      
      // Handle text files
      const content = fs.readFileSync(fullPath, 'utf8')
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
        },
        body: content,
      }
    }

    // File not found
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'File not found'
    }
  } catch (error) {
    console.error('Error serving file:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Internal server error'
    }
  }
}