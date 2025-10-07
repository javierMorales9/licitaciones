import { describe } from "@jest/globals"
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { Event, EventType } from "../../domain/Event.js";
import { testLicitationUpdate, testNewLicitation } from "../utils.js";
import { Doc } from "../../domain/Doc.js";

const CPVS = ["72313000"];
const LAST_CURSOR_DATE = new Date('2025-08-17');
const LICITATION_ID = "1234";
const PARTY_ID = "1234";
const BASE_PATH = 'src/tests/resolvedWithNoLots';

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
  lot_id: '0',
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

const baseDocsObj = [
  {
    name: 'PCAP.pdf',
    docId: 'PCAP.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=lFaguHXcfrNFt4mGJN9fy4MskKePiJhBC10pL/ORjUYKefS5pELhtQlUsyaPs/1AJbl2ZRR7e3h3TptbjOfssuErp8DYDge9WFJ3mRRH5C2B0nvVKRzfe4rpHcnlPhSZ&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'legal'
  },
  {
    name: 'PPT.pdf',
    docId: 'PPT.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=TYzghc%2BRVjDIWyaK5EruSvHjwh2TBS/WkX7GSUDmrMHXcg/uGQDNaKZk%2BqgbL%2Bry/WTc7UT9GiNaGAxECHTcVA7%2BS7jjMt7UQzdbGe9pypoC1/zDIE0Kw/PWNnLS0Z0z&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'technical'
  },
  {
    name: 'EICVHC25 - Ficha hogar.pdf',
    docId: 'EICVHC25 - Ficha hogar.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=iqmw19H7cTpRlBrdsRjC6T9bVl4PHA2ylKDbLgUYBX6xrMF6OvXXcAF5qfLjEaCaP5u2c6791eEpUm%2BfRLUIaTMrq1Q4oJgWFXFp58kP%2Bw/DdQD9RyhUmzT4jZ2In4zL&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'additional'
  },
  {
    name: 'EICVHC25 - Ficha vivienda.pdf',
    docId: 'EICVHC25 - Ficha vivienda.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=DQudMDlJvhKhAV90sFudDg7r%2BxyVXPAe9DMo/9Ud%2BBR0JYWeH7QVGfuYOPzEuC9bk69K9nD5M8WPXatRUmrAihoeepZU%2Bg4G1ZoiUb1IBP6Cx2e6p7hqtlp2aFupgHMr&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'additional'
  },
  {
    name: 'EICVHC25 - Anexo III Planificacion.pdf',
    docId: 'EICVHC25 - Anexo III Planificacion.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=gWYMQVAoRxVuSVOlJN7%2B995t4oG962BF/siPmu1/PpSPoV71716XBAYWKNj8DQPqUQVa4zi4E/0AgBrc5VM3OGQI1pQfuF2%2B5Hjks4Tj1RH6CYyL7SIrUOBFfNf52ZqA&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'additional'
  },
  {
    name: 'EICVHC25 - Cuestionario hogar.pdf',
    docId: 'EICVHC25 - Cuestionario hogar.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=sA4qdPwp/kZSfqtMSlvE0izV5av0utC7Kt9v6434wpQaWcAnSBgYw95ObaruEEqc9RiHV2xHTYYQ//M/OVp2anmiuBWq2gDesYu1Y1rJljcC1/zDIE0Kw/PWNnLS0Z0z&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'additional'
  },
  {
    name: 'EICVHC25 - Cuestionario individual.pdf',
    docId: 'EICVHC25 - Cuestionario individual.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=4PPqTsNaJx00bbGAqA8UV3IzB/tZ30LJm7dK5AkKWCsll3kikInRoVPVSZJOvfeXW/WYLhMjSiOsUKMZsRex3F3gCMu7xnt3an65hxPMS2WB0nvVKRzfe4rpHcnlPhSZ&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'additional'
  }
];

