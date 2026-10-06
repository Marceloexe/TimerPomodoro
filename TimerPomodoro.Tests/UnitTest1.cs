using Xunit;
using TimerPomodoro.Models;

namespace TimerPomodoro.Tests
{
	public class UnitTest1
	{
		[Fact]
		public void DeveIrParaPausaCurta_AposUmCicloDeFoco()
		{
			var gerenciador = new GerenciadorCiclos();

			string proximaFase = gerenciador.ObterProximaFase("Foco");

			Assert.Equal("PausaCurta", proximaFase);
		}
		 
		[Fact]
		public void DeveIrParaPausaLonga_AposQuatroCiclosDeFoco()
		{
			var gerenciador = new GerenciadorCiclos { TotalCiclosParaPausaLonga = 4 };

			gerenciador.ObterProximaFase("Foco");       
			gerenciador.ObterProximaFase("PausaCurta"); 
			gerenciador.ObterProximaFase("Foco");       
			gerenciador.ObterProximaFase("PausaCurta"); 
			gerenciador.ObterProximaFase("Foco");       
			gerenciador.ObterProximaFase("PausaCurta"); 

			string proximaFase = gerenciador.ObterProximaFase("Foco");

			Assert.Equal("PausaLonga", proximaFase);
		}

		[Fact]
		public void DeveReiniciarContagem_AposPausaLonga()
		{
			var gerenciador = new GerenciadorCiclos();

			gerenciador.ObterProximaFase("PausaLonga");

			Assert.Equal(0, gerenciador.CiclosCompletados);
		}

		[Theory]
		[InlineData(-10, 5, 15)]     
		[InlineData(25, -5, 15)] 
		[InlineData(0, 5, 15)]  
		[InlineData(300, 5, 15)] 
		public void ValidarConfiguracao_DeveRetornarFalso_ParaValoresInvalidos(int foco, int curta, int longa)
		{
			var gerenciador = new GerenciadorCiclos();

			bool ehValido = gerenciador.ValidarConfiguracao(foco, curta, longa);

			Assert.False(ehValido);
		}

		[Fact]
		public void ValidarConfiguracao_DeveRetornarVerdadeiro_ParaValoresValidos()
		{
			var gerenciador = new GerenciadorCiclos();

			bool ehValido = gerenciador.ValidarConfiguracao(25, 5, 15);

			Assert.True(ehValido);
		}
	}
}