-- `submitPublicPartnerRequest()` "Mas'ul shaxs" (contact person) fieldini
-- qabul qilardi, lekin uni saqlaydigan ustun umuman yo'q edi — DTO mapper
-- buning o'rniga legal_name/brand_name'ni qaytarardi va real qiymat har
-- doim jimgina yo'qolib ketardi (Hotel QA BUG-002).
ALTER TABLE "partner_organizations" ADD COLUMN IF NOT EXISTS "contact_person" VARCHAR(255);
