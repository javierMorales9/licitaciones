package internal

import (
	"bufio"
	"encoding/csv"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ===== Tiempo =====

type RFC3339Time struct{ time.Time }

func (t *RFC3339Time) UnmarshalText(b []byte) error {
	if tt, err := time.Parse(time.RFC3339Nano, strings.TrimSpace(string(b))); err == nil {
		t.Time = tt
		return nil
	}
	tt, err := time.Parse(time.RFC3339, strings.TrimSpace(string(b)))
	if err != nil {
		return err
	}
	t.Time = tt
	return nil
}

// Fecha AAAA-MM-DD (sin zona)
var reYMD = regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})`)

type DateYMD struct {
	time.Time
	Valid bool   // true si se pudo parsear
	Raw   string // valor original por trazabilidad
}

func (d *DateYMD) UnmarshalText(b []byte) error {
	s := strings.TrimSpace(string(b))
	d.Raw = s
	if s == "" {
		d.Valid = false
		d.Time = time.Time{}
		return nil
	}

	layouts := []string{
		"2006-01-02",       // fecha “pura”
		"2006-01-02Z07:00", // xsd:date con zona (Z o ±HH:MM), p.ej. 2024-10-07Z
		time.RFC3339,       // por si algún productor mete datetime completo
		"2006-01-02T15:04:05",
	}

	for _, ly := range layouts {
		if t, err := time.Parse(ly, s); err == nil {
			d.Time = t.UTC()
			d.Valid = true
			return nil
		}
	}

	// Fallback: extraer el prefijo YYYY-MM-DD e ignorar la cola (Z/offset basura)
	if m := reYMD.FindStringSubmatch(s); len(m) == 2 {
		if t, err := time.Parse("2006-01-02", m[1]); err == nil {
			d.Time = t.UTC()
			d.Valid = true
			return nil
		}
	}

	// No tumbar la ingesta: marca inválido y sigue.
	fmt.Printf("WARN DateYMD: no se pudo parsear %q; se deja en cero", s)
	d.Valid = false
	d.Time = time.Time{}
	return nil
}

// ===== Modelos de Feed y Tombstones =====

type Feed struct {
	Links    []Link      `xml:"link"`
	Updated  RFC3339Time `xml:"updated"`
	TombList []Tombstone `xml:"deleted-entry"` // at:deleted-entry
	Entries  []Entry     `xml:"entry"`
}

type Link struct {
	Rel  string `xml:"rel,attr"`
	Href string `xml:"href,attr"`
}

type Tombstone struct {
	When RFC3339Time `xml:"when,attr"`
	Ref  string      `xml:"ref,attr"`
	Type string      `xml:"-"` // at:comment@type
}

func (t *Tombstone) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	var aux struct {
		When        RFC3339Time `xml:"when,attr"`
		Ref         string      `xml:"ref,attr"`
		CommentType struct {
			Type string `xml:"type,attr"`
		} `xml:"comment"`
	}
	if err := d.DecodeElement(&aux, &start); err != nil {
		return err
	}
	t.When = aux.When
	t.Ref = aux.Ref
	t.Type = aux.CommentType.Type // ANULADA / CERRADA (según PLACSP)
	return nil
}

// ===== Types reutilizables (códigos, importes) =====

type Code struct {
	Value     string `xml:",chardata"`
	ListURI   string `xml:"listURI,attr,omitempty"`
	Name      string `xml:"name,attr,omitempty"`
	Scheme    string `xml:"schemeName,attr,omitempty"`
	Lang      string `xml:"languageID,attr,omitempty"`
	ListVerID string `xml:"listVersionID,attr,omitempty"`
}

type Amount struct {
	Currency string  `xml:"currencyID,attr"`
	Value    float64 `xml:"-"`
	Raw      string  `xml:",chardata"`
}

func (a *Amount) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	// Auxiliar para evitar recursión
	var aux struct {
		Currency string `xml:"currencyID,attr"`
		Raw      string `xml:",chardata"`
	}

	if err := d.DecodeElement(&aux, &start); err != nil {
		return err
	}

	a.Currency = aux.Currency
	a.Raw = strings.TrimSpace(aux.Raw)

	if a.Raw != "" {
		r := strings.ReplaceAll(a.Raw, ",", ".")
		if v, err := strconv.ParseFloat(r, 64); err == nil {
			a.Value = v
		}
	}
	return nil
}

// ===== ENTRY =====

type Entry struct {
	ID      string        `xml:"id"`
	Title   string        `xml:"title"`
	Summary string        `xml:"summary"`
	Updated RFC3339Time   `xml:"updated"`
	Links   []Link        `xml:"link"`
	CFS     ContractState `xml:"ContractFolderStatus"` // cac-place-ext:ContractFolderStatus
}

// ===== ContractFolderStatus (núcleo CODICE) =====

type ContractState struct {
	ContractFolderID string           `xml:"ContractFolderID"`         // expediente
	StatusCode       Code             `xml:"ContractFolderStatusCode"` // estado (p.ej. ENP, ADJ…)
	LocatedParty     LocatedParty     `xml:"LocatedContractingParty"`  // órgano
	Project          ProcurementProj  `xml:"ProcurementProject"`       // CPV, importes, NUTS…
	Result           *TenderResult    `xml:"TenderResult"`             // adjudicación (si existe)
	Terms            *TenderingTerms  `xml:"TenderingTerms"`           // idioma, criterios, etc.
	Process          TenderingProcess `xml:"TenderingProcess"`         // procedimiento, plazo ofertas
	// Documentación y anuncios
	LegalDocs     []DocRef        `xml:"LegalDocumentReference"`     // PCAP, etc.
	TechnicalDocs []DocRef        `xml:"TechnicalDocumentReference"` // PPT, etc.
	Notices       []ValidNotice   `xml:"ValidNoticeInfo"`
	GeneralDocs   []GeneralDocRef `xml:"GeneralDocument"`
}

// Órgano de contratación y contacto
type LocatedParty struct {
	ContractingPartyType Code   `xml:"ContractingPartyTypeCode"`
	ActivityCodes        []Code `xml:"ActivityCode"`
	BuyerProfileURIID    string `xml:"BuyerProfileURIID"`
	Party                Party  `xml:"Party"`
	// Se omite recursividad ParentLocatedParty por brevedad; puede añadirse si se requiere.
}

type Party struct {
	WebsiteURI      string                `xml:"WebsiteURI"`
	Identifications []PartyIdentification `xml:"PartyIdentification"`
	PartyName       struct {
		Name string `xml:"Name"`
	} `xml:"PartyName"`
	PostalAddress *Address `xml:"PostalAddress"`
	Contact       *Contact `xml:"Contact"`
}

type PartyIdentification struct {
	ID struct {
		Value string `xml:",chardata"`
		// schemeName=DIR3|NIF|ID_PLATAFORMA…
		SchemeName string `xml:"schemeName,attr"`
	} `xml:"ID"`
}

type Address struct {
	City       string `xml:"CityName"`
	PostalZone string `xml:"PostalZone"`
	Line       string `xml:"AddressLine>Line"`
	Country    struct {
		Code Code   `xml:"IdentificationCode"`
		Name string `xml:"Name"`
	} `xml:"Country"`
}

type Contact struct {
	Name  string `xml:"Name"`
	Phone string `xml:"Telephone"`
	Mail  string `xml:"ElectronicMail"`
}

// Proyecto de contratación (CPV, importes, NUTS, duración…)
type ProcurementProj struct {
	Name        string             `xml:"Name"`
	TypeCode    Code               `xml:"TypeCode"`    // tipo de contrato
	SubTypeCode Code               `xml:"SubTypeCode"` // sub-tipo (servicios, etc.)
	Mixed       string             `xml:"MixContractIndicator"`
	Budget      *Budget            `xml:"BudgetAmount"`
	Commodity   []Commodity        `xml:"RequiredCommodityClassification"`
	Location    *RealizedLoc       `xml:"RealizedLocation"`
	Planned     *PlannedPeriod     `xml:"PlannedPeriod"`
	Extension   *ContractExtension `xml:"ContractExtension"`
}

type Budget struct {
	EstimatedOverall Amount `xml:"EstimatedOverallContractAmount"`
	TotalAmount      Amount `xml:"TotalAmount"`
	TaxExclusive     Amount `xml:"TaxExclusiveAmount"`
}

type Commodity struct {
	CPV Code `xml:"ItemClassificationCode"` // CPV
}

type RealizedLoc struct {
	NUTS Code `xml:"CountrySubentityCode"` // NUTS
	Addr struct {
		Country struct {
			Code Code   `xml:"IdentificationCode"`
			Name string `xml:"Name"`
		} `xml:"Country"`
	} `xml:"Address"`
}

type PlannedPeriod struct {
	Duration struct {
		Value    int    `xml:",chardata"`
		UnitCode string `xml:"unitCode,attr"` // DAY|MON|ANN
	} `xml:"DurationMeasure"`
}

type ContractExtension struct {
	OptionValidityPeriod *struct {
		// Suele venir solo la descripción ("Sí se prevé, por un plazo máximo de 12 meses")
		Description string `xml:"Description"`

		// Algunos perfiles pueden usar fechas o duración; se dejan opcionales
		StartDate *DateYMD `xml:"StartDate"`
		EndDate   *DateYMD `xml:"EndDate"`
		Duration  *struct {
			Value    int    `xml:",chardata"`
			UnitCode string `xml:"unitCode,attr"` // DAY|MON|ANN
		} `xml:"DurationMeasure"`
	} `xml:"OptionValidityPeriod"`
}

// Adjudicación
type TenderResult struct {
	ResultCode Code           `xml:"ResultCode"`
	AwardDate  DateYMD        `xml:"AwardDate"`
	Winning    []WinningParty `xml:"WinningParty"`
	Awarded    *AwardedProj   `xml:"AwardedTenderedProject"`
}

type WinningParty struct {
	Identification []PartyIdentification `xml:"PartyIdentification"`
	PartyName      struct {
		Name string `xml:"Name"`
	} `xml:"PartyName"`
	PhysicalLoc struct {
		NUTS Code `xml:"CountrySubentityCode"`
	} `xml:"PhysicalLocation"`
}

type AwardedProj struct {
	LegalMonetaryTotal struct {
		TaxExclusive Amount `xml:"TaxExclusiveAmount"`
		Payable      Amount `xml:"PayableAmount"`
	} `xml:"LegalMonetaryTotal"`
}

// Términos/criterios/idioma
type TenderingTerms struct {
	Language struct {
		ID string `xml:"ID"`
	} `xml:"Language"`
}

// Proceso (procedimiento, urgencia, sistema, presentación, plazos…)
type TenderingProcess struct {
	ProcedureCode      Code   `xml:"ProcedureCode"`
	UrgencyCode        Code   `xml:"UrgencyCode"`
	ContractingSysCode Code   `xml:"ContractingSystemCode"`
	SubmissionMethod   Code   `xml:"SubmissionMethodCode"`
	OverThreshold      string `xml:"OverThresholdIndicator"`
	SubmissionDeadline struct {
		EndDate DateYMD `xml:"EndDate"`
		EndTime string  `xml:"EndTime"`
		Desc    string  `xml:"Description"`
	} `xml:"TenderSubmissionDeadlinePeriod"`
}

// Documentos
type DocRef struct {
	ID         string `xml:"ID"`
	Attachment struct {
		ExternalReference struct {
			URI          string `xml:"URI"`
			FileName     string `xml:"FileName"`
			DocumentHash string `xml:"DocumentHash"`
		} `xml:"ExternalReference"`
	} `xml:"Attachment"`
}

type GeneralDocRef struct {
	Ref DocRef `xml:"GeneralDocumentDocumentReference"`
}

type ValidNotice struct {
	NoticeType Code `xml:"NoticeTypeCode"`
	Status     struct {
		MediaName string `xml:"PublicationMediaName"`
		DocRef    struct {
			IssueDate DateYMD `xml:"IssueDate"`
		} `xml:"AdditionalPublicationDocumentReference"`
	} `xml:"AdditionalPublicationStatus"`
}

// ---------- Output row ----------
type OrgHydroRow struct {
	Dir3           string
	NIF            string
	OrgName        string
	ProfileUrl     string
	Email          string
	Phone          string
	AddressLine    string
	PostalCode     string
	City           string
	Country        string
	LastActionDate time.Time
	LastTenderURL  string
	TendersCount   int
}

type OrgAgg struct {
	byKey map[string]*OrgHydroRow // key = dir3|normalizedName
}

func NewOrgAgg() *OrgAgg {
	return &OrgAgg{byKey: make(map[string]*OrgHydroRow)}
}

func (a *OrgAgg) keyFor(dir3, name string) string {
	if dir3 != "" {
		return "DIR3:" + strings.ToUpper(strings.TrimSpace(dir3))
	}
	// Fallback por nombre si no hay DIR3
	n := strings.ToUpper(strings.Join(strings.Fields(name), " "))
	return "NAME:" + n
}

var HydrocarbonCPVPrefixes = []string{"0911", "0912", "0913"}

func isHydroCPV(cpv string) bool {
	c := strings.TrimSpace(cpv)
	c = strings.ReplaceAll(c, "-", "") // "09120000-6" -> "091200006"
	for _, p := range HydrocarbonCPVPrefixes {
		if strings.HasPrefix(c, p) {
			return true
		}
	}
	return false
}

func (a *OrgAgg) ingestEntry(e Entry) {
	// 1) Extraer CPVs y filtrar por hidrocarburos
	var hasHydro bool
	for _, c := range e.CFS.Project.Commodity {
		if isHydroCPV(c.CPV.Value) {
			hasHydro = true
			break
		}
	}
	if !hasHydro {
		return
	}

	orgName := e.CFS.LocatedParty.Party.PartyName.Name
	profileUrl := e.CFS.LocatedParty.BuyerProfileURIID
	dir3 := ""
	nif := ""
	for _, pid := range e.CFS.LocatedParty.Party.Identifications {
		if strings.EqualFold(pid.ID.SchemeName, "DIR3") {
			dir3 = pid.ID.Value
		} else if strings.EqualFold(pid.ID.SchemeName, "NIF") {
			nif = pid.ID.Value
		}
	}

	fields := e.CFS.LocatedParty.Party.PostalAddress

	email := e.CFS.LocatedParty.Party.Contact.Mail
	phone := e.CFS.LocatedParty.Party.Contact.Phone

	lastActionDate := e.Updated.Time
	lastTenderUrl := e.Links[0].Href

	key := a.keyFor(dir3, orgName)
	row, ok := a.byKey[key]
	if !ok {
		row = &OrgHydroRow{
			Dir3:           dir3,
			NIF:            nif,
			OrgName:        orgName,
			ProfileUrl:     profileUrl,
			Email:          email,
			Phone:          phone,
			AddressLine:    fields.Line,
			PostalCode:     fields.PostalZone,
			City:           fields.City,
			Country:        fields.Country.Code.Value,
			LastActionDate: lastActionDate,
			LastTenderURL:  lastTenderUrl,
			TendersCount:   1,
		}
		a.byKey[key] = row
		return
	}

	row.TendersCount++

	if lastActionDate.After(row.LastActionDate) {
		row.LastActionDate = lastActionDate
		row.LastTenderURL = lastTenderUrl
		row.Email = email
		row.Phone = phone
		row.AddressLine = fields.Line
		row.PostalCode = fields.PostalZone
		row.City = fields.City
		row.Country = fields.Country.Code.Value
		row.NIF = nif
		return
	}

	// Rellenar si antes estaban vacíos
	if row.Email == "" && email != "" {
		row.Email = email
	}
	if row.Phone == "" && phone != "" {
		row.Phone = phone
	}
	if row.AddressLine == "" && fields.Line != "" {
		row.AddressLine = fields.Line
	}
	if row.PostalCode == "" && fields.PostalZone != "" {
		row.PostalCode = fields.PostalZone
	}
	if row.City == "" && fields.City != "" {
		row.City = fields.City
	}
	if row.Country == "" && fields.Country.Code.Value != "" {
		row.Country = fields.Country.Code.Value
	}
	if row.NIF == "" && nif != "" {
		row.NIF = nif
	}
}

func (a *OrgAgg) rowsSorted() []OrgHydroRow {
	out := make([]OrgHydroRow, 0, len(a.byKey))
	for _, r := range a.byKey {
		out = append(out, *r)
	}
	// Ordenar por fecha desc y nombre
	sort.Slice(out, func(i, j int) bool {
		if out[i].LastActionDate.Equal(out[j].LastActionDate) {
			return out[i].OrgName < out[j].OrgName
		}
		return out[i].LastActionDate.After(out[j].LastActionDate)
	})
	return out
}

func (a *OrgAgg) writeCSV(filename string) error {
	if err := os.MkdirAll(filepath.Dir(filename), 0o755); err != nil {
		return err
	}
	f, err := os.Create(".\\" + filename + ".tmp")
	if err != nil {
		return err
	}
	defer f.Close()

	w := csv.NewWriter(f)
	defer w.Flush()

	_ = w.Write([]string{
		"Organismo", "NIF", "Url perfil", "Email", "Teléfono",
		"Dirección",
		"Fecha última licitación", "Url última licitación", "nº licitaciones",
	})

	for _, r := range a.rowsSorted() {
		_ = w.Write([]string{
			r.OrgName,
			r.ProfileUrl,
			r.Email,
			r.Phone,
			fmt.Sprintf("%s %s, %s %s", r.AddressLine, r.PostalCode, r.City, r.Country),
			r.LastActionDate.Format(time.RFC3339),
			r.LastTenderURL,
			intToString(r.TendersCount),
			r.Dir3,
			r.NIF,
		})
	}
	w.Flush()
	if err := w.Error(); err != nil {
		return err
	}
	// Publicación atómica
	return os.Rename(".\\"+filename+".tmp", ".\\"+filename)
}

func listLocalAtoms(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	type item struct {
		path string
		ts   string
	}
	var xs []item
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if strings.HasPrefix(name, "licitacionesPerfilesContratanteCompleto3_") &&
			strings.HasSuffix(name, ".atom") {
			// Soporta sufijos tipo “…_1.atom”
			base := strings.TrimSuffix(name, ".atom")
			parts := strings.Split(base, "_")
			if len(parts) >= 3 {
				ts := parts[1] + "_" + parts[2] // 20250814_175901
				xs = append(xs, item{path: filepath.Join(dir, name), ts: ts})
			}
		}
	}
	sort.Slice(xs, func(i, j int) bool { return xs[i].ts > xs[j].ts })
	out := make([]string, len(xs))
	for i := range xs {
		out[i] = xs[i].path
	}
	return out, nil
}

func intToString(n int) string        { return strconvFormatInt(int64(n)) }
func strconvFormatInt(n int64) string { return strconv.FormatInt(n, 10) }

func ParseAtom(dir string) error {
	startTime := time.Now()

	files, err := listLocalAtoms(dir)
	if err != nil {
		return err
	}

	workers := 8
	fileCh := make(chan string, workers*2)
	agg := NewOrgAgg()

	var wg sync.WaitGroup
	wg.Add(workers)
	for w := 0; w < workers; w++ {
		go func() {
			defer wg.Done()

			dec := xml.NewDecoder(nil) // se reasigna por archivo
			for path := range fileCh {
				pathStart := time.Now()

				f, err := os.Open(path)
				if err != nil {
					log.Printf("[WARN] %v", err)
				}

				dec = xml.NewDecoder(bufio.NewReaderSize(f, 256<<10))
				for {
					tok, err := dec.Token()

					if err == io.EOF {
						break
					}

					if err != nil {
						log.Printf("[XML] %s %v", path, err)
						break
					}

					if se, ok := tok.(xml.StartElement); ok && se.Name.Local == "entry" {
						var e Entry
						if err := dec.DecodeElement(&e, &se); err == nil {
							agg.ingestEntry(e)
						}
					}
				}

				_ = f.Close()
				log.Printf("Took %s to process %s", time.Since(pathStart), path)
			}
		}()
	}

	for _, f := range files {
		fileCh <- f
	}
	close(fileCh)
	wg.Wait()

	elapsed := time.Since(startTime)
	log.Printf("[done] Total: %d organismos únicos, tiempo: %s",
		len(agg.byKey), elapsed)
	agg.writeCSV("dondesea.csv")

	return nil
}
