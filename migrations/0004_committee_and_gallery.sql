-- Committee roster (editable in admin — members are elected and change)
-- and the photo gallery.
CREATE TABLE IF NOT EXISTS committee_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gallery_photos (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO committee_members (id, name, title, sort_order) VALUES
  ('cm-01', 'Maggie Brush', 'President', 1),
  ('cm-02', 'Bob Busking', 'Vice President and Treasurer', 2),
  ('cm-03', 'Sally Pope', 'Secretary', 3),
  ('cm-04', 'Chris Cohen', '', 4),
  ('cm-05', 'Matthew Conlon', '', 5),
  ('cm-06', 'Paul Dempsey', '', 6),
  ('cm-07', 'Tom Downing', '', 7),
  ('cm-08', 'Ceil Frank', '', 8),
  ('cm-09', 'Dorothy Labowski', '', 9),
  ('cm-10', 'Nancy Lombardi', '', 10),
  ('cm-11', 'Claudia Woods', '', 11);

INSERT INTO gallery_photos (id, image_url, caption, sort_order) VALUES
  ('gp-01', '/images/building/DSC_6054-banner-bw-2.jpg', 'The Academy on South Country Road', 1),
  ('gp-02', '/images/building/Remsenburg-Academy-DSC_6056-1x1-bw.jpg', 'The 1863 schoolhouse', 2),
  ('gp-03', '/images/building/DSC_4136.jpg', '', 3),
  ('gp-04', '/images/building/IMG_2463-scaled.jpeg', '', 4),
  ('gp-05', '/images/artremsenburg/ARTRemsenburg-banner-1.jpg', 'ArtRemsenburg', 5),
  ('gp-06', '/images/artremsenburg/ARTRemsenburg-banner-3.jpg', 'ArtRemsenburg', 6),
  ('gp-07', '/images/posters/Celebrate-Life.jpg', 'Celebrate Life! exhibit, 2024', 7),
  ('gp-08', '/images/posters/artisans-market.jpg', 'Artisans Market, 2024', 8),
  ('gp-09', '/images/posters/Autumn-at-the-Academy-postcard.jpg', 'Autumn at the Academy', 9),
  ('gp-10', '/images/posters/Remsenburg-Academy-2025-Summer-Schedule.jpg', 'The 2025 summer season', 10);
