import { describe } from "@jest/globals"
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { Event, EventType } from "../../domain/Event.js";
import { testLicitationUpdate, testNewLicitation } from "../utils.js";

const CPVS = ["34410000", "66114000", "34114100"];
const BASE_PATH = 'src/tests/resolvedWithLotsAllAwarded';
const LAST_CURSOR_DATE = new Date('2025-08-17');
const LICITATION_ID = "1234";
const PARTY_ID = "1234";

const baseLicObj = {
  entry_id: 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/16998351',
  partyId: PARTY_ID,
  statusCode: 'PUB',
  publishedDate: '2025-03-27',
  updated: new Date('2025-03-27T10:52:44.870Z'),
  title: 'Contrato de suministros consistente en arrendamiento financiero con opción de compra (leasing) para el suministro de varios vehículos destinados a la Policía Local de Gandia.',
  summary: 'Id licitación: CONT-010/2025 (58996/2024); Órgano de Contratación: Junta de Gobierno del Ayuntamiento de Gandía; Importe: 390804 EUR; Estado: PUB',
  platform_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=fUO8%2FC3mm%2FwzjChw4z%2FXvw%3D%3D',
  type_code: 1,
  subtype_code: 2,
  estimated_overall_cost: 390804,
  cost_with_taxes: 472872.84,
  cost_without_taxes: 390804,
  cpvs: ["34410000", "66114000", "34114100"],
  place: 'Valencia/València',
  realized_city: undefined,
  realized_zip: '',
  realized_country: 'ES',
  estimated_duration: '48 MON',
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
  end_date: '2025-04-25',
  end_hour: '14:00:00',
};

const basePartyObj = {
  id: undefined,
  profile_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:perfilContratante&idBp=UsgMm9iqmT8QK2TEfXGy%2BA%3D%3D',
  updated: new Date('2025-03-27T11:52:44.870+01:00'),
  website: 'http://www.gandia.org',
  dir3: undefined,
  nif: 'P4613300E',
  name: 'Junta de Gobierno del Ayuntamiento de Gandía',
  address: 'Plaza Major, 1',
  zip: '46701',
  city: 'Gandía',
  countryCode: 'ES',
  country: 'España',
  phone: '962959460',
  email: 'contratacion.patrimonio@gandia.org'
};

const baseLot1Obj = {
  id: undefined,
  licitationId: LICITATION_ID,
  cpvs: ["34410000", "34114100", "66114000"],
  lot_id: 1,
  ext_id: '1_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/16998351',
  name: 'Lote 1: Motocicleta Unidad Tráfico.',
  cost_with_taxes: 278706.56,
  cost_without_taxes: 230336,
  place: 'Valencia/València',
  city: undefined,
  zip: undefined,
  country: 'ES'
};

const baseLot2Obj = {
  id: undefined,
  licitationId: LICITATION_ID,
  cpvs: ["34410000", "34114100", "66114000"],
  lot_id: 2,
  ext_id: '2_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/16998351',
  name: 'Lote 2: Motocicletas Unidad Convivencia.',
  cost_with_taxes: 139353.28,
  cost_without_taxes: 115168,
  place: 'Valencia/València',
  city: undefined,
  zip: undefined,
  country: 'ES'
};

const baseLot3Obj = {
  id: undefined,
  licitationId: LICITATION_ID,
  cpvs: ["34410000", "34114100", "66114000"],
  lot_id: 3,
  ext_id: '3_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/16998351',
  name: 'Lote 3: Buggy UTV Unidad Playas.',
  cost_with_taxes: 54813,
  cost_without_taxes: 45300,
  place: 'Valencia/València',
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
  }),
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
  summary: 'Id licitación: CONT-010/2025 (58996/2024); Órgano de Contratación: Junta de Gobierno del Ayuntamiento de Gandía; Importe: 390804 EUR; Estado: EV',
  statusCode: 'EV',
  updated: new Date('2025-04-25T14:30:48.606+02:00'),
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
});
const events2 = [
  new Event({
    createdAt: licitation2.updated,
    type: EventType.LICITATION_FINISHED_SUBMISSION_PERIOD,
    licitationId: LICITATION_ID,
  }),
];

