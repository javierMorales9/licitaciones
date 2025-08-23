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
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ---------- Output row ----------
type Org struct {
	Dir3              string
	NIF               string
	OrgName           string
	ProfileUrl        string
	Email             string
	Phone             string
	AddressLine       string
	PostalCode        string
	City              string
	Country           string
	LastPublishedDate time.Time
	LastTenderURL     string
	TendersCount      int
}

type OrgAgg struct {
	byKey map[string]*Org // key = dir3|normalizedName
}

func NewOrgAgg() *OrgAgg {
	return &OrgAgg{byKey: make(map[string]*Org)}
}

func (a *OrgAgg) keyFor(dir3, name string) string {
	if dir3 != "" {
		return "DIR3:" + strings.ToUpper(strings.TrimSpace(dir3))
	}
	// Fallback por nombre si no hay DIR3
	n := strings.ToUpper(strings.Join(strings.Fields(name), " "))
	return "NAME:" + n
}

var CPVPrefixes = []string{"09132", "09134"}

func isValidCPV(cpv string) bool {
	c := strings.TrimSpace(cpv)
	c = strings.ReplaceAll(c, "-", "") // "09120000-6" -> "091200006"
	for _, p := range CPVPrefixes {
		if strings.HasPrefix(c, p) {
			return true
		}
	}
	return false
}

func (a *OrgAgg) ingestEntry(e Entry) {
	// 1) Extraer CPVs y filtrar por hidrocarburos
	var hasCPV bool
	for _, c := range e.CFS.Project.Commodity {
		if isValidCPV(c.CPV.Value) {
			hasCPV = true
			break
		}
	}

	if !hasCPV {
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

	var publishedDate time.Time
	for _, n := range e.CFS.Notices {
		if strings.EqualFold(n.NoticeType.Value, "DOC_CN") {
			publishedDate = n.Status.DocRef.IssueDate.Time
			break
		}
	}

	fields := e.CFS.LocatedParty.Party.PostalAddress

	email := e.CFS.LocatedParty.Party.Contact.Mail
	phone := e.CFS.LocatedParty.Party.Contact.Phone

	lastTenderUrl := e.Links[0].Href

	key := a.keyFor(dir3, orgName)
	row, ok := a.byKey[key]
	if !ok {
		row = &Org{
			Dir3:              dir3,
			NIF:               nif,
			OrgName:           orgName,
			ProfileUrl:        profileUrl,
			Email:             email,
			Phone:             phone,
			AddressLine:       fields.Line,
			PostalCode:        fields.PostalZone,
			City:              fields.City,
			Country:           fields.Country.Code.Value,
			LastPublishedDate: publishedDate,
			LastTenderURL:     lastTenderUrl,
			TendersCount:      1,
		}
		a.byKey[key] = row
		return
	}

	row.TendersCount++

	if publishedDate.After(row.LastPublishedDate) {
		row.LastPublishedDate = publishedDate
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

func (a *OrgAgg) rowsSorted() []Org {
	out := make([]Org, 0, len(a.byKey))
	for _, r := range a.byKey {
		out = append(out, *r)
	}
	// Ordenar por fecha desc y nombre
	sort.Slice(out, func(i, j int) bool {
		if out[i].LastPublishedDate.Equal(out[j].LastPublishedDate) {
			return out[i].OrgName < out[j].OrgName
		}
		return out[i].LastPublishedDate.After(out[j].LastPublishedDate)
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
			r.NIF,
			r.ProfileUrl,
			r.Email,
			r.Phone,
			fmt.Sprintf("%s %s, %s %s", r.AddressLine, r.PostalCode, r.City, r.Country),
			r.LastPublishedDate.Format(time.RFC3339),
			r.LastTenderURL,
			strconv.FormatInt(int64(r.TendersCount), 10),
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

			dec := xml.NewDecoder(nil) //gets reassigned every file
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
