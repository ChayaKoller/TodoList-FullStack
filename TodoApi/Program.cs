using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("ToDoDB")
    )
);
builder.Services.AddScoped<PasswordHasher<User>>();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key is missing");

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("JWT issuer is missing");

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("JWT audience is missing");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Convert.FromBase64String(jwtKey)
            ),

            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter your JWT token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowAll");


// מזהה המשתמש המחובר, מתוך הטוקן (ה-claim "sub" שנוצר בהתחברות)
static int GetUserId(ClaimsPrincipal user)
{
    var id = user.FindFirstValue(ClaimTypes.NameIdentifier)
          ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

    return int.Parse(id!);
}

//get all items - רק המשימות של המשתמש המחובר
app.MapGet("/api/items", async (ClaimsPrincipal user, ToDoDbContext db) =>
{
    var userId = GetUserId(user);

    var items = await db.Items
        .Where(i => i.UserId == userId)
        .ToListAsync();

    return Results.Ok(items);
}).RequireAuthorization();
//post new item - הבעלים נקבע בשרת, לא לפי מה שהלקוח שולח
app.MapPost("/api/items", async (Item item, ClaimsPrincipal user, ToDoDbContext db) =>
{
    var newItem = new Item
    {
        Name = item.Name,
        IsComplete = item.IsComplete ?? false,
        UserId = GetUserId(user)
    };

    db.Items.Add(newItem);
    await db.SaveChangesAsync();

    return Results.Ok(newItem);
}).RequireAuthorization();
//put item by id - רק משימה של המשתמש המחובר
app.MapPut("/api/items/{id}", async (int id, Item updatedItem, ClaimsPrincipal user, ToDoDbContext db) =>
{
    var userId = GetUserId(user);

    var item = await db.Items
        .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

    if (item == null)
        return Results.NotFound();

    item.Name = updatedItem.Name;
    item.IsComplete = updatedItem.IsComplete;

    await db.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization();
//delete item by id - רק משימה של המשתמש המחובר
app.MapDelete("/api/items/{id}", async (int id, ClaimsPrincipal user, ToDoDbContext db) =>
{
    var userId = GetUserId(user);

    var item = await db.Items
        .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

    if (item == null)
        return Results.NotFound();

    db.Items.Remove(item);
    await db.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization();


app.MapPost("/api/auth/register", async (
    AuthRequest request,
    ToDoDbContext db,
    PasswordHasher<User> hasher) =>
{
    var username = request.UserName?.Trim();

    if (string.IsNullOrWhiteSpace(username) ||
        username.Length > 100 ||
        string.IsNullOrWhiteSpace(request.Password) ||
        request.Password.Length < 8)
    {
        return Results.BadRequest(
            "Username is required and password must contain at least 8 characters."
        );
    }

    var exists = await db.Users
        .AnyAsync(u => u.UserName == username);

    if (exists)
        return Results.Conflict("Username already exists.");

    var user = new User
    {
        UserName = username
    };

    user.PasswordHash = hasher.HashPassword(user, request.Password);

    db.Users.Add(user);

    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException)
    {
        return Results.Conflict("Could not register username.");
    }

    return Results.Ok(new { message = "Registration successful" });
});

app.MapPost("/api/auth/login", async (
    AuthRequest request,
    ToDoDbContext db,
    PasswordHasher<User> hasher) =>
{
    var username = request.UserName?.Trim();

    var user = await db.Users
        .FirstOrDefaultAsync(u => u.UserName == username);

    if (user == null)
        return Results.Unauthorized();

    var verification = hasher.VerifyHashedPassword(
        user,
        user.PasswordHash,
        request.Password ?? ""
    );

    if (verification == PasswordVerificationResult.Failed)
        return Results.Unauthorized();

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName)
    };

    var signingKey = new SymmetricSecurityKey(
        Convert.FromBase64String(jwtKey)
    );

    var credentials = new SigningCredentials(
        signingKey,
        SecurityAlgorithms.HmacSha256
    );

    var token = new JwtSecurityToken(
        issuer: jwtIssuer,
        audience: jwtAudience,
        claims: claims,
        expires: DateTime.UtcNow.AddHours(2),
        signingCredentials: credentials
    );

    return Results.Ok(new
    {
        token = new JwtSecurityTokenHandler().WriteToken(token)
    });
});


app.Run();
record AuthRequest(string UserName, string Password);
