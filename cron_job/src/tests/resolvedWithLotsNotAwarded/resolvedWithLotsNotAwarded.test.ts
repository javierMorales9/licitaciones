import { describe } from "@jest/globals"
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { Event, EventType } from "../../domain/Event.js";
import { testLicitationUpdate, testNewLicitation } from "../utils.js";

const CPVS = ["90470000"];
const BASE_PATH = 'src/tests/resolvedWithLotsNotAwarded';
const LAST_CURSOR_DATE = new Date('2025-08-17');
const LICITATION_ID = "1234";
const PARTY_ID = "1234";

const baseLicObj = {
  entry_id: 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17465786',
  partyId: PARTY_ID,
  statusCode: 'PUB',
  publishedDate: '2025-06-13',
  updated: new Date('2025-06-13T10:56:34.960Z'),
  title: '918/2025 "Servicio de mantenimiento de redes de saneamiento para GIAHSA"',
  summary: 'Id licitación: 918/2025; Órgano de Contratación: Comisión Ejecutiva de Gestion Integral del Agua de Huelva; Importe: 2289150.11 EUR; Estado: PUB',
  platform_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=nvUGbRHn8%2BRJ8Trn0ZPzLw%3D%3D',
  type_code: 2,
  subtype_code: 1,
  estimated_overall_cost: 4273080.21,
  cost_with_taxes: 2518065.12,
  cost_without_taxes: 2289150.11,
  cpvs: ['90470000'],
  place: 'Huelva',
  realized_city: undefined,
  realized_zip: '',
  realized_country: 'ES',
  estimated_duration: '3 ANN',
  tender_result_code: undefined,
  award_date: undefined,
  received_tender_quantity: undefined,
  lower_tender_amount: undefined,
  higher_tender_amount: undefined,
  winning_nif: undefined,
  winning_name: undefined,
  winning_city: undefined,
  winning_zip: undefined,
  winning_country: undefined,
  award_tax_exclusive: undefined,
  award_payable_amount: undefined,
  lotsAdj: 0,
  procedure_code: 1,
  urgency_code: 1,
  part_presentation_code: 3,
  contracting_system_code: 0,
  submission_method_code: 1,
  over_threshold_indicator: true,
  end_availability_period: undefined,
  end_availability_hour: undefined,
  end_date: '2025-07-11',
  end_hour: '15:00:00',
};

const basePartyObj = {
  id: undefined,
  nif: 'A21143656',
  updated: baseLicObj.updated,
  profile_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:perfilContratante&idBp=2zq7iBq6yoMSugstABGr5A%3D%3D',
  website: 'http://www.giahsa.com',
  dir3: 'LA0011418',
  name: 'Comisión Ejecutiva de Gestion Integral del Agua de Huelva',
  address: 'Carretera A-492 KM., 4',
  zip: '21110',
  city: 'Aljaraque',
  countryCode: 'ES',
  country: 'España',
  phone: '959310310',
  email: 'notificacionesdoue@giahsa.com'
};

const baseLot1Obj = {
  id: undefined,
  lot_id: 1,
  ext_id: '1_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17465786',
  name: 'Lote 1: Zona oeste',
  licitationId: LICITATION_ID,
  cost_with_taxes: 841573.82,
  cost_without_taxes: 765067.11,
  cpvs: ['90470000'],
  place: 'Huelva',
  city: undefined,
  zip: undefined,
  country: 'ES',
  tender_result_code: undefined,
  award_date: undefined,
  received_tender_quantity: undefined,
  lower_tender_amount: undefined,
  higher_tender_amount: undefined,
  winning_nif: undefined,
  winning_name: undefined,
  winning_city: undefined,
  winning_zip: undefined,
  winning_country: undefined,
  award_tax_exclusive: undefined,
  award_payable_amount: undefined
};

const baseLot2Obj = {
  id: undefined,
  lot_id: 2,
  ext_id: '2_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17465786',
  name: 'Lote 2: Zona centro y este',
  licitationId: LICITATION_ID,
  cost_with_taxes: 872195.04,
  cost_without_taxes: 792904.59,
  cpvs: ['90470000'],
  place: 'Huelva',
  city: undefined,
  zip: undefined,
  country: 'ES'
};

const baseLot3Obj = {
  lot_id: 3,
  ext_id: '3_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17465786',
  name: 'Lote 3: Zona norte.',
  licitationId: LICITATION_ID,
  cost_with_taxes: 804296.26,
  cost_without_taxes: 731178.41,
  cpvs: ['90470000'],
  place: 'Huelva',
  city: undefined,
  zip: undefined,
  country: 'ES'
};

const licitation0 = new Licitation(baseLicObj);
const lots0 = [
  new Lot({ ...baseLot1Obj }),
  new Lot({ ...baseLot2Obj }),
  new Lot({ ...baseLot3Obj }),
];
const party0 = new Party({ ...basePartyObj });
const events0 = [
  new Event({
    createdAt: new Date(licitation0.publishedDate!),
    type: EventType.LICITATION_CREATED,
    licitationId: LICITATION_ID,
  })
];

const licitation1 = new Licitation({ ...baseLicObj, id: LICITATION_ID, });
const lots1 = [
  new Lot({ ...baseLot1Obj, id: "1", }),
  new Lot({ ...baseLot2Obj, id: "2", }),
  new Lot({ ...baseLot3Obj, id: "3", }),
];
const party1 = new Party({ ...basePartyObj, id: PARTY_ID, });

