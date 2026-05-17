namespace GymManagement.Api.Models
{
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Trainer = "Trainer";
        public const string Member = "Member";

        public static readonly IReadOnlyList<string> All = [Admin, Trainer, Member];
    }
}
