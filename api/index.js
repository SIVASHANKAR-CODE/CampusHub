/**
 * Vercel Serverless Function Entry Point
 * 
 * All /api/* requests are routed here by vercel.json.
 * Express handles routing internally.
 * 
 * IMPORTANT: No app.listen() anywhere.
 */
import app from '../backend/app.js';

export default app;
