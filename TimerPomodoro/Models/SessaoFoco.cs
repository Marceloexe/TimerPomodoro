using TimerPomodoro.Models;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TimerPomodoro.Models
{
	[Table("SessaoFoco")]
	public class SessaoFoco
	{
		public int Id { get; set; }
		public int TarefaId { get; set; }
		public DateTime DataInicio { get; set; }
		public DateTime DataFim { get; set; }
		public int DuracaoMinutos { get; set; }

		public virtual Tarefa Tarefa { get; set; }
	}
}