const licitation0 = new Licitation(baseLicObj);
const lots0 = [new Lot({ ...baseLot1Obj })];
const party0 = new Party({ ...basePartyObj });
const documents0 = baseDocsObj.map(
  (doc, index) => new Doc({ ...doc, licitationId: LICITATION_ID })
);
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
const prevDocuments2 = baseDocsObj.map(
  (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
);
const newDocuments2 = [
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-6e7e28da-36ea-4366-bab5-db8bb91edcc2',
    name: 'Documento de aprobación del expediente',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-6e7e28da-36ea-4366-bab5-db8bb91edcc2',
    type: "general",
  }),
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-8b688531-d02f-472a-ab3e-ae5ea2861d8e',
    name: 'Composición de la mesa de contratación',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-8b688531-d02f-472a-ab3e-ae5ea2861d8e',
    type: "general",
  }),
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-b82a6016-ce3a-4c69-b991-4fe710912d4f',
    name: 'Memoria justificativa',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-b82a6016-ce3a-4c69-b991-4fe710912d4f',
    type: "general",
  }),
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-c33fb4d8-b8ba-4d60-a18a-4aa0c63b6fb2',
    name: 'Ampliación de plazo',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-c33fb4d8-b8ba-4d60-a18a-4aa0c63b6fb2',
    type: "general",
  }),
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-92b208d0-0afa-4a7d-a3af-fe1ea7a69371',
    name: 'Acuerdo de iniciación del expediente',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-92b208d0-0afa-4a7d-a3af-fe1ea7a69371',
    type: "general",
  }),
];
const documents2 = baseDocsObj.map(
  (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
);
const events2 = [];

const licitation3 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  updated: new Date('2025-06-05T13:32:01.154+02:00'),
  end_date: '2025-06-12'
});
const lots3 = [new Lot({ ...baseLot1Obj, id: "1" })];
const party3 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation3.updated });
const prevDocuments3 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
];
const newDocuments3 = [
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-1cde745c-f586-4567-983e-701da3e1b83d',
    name: 'Comunicación Mesa de Contratación',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-1cde745c-f586-4567-983e-701da3e1b83d',
    type: "general",
  }),
];
const documents3 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
];
const events3 = [];

const licitation4 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'EV',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: EV",
  updated: new Date('2025-06-13T13:24:16.856+02:00'),
  end_date: '2025-06-12'
});
const lots4 = [new Lot({ ...baseLot1Obj, id: "1" })];
const party4 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation4.updated });
const prevDocuments4 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
];
const newDocuments4 = [
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-afb26e7c-6b7e-4524-bcee-5d0d320d37aa',
    name: 'Comunicación Mesa de Contratación',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-afb26e7c-6b7e-4524-bcee-5d0d320d37aa',
    type: "general",
  }),
];
const documents4 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
];
const events4 = [new Event({
  createdAt: new Date(licitation4.updated),
  type: EventType.LICITATION_FINISHED_SUBMISSION_PERIOD,
  licitationId: LICITATION_ID,
})];


const licitation5 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'EV',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: EV",
  updated: new Date('2025-06-19T15:43:28.963+02:00'),
  end_date: '2025-06-12'
});
const lots5 = [new Lot({ ...baseLot1Obj, id: "1" })];
const party5 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation5.updated });
const prevDocuments5 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
];
const newDocuments5 = [
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-77aeccac-dcad-4dbb-9a85-7812c9252839',
    name: 'Comunicación Mesa de Contratación',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-77aeccac-dcad-4dbb-9a85-7812c9252839',
    type: "general",
  }),
];
const documents5 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
];
const events5 = [];

const licitation6 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'EV',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: EV",
  updated: new Date('2025-07-09T08:27:37.660+02:00'),
  end_date: '2025-06-12'
});
const lots6 = [new Lot({ ...baseLot1Obj, id: "1" })];
const party6 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation6.updated });
const prevDocuments6 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
  ...newDocuments5.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length).toString(), ...doc })
  ),
];
const newDocuments6 = [
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-05fff47a-a7bc-4afc-ac10-20c5a6fb3baf',
    name: 'Comunicación Mesa de Contratación',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-05fff47a-a7bc-4afc-ac10-20c5a6fb3baf',
    type: "general",
  }),
];
const documents6 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
  ...newDocuments5.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length).toString(), ...doc })
  ),
];
const events6 = [];

const licitation7 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'EV',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: EV",
  updated: new Date('2025-07-11T10:31:31.356+02:00'),
  end_date: '2025-06-12'
});
const lots7 = [new Lot({ ...baseLot1Obj, id: "1" })];
const party7 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation7.updated });
const prevDocuments7 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
  ...newDocuments5.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length).toString(), ...doc })
  ),
  ...newDocuments6.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length).toString(), ...doc })
  ),
];
const newDocuments7 = [
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-fb46e6c6-0148-4428-a12e-a75425403327',
    name: 'Comunicación Mesa de Contratación',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-fb46e6c6-0148-4428-a12e-a75425403327',
    type: "general",
  }),
];
const documents7 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
  ...newDocuments5.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length).toString(), ...doc })
  ),
  ...newDocuments6.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length).toString(), ...doc })
  ),
];
const events7 = [];

