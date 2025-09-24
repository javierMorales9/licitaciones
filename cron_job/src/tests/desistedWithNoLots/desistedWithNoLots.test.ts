import { describe } from "@jest/globals"
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { Event, EventType } from "../../domain/Event.js";
import { testLicitationUpdate, testNewLicitation } from "../utils.js";

const CPVS = ["72313000"];
const LAST_CURSOR_DATE = new Date('2025-08-17');
const LICITATION_ID = "1234";
const PARTY_ID = "1234";

const baseLicObj = {
  entry_id: 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17165996',
  partyId: PARTY_ID,
  statusCode: 'PUB',
  publishedDate: '2025-04-23',
  updated: new Date('2025-04-23T08:10:47.177Z'),
  title: 'Trabajos de recogida, grabación y depuración de los datos de la operación estadística denominada "ENCUESTA DE CONDICIONES DE VIDA DE LOS HOGARES DE CANARIAS 2025"',
  summary: 'Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: PUB',
  platform_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=5Q16zvBfrXDE6P%2FuLemXRw%3D%3D',
  type_code: 2,
  subtype_code: 10,
  estimated_overall_cost: 261901.77,
  cost_with_taxes: 280234.89,
  cost_without_taxes: 261901.77,
  cpvs: ['72313000'],
  place: 'Canarias',
  realized_city: 'Las Palmas de Gran Canaria',
  realized_zip: '35004',
  realized_country: 'ES',
  estimated_duration: '8 MON',
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
  part_presentation_code: undefined,
  contracting_system_code: 0,
  submission_method_code: 1,
  over_threshold_indicator: true,
  end_availability_period: undefined,
  end_availability_hour: undefined,
  end_date: '2025-05-23',
  end_hour: '15:00:00',
};

const basePartyObj = {
  id: undefined,
  nif: 'Q8550002C',
  updated: new Date('2025-04-23T08:10:47.177Z'),
  profile_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:perfilContratante&idBp=lX6avbkvrJEQK2TEfXGy%2BA%3D%3D',
  website: 'http://www.gobiernodecanarias.org/istac/',
  dir3: 'A05003423',
  name: 'Director del Instituto Canario de Estadística (ISTAC)',
  address: 'c/ Luis Doreste Silva, 101 p.7',
  zip: '35004',
  city: 'Las Palmas de Gran Canaria',
  countryCode: 'ES',
  country: 'España',
  phone: '928899260',
  email: 'istac@gobiernodecanarias.org'
};

const baseLot1Obj = {
  id: undefined,
  lot_id: 0,
  ext_id: '0_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17165996',
  name: 'Trabajos de recogida, grabación y depuración de los datos de la operación estadística denominada "ENCUESTA DE CONDICIONES DE VIDA DE LOS HOGARES DE CANARIAS 2025"',
  licitationId: LICITATION_ID,
  cost_with_taxes: 280234.89,
  cost_without_taxes: 261901.77,
  cpvs: ['72313000'],
  place: 'Canarias',
  city: undefined,
  zip: undefined,
  country: undefined,
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

const licitation0 = new Licitation(baseLicObj);
const lots0 = [new Lot({ ...baseLot1Obj })];
const party0 = new Party({ ...basePartyObj });
const events0 = [new Event({
  createdAt: new Date(licitation0.publishedDate!),
  type: EventType.LICITATION_CREATED,
  licitationId: LICITATION_ID,
})];

const licitation1 = new Licitation({ ...baseLicObj, id: LICITATION_ID, });
const lots1 = [new Lot({ ...baseLot1Obj, id: "1", })];
const party1 = new Party({ ...basePartyObj, id: PARTY_ID, });

const licitation2 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  updated: new Date('2025-05-12T10:28:43.718Z'),
  end_date: '2025-06-12'
});
const lots2 = [new Lot({ ...baseLot1Obj, id: "1" })];
const party2 = new Party({ ...basePartyObj, id: PARTY_ID, updated: new Date('2025-05-12T10:28:43.718Z') });
const events2 = [];

