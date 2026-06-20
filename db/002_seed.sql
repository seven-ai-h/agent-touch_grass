-- all passwords are "touchgrass123" (bcrypt cost 10)

INSERT INTO users (id, email, password_hash, identity_statement, agent_tone, hobby_profile, google_refresh_token) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'jamie@berkeley.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'I am an athlete and a builder.',
    'tough_love',
    '{"basketball": 0.34, "music_production": 0.28, "cooking": 0.18}',
    '1//fake_refresh_token_jamie'
),
(
    '00000000-0000-0000-0000-000000000002',
    'alex@berkeley.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'I am a designer who codes.',
    'gentle',
    '{"drawing": 0.40, "hiking": 0.30, "photography": 0.20}',
    '1//fake_refresh_token_alex'
),
(
    '00000000-0000-0000-0000-000000000003',
    'sam@berkeley.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'I am a musician and a student.',
    'coach',
    '{"guitar": 0.45, "cooking": 0.25, "photography": 0.15}',
    NULL
),
(
    '00000000-0000-0000-0000-000000000004',
    'hiro@berkeley.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'I am a builder and an AI researcher.',
    'tough_love',
    '{"coding_projects": 0.40, "running": 0.30, "reading": 0.20}',
    '1//fake_refresh_token_hiro'
),
(
    '00000000-0000-0000-0000-000000000005',
    'jenni@berkeley.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'I am a creative and a connector.',
    'gentle',
    '{"painting": 0.38, "yoga": 0.32, "journaling": 0.20}',
    NULL
);

-- Jamie: 14 days of sessions (~2-3/day, ~73% redirected) + full intervention transcripts

INSERT INTO sessions (id, user_id, app_triggered, vulnerability_score, battery, location, outcome, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'tiktok.com',    72, 61, 'home',   'redirected',     NOW() - INTERVAL '14 days' + INTERVAL '21 hours'),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'instagram.com', 68, 45, 'home',   'overridden',     NOW() - INTERVAL '14 days' + INTERVAL '23 hours'),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'reddit.com',    55, 78, 'campus', 'redirected',     NOW() - INTERVAL '13 days' + INTERVAL '14 hours'),
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'tiktok.com',    80, 34, 'home',   'redirected',     NOW() - INTERVAL '13 days' + INTERVAL '22 hours');

INSERT INTO interventions (session_id, user_id, messages, redirect_suggestion, accepted, created_at) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '[{"role":"assistant","content":"You''ve been on TikTok for 22 minutes. Your CS161 final is in 12 hours. Willard Park closes in an hour — want to shoot around?"}, {"role":"user","content":"yeah okay let''s go"}]',
    '{"hobby": "basketball", "place": "Willard Park", "distance": "0.4mi", "drill": "weak-hand layup, 3 sets of 10"}',
    true,
    NOW() - INTERVAL '14 days' + INTERVAL '21 hours 3 minutes'
),
(
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '[{"role":"assistant","content":"You closed this 10 minutes ago. What''s actually going on?"}, {"role":"user","content":"I''ll just scroll for 15 min"}, {"role":"assistant","content":"Your call. Timer set."}]',
    '{"hobby": "cooking", "suggestion": "Make a quick meal, you haven''t eaten since noon"}',
    false,
    NOW() - INTERVAL '14 days' + INTERVAL '23 hours 2 minutes'
),
(
    'a0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '[{"role":"assistant","content":"Reddit spiral starting. You have 2 hours before your next class — enough time for a 25-min focus block and a walk."}, {"role":"user","content":"fine, starting the timer"}]',
    '{"hobby": "focus", "type": "pomodoro", "duration_min": 25}',
    true,
    NOW() - INTERVAL '13 days' + INTERVAL '14 hours 2 minutes'
),
(
    'a0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '[{"role":"assistant","content":"11pm, battery at 34%, you closed this 6 minutes ago. Your body needs sleep more than this content."}, {"role":"user","content":"okay okay. going to bed"}, {"role":"assistant","content":"Good call. See you tomorrow."}]',
    '{"hobby": "sleep", "suggestion": "Wind down, lights off in 20 min"}',
    true,
    NOW() - INTERVAL '13 days' + INTERVAL '22 hours 3 minutes'
);

