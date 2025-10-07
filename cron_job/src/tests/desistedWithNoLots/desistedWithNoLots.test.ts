import { describe } from "@jest/globals"
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { Event, EventType } from "../../domain/Event.js";
import { testLicitationUpdate, testNewLicitation } from "../utils.js";

const CPVS = ["79111000"];
const BASE_PATH = 'src/tests/desistedWithNoLots';
const LAST_CURSOR_DATE = new Date('2025-08-17');
const LICITATION_ID = "1234";
const PARTY_ID = "1234";

const baseLicObj = {
  entry_id: 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17540944',
  partyId: PARTY_ID,
  statusCode: 'PUB',
  publishedDate: '2025-06-25',
  updated: new Date('2025-06-25T08:51:20.989Z'),
  title: 'Servicios técnico de asesoramiento jurídico en materia de Derecho Administrativo, Derecho Urbanístico, Derecho Civil y Derecho Laboral.',
  summary: 'Id licitación: Exp 07-2025; Órgano de Contratación: Consejo de Administración de la Agència Balear de Digitalització, Ciberseguretat i Telecomunicacions (IB Digital); Importe: 240350 EUR; Estado: PUB',
  platform_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=hRxr0sLCRmKExvMJXBMHHQ%3D%3D',
  type_code: 2,
  subtype_code: 21,
  estimated_overall_cost: 423200,
  cost_with_taxes: 290823.5,
  cost_without_taxes: 240350,
  cpvs: ['79111000'],
  place: 'Mallorca',
  realized_city: 'Palma',
  realized_zip: '07121',
  realized_country: 'ES',
  estimated_duration: '2 ANN',
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
  end_date: '2025-07-23',
  end_hour: '15:00:00',
};

const basePartyObj = {
  id: undefined,
  nif: 'V16541831',
  updated: new Date('2025-06-25T10:51:20.989+02:00'),
  profile_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:perfilContratante&idBp=URTYI5cY1%2FsQK2TEfXGy%2BA%3D%3D',
  website: 'http://www.ibetec.cat',
  dir3: undefined,
  name: 'Consejo de Administración de la Agència Balear de Digitalització, Ciberseguretat i Telecomunicacions (IB Digital)',
  address: 'Blaise Pascal, s/n Edificio Adduno - Parc Bit (Ctra. Palma-Valdemossa, Km 7,4)',
  zip: '07121',
  city: 'Palma',
  countryCode: 'ES',
  country: 'España',
  phone: '971177354',
  email: 'contractacio@ibdigital.caib.es'
};

const baseLot1Obj = {
  id: undefined,
  lot_id: '0',
  ext_id: '0_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17540944',
  name: 'Servicios técnico de asesoramiento jurídico en materia de Derecho Administrativo, Derecho Urbanístico, Derecho Civil y Derecho Laboral.',
  licitationId: LICITATION_ID,
  cost_with_taxes: 290823.5,
  cost_without_taxes: 240350,
  type_code: 2,
  subtype_code: 21,
  estimated_overall_cost: 423200,
  cpvs: ['79111000'],
  place: 'Mallorca',
  realized_city: 'Palma',
  realized_zip: '07121',
  realized_country: 'ES',
  estimated_duration: '2 ANN',
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
const events0 = [
  new Event({
    createdAt: new Date(licitation0.publishedDate!),
    type: EventType.LICITATION_CREATED,
    licitationId: LICITATION_ID,
  }),
];

const licitation1 = new Licitation({ ...baseLicObj, id: LICITATION_ID, });
const lots1 = [new Lot({ ...baseLot1Obj, id: "1", })];
const party1 = new Party({ ...basePartyObj, id: PARTY_ID, });

const licitation2 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'RES',
  updated: new Date('2025-08-16T09:43:27.425+02:00'),
  summary: 'Id licitación: Exp 07-2025; Órgano de Contratación: Consejo de Administración de la Agència Balear de Digitalització, Ciberseguretat i Telecomunicacions (IB Digital); Importe: 240350 EUR; Estado: RES',
  end_date: '2025-07-23',
  tender_result_code: 4,
  lotsAdj: 0,
});
const lots2 = [new Lot({
  ...baseLot1Obj,
  id: "1",
  tender_result_code: 4,
})];
const party2 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation2.updated });
const events2 = [
  new Event({
    createdAt: new Date(licitation2.updated!),
    type: EventType.LICITATION_RESOLVED,
    licitationId: LICITATION_ID,
  }),
];

describe('Desisted with no lots', () => {
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
    'Published, end date updated',
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
});
