/**
 * Vercel Edge Middleware for HTTP Basic Auth
 * Protects deployments on Vercel while allowing local development without credentials.
 */

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets/ (Vite static assets)
     * - public files with file extensions (.svg, .png, .jpg, .ico, .css, .js, .json)
     */
    '/((?!_next/static|_next/image|assets/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|woff|woff2)$).*)',
  ],
};

export default function middleware(request: Request) {
  // Read credentials from environment variables
  const validUser = process.env.BASIC_AUTH_USER;
  // Support both BASIC_AUTH_PASSWORD (per specification) and BASIC_AUTH_PASS as fallback
  const validPass = process.env.BASIC_AUTH_PASSWORD || process.env.BASIC_AUTH_PASS;

  // If credentials are not configured (e.g. in local development), skip protection
  if (!validUser || !validPass) {
    return;
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    try {
      const [type, credentials] = authHeader.split(' ');
      if (type === 'Basic' && credentials) {
        // Decode base64 credentials (atob is globally available in Edge Runtime)
        const decoded = atob(credentials);
        const colonIndex = decoded.indexOf(':');
        if (colonIndex !== -1) {
          const user = decoded.substring(0, colonIndex);
          const pass = decoded.substring(colonIndex + 1);

          if (user === validUser && pass === validPass) {
            // Authorized, continue request
            return;
          }
        }
      }
    } catch {
      // In case of malformed header, continue to 401
    }
  }

  // Request credentials via standard browser popup
  return new Response('Zugriff verweigert - Authentifizierung erforderlich', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
