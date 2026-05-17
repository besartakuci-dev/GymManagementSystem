using GymManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers
{
    [Authorize(Roles = $"{Roles.Member},{Roles.Admin}")]
    [Route("api/[controller]")]
    [ApiController]
    public class MemberController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;

        public MemberController(UserManager<IdentityUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var username = User.FindFirst("sub")?.Value;
            var user = await _userManager.FindByNameAsync(username!);
            if (user == null) return NotFound();
            return Ok(new { user.Id, user.UserName });
        }
    }
}
