import { api } from "./lib/api";
api.catalog.getPopularCities("uz").then(c => console.log(JSON.stringify(c, null, 2))).catch(e => console.error(e));