const licitation3 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  summary: 'Id licitación: CONT-010/2025 (58996/2024); Órgano de Contratación: Junta de Gobierno del Ayuntamiento de Gandía; Importe: 390804 EUR; Estado: ADJ',
  statusCode: 'ADJ',
  updated: new Date('2025-06-23T09:28:14.966+02:00'),
  lotsAdj: 3,
});
const lots3 = [
  new Lot({
    ...baseLot1Obj,
    id: "1",
    tender_result_code: 8,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 214656,
    award_payable_amount: 259733.76,
  }),
  new Lot({
    ...baseLot2Obj,
    id: "2",
    tender_result_code: 8,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 107328,
    award_payable_amount: 129866.88,
  }),
  new Lot({
    ...baseLot3Obj,
    id: "3",
    tender_result_code: 8,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 44832,
    award_payable_amount: 54246.72,
  }),
];
const party3 = new Party({
  ...basePartyObj,
  id: PARTY_ID,
  updated: licitation3.updated,
});
const events3 = [
  new Event({
    createdAt: new Date(lots3[1].award_date!),
    type: EventType.LICITATION_LOT_AWARDED,
    licitationId: LICITATION_ID,
    lotId: lots3[0].id,
  }),
  new Event({
    createdAt: new Date(lots3[1].award_date!),
    type: EventType.LICITATION_LOT_AWARDED,
    licitationId: LICITATION_ID,
    lotId: lots3[1].id,
  }),
  new Event({
    createdAt: new Date(lots3[2].award_date!),
    type: EventType.LICITATION_LOT_AWARDED,
    licitationId: LICITATION_ID,
    lotId: lots3[2].id,
  }),
  new Event({
    createdAt: licitation3.updated,
    type: EventType.LICITATION_AWARDED,
    licitationId: LICITATION_ID,
  }),
];

const licitation4 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  summary: 'Id licitación: CONT-010/2025 (58996/2024); Órgano de Contratación: Junta de Gobierno del Ayuntamiento de Gandía; Importe: 390804 EUR; Estado: ADJ',
  statusCode: 'ADJ',
  updated: new Date('2025-08-13T09:30:49.162+02:00'),
  lotsAdj: 3,
});
const lots4 = [
  new Lot({
    ...baseLot1Obj,
    id: "1",
    tender_result_code: 9,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 214656,
    award_payable_amount: 259733.76,
  }),
  new Lot({
    ...baseLot2Obj,
    id: "2",
    tender_result_code: 8,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 107328,
    award_payable_amount: 129866.88,
  }),
  new Lot({
    ...baseLot3Obj,
    id: "3",
    tender_result_code: 8,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 44832,
    award_payable_amount: 54246.72,
  }),
];
const party4 = new Party({
  ...basePartyObj,
  id: PARTY_ID,
  updated: licitation4.updated,
});
const events4 = [];

const licitation5 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  summary: 'Id licitación: CONT-010/2025 (58996/2024); Órgano de Contratación: Junta de Gobierno del Ayuntamiento de Gandía; Importe: 390804 EUR; Estado: RES',
  statusCode: 'RES',
  updated: new Date('2025-08-16T09:41:59.778+02:00'),
  lotsAdj: 3,
});
const lots5 = [
  new Lot({
    ...baseLot1Obj,
    id: "1",
    tender_result_code: 9,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 214656,
    award_payable_amount: 259733.76,
  }),
  new Lot({
    ...baseLot2Obj,
    id: "2",
    tender_result_code: 9,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 107328,
    award_payable_amount: 129866.88,
  }),
  new Lot({
    ...baseLot3Obj,
    id: "3",
    tender_result_code: 9,
    award_date: '2025-06-20',
    received_tender_quantity: 1,
    winning_nif: 'B64146632',
    winning_name: 'COOLTRA MOTOS, S.L.',
    award_tax_exclusive: 44832,
    award_payable_amount: 54246.72,
  }),
];
const party5 = new Party({
  ...basePartyObj,
  id: PARTY_ID,
  updated: licitation5.updated,
});
const events5 = [
  new Event({
    createdAt: licitation5.updated,
    type: EventType.LICITATION_RESOLVED,
    licitationId: LICITATION_ID,
  }),
];

describe('Resolved with Lots', () => {
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
    'Finished period, no in Evaluation',
    `${BASE_PATH}/version2.atom`,
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
    'Awarded Lot',
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
    'Lot resolved',
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
  testLicitationUpdate(
    'Licitation resolved',
    `${BASE_PATH}/version6.atom`,
    licitation4,
    lots4,
    party4,
    licitation5,
    lots5,
    party5,
    events5,
    LAST_CURSOR_DATE,
    CPVS,
  );
});
