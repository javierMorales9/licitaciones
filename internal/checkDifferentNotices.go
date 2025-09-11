package internal

import (
	"bufio"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"os"
	"sync"
)

type NoticeType struct {
	Times          int
	FirstOcurrence string
	EntryState     sync.Map
}

func CheckDifferentNoticesTypes(dir string) error {
	files, err := listLocalAtoms(dir)
	if err != nil {
		return err
	}

	workers := 8
	fileCh := make(chan string, workers*2)
	noticesTypes := make(map[string]*NoticeType)

	var visited sync.Map

	var wg sync.WaitGroup
	wg.Add(workers)
	for w := 0; w < workers; w++ {
		go func() {
			defer wg.Done()
			dec := xml.NewDecoder(nil) //gets reassigned every file

			for path := range fileCh {
				log.Println("Processing:", path)
				f, err := os.Open(path)
				if err != nil {
					log.Printf("[WARN] %v", err)
					continue
				}
				defer f.Close()

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

							if _, ok = visited.Load(e.ID); ok {
								continue
							}
							visited.Store(e.ID, true)

							for _, notice := range e.CFS.Notices {
								noticeKey := notice.NoticeType.Value
								_, ok := noticesTypes[noticeKey]
								if ok {
									noticesTypes[noticeKey].Times += 1
								} else {
									noticesTypes[noticeKey] = &NoticeType{Times: 1, FirstOcurrence: path}
								}

								val, ok := noticesTypes[noticeKey].EntryState.Load(e.CFS.StatusCode.Value)
								if ok {
									noticesTypes[noticeKey].EntryState.Store(e.CFS.StatusCode.Value, val.(int)+1)
								} else {
									noticesTypes[noticeKey].EntryState.Store(e.CFS.StatusCode.Value, 1)
								}
							}
						}
					}
				}
			}
		}()
	}

	for _, f := range files {
		fileCh <- f
	}
	close(fileCh)
	wg.Wait()

	for key, val := range noticesTypes {
		fmt.Printf("%s: %d %s\n", key, val.Times, val.FirstOcurrence)
		for k, v := range val.EntryState.Range {
			fmt.Printf("  %s: %d\n", k, v)
		}
		fmt.Println()
	}

	return nil
}
