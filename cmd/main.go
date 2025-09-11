package main

import (
	"javierMorales9/licitaciones/internal"
	"time"
)

type Contract struct {
	url  string
	date string
}

func main() {
	contracts := []Contract{
		//resuelta con lotes todos adjudicados
		{url: "https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/16998351", date: "2025-03-27"},
		//adjudicada con algunos lotes sin adjudicar.
		{url: "https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17465786", date: "2025-06-13"},
		//resuelta sin lotes adjudicada
		{url: "https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17165996", date: "2025-04-23"},
		//entry sin lotes resuelta sin adjudicar (Renuncia)
		{url: "https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/17540944", date: "2025-06-25"},
	}

	for _, val := range contracts {
		createdAt, err := time.Parse("2006-01-02", val.date)
		if err != nil {
			continue
		}
		internal.ExtractContractHistory("data/", val.url, createdAt)
	}

	/*
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
	*/
}
