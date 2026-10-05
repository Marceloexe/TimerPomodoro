using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace TimerPomodoro.Models
{
	[Table("Tarefa")]
	public class Tarefa
	{
		public int Id { get; set; }
		public string Titulo { get; set; }
		public string Descricao { get; set; }
		public int PomodorosConcluidos { get; set; }
		public bool Concluida { get; set; }
		public DateTime DataCriacao { get; set; } = DateTime.Now;
		public int TempoFoco { get; set; }
		public int PausaCurta { get; set; }
		public int PausaLonga { get; set; }

		public virtual ICollection<SessaoFoco> SessoesFoco { get; set; }
	}
}