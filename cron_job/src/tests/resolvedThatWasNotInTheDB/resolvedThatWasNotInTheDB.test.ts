import { describe } from "@jest/globals"
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { Event, EventType } from "../../domain/Event.js";
import { testLicitationUpdate, testNewLicitation } from "../utils.js";
import { Doc } from "../../domain/Doc.js";

const CPVS = ["42913000"];
const BASE_PATH = 'src/tests/resolvedThatWasNotInTheDB';
const LAST_CURSOR_DATE = new Date('2025-08-17');
const LICITATION_ID = "1234";
const PARTY_ID = "1234";

const baseLicObj = {
  entry_id: 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17510264',
  partyId: PARTY_ID,
  statusCode: 'RES',
  publishedDate: '2025-06-19',
  updated: new Date('2025-08-18T14:54:23.671Z'),
  title: 'Adquisición de cartuchos filtrantes para UURR de la Base Aérea de Son San Juan',
  summary: 'Id licitación: 2025/EA61/00001853E; Órgano de Contratación: Jefatura de la Sección Económico-Administrativa 61 - Base Aérea de Son San Juan; Importe: 15694.35 EUR; Estado: RES',
  platform_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=%2FCyBGV1yoY3E6P%2FuLemXRw%3D%3D',
  type_code: 1,
  subtype_code: 2,
  estimated_overall_cost: 15694.35,
  cost_with_taxes: 18990.16,
  cost_without_taxes: 15694.35,
  cpvs: ['42913000'],
  place: 'Illes Balears',
  realized_city: 'Palma de Mallorca',
  realized_zip: '07199',
  realized_country: 'ES',
  estimated_duration: '5 MON',
  lotsAdj: 2,
  procedure_code: 9,
  urgency_code: 1,
  part_presentation_code: 3,
  contracting_system_code: 0,
  submission_method_code: 1,
  over_threshold_indicator: true,
  end_availability_period: undefined,
  end_availability_hour: undefined,
  end_date: '2025-07-04',
  end_hour: '06:00:00',
};

const basePartyObj = {
  id: undefined,
  nif: 'S0722001E',
  updated: new Date('2025-08-18T14:54:23.671Z'),
  profile_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:perfilContratante&idBp=ex6E%2B7Ug6Yo%3D',
  website: 'http://www.ejercitodelaire.mde.es/Contratacion',
  dir3: 'EA0003049',
  name: 'Jefatura de la Sección Económico-Administrativa 61 - Base Aérea de Son San Juan',
  address: 'Base Aérea de Son San Juán, Ctra. de Manacor Km. 8',
  zip: '07199',
  city: 'Palma de Mallorca',
  countryCode: 'ES',
  country: 'España',
  phone: '971497571',
  email: 'sea61contratacion@ea.mde.es'
};

const baseLot1Obj = {
  id: undefined,
  lot_id: '1',
  ext_id: '1_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17510264',
  name: 'Adquisición de cartuchos filtrantes para UURR de la Base Aérea de Son San Juan - LOTE 1',
  licitationId: LICITATION_ID,
  cost_with_taxes: 11510.04,
  cost_without_taxes: 9512.43,
  cpvs: ['42913000'],
  place: 'Mallorca',
  city: undefined,
  zip: undefined,
  country: 'ES',
  tender_result_code: 8,
  award_date: '2025-08-18',
  received_tender_quantity: 2,
  lower_tender_amount: 9024.27,
  higher_tender_amount: 9167.71,
  winning_nif: 'B84995711',
  winning_name: 'Suyfa Defence, S.L.',
  winning_city: undefined,
  winning_zip: undefined,
  winning_country: undefined,
  award_tax_exclusive: 9167.71,
  award_payable_amount: 11092.93
};

const baseLot2Obj = {
  id: undefined,
  lot_id: '2',
  ext_id: '2_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17510264',
  name: 'Adquisición filtros instalación planta fija JP-8 de la Base Aérea de Son San Juan - LOTE 2',
  licitationId: LICITATION_ID,
  cost_with_taxes: 7480.12,
  cost_without_taxes: 6181.92,
  cpvs: ['42913000'],
  place: 'Mallorca',
  city: undefined,
  zip: undefined,
  country: 'ES',
  tender_result_code: 4,
  award_date: '2025-08-18',
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

const baseDocuments = [
  {
    docId: '1853 PCAP filtros.pdf',
    name: '1853 PCAP filtros.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=BEvNWXSpGigd2vpNVRIiSjxFULjQ9J9MFguiL9pk7wKoEe7JxXJKVXjhgbxW5y8SSTdYTyiT20L3HpB32CtXEVAN%2B33ov%2B2kbLUkWb%2BzjxY//q7NB2iMZvNyf0xrJmjt&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'legal'
  },
  {
    docId: 'PPT FILTROS.pdf',
    name: 'PPT FILTROS.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=TgtUYkWF71PC1n%2BQxYvWHnj8Uowd41NKfYxnFPhFz27Jr4JpV7WOGkWNB566e8kC0K1wt6JQNHqMx%2BX8ke6ctbYw1pb97Mx2oBWYZe41V8bVTD3T98KC0nSgQFM0q%2B5s&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'technical'
  },
  {
    docId: '2025-7444e41a-5efc-49c5-a8a5-6fb6ef5c0c19',
    name: 'Informe técnico',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-7444e41a-5efc-49c5-a8a5-6fb6ef5c0c19',
    type: 'general'
  },
  {
    docId: '2025-e4b32fdb-02c7-48f3-81d0-a1ba2b22756b',
    name: 'Acta del órgano de asistencia',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-e4b32fdb-02c7-48f3-81d0-a1ba2b22756b',
    type: 'general'
  },
  {
    docId: '2025-c590b6eb-fe1d-43a6-83be-0354ec18553d',
    name: 'Informe de insuficiencia de medios',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-c590b6eb-fe1d-43a6-83be-0354ec18553d',
    type: 'general'
  },
  {
    docId: '2025-d1e2274b-b8cf-4d02-8786-4a0696d509e2',
    name: 'Acuerdo de iniciación del expediente',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-d1e2274b-b8cf-4d02-8786-4a0696d509e2',
    type: 'general'
  },
  {
    docId: '2025-fe61b1c7-e1fb-48dc-a63e-0a0dafc577eb',
    name: 'Documento de aprobación del expediente',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-fe61b1c7-e1fb-48dc-a63e-0a0dafc577eb',
    type: 'general'
  }
];

const licitation0 = new Licitation(baseLicObj);
const lots0 = [new Lot({ ...baseLot1Obj }), new Lot({ ...baseLot2Obj })];
const party0 = new Party({ ...basePartyObj });
const expectedDocs0 = baseDocuments.map(el => new Doc({ ...el, licitationId: LICITATION_ID }));
const events0 = [
  new Event({
    createdAt: new Date(licitation0.updated),
    type: EventType.LICITATION_RESOLVED,
    licitationId: LICITATION_ID,
  }),
];

describe('Resolved that was not in the DB', () => {
  testNewLicitation(
    'Test',
    `${BASE_PATH}/version1.atom`,
    licitation0,
    lots0,
    party0,
    events0,
    LAST_CURSOR_DATE,
    CPVS,
    expectedDocs0,
  );
});
