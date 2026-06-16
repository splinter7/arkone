CREATE TABLE `assets` (
	`cid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`category` text NOT NULL,
	`uploaded_at` text NOT NULL,
	`pinata_file_id` text,
	`thumbnail_cid` text,
	`thumbnail_pinata_file_id` text
);
