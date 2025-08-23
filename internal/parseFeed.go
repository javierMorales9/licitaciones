package internal

import (
	"encoding/xml"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"
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

// Date Format: AAAA-MM-DD (no zone)
var reYMD = regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})`)

type DateYMD struct {
	time.Time
	Valid bool   // true if could be parsed
	Raw   string // original value
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
	fmt.Printf("[WARN] DateYMD: could not be parsed %q", s)
	d.Valid = false
	d.Time = time.Time{}
	return nil
}

// ===== Modelos de Feed y Tombstones =====

type Feed struct {
	Self     string
	First    string
	Prev     string
	Next     string
	Updated  RFC3339Time `xml:"updated"`
	TombList []Tombstone `xml:"deleted-entry"` // at:deleted-entry
	Entries  []Entry     `xml:"entry"`
}

func (f *Feed) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	f.TombList = make([]Tombstone, 0)
	f.Entries = make([]Entry, 0)

	for {
		t, err := d.Token()
		if err == io.EOF {
			break
		}

		if err != nil {
			break
		}

		se, ok := t.(xml.StartElement)
		if !ok {
			continue
		}

		switch se.Name.Local {
		case "link":
			var l Link
			if err := d.DecodeElement(&l, &se); err == nil {
				switch l.Rel {
				case "self":
					f.Self = l.Href
				case "first":
					f.First = l.Href
				case "prev":
					f.Prev = l.Href
				case "next":
					f.Next = l.Href
				}
			}
		case "entry":
			var e Entry
			if err := d.DecodeElement(&e, &se); err == nil {
				f.Entries = append(f.Entries, e)
			}
		case "deleted-entry":
			var t Tombstone
			if err := d.DecodeElement(&t, &se); err == nil {
				f.TombList = append(f.TombList, t)
			}
		}
	}

	return nil
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
