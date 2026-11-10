
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
- התחברות באמצעות JWT
- הצגת רשימת משימות
- הוספת משימה
- סימון משימה כהושלמה
- מחיקת משימה
- טיפול בשגיאות באמצעות Axios Interceptors
- מעבר למסך התחברות כאשר מתקבלת שגיאת 401

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

אין להעלות סיסמאות או מפתחות סודיים ל-GitHub.

## הערות

- פעולות המשימות מוגנות באמצעות JWT.
- כל משתמש מחובר יכול כרגע לגשת לרשימת המשימות המשותפת.
- הפרויקט מיועד ללמידה ולהדגמת פיתוח Full Stack.
