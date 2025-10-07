import { describe } from "@jest/globals"
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { Event, EventType } from "../../domain/Event.js";
import { testLicitationUpdate, testNewLicitation } from "../utils.js";
import { Doc } from "../../domain/Doc.js";

const CPVS = ["72212220"];
const BASE_PATH = 'src/tests/inEvaluationThatWasNotInTheDB';
const LAST_CURSOR_DATE = new Date('2025-08-17');
const LICITATION_ID = "1234";
const PARTY_ID = "1234";

const baseLicObj = {
  entry_id: 'https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17442349',
  partyId: PARTY_ID,
  statusCode: 'EV',
  publishedDate: '2025-06-09',
  updated: new Date('2025-08-18T14:41:53.672Z'),
  title: 'Servicio de análisis, implementación y mantenimiento de la intranet corporativa en Sociedad Aragonesa de Gestión Agroambiental, S.L.U (SARGA)',
  summary: 'Id licitación: 2025/A-SE-0161; Órgano de Contratación: Sociedad Aragonesa de Gestión Agroambiental, S.L.U. (SARGA); Importe: 97600 EUR; Estado: EV',
  platform_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=ayNH9B8s0k9eKgd8LfVV9g%3D%3D',
  type_code: 2,
  subtype_code: 27,
  estimated_overall_cost: 109720,
  cost_with_taxes: 118096,
  cost_without_taxes: 97600,
  cpvs: ['72212220'],
  place: undefined,
  realized_city: undefined,
  realized_zip: '',
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
  end_date: '2025-07-01',
  end_hour: '12:00:00',
};

const basePartyObj = {
  id: undefined,
  nif: 'B99354607',
  updated: new Date('2025-08-18T14:41:53.672Z'),
  profile_url: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:perfilContratante&idBp=rMcZ3VHNz28QK2TEfXGy%2BA%3D%3D',
  website: undefined,
  dir3: 'A02022452',
  name: 'Sociedad Aragonesa de Gestión Agroambiental, S.L.U. (SARGA)',
  address: 'Avda. Ranillas, Edificio A 3ª planta',
  zip: '50018',
  city: 'Zaragoza',
  countryCode: 'ES',
  country: 'España',
  phone: '976070000',
  email: 'contratacion@sarga.es',
};

const baseLot1Obj = {
  id: undefined,
  lot_id: '0',
  ext_id: '0_https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17442349',
  name: 'Servicio de análisis, implementación y mantenimiento de la intranet corporativa en Sociedad Aragonesa de Gestión Agroambiental, S.L.U (SARGA)',
  licitationId: LICITATION_ID,
  cost_with_taxes: 118096,
  cost_without_taxes: 97600,
  type_code: 2,
  subtype_code: 27,
  estimated_overall_cost: 109720,
  cpvs: ['72212220'],
  place: undefined,
  realized_city: undefined,
  realized_zip: '',
  realized_country: 'ES',
  estimated_duration: '2 ANN',
};

