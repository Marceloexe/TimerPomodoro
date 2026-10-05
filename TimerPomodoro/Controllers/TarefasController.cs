using TimerPomodoro.Models;
using System;
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
	}
}