import { TestCursorRepository } from "../infra/TestCursorRepository.js";
import { TestDocRepository } from "../infra/TestDocRepository.js";
import { TestEventRepository } from "../infra/TestEventRepository.js";
import { TestLicitationRepository } from "../infra/TestLicitationRepository.js";
import { TestLotsRepository } from "../infra/TestLotsRepository.js";
import { TestPartyRepository } from "../infra/TestPartyRepository.js";
import { start } from "../../cronJob.js";
import { describe, test } from "@jest/globals"
import { TestAtomFetcher } from "../infra/TestAtomFetcher.js";
import fs from "fs";
import { testLogger } from "../testLogger.js";
import { Licitation } from "../../domain/Licitation.js";
import { Party } from "../../domain/Party.js";
import { Lot } from "../../domain/Lot.js";
import { compareEvents, compareLicitation, compareLots, compareParty } from "../compareFunctions.js";
import { Event, EventType } from "../../domain/Event.js";

const BASE_FEED_URL = "https://www.test_feed.com";
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

describe('Resolved with no lots', () => {
  test('Published', async () => {
    const cursorRepo = new TestCursorRepository(LAST_CURSOR_DATE);
    const licitationsRepo = new TestLicitationRepository(null);
    const lotsRepo = new TestLotsRepository([]);
    const partyRepo = new TestPartyRepository(null);
    const docRepo = new TestDocRepository([]);
    const eventRepo = new TestEventRepository();
    const atomFetcher = new TestAtomFetcher(fs.readFileSync("src/tests/resolvedWithNoLots/first.atom").toString());

    await start(
      BASE_FEED_URL,
      CPVS,
      cursorRepo,
      licitationsRepo,
      lotsRepo,
      partyRepo,
      docRepo,
      eventRepo,
      atomFetcher,
      testLogger,
    );

    compareLicitation(licitationsRepo.getCreateArgs(), licitation0);
    compareLots(lotsRepo.getCreateArgs(), lots0);
    compareParty(partyRepo.getCreateArgs(), party0);
    compareEvents(eventRepo.getAddArgs(), events0);
  });
  test('Published, end date updated', async () => {
    const cursorRepo = new TestCursorRepository(LAST_CURSOR_DATE);
    const licitationsRepo = new TestLicitationRepository(licitation1);
    const lotsRepo = new TestLotsRepository(lots1);
    const partyRepo = new TestPartyRepository(party1);
    const docRepo = new TestDocRepository([]);
    const eventRepo = new TestEventRepository();
    const atomFetcher = new TestAtomFetcher(fs.readFileSync("src/tests/resolvedWithNoLots/second.atom").toString());

    await start(
      BASE_FEED_URL,
      CPVS,
      cursorRepo,
      licitationsRepo,
      lotsRepo,
      partyRepo,
      docRepo,
      eventRepo,
      atomFetcher,
      testLogger,
    );

    compareLicitation(licitationsRepo.getSaveArgs(), licitation2);
    compareLots(lotsRepo.getSaveArgs(), lots2);
    compareParty(partyRepo.getSaveArgs(), party2);
    compareEvents(eventRepo.getAddArgs(), events2);
  });
});
