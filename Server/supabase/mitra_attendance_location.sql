-- Adds GPS location to SATHEE MITRA arrival/departure check-ins.
-- Run once in Supabase -> SQL Editor. Safe to re-run; no data is changed.
-- Until this runs, check-ins still work, just without a saved location.
alter table mitra_attendances add column if not exists arrival_lat          double precision;
alter table mitra_attendances add column if not exists arrival_lng          double precision;
alter table mitra_attendances add column if not exists arrival_accuracy_m   integer;
alter table mitra_attendances add column if not exists arrival_distance_m   integer;
alter table mitra_attendances add column if not exists departure_lat        double precision;
alter table mitra_attendances add column if not exists departure_lng        double precision;
alter table mitra_attendances add column if not exists departure_accuracy_m integer;
alter table mitra_attendances add column if not exists departure_distance_m integer;