const licitation8 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'ADJ',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: ADJ",
  updated: new Date('2025-07-18T13:25:26.131+02:00'),
  end_date: '2025-06-12',
  tender_result_code: 8,
  award_date: '2025-07-18',
  received_tender_quantity: 4,
  lower_tender_amount: 224002.34,
  higher_tender_amount: 260000,
  winning_nif: 'A38210100',
  winning_name: 'REDCA S.A.',
  winning_city: 'Las Palmas de Gran Canaria',
  winning_zip: '35007',
  winning_country: 'ES',
  award_tax_exclusive: 224002.34,
  award_payable_amount: 239682.5,
  lotsAdj: 1,
});
const lots8 = [new Lot({
  ...baseLot1Obj,
  id: "1",
  tender_result_code: 8,
  award_date: '2025-07-18',
  received_tender_quantity: 4,
  lower_tender_amount: 224002.34,
  higher_tender_amount: 260000,
  winning_nif: 'A38210100',
  winning_name: 'REDCA S.A.',
  winning_city: 'Las Palmas de Gran Canaria',
  winning_zip: '35007',
  winning_country: 'ES',
  award_tax_exclusive: 224002.34,
  award_payable_amount: 239682.5,
})];
const party8 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation8.updated });
const prevDocuments8 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
  ...newDocuments5.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length).toString(), ...doc })
  ),
  ...newDocuments6.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length).toString(), ...doc })
  ),
  ...newDocuments7.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length + newDocuments6.length).toString(), ...doc })
  ),
];
const newDocuments8 = [
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-450d97a2-19e1-4f75-a979-d8a323474af4',
    name: 'Acta del órgano de asistencia',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-450d97a2-19e1-4f75-a979-d8a323474af4',
    type: "general",
  }),
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-5fba3074-1bd8-49d8-8769-d76a32789832',
    name: 'Acta del órgano de asistencia',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-5fba3074-1bd8-49d8-8769-d76a32789832',
    type: "general",
  }),
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-6107677d-4e46-425c-b498-84649ca19633',
    name: 'Acta del órgano de asistencia',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-6107677d-4e46-425c-b498-84649ca19633',
    type: "general",
  }),
  new Doc({
    licitationId: LICITATION_ID,
    docId: '2025-6e544d96-a8ce-4f73-a7a8-601065fb89cb',
    name: 'Acta del órgano de asistencia',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-6e544d96-a8ce-4f73-a7a8-601065fb89cb',
    type: "general",
  }),
];
const documents8 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
  ...newDocuments5.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length).toString(), ...doc })
  ),
  ...newDocuments6.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length).toString(), ...doc })
  ),
  ...newDocuments7.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length + newDocuments6.length).toString(), ...doc })
  ),
];
const events8 = [
  new Event({
    createdAt: new Date('2025-07-18'),
    type: EventType.LICITATION_LOT_AWARDED,
    licitationId: LICITATION_ID,
    lotId: lots8[0].lot_id.toString(),
  }),
  new Event({
    createdAt: new Date('2025-07-18'),
    type: EventType.LICITATION_AWARDED,
    licitationId: LICITATION_ID,
  }),
];

