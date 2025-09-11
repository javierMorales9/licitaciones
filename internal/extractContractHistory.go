package internal

import (
	"bufio"
	"bytes"
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

type entryMin struct {
	ID string `xml:"id"`
}

var reTs = regexp.MustCompile(`_(\d{8}_\d{6})(?:_\d+)?(?:\.atom)?$`)

func parseTSFromPath(p string, loc *time.Location) (time.Time, bool) {
	base := filepath.Base(p)
	m := reTs.FindStringSubmatch(base)
	if len(m) != 2 {
		return time.Time{}, false
	}
	ts, err := time.ParseInLocation("20060102_150405", m[1], loc)
	if err != nil {
		return time.Time{}, false
	}
	return ts, true
}

func ExtractContractHistory(dir string, refID string, createdAt time.Time) error {
	files, err := listLocalAtoms(dir)
	if err != nil {
		return err
	}

	entryHistory := make([]string, 0)

	var mu sync.Mutex

	workers := 8
	fileCh := make(chan string, workers*2)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		defer close(fileCh)
		for _, f := range files {
			select {
			case <-ctx.Done():
				return
			case fileCh <- f:
				//enviado
			}
		}
	}()

	var wg sync.WaitGroup
	wg.Add(workers)
	for w := 0; w < workers; w++ {
		go func() {
			defer wg.Done()

			loc, err := time.LoadLocation("Europe/Madrid")
			if err != nil {
				loc = time.UTC
			}

			for {
				select {
				case <-ctx.Done():
					return
				case path, ok := <-fileCh:
					if !ok {
						return
					}
					log.Println("Processing:", path)

					if ts, ok := parseTSFromPath(path, loc); ok {
						if ts.Before(createdAt) {
							log.Printf("[STOP] %s ts=%s > createdAt=%s. Worker se detiene.",
								filepath.Base(path), ts.Format(time.RFC3339), createdAt.In(loc).Format(time.RFC3339))
							cancel()
							return // se cierra este worker
						}
					}

					f, err := os.Open(path)
					if err != nil {
						log.Printf("[WARN] %v", err)
						continue
					}

					dec := xml.NewDecoder(bufio.NewReaderSize(f, 256<<10))

					for {
						tok, err := dec.RawToken()
						if err == io.EOF {
							break
						}
						if err != nil {
							log.Printf("[XML] %s %v", path, err)
							break
						}

						se, ok := tok.(xml.StartElement)
						if !ok || se.Name.Local != "entry" {
							continue
						}

						// --- 1) Volcar la <entry> completa a un buffer (XML normalizado) ---
						var buf bytes.Buffer
						enc := xml.NewEncoder(&buf)

						// Escribimos el start tag que ya hemos consumido
						if err := enc.EncodeToken(se); err != nil {
							log.Printf("[XML] %s encode start: %v", path, err)
							continue
						}

						depth := 1
						for depth > 0 {
							t, err := dec.RawToken()
							if err != nil {
								log.Printf("[XML] %s %v", path, err)
								break
							}
							if err := enc.EncodeToken(t); err != nil {
								log.Printf("[XML] %s encode token: %v", path, err)
								break
							}
							switch t.(type) {
							case xml.StartElement:
								depth++
							case xml.EndElement:
								depth--
							}
						}
						if err := enc.Flush(); err != nil {
							log.Printf("[XML] %s flush: %v", path, err)
							continue
						}

						// --- 2) Parseo ligero para leer <id> y decidir si guardar ---
						var mini entryMin
						if err := xml.Unmarshal(buf.Bytes(), &mini); err != nil {
							log.Printf("[XML] %s unmarshal entry: %v", path, err)
							continue
						}
						if mini.ID == refID {
							mu.Lock()
							entryHistory = append(entryHistory, buf.String())
							mu.Unlock()
						}
					}
					_ = f.Close()
				}
			}
		}()
	}

	wg.Wait()

	var buffer bytes.Buffer
	for _, val := range entryHistory {
		buffer.WriteString(val)
	}

	path := strings.ReplaceAll(refID[8:], "/", "_")
	path = strings.ReplaceAll(path, ".", "")
	err = os.WriteFile("tests/"+path, buffer.Bytes(), 0644)
	if err != nil {
		log.Println("[ERROR]" + err.Error())
		return nil
	}

	fmt.Println("Vamos a ver esto", len(entryHistory))

	return nil
}
