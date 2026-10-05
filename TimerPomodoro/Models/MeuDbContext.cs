using System.Data.Entity;

namespace TimerPomodoro.Models
{
	public class MeuDbContext : DbContext
	{
		public MeuDbContext() : base("name=DefaultConnection")
		{
		}

		public DbSet<Tarefa> Tarefas { get; set; }
		public DbSet<SessaoFoco> SessoesFoco { get; set; }
	}
}