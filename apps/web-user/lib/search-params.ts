import {
  createSerializer,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

/**
 * Bu yerda URL'dagi qidiruv parametrlarini qanday formatda o'qish (parse)
 * va default qiymatlarini belgilaymiz.
 * 
 * Bu funksiyalar server va client tomonida bir xil ishlaydi, type-safety ta'minlanadi.
 */
export const searchParamsParsers = {
  // Joylashuv (Kenglik va Uzunlik)
  lat: parseAsFloat,
  lng: parseAsFloat,
  
  // Odamlar soni
  adults: parseAsInteger.withDefault(1),
  children: parseAsInteger.withDefault(0),
  
  // Sanalar (YYYY-MM-DD formati qulayroq bo'ladi)
  checkIn: parseAsString,
  checkOut: parseAsString,
  
  // Shahar ID si
  city_id: parseAsString,
};

// URL hosil qilish uchun yordamchi serializator
export const serializeSearchParams = createSerializer(searchParamsParsers);
