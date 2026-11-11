export const config = {
  matcher: '/:path*',
};

export default function middleware(request) {
  const auth = request.headers.get('authorization');

  if (auth) {
    const [, encoded] = auth.split(' ');
    const [user, pass] = atob(encoded).split(':');

    if (user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS) {
      return; // Zugriff erlaubt, Seite wird normal ausgeliefert
    }
  }

  return new Response('Zugriff verweigert', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Winterball Kasse"' },
  });
}
