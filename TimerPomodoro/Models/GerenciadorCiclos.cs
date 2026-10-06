using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TimerPomodoro.Models
{
	public class GerenciadorCiclos
	{
		public int CiclosCompletados { get; private set; } = 0;
		public int TotalCiclosParaPausaLonga { get; set; } = 4;

		public string ObterProximaFase(string faseAtual)
		{
			if (faseAtual == "Foco")
			{
				CiclosCompletados++;

				if (CiclosCompletados % TotalCiclosParaPausaLonga == 0)
				{
					return "PausaLonga";
				}

				return "PausaCurta";
			}

			if (faseAtual == "PausaLonga")
			{
				CiclosCompletados = 0;
			}

			return "Foco";
		}

		public bool ValidarConfiguracao(int focoMin, int pausaCurtaMin, int pausaLongaMin)
		{
			if (focoMin <= 0 || pausaCurtaMin <= 0 || pausaLongaMin <= 0)
			{
				return false;
			}

			if (focoMin > 180 || pausaCurtaMin > 60 || pausaLongaMin > 120)
			{
				return false;
			}

			return true;
		}
	}
}