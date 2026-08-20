import axios from "axios";

// Barcha so'rovlar shu ilovaning o'z same-origin proxy'i orqali o'tadi
// (`app/api/proxy/[...path]/route.ts`) — u httpOnly cookie'dan tokenni
// o'qib, `Authorization` header'ini serverda biriktiradi. Brauzer JS
// tokenni hech qachon ko'rmaydi, shu sabab bu yerda uni cookie'dan o'qib
// header'ga qo'shishning hojati (va imkoni) yo'q.
const apiClient = axios.create({
  baseURL: "/api/proxy",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Sessiya (httpOnly cookie) yaroqsiz/muddati o'tgan — uni tozalash
      // uchun server action kerak (JS uni to'g'ridan-to'g'ri o'chira
      // olmaydi), shuning uchun to'g'ridan-to'g'ri /logout'ga
      // yo'naltiramiz — o'sha sahifa sessiyani to'liq tozalaydi.
      if (typeof window !== "undefined") {
        window.location.href = "/logout";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
