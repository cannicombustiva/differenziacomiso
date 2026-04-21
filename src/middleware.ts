import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Preserve Supabase-set cookies on redirects so refreshed auth tokens are not lost.
 */
function redirectWithCookies(url: URL, baseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  baseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    redirectResponse.cookies.set(name, value, options);
  });
  return redirectResponse;
}

function withCookies(responseToReturn: NextResponse, baseResponse: NextResponse) {
  baseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    responseToReturn.cookies.set(name, value, options);
  });
  return responseToReturn;
}

export async function middleware(request: NextRequest) {
  // Only protect admin routes (except login)
  if (!request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/admin/login', request.url);
    return redirectWithCookies(loginUrl, response);
  }

  const email = session.user.email?.toLowerCase();
  if (!email) {
    const loginUrl = new URL('/admin/login', request.url);
    return redirectWithCookies(loginUrl, response);
  }

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (adminError) {
    console.error('Admin lookup query error in middleware', {
      hasUserEmail: Boolean(session.user.email),
      error: adminError,
    });
    return withCookies(new NextResponse('Internal Server Error', { status: 500 }), response);
  }

  if (!admin) {
    const loginUrl = new URL('/admin/login', request.url);
    return redirectWithCookies(loginUrl, response);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
