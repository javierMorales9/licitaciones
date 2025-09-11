package internal

import (
	"os"
	"strings"
	"path/filepath"
	"sort"
)

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
