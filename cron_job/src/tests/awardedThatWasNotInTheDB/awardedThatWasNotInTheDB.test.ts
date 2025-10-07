import { describe } from "@jest/globals"
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { Event, EventType } from "../../domain/Event.js";
import { testLicitationUpdate, testNewLicitation } from "../utils.js";
import { Doc } from "../../domain/Doc.js";

const CPVS = ["44617000"];
const BASE_PATH = 'src/tests/awardedThatWasNotInTheDB';
const LAST_CURSOR_DATE = new Date('2025-08-17');
const LICITATION_ID = "1234";
const PARTY_ID = "1234";

const baseLicObj = {
  entry_id: 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17637184',
  partyId: PARTY_ID,
  statusCode: 'ADJ',
  publishedDate: '2025-07-09',
  updated: new Date('2025-08-18T14:51:22.403Z'),
  title: 'Clotra suministro de embalaje',
  summary: 'Id licitación: 2025/EA27/00001387E; Órgano de Contratación: Jefatura de la Sección Económico-Administrativa 27 - Base Aérea de Getafe; Importe: 2314.05 EUR; Estado: ADJ',
  platform_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=6Klz9LG41M%2BAAM7L03kM8A%3D%3D',
  type_code: 1,
  subtype_code: 2,
  estimated_overall_cost: 59314.05,
  cost_with_taxes: 2800,
  cost_without_taxes: 2314.05,
  cpvs: ['44617000'],
  place: 'Madrid',
  realized_city: undefined,
  realized_zip: '',
  realized_country: 'ES',
  estimated_duration: undefined,
  tender_result_code: 8,
  award_date: '2025-08-18',
  received_tender_quantity: 3,
  lower_tender_amount: 0,
  higher_tender_amount: 2314.05,
  winning_nif: 'B80461122',
  winning_name: 'Supeim, S.L.',
  winning_city: 'Alcorcón',
  winning_zip: '28925',
  winning_country: 'ES',
  award_tax_exclusive: 2314.05,
  award_payable_amount: 28000,
  lotsAdj: 1,
  procedure_code: 9,
  urgency_code: 1,
  part_presentation_code: undefined,
  contracting_system_code: 0,
  submission_method_code: 1,
  over_threshold_indicator: true,
  end_availability_period: undefined,
  end_availability_hour: undefined,
  end_date: '2025-07-25',
  end_hour: '10:00:00',
};

const basePartyObj = {
  id: undefined,
  nif: 'S2822023D',
  updated: new Date('2025-08-18T14:51:22.403Z'),
  profile_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:perfilContratante&idBp=9dfE6bBBxVE%3D',
  website: 'http://www.ejercitodelaire.mde.es/Contratacion',
  dir3: 'EA0003016',
  name: 'Jefatura de la Sección Económico-Administrativa 27 - Base Aérea de Getafe',
  address: 'Negociado de Contratación de la SEA de la Base Aérea de Getafe, Plaza Coronel Polanco, s/n',
  zip: '28901',
  city: 'Getafe',
  countryCode: 'ES',
  country: 'España',
  phone: '917798395',
  email: 'sea27contratacion@ea.mde.es',
};

const baseLot1Obj = {
  id: undefined,
  lot_id: '0',
  ext_id: '0_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17637184',
  name: 'Clotra suministro de embalaje',
  licitationId: LICITATION_ID,
  cost_with_taxes: 2800,
  cost_without_taxes: 2314.05,
  type_code: 1,
  subtype_code: 2,
  estimated_overall_cost: 59314.05,
  cpvs: ['44617000'],
  place: 'Madrid',
  realized_city: undefined,
  realized_zip: '',
  realized_country: 'ES',
  estimated_duration: undefined,
  tender_result_code: 8,
  award_date: '2025-08-18',
  received_tender_quantity: 3,
  lower_tender_amount: 0,
  higher_tender_amount: 2314.05,
  winning_nif: 'B80461122',
  winning_name: 'Supeim, S.L.',
  winning_city: 'Alcorcón',
  winning_zip: '28925',
  winning_country: 'ES',
  award_tax_exclusive: 2314.05,
  award_payable_amount: 28000
};

const baseDocuments = [
  {
    docId: 'PCAP 1387 material embalaje.pdf',
    name: 'PCAP 1387 material embalaje.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=hwz1sMJi19Af/AEfGJhrxSiSmla3reMfgjQdw6vsbLYmDf9181FaTARS9vWrW1VArMXVXrXAgAmJyqf59WDtu9RP5lcv9FnHWCz5ZSYdFAo//q7NB2iMZvNyf0xrJmjt&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'legal'
  },
  {
    docId: 'Pliego de Prescripciones Tecnicas.pdf',
    name: 'Pliego de Prescripciones Tecnicas.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=PGantZSkLC/NDnBR8i/ZHTfujN8XlrJU3Tt2f6ucdanhy7wV8ee2Jjn7TCef3f9OTeB0kpj4z5%2BP4nmSwhitfqjSVuxR8LUIHkQWgfg1raq1aXEvq3KHa/AEHgtDrQw0&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'technical'
  },
  {
    docId: '2025-59b3ba4d-aadb-46b8-993e-a4f5ff8e9c27',
    name: 'ACTA',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-59b3ba4d-aadb-46b8-993e-a4f5ff8e9c27',
    type: 'general'
  },
  {
    docId: '2025-3710159d-ad50-4cd2-8042-f6b27ac8fb0d',
    name: 'Memoria justificativa',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-3710159d-ad50-4cd2-8042-f6b27ac8fb0d',
    type: 'general'
  },
  {
    docId: '2025-4b565630-683f-4485-800b-030b72c501c8',
    name: 'OI',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-4b565630-683f-4485-800b-030b72c501c8',
    type: 'general'
  },
  {
    docId: '2025-1941861f-b1a4-499f-b7f0-cfa46e1576a2',
    name: 'INFORME TECNICO',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-1941861f-b1a4-499f-b7f0-cfa46e1576a2',
    type: 'general'
  }
];

const licitation0 = new Licitation(baseLicObj);
const lots0 = [new Lot({ ...baseLot1Obj })];
const party0 = new Party({ ...basePartyObj });
const expectedDocs0 = baseDocuments.map(el => new Doc({ ...el, licitationId: LICITATION_ID }));
const events0 = [
  new Event({
    createdAt: new Date(new Date(lots0[0]!.award_date!)),
    type: EventType.LICITATION_LOT_AWARDED,
    licitationId: LICITATION_ID,
    lotId: lots0[0]!.id,
  }),
  new Event({
    createdAt: new Date(licitation0.updated),
    type: EventType.LICITATION_AWARDED,
    licitationId: LICITATION_ID,
  }),
];

describe('Awarded that was not in the DB', () => {
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