-- days -12 through -1 (same pattern, no transcripts for brevity)
INSERT INTO sessions (user_id, app_triggered, vulnerability_score, battery, location, outcome, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    65, 55, 'home',   'redirected',     NOW() - INTERVAL '12 days' + INTERVAL '20 hours'),
('00000000-0000-0000-0000-000000000001', 'instagram.com', 71, 40, 'home',   'redirected',     NOW() - INTERVAL '12 days' + INTERVAL '22 hours'),
('00000000-0000-0000-0000-000000000001', 'reddit.com',    50, 82, 'campus', 'redirected',     NOW() - INTERVAL '11 days' + INTERVAL '11 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    88, 28, 'home',   'overridden',     NOW() - INTERVAL '11 days' + INTERVAL '23 hours'),
('00000000-0000-0000-0000-000000000001', 'instagram.com', 60, 67, 'home',   'redirected',     NOW() - INTERVAL '10 days' + INTERVAL '15 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    75, 42, 'home',   'redirected',     NOW() - INTERVAL '10 days' + INTERVAL '21 hours'),
('00000000-0000-0000-0000-000000000001', 'reddit.com',    82, 31, 'home',   'overridden',     NOW() - INTERVAL '10 days' + INTERVAL '23 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    58, 73, 'home',   'redirected',     NOW() - INTERVAL '9 days'  + INTERVAL '16 hours'),
('00000000-0000-0000-0000-000000000001', 'instagram.com', 70, 50, 'home',   'leisure_window', NOW() - INTERVAL '9 days'  + INTERVAL '22 hours'),
('00000000-0000-0000-0000-000000000001', 'reddit.com',    45, 88, 'campus', 'redirected',     NOW() - INTERVAL '8 days'  + INTERVAL '13 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    79, 36, 'home',   'redirected',     NOW() - INTERVAL '8 days'  + INTERVAL '23 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    68, 58, 'home',   'redirected',     NOW() - INTERVAL '7 days'  + INTERVAL '20 hours'),
('00000000-0000-0000-0000-000000000001', 'instagram.com', 74, 44, 'home',   'overridden',     NOW() - INTERVAL '7 days'  + INTERVAL '22 hours'),
('00000000-0000-0000-0000-000000000001', 'reddit.com',    52, 79, 'campus', 'redirected',     NOW() - INTERVAL '6 days'  + INTERVAL '14 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    77, 41, 'home',   'redirected',     NOW() - INTERVAL '6 days'  + INTERVAL '21 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    63, 62, 'home',   'redirected',     NOW() - INTERVAL '5 days'  + INTERVAL '19 hours'),
('00000000-0000-0000-0000-000000000001', 'instagram.com', 70, 48, 'home',   'leisure_window', NOW() - INTERVAL '5 days'  + INTERVAL '22 hours'),
('00000000-0000-0000-0000-000000000001', 'reddit.com',    81, 33, 'home',   'redirected',     NOW() - INTERVAL '5 days'  + INTERVAL '23 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    59, 71, 'home',   'redirected',     NOW() - INTERVAL '4 days'  + INTERVAL '15 hours'),
('00000000-0000-0000-0000-000000000001', 'instagram.com', 66, 46, 'home',   'overridden',     NOW() - INTERVAL '4 days'  + INTERVAL '21 hours'),
('00000000-0000-0000-0000-000000000001', 'reddit.com',    48, 84, 'campus', 'redirected',     NOW() - INTERVAL '3 days'  + INTERVAL '13 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    76, 39, 'home',   'redirected',     NOW() - INTERVAL '3 days'  + INTERVAL '22 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    72, 54, 'home',   'redirected',     NOW() - INTERVAL '2 days'  + INTERVAL '20 hours'),
('00000000-0000-0000-0000-000000000001', 'instagram.com', 78, 43, 'home',   'redirected',     NOW() - INTERVAL '2 days'  + INTERVAL '22 hours'),
('00000000-0000-0000-0000-000000000001', 'reddit.com',    85, 30, 'home',   'overridden',     NOW() - INTERVAL '2 days'  + INTERVAL '23 hours'),
('00000000-0000-0000-0000-000000000001', 'tiktok.com',    61, 68, 'home',   'redirected',     NOW() - INTERVAL '1 day'   + INTERVAL '16 hours'),
('00000000-0000-0000-0000-000000000001', 'instagram.com', 69, 47, 'home',   'leisure_window', NOW() - INTERVAL '1 day'   + INTERVAL '22 hours');

-- today's sessions; the 23:14 one is currently open (no outcome yet)
INSERT INTO sessions (id, user_id, app_triggered, vulnerability_score, battery, location, outcome, created_at) VALUES
('a0000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000001', 'tiktok.com', 85, 31, 'home', 'redirected', NOW() - INTERVAL '3 hours'),
('a0000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'tiktok.com', 92, 23, 'home', NULL,         NOW() - INTERVAL '30 minutes');

INSERT INTO interventions (session_id, user_id, messages, redirect_suggestion, accepted, created_at) VALUES
(
    'a0000000-0000-0000-0000-000000000099',
    '00000000-0000-0000-0000-000000000001',
    '[{"role":"assistant","content":"You closed this tab 8 minutes ago. What''s actually going on right now?"}, {"role":"user","content":"I just need a break, I''ve been studying all day."}, {"role":"assistant","content":"Fair — you put in real work. CS161 final is in 9hr 46min and you''ve averaged 5.2 hours of sleep this week. Willard Park is open until midnight — 6 min away."}, {"role":"user","content":"okay let''s go"}]',
    '{"hobby": "basketball", "place": "Willard Park", "distance": "0.4mi", "open_until": "midnight", "drill": "weak-hand layup, 3 sets of 10"}',
    true,
    NOW() - INTERVAL '3 hours' + INTERVAL '4 minutes'
),
(
    'a0000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000001',
    '[{"role":"assistant","content":"You closed this tab 8 minutes ago. What''s actually going on right now?"}]',
    NULL,
    NULL,
    NOW() - INTERVAL '28 minutes'
);

-- Jamie's vulnerability scores for today (matches dashboard timeline)
INSERT INTO vulnerability_scores (user_id, score, signals, recorded_at) VALUES
('00000000-0000-0000-0000-000000000001', 20, '{"battery": 82, "sleep_hours": 7.1, "exam_hours_away": null, "is_late_night": false}', NOW() - INTERVAL '15 hours'),
('00000000-0000-0000-0000-000000000001', 15, '{"battery": 79, "sleep_hours": 7.1, "exam_hours_away": null, "is_late_night": false}', NOW() - INTERVAL '14 hours'),
('00000000-0000-0000-0000-000000000001', 30, '{"battery": 74, "sleep_hours": 7.1, "exam_hours_away": null, "is_late_night": false}', NOW() - INTERVAL '13 hours'),
('00000000-0000-0000-0000-000000000001', 45, '{"battery": 68, "sleep_hours": 7.1, "exam_hours_away": null, "is_late_night": false}', NOW() - INTERVAL '12 hours'),
('00000000-0000-0000-0000-000000000001', 60, '{"battery": 61, "sleep_hours": 5.2, "exam_hours_away": 21,   "is_late_night": false}', NOW() - INTERVAL '11 hours'),
('00000000-0000-0000-0000-000000000001', 40, '{"battery": 58, "sleep_hours": 5.2, "exam_hours_away": 20,   "is_late_night": false}', NOW() - INTERVAL '10 hours'),
('00000000-0000-0000-0000-000000000001', 35, '{"battery": 52, "sleep_hours": 5.2, "exam_hours_away": 19,   "is_late_night": false}', NOW() - INTERVAL '9 hours'),
('00000000-0000-0000-0000-000000000001', 55, '{"battery": 45, "sleep_hours": 5.2, "exam_hours_away": 18,   "is_late_night": false}', NOW() - INTERVAL '8 hours'),
('00000000-0000-0000-0000-000000000001', 70, '{"battery": 38, "sleep_hours": 5.2, "exam_hours_away": 17,   "is_late_night": false}', NOW() - INTERVAL '7 hours'),
('00000000-0000-0000-0000-000000000001', 85, '{"battery": 30, "sleep_hours": 5.2, "exam_hours_away": 16,   "is_late_night": false}', NOW() - INTERVAL '6 hours'),
('00000000-0000-0000-0000-000000000001', 92, '{"battery": 23, "sleep_hours": 5.2, "exam_hours_away": 9.75, "is_late_night": true}',  NOW() - INTERVAL '15 minutes');