const licitation9 = new Licitation({
  ...baseLicObj,
  id: LICITATION_ID,
  statusCode: 'RES',
  summary: "Id licitación: 2/2025; Órgano de Contratación: Director del Instituto Canario de Estadística (ISTAC); Importe: 261901.77 EUR; Estado: RES",
  updated: new Date('2025-08-16T09:58:08.174+02:00'),
  end_date: '2025-06-12',
  tender_result_code: 9,
  award_date: '2025-07-18',
  received_tender_quantity: 4,
  lower_tender_amount: 224002.34,
  higher_tender_amount: 260000,
  winning_nif: 'A38210100',
  winning_name: 'REDCA S.A.',
  winning_city: 'Las Palmas de Gran Canaria',
  winning_zip: '35007',
  winning_country: 'ES',
  award_tax_exclusive: 224002.34,
  award_payable_amount: 239682.5,
  lotsAdj: 1,
});
const lots9 = [new Lot({
  ...baseLot1Obj,
  id: "1",
  tender_result_code: 9,
  award_date: '2025-07-18',
  received_tender_quantity: 4,
  lower_tender_amount: 224002.34,
  higher_tender_amount: 260000,
  winning_nif: 'A38210100',
  winning_name: 'REDCA S.A.',
  winning_city: 'Las Palmas de Gran Canaria',
  winning_zip: '35007',
  winning_country: 'ES',
  award_tax_exclusive: 224002.34,
  award_payable_amount: 239682.5,
})];
const party9 = new Party({ ...basePartyObj, id: PARTY_ID, updated: licitation9.updated });
const prevDocuments9 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
  ...newDocuments5.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length).toString(), ...doc })
  ),
  ...newDocuments6.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length).toString(), ...doc })
  ),
  ...newDocuments7.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length + newDocuments6.length).toString(), ...doc })
  ),
  ...newDocuments8.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length + newDocuments6.length + newDocuments7.length).toString(), ...doc })
  ),
];
const newDocuments9 = [];
const documents9 = [
  ...baseDocsObj.map(
    (doc, index) => new Doc({ id: index.toString(), ...doc, licitationId: LICITATION_ID })
  ),
  ...newDocuments2.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length).toString(), ...doc })
  ),
  ...newDocuments3.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length).toString(), ...doc })
  ),
  ...newDocuments4.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length).toString(), ...doc })
  ),
  ...newDocuments5.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length).toString(), ...doc })
  ),
  ...newDocuments6.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length).toString(), ...doc })
  ),
  ...newDocuments7.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length + newDocuments6.length).toString(), ...doc })
  ),
  ...newDocuments8.map(
    (doc, index) => new Doc({ id: (index + baseDocsObj.length + newDocuments2.length + newDocuments3.length + newDocuments4.length + newDocuments5.length + newDocuments6.length + newDocuments7.length).toString(), ...doc })
  ),
];
const events9 = [
  new Event({
    createdAt: licitation9.updated,
    type: EventType.LICITATION_RESOLVED,
    licitationId: LICITATION_ID,
  }),
];

describe('Resolved with no lots', () => {
  testNewLicitation(
    'Published',
    `${BASE_PATH}/version1.atom`,
    licitation0,
    lots0,
    party0,
    events0,
    LAST_CURSOR_DATE,
    CPVS,
    documents0,
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
    prevDocuments2,
    newDocuments2,
    documents2,
  );
  testLicitationUpdate(
    'Published, new document',
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
    prevDocuments3,
    newDocuments3,
    documents3,
  );
  testLicitationUpdate(
    'Finished submission period, now in Evaluation state',
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
    prevDocuments4,
    newDocuments4,
    documents4,
  );
  testLicitationUpdate(
    'In evaluation state, new Document',
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
    prevDocuments5,
    newDocuments5,
    documents5,
  );
  testLicitationUpdate(
    'In evaluation state, another Document',
    `${BASE_PATH}/version7.atom`,
    licitation5,
    lots5,
    party5,
    licitation6,
    lots6,
    party6,
    events6,
    LAST_CURSOR_DATE,
    CPVS,
    prevDocuments6,
    newDocuments6,
    documents6,
  );
  testLicitationUpdate(
    'In evaluation state, another Document x2',
    `${BASE_PATH}/version8.atom`,
    licitation6,
    lots6,
    party6,
    licitation7,
    lots7,
    party7,
    events7,
    LAST_CURSOR_DATE,
    CPVS,
    prevDocuments7,
    newDocuments7,
    documents7,
  );
  testLicitationUpdate(
    'Licitation awarded',
    `${BASE_PATH}/version9.atom`,
    licitation7,
    lots7,
    party7,
    licitation8,
    lots8,
    party8,
    events8,
    LAST_CURSOR_DATE,
    CPVS,
    prevDocuments8,
    newDocuments8,
    documents8,
  );
  testLicitationUpdate(
    'Licitation awarded',
    `${BASE_PATH}/version10.atom`,
    licitation8,
    lots8,
    party8,
    licitation9,
    lots9,
    party9,
    events9,
    LAST_CURSOR_DATE,
    CPVS,
    prevDocuments9,
    newDocuments9,
    documents9,
  );
});