const licitation3 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'EV',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: EV",
  updated: new Date('2025-06-13T13:24:16.856+02:00'),
  end_date: '2025-06-12'
});
const lots3 = [new Lot({ ...baseLot1Obj, id: "1" })];
const party3 = new Party({ ...basePartyObj, id: PARTY_ID, updated: new Date('2025-06-13T13:24:16.856+02:00') });
const events3 = [new Event({
  createdAt: new Date(licitation3.updated),
  type: EventType.LICITATION_FINISHED_SUBMISSION_PERIOD,
  licitationId: LICITATION_ID,
})];

const licitation4 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'ADJ',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: ADJ",
  updated: new Date('2025-07-18T13:25:26.131+02:00'),
  end_date: '2025-06-12',
  tender_result_code: 8,
  award_date: '2025-07-18',
  received_tender_quantity: 4,
  lower_tender_amount: '224002.34',
  higher_tender_amount: '260000',
  winning_nif: 'A38210100',
  winning_name: 'REDCA S.A.',
  winning_city: 'Las Palmas de Gran Canaria',
  winning_zip: '35007',
  winning_country: 'ES',
  award_tax_exclusive: '224002.34',
  award_payable_amount: '239682.5',
  lotsAdj: 1,
});
const lots4 = [new Lot({
  ...baseLot1Obj,
  id: "1",
  tender_result_code: 8,
  award_date: '2025-07-18',
  received_tender_quantity: 4,
  lower_tender_amount: '224002.34',
  higher_tender_amount: '260000',
  winning_nif: 'A38210100',
  winning_name: 'REDCA S.A.',
  winning_city: 'Las Palmas de Gran Canaria',
  winning_zip: '35007',
  winning_country: 'ES',
  award_tax_exclusive: '224002.34',
  award_payable_amount: '239682.5',
})];
const party4 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation4.updated });
const events4 = [
  new Event({
    createdAt: new Date('2025-07-18'),
    type: EventType.LICITATION_LOT_AWARDED,
    licitationId: LICITATION_ID,
    lotId: lots4[0].lot_id.toString(),
  }),
  new Event({
    createdAt: new Date('2025-07-18'),
    type: EventType.LICITATION_AWARDED,
    licitationId: LICITATION_ID,
  }),
];

const licitation5 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'RES',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: RES",
  updated: new Date('2025-08-16T09:58:08.174+02:00'),
  end_date: '2025-06-12',
  tender_result_code: 9,
  award_date: '2025-07-18',
  received_tender_quantity: 4,
  lower_tender_amount: '224002.34',
  higher_tender_amount: '260000',
  winning_nif: 'A38210100',
  winning_name: 'REDCA S.A.',
  winning_city: 'Las Palmas de Gran Canaria',
  winning_zip: '35007',
  winning_country: 'ES',
  award_tax_exclusive: '224002.34',
  award_payable_amount: '239682.5',
  lotsAdj: 1,
});
const lots5 = [new Lot({
  ...baseLot1Obj,
  id: "1",
  tender_result_code: 9,
  award_date: '2025-07-18',
  received_tender_quantity: 4,
  lower_tender_amount: '224002.34',
  higher_tender_amount: '260000',
  winning_nif: 'A38210100',
  winning_name: 'REDCA S.A.',
  winning_city: 'Las Palmas de Gran Canaria',
  winning_zip: '35007',
  winning_country: 'ES',
  award_tax_exclusive: '224002.34',
  award_payable_amount: '239682.5',
})];
const party5 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation5.updated });
const events5 = [
  new Event({
    createdAt: licitation5.updated,
    type: EventType.LICITATION_RESOLVED,
    licitationId: LICITATION_ID,
  }),
];

describe('Resolved with no lots', () => {
  testNewLicitation(
    'Published',
    "1",
    licitation0,
    lots0,
    party0,
    events0,
    LAST_CURSOR_DATE,
    CPVS,
  );
  testLicitationUpdate(
    'Published, end date updated',
    "2",
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
    'Finished submission period, now in Evaluation state',
    "5",
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
    'Licitation awarded',
    "9",
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
    'Licitation awarded',
    "10",
    licitation4,
    lots4,
    party4,
    licitation4,
    lots5,
    party5,
    events5,
    LAST_CURSOR_DATE,
    CPVS,
  );
});
