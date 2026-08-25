import { readFileSync, writeFileSync } from 'fs';

const path = 'apps/web-partner/app/_hooks/use-dacha-details.ts';
let code = readFileSync(path, 'utf8');

// We will add price to DachaDetails interface.
code = code.replace('capacityPeople: number | null;', 'capacityPeople: number | null;\n  price: number | null;');
code = code.replace('capacityPeople: null,', 'capacityPeople: null,\n  price: null,');

// We need to fetch the room price inside useDachaDetails.
// But useDachaDetails only fetches usePrimaryHotel.