const licitation2 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  summary: 'Id licitación: 918/2025; Órgano de Contratación: Comisión Ejecutiva de Gestión Integral del Agua de Huelva; Importe: 2289150.11 EUR; Estado: EV',
  updated: new Date('2025-08-05T10:12:41.502+02:00'),
  statusCode: 'EV',
});
const lots2 = [
  new Lot({ ...baseLot1Obj, id: "1", }),
  new Lot({ ...baseLot2Obj, id: "2", }),
  new Lot({ ...baseLot3Obj, id: "3", }),
];
const party2 = new Party({
  ...basePartyObj,
  id: PARTY_ID,
  updated: licitation2.updated,
  name: 'Comisión Ejecutiva de Gestión Integral del Agua de Huelva',
});
const events2 = [
  new Event({
    type: EventType.LICITATION_FINISHED_SUBMISSION_PERIOD,
    licitationId: LICITATION_ID,
    createdAt: licitation2.updated,
  }),
];

const licitation3 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  summary: 'Id licitación: 918/2025; Órgano de Contratación: Comisión Ejecutiva de Gestión Integral del Agua de Huelva; Importe: 2289150.11 EUR; Estado: ADJ',
  updated: new Date('2025-08-14T13:25:01.257+02:00'),
  statusCode: 'ADJ',
  lotsAdj: 2,
});
const lots3 = [
  new Lot({
    ...baseLot1Obj,
    id: "1",
    tender_result_code: 8,
    award_date: '2025-08-14',
    received_tender_quantity: 1,
    lower_tender_amount: 699174,
    higher_tender_amount: 699174,
    winning_nif: 'B21487467',
    winning_name: 'DOMINAGUA SUR S.L.L.',
    award_tax_exclusive: 699174,
    award_payable_amount: 769091.4,
  }),
  new Lot({
    ...baseLot2Obj,
    id: "2",
  }),
  new Lot({
    ...baseLot3Obj,
    id: "3",
    tender_result_code: 8,
    award_date: '2025-08-14',
    received_tender_quantity: 1,
    lower_tender_amount: 675591.63,
    higher_tender_amount: 675591.63,
    winning_nif: 'B21487467',
    winning_name: 'DOMINAGUA SUR S.L.L.',
    award_tax_exclusive: 675591.63,
    award_payable_amount: 743150.79,
  }),
];
const party3 = new Party({
  ...basePartyObj,
  id: PARTY_ID,
  updated: licitation3.updated,
  name: 'Comisión Ejecutiva de Gestión Integral del Agua de Huelva',
});
const events3 = [
  new Event({
    type: EventType.LICITATION_LOT_AWARDED,
    licitationId: LICITATION_ID,
    createdAt: new Date(lots3[0].award_date!),
    lotId: lots3[0].id,
  }),
  new Event({
    type: EventType.LICITATION_LOT_AWARDED,
    licitationId: LICITATION_ID,
    createdAt: new Date(lots3[2].award_date!),
    lotId: lots3[2].id,
  }),
];

const licitation4 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  summary: 'Id licitación: 918/2025; Órgano de Contratación: Comisión Ejecutiva de Gestión Integral del Agua de Huelva; Importe: 2289150.11 EUR; Estado: ADJ',
  updated: new Date('2025-08-16T13:42:00.545+02:00'),
  statusCode: 'ADJ',
  lotsAdj: 2,
});
const lots4 = [
  new Lot({
    ...baseLot1Obj,
    id: "1",
    tender_result_code: 8,
    award_date: '2025-08-14',
    received_tender_quantity: 1,
    lower_tender_amount: 699174,
    higher_tender_amount: 699174,
    winning_nif: 'B21487467',
    winning_name: 'DOMINAGUA SUR S.L.L.',
    award_tax_exclusive: 699174,
    award_payable_amount: 769091.4,
  }),
  new Lot({
    ...baseLot2Obj,
    id: "2",
    tender_result_code: 3,
    award_date: '2025-08-14',
    received_tender_quantity: 1,
    lower_tender_amount: 0,
    higher_tender_amount: 0,
  }),
  new Lot({
    ...baseLot3Obj,
    id: "3",
    tender_result_code: 8,
    award_date: '2025-08-14',
    received_tender_quantity: 1,
    lower_tender_amount: 675591.63,
    higher_tender_amount: 675591.63,
    winning_nif: 'B21487467',
    winning_name: 'DOMINAGUA SUR S.L.L.',
    award_tax_exclusive: 675591.63,
    award_payable_amount: 743150.79,
  }),
];
const party4 = new Party({
  ...basePartyObj,
  id: PARTY_ID,
  updated: licitation4.updated,
  name: 'Comisión Ejecutiva de Gestión Integral del Agua de Huelva',
});
const events4 = [];

describe('Resolved with lots not awarded', () => {
  testNewLicitation(
    'Published',
    `${BASE_PATH}/version1.atom`,
    licitation0,
    lots0,
    party0,
    events0,
    LAST_CURSOR_DATE,
    CPVS,
  );
  testLicitationUpdate(
    'Finished submission period. Now in evaluation mode',
    `${BASE_PATH}/version3.atom`,
    licitation1,
    lots1,
    party1,
    licitation2,
    lots2,
    party2,
    events2,
    LAST_CURSOR_DATE,
    CPVS,
  );
  testLicitationUpdate(
    'Some lots awarded',
    `${BASE_PATH}/version4.atom`,
    licitation2,
    lots2,
    party2,
    licitation3,
    lots3,
    party3,
    events3,
    LAST_CURSOR_DATE,
    CPVS,
  );
  testLicitationUpdate(
    'Desisted Lot 2',
    `${BASE_PATH}/version5.atom`,
    licitation3,
    lots3,
    party3,
    licitation4,
    lots4,
    party4,
    events4,
    LAST_CURSOR_DATE,
    CPVS,
  );
});
