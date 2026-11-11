-- יצירת הטבלאות במסד נתונים חדש (למשל ב-Neon)
-- להריץ פעם אחת ב-SQL Editor של Neon

CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL CONSTRAINT "Users_pkey" PRIMARY KEY,
    "UserName" VARCHAR(100) NOT NULL CONSTRAINT "Users_UserName_key" UNIQUE,
    "PasswordHash" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Items" (
    "Id" SERIAL CONSTRAINT "Items_pkey" PRIMARY KEY,
    "Name" VARCHAR(100),
    "IsComplete" BOOLEAN,
    "UserId" INTEGER NOT NULL
        CONSTRAINT "Items_UserId_fkey" REFERENCES "Users"("Id") ON DELETE CASCADE
);
