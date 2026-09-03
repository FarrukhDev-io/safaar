# SAFAAR — Uzum Bank Merchant API onboarding

This folder is SAFAAR's equivalent of the sample "anyoung" Postman collection
Uzum sent. Import `safaar-uzum-merchant.postman_collection.json` into Postman.

## Config to send Uzum

```
SAFAAR — Uzum Merchant API

Base URL:
https://api.safaar.uz/v1/uzum/webhook

Endpoints:
POST https://api.safaar.uz/v1/uzum/webhook/check
POST https://api.safaar.uz/v1/uzum/webhook/create
POST https://api.safaar.uz/v1/uzum/webhook/confirm
POST https://api.safaar.uz/v1/uzum/webhook/reverse
POST https://api.safaar.uz/v1/uzum/webhook/status

Authorization:
HTTP Basic Auth on every request.
  Username: <issued by SAFAAR, sent out-of-band>
  Password: <issued by SAFAAR, sent out-of-band>

Service ID:
783774

Request/response:
- Content-Type: application/json
- Success = HTTP 200
- Business error = HTTP 400, body:
    { "serviceId": <id>, "status": "FAILED", "errorCode": "<code>" }
  (errorCode is a string; there is no errorMessage field)
- amount is in tiyin (so'm x 100)
- The order reference is sent as params.order_id and maps to a SAFAAR booking number

Test order:
- We will give you a live SAFAAR booking_number that is currently pending / unpaid,
  plus that booking's exact amount in tiyin (total_amount x 100).
- Set the collection's `orderId` variable to that booking_number and `amount` to that
  tiyin value. Ask us for a fresh one right before the run — a pending booking expires
  in ~15 minutes; the /create call extends it to +35 minutes.

Recommended flow:
  Payment:      check -> create -> confirm -> status   (expect status CONFIRMED)
  Cancellation: check -> create -> reverse -> status   (expect status REVERSED)
```

## Notes / open items for onboarding

- `/check` returns `data: {}` (empty). If your app needs specific fields there
  (amount, description) tell us — it is a small addition.
- `/status` for a transaction that timed out after 30 minutes returns
  `status: "FAILED"`. Confirm your `/status` consumer accepts `FAILED` in addition
  to `CREATED` / `CONFIRMED` / `REVERSED`.
- Error codes implemented: `10001` auth, `10002` bad JSON, `10003` unknown operation,
  `10005` missing params, `10006` wrong serviceId, `10007` order not found,
  `10008` already paid, `10009` cancelled/expired, `10010` transId already created,
  `10011` wrong amount, `10014` transaction not found, `10015` cannot confirm
  (reversed/failed), `10016` already confirmed, `10017` cannot reverse in this state,
  `10018` already reversed, `99999` internal error.

## Credentials — never commit

`UZUM_USERNAME` / `UZUM_PASSWORD` / `UZUM_SERVICE_ID` are set only in the deploy
host env (`/home/scarygun/safaar-stack/backend.env`), never in this repo. The
Postman collection ships with empty `username` / `password` variables — fill them
in Postman at run time. Do not reuse the password that appeared in the chat thread.
