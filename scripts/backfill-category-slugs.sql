-- Optional MySQL preview / manual helpers for empty category slugs.
-- Prefer the Node script (scripts/backfill-category-slugs.mjs) for uniqueness (-2, -3).
--
-- Preview rows needing backfill:
SELECT id, name, slug
FROM category
WHERE slug IS NULL OR slug = '';

-- Example: Slippers & Sandals → slippers-sandals (only if free)
-- UPDATE category
-- SET slug = 'slippers-sandals'
-- WHERE name = 'Slippers & Sandals'
--   AND (slug IS NULL OR slug = '')
--   AND NOT EXISTS (
--     SELECT 1 FROM category c2
--     WHERE c2.slug = 'slippers-sandals'
--       AND c2.id <> category.id
--   );
