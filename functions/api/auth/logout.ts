// POST /api/auth/logout — Clear session cookie
export const onRequestPost: PagesFunction = async ({ request }) => {
  const headers = new Headers();
  headers.set('Set-Cookie', 'dt_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};
