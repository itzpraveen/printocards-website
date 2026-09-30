import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
export { products, audiences, getMeta, contact } from './data'
export const render = (url: string) => renderToString(<StaticRouter location={url}><App /></StaticRouter>)
