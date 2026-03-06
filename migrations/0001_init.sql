-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ARTIST',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'BASIC',
    "subscriptionStartDate" DATETIME,
    "dspUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "dspUnlockPaidAt" DATETIME,
    "artistName" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "genre" TEXT,
    "socialLinks" TEXT,
    "profilePictureUrl" TEXT,
    "walletBalance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expoPushToken" TEXT
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistName" TEXT,
    "featuredArtists" TEXT,
    "genre" TEXT,
    "subgenre" TEXT,
    "releaseDate" DATETIME,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "coverUrl" TEXT,
    "audioUrl" TEXT NOT NULL,
    "audioSource" TEXT NOT NULL DEFAULT 'UPLOAD',
    "masteringTaskId" TEXT,
    "lyricsToMusicTaskId" TEXT,
    "isrc" TEXT,
    "labelName" TEXT,
    "producer" TEXT,
    "composer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "shareLink" TEXT,
    "dspLinks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Song_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "songId" TEXT,
    "requestedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "meta" TEXT,
    "downloadUrl" TEXT,
    "estimatedCompletionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoyaltyLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "platform" TEXT,
    "songId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoyaltyLedger_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoyaltySplit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "userId" TEXT,
    CONSTRAINT "RoyaltySplit_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "totalStreams" INTEGER NOT NULL DEFAULT 0,
    "monthlyStreams" TEXT,
    "platformBreakdown" TEXT,
    "dspLinks" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Analytics_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Analytics_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistId" TEXT NOT NULL,
    "releasesUsed" INTEGER NOT NULL DEFAULT 0,
    "masteringUsed" INTEGER NOT NULL DEFAULT 0,
    "songCreationUsed" INTEGER NOT NULL DEFAULT 0,
    "coverCreationUsed" INTEGER NOT NULL DEFAULT 0,
    "lyricsUsed" INTEGER NOT NULL DEFAULT 0,
    "audioSeparatorUsed" INTEGER NOT NULL DEFAULT 0,
    "voiceReferenceUsed" INTEGER NOT NULL DEFAULT 0,
    "lyricsToMusicUsed" INTEGER NOT NULL DEFAULT 0,
    "resetDate" DATETIME NOT NULL,
    CONSTRAINT "Quota_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lyrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "theme" TEXT,
    "genre" TEXT,
    "tempo" TEXT,
    "storyline" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lyrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverArt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "songId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "prompt" TEXT,
    "source" TEXT NOT NULL DEFAULT 'UPLOAD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoverArt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoverArt_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "processedById" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WithdrawalRequest_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "meta" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "scheduledFor" DATETIME,
    "sentByAdminId" TEXT NOT NULL,
    "notifiedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Broadcast_sentByAdminId_fkey" FOREIGN KEY ("sentByAdminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Quota_artistId_key" ON "Quota"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_name_key" ON "AdminRole"("name");

INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('4f4e70ca-7b33-485f-950b-2eda237b08b8', 'admin@vilobeat.com', 'admin123', 'SUPER_ADMIN', 'EXPERT', NULL, 0, NULL, 'Admin', NULL, NULL, NULL, NULL, NULL, 0, '2026-03-03T23:17:43.428+00:00', '2026-03-03T23:17:43.428+00:00', NULL);
INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('b7fffd6d-94e8-43df-b215-44a9f36bc9ad', 'dist@vilobeat.com', 'staff123', 'DISTRIBUTION_MANAGER', 'BASIC', NULL, 0, NULL, 'Distribution Manager', NULL, NULL, NULL, NULL, NULL, 0, '2026-03-03T23:17:43.444+00:00', '2026-03-03T23:17:43.444+00:00', NULL);
INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('dfbc08a5-9743-4018-b76b-8796655972be', 'creative@vilobeat.com', 'staff123', 'CREATIVE_MANAGER', 'BASIC', NULL, 0, NULL, 'Creative Manager', NULL, NULL, NULL, NULL, NULL, 0, '2026-03-03T23:17:43.451+00:00', '2026-03-03T23:17:43.451+00:00', NULL);
INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('8113c8d3-171f-4143-ba2d-34688afc3832', 'finance@vilobeat.com', 'staff123', 'FINANCE_ADMIN', 'BASIC', NULL, 0, NULL, 'Finance Admin', NULL, NULL, NULL, NULL, NULL, 0, '2026-03-03T23:17:43.459+00:00', '2026-03-03T23:17:43.459+00:00', NULL);
INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('65798283-85f3-4f25-956b-1ac7e79857e8', 'support@vilobeat.com', 'staff123', 'SUPPORT_STAFF', 'BASIC', NULL, 0, NULL, 'Support Staff', NULL, NULL, NULL, NULL, NULL, 0, '2026-03-03T23:17:43.468+00:00', '2026-03-03T23:17:43.468+00:00', NULL);
INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('2010fc1f-0c39-4945-b115-f96cc58a43e4', 'johan@music.com', 'artist123', 'ARTIST', 'PRO', '2025-09-03T23:17:43.477+00:00', 0, NULL, 'Johan Beats', '+234812345678', 'Afrobeats producer and vocalist', 'Afrobeats', '{"instagram":"@johanbeats","tiktok":"@johanmusic"}', NULL, 467.5, '2026-03-03T23:17:43.481+00:00', '2026-03-03T23:17:43.481+00:00', NULL);
INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('018a9b10-36c2-45d6-867d-7d3e35d620b6', 'synthwave@beats.com', 'artist123', 'ARTIST', 'ELITE', '2025-12-03T23:17:43.477+00:00', 0, NULL, 'SynthWave', NULL, 'Electronic music artist and producer', 'Electronic', '{"spotify":"SynthWaveOfficial"}', NULL, 896.3, '2026-03-03T23:17:43.493+00:00', '2026-03-03T23:17:43.493+00:00', NULL);
INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('ab9ad090-c7fa-48b9-a3bf-41269d21401d', 'lillyrose@email.com', 'artist123', 'ARTIST', 'BASIC', '2025-12-03T23:17:43.477+00:00', 0, NULL, 'Lilly Rose', NULL, 'Singer-songwriter from Lagos', 'Pop', NULL, NULL, 45.6, '2026-03-03T23:17:43.506+00:00', '2026-03-03T23:17:43.506+00:00', NULL);
INSERT INTO "User" ("id", "email", "passwordHash", "role", "subscriptionTier", "subscriptionStartDate", "dspUnlocked", "dspUnlockPaidAt", "artistName", "phone", "bio", "genre", "socialLinks", "profilePictureUrl", "walletBalance", "createdAt", "updatedAt", "expoPushToken") VALUES ('52edc9b6-36da-4065-8a14-00b97ffdc40c', 'brandwithtomi@gmail.com', 'Successz441', 'ARTIST', 'BASIC', NULL, 0, NULL, 'Tomisin', NULL, NULL, NULL, NULL, NULL, 0, '2026-03-04T07:32:05.890+00:00', '2026-03-05T12:34:10.314+00:00', NULL);
INSERT INTO "RoyaltyLedger" ("id", "artistId", "amount", "description", "platform", "songId", "date") VALUES ('7c0c4761-fdc7-4da3-abe4-c857581c10fe', '2010fc1f-0c39-4945-b115-f96cc58a43e4', 245.5, 'Spotify streams - Jan 2026', 'Spotify', 'ec4aa557-2840-476d-aaca-4f27800810cb', '2026-03-03T23:17:43.718+00:00');
INSERT INTO "RoyaltyLedger" ("id", "artistId", "amount", "description", "platform", "songId", "date") VALUES ('ff248174-dec6-46c0-b95f-33514f9718a4', '2010fc1f-0c39-4945-b115-f96cc58a43e4', 132.8, 'Apple Music streams - Jan 2026', 'Apple Music', 'ec4aa557-2840-476d-aaca-4f27800810cb', '2026-03-03T23:17:43.718+00:00');
INSERT INTO "RoyaltyLedger" ("id", "artistId", "amount", "description", "platform", "songId", "date") VALUES ('33b2781d-41aa-4a53-b197-827ae38900b1', '2010fc1f-0c39-4945-b115-f96cc58a43e4', 89.2, 'YouTube Music - Jan 2026', 'YouTube Music', 'b61cad87-d92f-4342-8da9-de22486c91f3', '2026-03-03T23:17:43.718+00:00');
INSERT INTO "RoyaltyLedger" ("id", "artistId", "amount", "description", "platform", "songId", "date") VALUES ('a8a77490-10b2-42bc-9143-5bf6e21dd8fb', '018a9b10-36c2-45d6-867d-7d3e35d620b6', 567.9, 'Spotify streams - Jan 2026', 'Spotify', 'f29ca96c-2c0e-4042-ae5c-f46abcad835c', '2026-03-03T23:17:43.718+00:00');
INSERT INTO "RoyaltyLedger" ("id", "artistId", "amount", "description", "platform", "songId", "date") VALUES ('6db2a510-f7bc-4254-9e20-36482a7870cf', '018a9b10-36c2-45d6-867d-7d3e35d620b6', 328.4, 'Apple Music streams - Jan 2026', 'Apple Music', 'f29ca96c-2c0e-4042-ae5c-f46abcad835c', '2026-03-03T23:17:43.718+00:00');
INSERT INTO "RoyaltyLedger" ("id", "artistId", "amount", "description", "platform", "songId", "date") VALUES ('a7c7dcf8-7dd5-4fb0-a88b-7e729e1a7023', 'ab9ad090-c7fa-48b9-a3bf-41269d21401d', 45.6, 'Spotify streams - Feb 2026', 'Spotify', NULL, '2026-03-03T23:17:43.718+00:00');
INSERT INTO "RoyaltyLedger" ("id", "artistId", "amount", "description", "platform", "songId", "date") VALUES ('d18336a4-578f-4336-9993-0cf490955740', '2010fc1f-0c39-4945-b115-f96cc58a43e4', 310, 'Spotify streams - Feb 2026', 'Spotify', NULL, '2026-03-03T23:17:43.718+00:00');
INSERT INTO "RoyaltyLedger" ("id", "artistId", "amount", "description", "platform", "songId", "date") VALUES ('7498501d-25c1-467c-bcad-6b4463b6fda7', '018a9b10-36c2-45d6-867d-7d3e35d620b6', 420.15, 'Spotify streams - Feb 2026', 'Spotify', NULL, '2026-03-03T23:17:43.718+00:00');
INSERT INTO "Lyrics" ("id", "userId", "content", "mood", "theme", "genre", "tempo", "storyline", "createdAt", "updatedAt") VALUES ('3dc63bec-7eef-4301-8d96-1caef6b487ce', '2010fc1f-0c39-4945-b115-f96cc58a43e4', 'Dancing in the moonlight
Feel the rhythm of the night
Heartbeat syncing with the bass...', 'Energetic', 'Party', 'Afrobeats', 'Fast', NULL, '2026-03-03T23:17:43.763+00:00', '2026-03-03T23:17:43.763+00:00');
INSERT INTO "Lyrics" ("id", "userId", "content", "mood", "theme", "genre", "tempo", "storyline", "createdAt", "updatedAt") VALUES ('38e8e135-b051-46ba-94b0-d81895c64dfa', '018a9b10-36c2-45d6-867d-7d3e35d620b6', 'Neon lights reflecting
In the rain-soaked street
Synthesizers humming...', 'Melancholic', 'Night Life', 'Electronic', 'Medium', NULL, '2026-03-03T23:17:43.763+00:00', '2026-03-03T23:17:43.763+00:00');
INSERT INTO "WithdrawalRequest" ("id", "artistId", "amount", "status", "adminNote", "processedById", "processedAt", "createdAt") VALUES ('d4095ea3-91c8-47f9-87c2-c2951ccfd86e', '2010fc1f-0c39-4945-b115-f96cc58a43e4', 200, 'APPROVED', NULL, '4f4e70ca-7b33-485f-950b-2eda237b08b8', '2026-02-26T23:17:43.774+00:00', '2026-03-03T23:17:43.777+00:00');
INSERT INTO "WithdrawalRequest" ("id", "artistId", "amount", "status", "adminNote", "processedById", "processedAt", "createdAt") VALUES ('44aa49a0-58d4-4068-a240-17beba4e5a0a', '018a9b10-36c2-45d6-867d-7d3e35d620b6', 500, 'PENDING', NULL, NULL, NULL, '2026-03-03T23:17:43.789+00:00');
INSERT INTO "AdminLog" ("id", "adminId", "action", "targetId", "targetType", "meta", "timestamp") VALUES ('89ea5529-f0bc-41c1-a002-d0f1cd42696c', '4f4e70ca-7b33-485f-950b-2eda237b08b8', 'USER_CREATED', NULL, 'USER', '{"email":"johan@music.com"}', '2026-03-03T23:17:43.802+00:00');
INSERT INTO "AdminLog" ("id", "adminId", "action", "targetId", "targetType", "meta", "timestamp") VALUES ('d03dc3f1-b721-4d27-b237-c717d43a3adb', 'b7fffd6d-94e8-43df-b215-44a9f36bc9ad', 'TASK_STATUS_CHANGE', 'e500c349-e888-4cf4-b16d-aba8b96b0105', 'TASK', '{"from":"PENDING","to":"COMPLETED"}', '2026-03-03T23:17:43.802+00:00');
INSERT INTO "AdminLog" ("id", "adminId", "action", "targetId", "targetType", "meta", "timestamp") VALUES ('1545d27c-41bf-493a-8bfb-30a68c8bd2d1', '4f4e70ca-7b33-485f-950b-2eda237b08b8', 'WITHDRAWAL_APPROVED', NULL, 'WITHDRAWAL', '{"artist":"johan@music.com","amount":200}', '2026-03-03T23:17:43.802+00:00');
INSERT INTO "AdminLog" ("id", "adminId", "action", "targetId", "targetType", "meta", "timestamp") VALUES ('74ec9a25-e17c-46af-97c7-5d2ad1864fb2', '4f4e70ca-7b33-485f-950b-2eda237b08b8', 'ROYALTY_ADDED', NULL, 'ROYALTY', '{"artist":"synthwave@beats.com","amount":567.9}', '2026-03-03T23:17:43.802+00:00');
INSERT INTO "AdminLog" ("id", "adminId", "action", "targetId", "targetType", "meta", "timestamp") VALUES ('91f354e6-bc53-467d-8420-d971cde520ca', 'dfbc08a5-9743-4018-b76b-8796655972be', 'TASK_ASSIGNED', 'cc97febc-c8c7-4771-9b7f-37bbbf528a93', 'TASK', '{"assignee":"dist@vilobeat.com"}', '2026-03-03T23:17:43.802+00:00');
INSERT INTO "Quota" ("id", "artistId", "releasesUsed", "masteringUsed", "songCreationUsed", "coverCreationUsed", "lyricsUsed", "audioSeparatorUsed", "voiceReferenceUsed", "lyricsToMusicUsed", "resetDate") VALUES ('3f018df8-3091-48d3-b35e-1e601345ccff', '2010fc1f-0c39-4945-b115-f96cc58a43e4', 2, 1, 0, 1, 3, 0, 0, 0, '2026-03-31T23:17:43.744+00:00');
INSERT INTO "Quota" ("id", "artistId", "releasesUsed", "masteringUsed", "songCreationUsed", "coverCreationUsed", "lyricsUsed", "audioSeparatorUsed", "voiceReferenceUsed", "lyricsToMusicUsed", "resetDate") VALUES ('f08fc81a-f92e-4fa9-be06-a84541d37cc9', '018a9b10-36c2-45d6-867d-7d3e35d620b6', 3, 1, 1, 0, 2, 0, 0, 0, '2026-03-31T23:17:43.744+00:00');
INSERT INTO "Quota" ("id", "artistId", "releasesUsed", "masteringUsed", "songCreationUsed", "coverCreationUsed", "lyricsUsed", "audioSeparatorUsed", "voiceReferenceUsed", "lyricsToMusicUsed", "resetDate") VALUES ('2d84edcc-9228-444e-a8cb-a562f8d5f5c9', 'ab9ad090-c7fa-48b9-a3bf-41269d21401d', 1, 0, 0, 0, 1, 0, 0, 0, '2026-03-31T23:17:43.744+00:00');
INSERT INTO "Quota" ("id", "artistId", "releasesUsed", "masteringUsed", "songCreationUsed", "coverCreationUsed", "lyricsUsed", "audioSeparatorUsed", "voiceReferenceUsed", "lyricsToMusicUsed", "resetDate") VALUES ('2636a9fe-da5e-4b14-a4f1-c6c8f735c5c4', '52edc9b6-36da-4065-8a14-00b97ffdc40c', 3, 0, 0, 0, 4, 0, 0, 0, '2026-04-04T12:27:33.957+00:00');
