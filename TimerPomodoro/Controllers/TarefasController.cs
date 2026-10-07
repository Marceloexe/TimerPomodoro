using System;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Web.Mvc;
using TimerPomodoro.Models;

namespace TimerPomodoro.Controllers
{
	public class TarefasController : Controller
	{
		private MeuDbContext db = new MeuDbContext();

		[HttpGet]
		public JsonResult Listar()
		{
			try
			{
				var tarefas = db.Tarefas
					.Select(t => new {
						t.Id,
						t.Titulo,
						t.Descricao,
						t.PomodorosConcluidos,
						t.TempoFoco,
						t.PausaCurta,
						t.PausaLonga,
						t.Concluida
					})
					.ToList();

				return Json(tarefas, JsonRequestBehavior.AllowGet);
			}
			catch (Exception ex)
			{
				Trace.TraceError($"[ERRO DB] Falha ao listar tarefas: {ex.Message}");
				return Json(new { sucesso = false, mensagem = "Erro ao buscar tarefas." }, JsonRequestBehavior.AllowGet);
			}
		}

		[HttpPost]
		public JsonResult Salvar(Tarefa tarefa)
		{
			try
			{
				if (tarefa.Id == 0)
				{
					tarefa.DataCriacao = DateTime.Now;
					db.Tarefas.Add(tarefa);
				}
				else
				{
					var tExistente = db.Tarefas.Find(tarefa.Id);
					if (tExistente != null)
					{
						tExistente.Titulo = tarefa.Titulo;
						tExistente.Descricao = tarefa.Descricao;
						tExistente.TempoFoco = tarefa.TempoFoco;
						tExistente.PausaCurta = tarefa.PausaCurta;
						tExistente.PausaLonga = tarefa.PausaLonga;
					}
				}

				db.SaveChanges();
				return Json(new { sucesso = true, tarefa = tarefa });
			}
			catch (Exception ex)
			{
				Trace.TraceError($"[ERRO DB] Falha ao salvar tarefa (Id: {tarefa.Id}): {ex.Message}");
				Response.StatusCode = 500;
				return Json(new { sucesso = false, mensagem = "Erro ao salvar no banco." });
			}
		}

		[HttpPost]
		public JsonResult Excluir(int id)
		{
			try
			{
				var t = db.Tarefas.Find(id);
				if (t != null)
				{
					var sessoes = db.SessoesFoco.Where(s => s.TarefaId == id);
					db.SessoesFoco.RemoveRange(sessoes);

					db.Tarefas.Remove(t);
					db.SaveChanges();
				}
				return Json(new { sucesso = true });
			}
			catch (Exception ex)
			{
				Trace.TraceError($"[ERRO DB] Falha ao excluir tarefa ID {id}: {ex.Message}");
				Response.StatusCode = 500;
				return Json(new { sucesso = false, mensagem = "Erro ao excluir tarefa." });
			}
		}

		[HttpPost]
		public JsonResult SalvarSessao(SessaoFoco sessao)
		{
			try
			{
				var tarefa = db.Tarefas.Find(sessao.TarefaId);
				if (tarefa == null)
				{
					return Json(new { sucesso = false, mensagem = "Tarefa não encontrada." });
				}

				sessao.DuracaoMinutos = (int)(sessao.DataFim - sessao.DataInicio).TotalMinutes;
				db.SessoesFoco.Add(sessao);
				tarefa.PomodorosConcluidos += 1;

				db.SaveChanges();
				return Json(new { sucesso = true, pomodorosConcluidos = tarefa.PomodorosConcluidos });
			}
			catch (Exception ex)
			{
				Trace.TraceError($"[ERRO DE PERSISTÊNCIA] Falha ao gravar SessaoFoco | Tarefaid: {sessao.TarefaId} | Inicio: {sessao.DataInicio} | Fim: {sessao.DataFim} | Detalhes: {ex.ToString()}");

				Response.StatusCode = 500;
				return Json(new { sucesso = false, mensagem = "Falha interna ao salvar sessão de foco no banco de dados." });
			}
		}

		[HttpGet]
		public JsonResult ObterRelatorioHoras(DateTime? dataInicio, DateTime? dataFim)
		{
			DateTime inicio = dataInicio?.Date ?? DateTime.Today;
			DateTime fim = dataFim?.Date.AddDays(1).AddTicks(-1) ?? DateTime.Today.AddDays(1).AddTicks(-1);

			using (var dbContext = new MeuDbContext())
			{
				var pInicio1 = new SqlParameter("@DataInicio", inicio);
				var pFim1 = new SqlParameter("@DataFim", fim);

				var resumo = dbContext.Database
									  .SqlQuery<RelatorioResumoDTO>("EXEC dbo.sp_ObterRelatorioResumo @DataInicio, @DataFim", pInicio1, pFim1)
									  .FirstOrDefault() ?? new RelatorioResumoDTO();

				var pInicio2 = new SqlParameter("@DataInicio", inicio);
				var pFim2 = new SqlParameter("@DataFim", fim);

				var tarefas = dbContext.Database
									   .SqlQuery<RelatorioTarefaDTO>("EXEC dbo.sp_ObterRelatorioPorTarefa @DataInicio, @DataFim", pInicio2, pFim2)
									   .ToList();

				return Json(new
				{
					TotalPomodoros = resumo.TotalPomodoros,
					TempoTotal = FormatarHoras(resumo.TempoTotalMinutos),
					DetalhamentoTarefas = tarefas.Select(t => new
					{
						t.NomeTarefa,
						t.PomodorosConcluidos,
						TempoTotal = FormatarHoras(t.TempoTotalMinutos)
					})
				}, JsonRequestBehavior.AllowGet);
			}
		}

		private string FormatarHoras(int totalMinutos)
		{
			int horas = totalMinutos / 60;
			int minutos = totalMinutos % 60;
			return $"{horas}h {minutos}m";
		}
	}

	public class RelatorioResumoDTO
	{
		public int TotalPomodoros { get; set; }
		public int TempoTotalMinutos { get; set; }
	}

	public class RelatorioTarefaDTO
	{
		public string NomeTarefa { get; set; }
		public int PomodorosConcluidos { get; set; }
		public int TempoTotalMinutos { get; set; }
	}
}