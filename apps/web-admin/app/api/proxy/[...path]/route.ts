/**
 * Admin panelning barcha (login'dan tashqari) API so'rovlari shu orqali
 * o'tadi. Brauzerdan httpOnly `admin_token` cookie'siga hech qachon
 * to'g'ridan-to'g'ri kirib bo'lmaydi — shuning uchun `Authorization`
 * header'ini biriktirish endi shu (server tomonidagi) proxy'ning
 * mas'uliyati, avvalgidek axios interceptor'ning emas.
 *
 * `lib/api/admin-api.ts`dagi ~50 metodning birontasi o'zgartirilmagan —
 * ular hammasi bitta umumiy `apiClient`dan (`lib/api/client.ts`) o'tadi,
 * shu sabab faqat o'sha faylning `baseURL`ini shu yerga yo'naltirish
 * kifoya qildi.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAdminAccessToken } from "../../../../lib/auth/session";

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/v1"
    : "https://backend-production-87e6.up.railway.app/v1";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function forward(
  request: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  const token = await getAdminAccessToken();
  const targetUrl = `${API_BASE_URL}/${segments.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== "cookie") {
      headers.set(key, value);
    }
  });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path);
}
export async function POST(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path);
}
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path);
}
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path);
}
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path);
}
