import { readFileSync, writeFileSync } from 'fs';

const path = 'apps/web-partner/app/(dashboard)/rooms/dacha-details-view.tsx';
let code = readFileSync(path, 'utf8');

// Insert Price field below Capacity
const toInsert = `
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Narxi (1 kechaga)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              placeholder="Masalan: 300000"
              value={draft.price ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  price: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              disabled={isLoading}
            />
          </div>
`;

code = code.replace(
  '              disabled={isLoading}\n            />\n          </div>\n        </div>',
  '              disabled={isLoading}\n            />\n          </div>\n' + toInsert + '        </div>'
);

writeFileSync(path, code);
