-- Realistic demo data for hiro@berkeley.edu (00000000-0000-0000-0000-000000000004)
-- Sessions, interventions, and vulnerability scores over the past 2 weeks

-- ── SESSIONS ────────────────────────────────────────────────────────────────

INSERT INTO sessions (id, user_id, app_triggered, vulnerability_score, battery, location, outcome, created_at) VALUES
-- Week 1 (June 8-14)
('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     72, 38, 'home',    'redirected',     '2026-06-08 14:23:00+00'),
('a0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'instagram.com',  55, 81, 'library', 'overridden',     '2026-06-09 10:05:00+00'),
('a0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     68, 24, 'home',    'redirected',     '2026-06-09 22:41:00+00'),
('a0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'youtube.com',    45, 60, 'campus',  'overridden',     '2026-06-10 16:14:00+00'),
('a0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     80, 17, 'home',    'redirected',     '2026-06-11 23:02:00+00'),
('a0000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', 'instagram.com',  60, 55, 'gym',     'redirected',     '2026-06-12 09:30:00+00'),
('a0000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     50, 72, 'home',    'overridden',     '2026-06-12 20:18:00+00'),
('a0000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     65, 43, 'home',    'overridden',     '2026-06-13 15:45:00+00'),
('a0000001-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'youtube.com',    58, 89, 'library', 'redirected',     '2026-06-14 11:20:00+00'),
-- Week 2 (June 15-21)
('a0000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     75, 31, 'home',    'redirected',     '2026-06-15 21:10:00+00'),
('a0000001-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', 'instagram.com',  48, 66, 'campus',  'overridden',     '2026-06-16 13:05:00+00'),
('a0000001-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     82, 19, 'home',    'redirected',     '2026-06-16 22:55:00+00'),
('a0000001-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     70, 45, 'home',    'overridden',     '2026-06-17 18:30:00+00'),
('a0000001-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000004', 'youtube.com',    55, 78, 'library', 'redirected',     '2026-06-18 10:15:00+00'),
('a0000001-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     88, 12, 'home',    'redirected',     '2026-06-19 23:33:00+00'),
('a0000001-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000004', 'instagram.com',  62, 54, 'home',    'overridden',     '2026-06-20 16:48:00+00'),
('a0000001-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000004', 'tiktok.com',     77, 28, 'home',    'redirected',     '2026-06-21 11:20:00+00');

-- ── INTERVENTIONS ────────────────────────────────────────────────────────────

INSERT INTO interventions (id, session_id, user_id, messages, redirect_suggestion, accepted, created_at) VALUES
('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"You opened TikTok at 2pm with 38% battery — that''s your third scroll session today. Willard Park courts are open until 9pm, go shoot for an hour."},{"role":"user","content":"yeah you''re right"},{"role":"assistant","content":"Lace up. The park is 0.4mi away."}]',
 '{"hobby":"basketball","place":"Willard Park","distance":"0.4mi","open_until":"9pm"}', true, '2026-06-08 14:23:00+00'),

('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"You''re in the library and opening Instagram — you had a full hour before your next class. Finish that music beat you started."},{"role":"user","content":"i''m taking a break"},{"role":"assistant","content":"5 minutes is a break. Instagram is 45 minutes."}]',
 null, false, '2026-06-09 10:05:00+00'),

('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"10:41pm on a Monday with 24% battery — this is your second TikTok session tonight. Plug in and open your DAW instead."},{"role":"user","content":"okay fine"},{"role":"assistant","content":"Good. 30 minutes on that track and then sleep."}]',
 '{"hobby":"music_production","suggestion":"30 min on your current track, then sleep"}', true, '2026-06-09 22:41:00+00'),

('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"4pm on campus, YouTube open. You''ve got 2 hours before dinner — use them on CS homework."},{"role":"user","content":"just watching one video"},{"role":"assistant","content":"There''s no such thing as one video. Close it."},{"role":"user","content":"lol okay later"}]',
 null, false, '2026-06-10 16:14:00+00'),

('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"11pm, 17% battery, TikTok. You should be sleeping — you have class at 9am."},{"role":"user","content":"can''t sleep"},{"role":"assistant","content":"Scrolling makes it worse. Put the phone down and try the 4-7-8 breathing technique."}]',
 '{"hobby":"sleep","suggestion":"4-7-8 breathing: inhale 4s, hold 7s, exhale 8s"}', true, '2026-06-11 23:02:00+00'),

('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"9:30am at the gym and you opened Instagram — you''re already here, finish your workout first."},{"role":"user","content":"waiting for the squat rack"},{"role":"assistant","content":"Do your warmup sets. The rack will open up."}]',
 '{"hobby":"basketball","place":"gym","suggestion":"warmup sets while waiting for squat rack"}', true, '2026-06-12 09:30:00+00'),

('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"8pm, you''ve already opened TikTok twice today. Call one of your friends instead — you haven''t hung out this week."},{"role":"user","content":"they''re busy"},{"role":"assistant","content":"Text them anyway. Worst case you plan something for later."},{"role":"user","content":"i''ll just scroll for a bit"}]',
 null, false, '2026-06-12 20:18:00+00'),

('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"TikTok at 3:45pm — third time today. Your music project hasn''t been touched since Tuesday."},{"role":"user","content":"i''ll work on it later"},{"role":"assistant","content":"You said that yesterday. Open the DAW for 20 minutes now."},{"role":"user","content":"nah"}]',
 null, false, '2026-06-13 15:45:00+00'),

('b0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"YouTube in the library at 11am — you have a study session until 1pm. Close it and get back to your notes."},{"role":"user","content":"okay okay"},{"role":"assistant","content":"Good. One focused hour and you''ll be done."}]',
 '{"hobby":"studying","suggestion":"one focused hour on your notes"}', true, '2026-06-14 11:20:00+00'),

('b0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"9pm Sunday, TikTok again. You still have 4 hours of work to hit your daily goal."},{"role":"user","content":"it''s sunday though"},{"role":"assistant","content":"That''s why it still counts. 2 hours of music production and you''re halfway there."}]',
 '{"hobby":"music_production","suggestion":"2 hours of music production to hit daily work goal"}', true, '2026-06-15 21:10:00+00'),

('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"1pm on campus, Instagram open. You''ve got a free block before your 3pm — use it for basketball drills at the RSF."},{"role":"user","content":"too tired"},{"role":"assistant","content":"15 minutes of shooting will wake you up more than scrolling."},{"role":"user","content":"maybe next time"}]',
 null, false, '2026-06-16 13:05:00+00'),

('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"10:55pm Monday, 19% battery, TikTok. This is your second session tonight — plug in and close it."},{"role":"user","content":"just 10 more minutes"},{"role":"assistant","content":"You said that 40 minutes ago."}]',
 '{"hobby":"sleep","suggestion":"plug in and wind down"}', true, '2026-06-16 22:55:00+00'),

('b0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"6:30pm and you''re scrolling TikTok — your friends are probably free right now. Text the group chat."},{"role":"user","content":"eh"},{"role":"assistant","content":"When''s the last time you actually hung out with them in person?"},{"role":"user","content":"lol a while. fine i''ll text them"}]',
 '{"hobby":"hanging_out_with_friends","suggestion":"text the group chat"}', true, '2026-06-17 18:30:00+00'),

('b0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"YouTube at 10am in the library — you blocked this time for studying. Close the tab."},{"role":"user","content":"okay"},{"role":"assistant","content":"Good. Timer on for 45 minutes."}]',
 '{"hobby":"studying","suggestion":"45 minute focused study session"}', true, '2026-06-18 10:15:00+00'),

('b0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"11:33pm, 12% battery. You''ve been on TikTok for 40 minutes. Plug in and open your beat from earlier."},{"role":"user","content":"i''m almost done with this song"},{"role":"assistant","content":"Finish it tomorrow with fresh ears — you''ll catch more."}]',
 '{"hobby":"music_production","suggestion":"finish the track tomorrow with fresh ears"}', true, '2026-06-19 23:33:00+00'),

('b0000001-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"4:48pm, Instagram open. Willard Park courts are free until 8pm — go shoot for an hour."},{"role":"user","content":"nah i''m good"},{"role":"assistant","content":"You haven''t played since Tuesday. Your handles will get rusty."},{"role":"user","content":"i''ll go tomorrow"}]',
 null, false, '2026-06-20 16:48:00+00'),

('b0000001-0000-0000-0000-000000000017', 'a0000001-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000004',
 '[{"role":"assistant","content":"11:20am Saturday, TikTok. The RSF is open — go work on your crossover."},{"role":"user","content":"okay i''ll go"},{"role":"assistant","content":"There you go. One hour minimum."}]',
 '{"hobby":"basketball","place":"RSF","suggestion":"work on your crossover, 1 hour minimum"}', true, '2026-06-21 11:20:00+00');

-- ── VULNERABILITY SCORES ─────────────────────────────────────────────────────

INSERT INTO vulnerability_scores (user_id, score, signals, recorded_at) VALUES
('00000000-0000-0000-0000-000000000004', 72, '{"battery":38,"location":"home","opens_today":3,"schedule_block":"focus","exam_hours_away":null}', '2026-06-08 14:23:00+00'),
('00000000-0000-0000-0000-000000000004', 55, '{"battery":81,"location":"library","opens_today":1,"schedule_block":null,"exam_hours_away":null}', '2026-06-09 10:05:00+00'),
('00000000-0000-0000-0000-000000000004', 68, '{"battery":24,"location":"home","opens_today":2,"schedule_block":null,"exam_hours_away":null}', '2026-06-09 22:41:00+00'),
('00000000-0000-0000-0000-000000000004', 45, '{"battery":60,"location":"campus","opens_today":1,"schedule_block":null,"exam_hours_away":null}', '2026-06-10 16:14:00+00'),
('00000000-0000-0000-0000-000000000004', 80, '{"battery":17,"location":"home","opens_today":1,"schedule_block":null,"exam_hours_away":null}', '2026-06-11 23:02:00+00'),
('00000000-0000-0000-0000-000000000004', 60, '{"battery":55,"location":"gym","opens_today":1,"schedule_block":null,"exam_hours_away":null}',  '2026-06-12 09:30:00+00'),
('00000000-0000-0000-0000-000000000004', 50, '{"battery":72,"location":"home","opens_today":2,"schedule_block":null,"exam_hours_away":null}',  '2026-06-12 20:18:00+00'),
('00000000-0000-0000-0000-000000000004', 65, '{"battery":43,"location":"home","opens_today":3,"schedule_block":null,"exam_hours_away":null}',  '2026-06-13 15:45:00+00'),
('00000000-0000-0000-0000-000000000004', 58, '{"battery":89,"location":"library","opens_today":1,"schedule_block":null,"exam_hours_away":null}','2026-06-14 11:20:00+00'),
('00000000-0000-0000-0000-000000000004', 75, '{"battery":31,"location":"home","opens_today":1,"schedule_block":null,"exam_hours_away":null}',  '2026-06-15 21:10:00+00'),
('00000000-0000-0000-0000-000000000004', 48, '{"battery":66,"location":"campus","opens_today":1,"schedule_block":null,"exam_hours_away":null}', '2026-06-16 13:05:00+00'),
('00000000-0000-0000-0000-000000000004', 82, '{"battery":19,"location":"home","opens_today":2,"schedule_block":null,"exam_hours_away":null}',  '2026-06-16 22:55:00+00'),
('00000000-0000-0000-0000-000000000004', 70, '{"battery":45,"location":"home","opens_today":1,"schedule_block":null,"exam_hours_away":null}',  '2026-06-17 18:30:00+00'),
('00000000-0000-0000-0000-000000000004', 55, '{"battery":78,"location":"library","opens_today":1,"schedule_block":null,"exam_hours_away":null}','2026-06-18 10:15:00+00'),
('00000000-0000-0000-0000-000000000004', 88, '{"battery":12,"location":"home","opens_today":1,"schedule_block":null,"exam_hours_away":null}',  '2026-06-19 23:33:00+00'),
('00000000-0000-0000-0000-000000000004', 62, '{"battery":54,"location":"home","opens_today":1,"schedule_block":null,"exam_hours_away":null}',  '2026-06-20 16:48:00+00'),
('00000000-0000-0000-0000-000000000004', 77, '{"battery":28,"location":"home","opens_today":1,"schedule_block":null,"exam_hours_away":null}',  '2026-06-21 11:20:00+00');
