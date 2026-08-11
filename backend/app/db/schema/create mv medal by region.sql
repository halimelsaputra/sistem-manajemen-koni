
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_medals_by_region AS
SELECT
    a.kabupaten_kota,
    COUNT(*) FILTER (WHERE p.medali = 'Emas')     AS total_emas,
    COUNT(*) FILTER (WHERE p.medali = 'Perak')    AS total_perak,
    COUNT(*) FILTER (WHERE p.medali = 'Perunggu') AS total_perunggu
FROM prestasi p
JOIN atlet a ON p.atlet_id = a.id
GROUP BY a.kabupaten_kota;


CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_medals_by_region_kabkota
ON mv_medals_by_region (kabupaten_kota);