const baseDocuments = [
  {
    docId: '1042790-PliegodeClusulasAdmin-001001PCA_STD_CA.pdf',
    name: '1042790-PliegodeClusulasAdmin-001001PCA_STD_CA.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=qM41I9dAPCC4Cthoz%2Bi12d//5s8AToYfE4JXUB8pEnQfDjs%2BWnbwpTVtMuYLZKShwsklvgRQT3uuzdx2pfou4jHf/l5LRJBq%2Bgf/u3kbuR/3GVhXrFFqN7yFncy7YfRK&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'legal'
  },
  {
    docId: '1042632-PliegodePrescripcione-001001PPT_STD_CA.pdf',
    name: '1042632-PliegodePrescripcione-001001PPT_STD_CA.pdf',
    url: 'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=597NKPOLgZL4Dggid%2BBZ9/YNWXGcMP5CaNU2x3%2BS/fqzqsqgEc3TzRk5Qzk7yDzSRxsB5JJKeomxTvQBY42LAI7aCxfMKUxHMAElGAk0Qpa1aXEvq3KHa/AEHgtDrQw0&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D',
    type: 'technical'
  },
  {
    docId: '2025-e77e8841-48ca-42b9-866f-e7dfc3398b28',
    name: 'Informe Técnico de Valoración Evaluación previa (002001ITVCS_STD_CA.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-e77e8841-48ca-42b9-866f-e7dfc3398b28',
    type: 'general'
  },
  {
    docId: '2025-12cc5df8-c78d-4dd5-8284-ad4b90527c9e',
    name: 'Acta de Mesa de Contratación/Acuerdo del Órgano de Contratación (001001AMC_STD_CA.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-12cc5df8-c78d-4dd5-8284-ad4b90527c9e',
    type: 'general'
  },
  {
    docId: '2025-381a4c9d-8460-4057-9d04-9b035f7daa9f',
    name: 'Anexo Informe valoración documentación administrativa (001001AIVA_CA.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-381a4c9d-8460-4057-9d04-9b035f7daa9f',
    type: 'general'
  },
  {
    docId: '2025-5ac25885-dbeb-44f4-8a10-48bee5133822',
    name: 'Declaración Responsable Única (DRU) (Declaración_Responsable_Unica.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-5ac25885-dbeb-44f4-8a10-48bee5133822',
    type: 'general'
  },
  {
    docId: '2025-d68eb2da-d1d8-490b-a8d7-f0346bf1cebe',
    name: 'Informe Sobre Documentación Administrativa (001001ISDA_CA.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-d68eb2da-d1d8-490b-a8d7-f0346bf1cebe',
    type: 'general'
  },
  {
    docId: '2025-0d936faa-b2e0-4aa2-a913-b1590eb4e742',
    name: 'Acuerdo de Aprobación del Expediente y gasto (2025_A_SE_0161_acuerdo_aprob_expediente_firmado.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-0d936faa-b2e0-4aa2-a913-b1590eb4e742',
    type: 'general'
  },
  {
    docId: '2025-d900fda9-bddf-48b9-8161-82d275b95379',
    name: 'Acta de Mesa de Contratación/Acuerdo del Órgano de Contratación (001001AMC_STD_CA.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-d900fda9-bddf-48b9-8161-82d275b95379',
    type: 'general'
  },
  {
    docId: '2025-68fafe8e-6ae8-411e-83ef-8c91ac79182b',
    name: 'Informe Técnico de Valoración Evaluación previa (Informe_tec_Valoración_Sobre B.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-68fafe8e-6ae8-411e-83ef-8c91ac79182b',
    type: 'general'
  },
  {
    docId: '2025-41e032b2-8871-448d-a098-a8bd3c2f3ea5',
    name: 'Nota corrección errores PPT (nota_corrección_errores_firmada.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-41e032b2-8871-448d-a098-a8bd3c2f3ea5',
    type: 'general'
  },
  {
    docId: '2025-69a6dccc-d5ea-4e61-9ed6-24a70bfdf346',
    name: 'Memoria Justificativa (001001MJE_CA.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-69a6dccc-d5ea-4e61-9ed6-24a70bfdf346',
    type: 'general'
  },
  {
    docId: '2025-5b3246ab-e742-4938-8ad8-2d64e35feac1',
    name: 'Evento apertura sobre C_Suspensión (evento_apertura_sobre_C_suspension.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-5b3246ab-e742-4938-8ad8-2d64e35feac1',
    type: 'general'
  },
  {
    docId: '2025-eaace51a-a3d7-46fc-aeb7-861f62033988',
    name: 'Anexo Pliegos Administrativos 2 (Anexo VII_Modelo_oferta_económica.doc)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-eaace51a-a3d7-46fc-aeb7-861f62033988',
    type: 'general'
  },
  {
    docId: '2025-f0090bb7-1cfe-4ab9-9aed-1654a38846b0',
    name: 'Anexo Pliegos Administrativos 1 (Guia Licitacion Electronica.pdf)',
    url: 'https://contrataciondelestado.es/wps/wcm/connect/PLACE_es/Site/area/docAccCmpnt?srv=cmpnt&cmpntname=GetDocumentsById&source=library&DocumentIdParam=2025-f0090bb7-1cfe-4ab9-9aed-1654a38846b0',
    type: 'general'
  }
];

const licitation0 = new Licitation(baseLicObj);
const lots0 = [new Lot({ ...baseLot1Obj })];
const party0 = new Party({ ...basePartyObj });
const expectedDocs0 = baseDocuments.map(el => new Doc({ ...el, licitationId: LICITATION_ID }));
const events0 = [
  new Event({
    createdAt: new Date(licitation0.updated),
    type: EventType.LICITATION_FINISHED_SUBMISSION_PERIOD,
    licitationId: LICITATION_ID,
  }),
];

describe('In evaluation that was not in the DB', () => {
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
