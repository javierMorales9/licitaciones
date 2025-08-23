package main

import (
	"bufio"
	"encoding/xml"
	"fmt"
	"javierMorales9/licitaciones/internal"
	"os"
)

func main() {
	//internal.ParseAtom("data/")

	//path := "data/licitacionesPerfilesContratanteCompleto3.atom"
	path := "data/licitacionesPerfilesContratanteCompleto3_20250818_175602_3.atom"
	f, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	reader := bufio.NewReaderSize(f, 256<<10)

	var feed internal.Feed
	dec := xml.NewDecoder(reader)
	err = dec.Decode(&feed)
	if err != nil {
		panic(err)
	}

	fmt.Println("entries", len(feed.Entries))
	fmt.Println("tomblist", len(feed.TombList))
}
