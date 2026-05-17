using GymManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace GymManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IConfiguration _configuration;

        public AccountController(UserManager<IdentityUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] Register model)
        {
            var role = model.Role ?? Roles.Member;

            if (!Roles.All.Contains(role))
                return BadRequest(new { message = $"Invalid role. Valid roles: {string.Join(", ", Roles.All)}" });

            var user = new IdentityUser { UserName = model.Username };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, role);
            return Ok(new { message = $"User registered successfully with role: {role}" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Login model)
        {
            var user = await _userManager.FindByNameAsync(model.Username);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized();

            var userRoles = await _userManager.GetRolesAsync(user);
            var authClaims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };
            authClaims.AddRange(userRoles.Select(r => new Claim(ClaimTypes.Role, r)));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                expires: DateTime.Now.AddMinutes(double.Parse(_configuration["Jwt:ExpiryMinutes"]!)),
                claims: authClaims,
                signingCredentials: new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)),
                    SecurityAlgorithms.HmacSha256)
            );

            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
        }

        [Authorize(Roles = Roles.Admin)]
        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRole([FromBody] UserRole model)
        {
            if (!Roles.All.Contains(model.Role))
                return BadRequest(new { message = $"Invalid role. Valid roles: {string.Join(", ", Roles.All)}" });

            var user = await _userManager.FindByNameAsync(model.Username);
            if (user == null)
                return NotFound(new { message = "User not found" });

            var result = await _userManager.AddToRoleAsync(user, model.Role);
            if (result.Succeeded)
                return Ok(new { message = $"Role '{model.Role}' assigned to '{model.Username}'" });

            return BadRequest(result.Errors);
        }
    }
}
