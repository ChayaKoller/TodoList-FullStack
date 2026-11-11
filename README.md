
# TodoList – Full Stack Application

מערכת לניהול משימות הכוללת הרשמה, התחברות וניהול משימות.

## טכנולוגיות

### Backend
- ASP.NET Core 9 – Minimal API
- Entity Framework Core – DB First
- PostgreSQL
- JWT Authentication
- Swagger

### Frontend
- React
- JavaScript
- Axios
- CSS

## יכולות המערכת

- הרשמת משתמש חדש
- התחברות באמצעות JWT (הטוקן נשלח בכל בקשה דרך Axios Request Interceptor)
- **כל משתמש רואה ומנהל רק את המשימות שלו**
- הצגת רשימת משימות עם סינון: הכל / פתוחות / הושלמו
- הוספת משימה
- סימון משימה כהושלמה
- מחיקת משימה, עם אישור לפני מחיקה
- ברכה אישית, טבעת התקדמות וכרטיסי סיכום
- טיפול בשגיאות באמצעות Axios Interceptors
- מעבר למסך התחברות כאשר מתקבלת שגיאת 401

## הפרדת משימות בין משתמשים

- לכל משימה בטבלת `Items` יש עמודה `UserId` (מפתח זר לטבלת `Users`).
- השרת קורא את מזהה המשתמש מתוך ה-JWT (ה-claim `sub`), ולא סומך על מה שהלקוח שולח.
- `GET /api/items` מחזיר רק את המשימות של המשתמש המחובר.
- `POST /api/items` שומר את המשימה עם ה-`UserId` של המשתמש המחובר.
- `PUT` ו-`DELETE` עובדים רק על משימה של המשתמש המחובר. משימה של משתמש אחר מחזירה 404.
- מחיקת משתמש מוחקת גם את המשימות שלו (`ON DELETE CASCADE`).

## עיצוב

- צבעים: ורוד-פוקסיה, כחול וירוק. כל הצבעים מוגדרים כמשתנים ב-`ToDoListReact-master/public/index.css`.
- גופנים: Varela Round לכותרות ו-Rubik לטקסט (Google Fonts, תומכים בעברית).
- מותאם לטלפונים.

## מבנה הפרויקט

- `TodoApi/` – שרת ASP.NET Core
- `ToDoListReact-master/` – אפליקציית React

## הפעלת הפרויקט

### הפעלת השרת

```bash
cd TodoApi
dotnet restore
dotnet run
```

כתובת השרת בפיתוח:

http://localhost:5199

Swagger:

http://localhost:5199/swagger

### הפעלת React

בטרמינל נוסף:

```bash
cd ToDoListReact-master
npm install
npm start
```

כתובת הקליינט:

http://localhost:3000

## הגדרות נדרשות

לפני הפעלת השרת יש להגדיר חיבור ל-PostgreSQL
ואת הגדרות JWT באמצעות User Secrets.

השרת משתמש במפתח `ConnectionStrings:ToDoDB`
ובמפתח `Jwt:Key`.

יש ליצור את טבלאות `Items` ו-`Users` במסד הנתונים.
בטבלת `Items` נדרשת עמודה `UserId` (מפתח זר לטבלת `Users`).

עדכון מסד נתונים קיים (מוחק את המשימות הקיימות, כי אין להן בעלים):

```sql
DELETE FROM "Items";
ALTER TABLE "Items" ADD COLUMN "UserId" integer NOT NULL;
ALTER TABLE "Items" ADD CONSTRAINT "Items_UserId_fkey"
  FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE;
```

אין להעלות סיסמאות או מפתחות סודיים ל-GitHub.

## העלאה לענן

- **מסד נתונים:** Neon (PostgreSQL חינמי). יוצרים את הטבלאות עם הקובץ `database.sql`.
- **שרת:** Render, Web Service מסוג Docker. Root Directory: `TodoApi`. הקובץ `TodoApi/Dockerfile` בונה ומריץ את השרת, והשרת מאזין לפורט שבמשתנה `PORT`.
- **לקוח:** Render, Static Site. Root Directory: `ToDoListReact-master`, Build Command: `npm install && npm run build`, Publish Directory: `build`.

משתני סביבה (מוגדרים ב-Render, לא בקוד):

| שירות | משתנה | ערך |
|---|---|---|
| שרת | `ConnectionStrings__ToDoDB` | מחרוזת החיבור של Neon בפורמט `Host=...;Database=...;Username=...;Password=...;SSL Mode=Require` |
| שרת | `Jwt__Key` | מפתח סודי ב-Base64 (לפחות 32 בתים) |
| לקוח | `REACT_APP_API_URL` | כתובת השרת ב-Render + `/api` |

## הערות

- פעולות המשימות מוגנות באמצעות JWT.
- כל משתמש רואה, מעדכן ומוחק רק את המשימות שלו (עמודת UserId בטבלת Items).
- הפרויקט מיועד ללמידה ולהדגמת פיתוח Full Stack.
